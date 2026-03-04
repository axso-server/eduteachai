// routes/groups.js
const express = require('express');
const { Group } = require('../models/index');
const { protect, requireRole } = require('../middleware/auth');
const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    let filter = {};
    if (req.user.role === 'teacher') filter.teacher = req.user._id;
    const groups = await Group.find(filter).populate('teacher', 'name email').populate('students', 'name email');
    res.json({ success: true, groups });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const group = await Group.create(req.body);
    const populated = await Group.findById(group._id).populate('teacher', 'name').populate('students', 'name');
    res.status(201).json({ success: true, group: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const group = await Group.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('teacher', 'name').populate('students', 'name');
    res.json({ success: true, group });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await Group.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Guruh o\'chirildi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
