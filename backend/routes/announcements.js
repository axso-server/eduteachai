// routes/announcements.js
const express = require('express');
const { Announcement } = require('../models/index');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const user = req.user;
    let filter = {};
    if (user.role !== 'admin') {
      filter.$or = [
        { target: 'all' },
        { target: user.role === 'teacher' ? 'teachers' : 'students' },
        { target: 'group', targetGroup: user.group }
      ];
    }
    const announcements = await Announcement.find(filter)
      .populate('author', 'name role').sort('-createdAt');
    res.json({ success: true, announcements });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, requireRole('admin', 'teacher'), async (req, res) => {
  try {
    const { title, content, target, targetGroup, priority } = req.body;
    const ann = await Announcement.create({ title, content, author: req.user._id, target, targetGroup, priority });

    // Push notification to target users
    let userFilter = {};
    if (target === 'teachers') userFilter.role = 'teacher';
    else if (target === 'students') userFilter.role = 'student';
    else if (target === 'group') userFilter.group = targetGroup;
    
    if (target !== 'all') {
      const users = await User.find(userFilter).select('_id');
      for (const u of users) {
        await User.findByIdAndUpdate(u._id, {
          $push: { notifications: { title: `E'lon: ${title}`, message: content.substring(0, 100), type: priority === 'urgent' ? 'warning' : 'info' } }
        });
      }
    } else {
      await User.updateMany({}, {
        $push: { notifications: { title: `E'lon: ${title}`, message: content.substring(0, 100), type: priority === 'urgent' ? 'warning' : 'info' } }
      });
    }

    res.status(201).json({ success: true, announcement: ann });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
