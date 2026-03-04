// routes/messages.js
const express = require('express');
const { Message } = require('../models/index');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

router.get('/conversation/:userId', protect, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { from: req.user._id, to: req.params.userId },
        { from: req.params.userId, to: req.user._id }
      ]
    }).populate('from', 'name role').populate('to', 'name role').sort('createdAt');
    await Message.updateMany({ from: req.params.userId, to: req.user._id }, { read: true });
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/inbox', protect, async (req, res) => {
  try {
    const messages = await Message.find({ to: req.user._id })
      .populate('from', 'name role avatar').sort('-createdAt');
    res.json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { to, message, type } = req.body;
    const msg = await Message.create({ from: req.user._id, to, message, type: type || 'message' });
    await User.findByIdAndUpdate(to, {
      $push: { notifications: { title: `${req.user.name} dan xabar`, message: message.substring(0, 80), type: type === 'warning' ? 'warning' : 'info' } }
    });
    res.status(201).json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await Message.countDocuments({ to: req.user._id, read: false });
    res.json({ success: true, count });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
