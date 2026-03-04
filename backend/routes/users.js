// routes/users.js
const express = require('express');
const User = require('../models/User');
const { Group } = require('../models/index');
const { protect, requireRole } = require('../middleware/auth');
const router = express.Router();

// GET /api/users - admin gets all users
router.get('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { role, group } = req.query;
    let filter = {};
    if (role) filter.role = role;
    if (group) filter.group = group;
    const users = await User.find(filter).select('-password').populate('group', 'name subject');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users - admin creates user
router.post('/', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, password, role, group, subject } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ success: false, message: 'Bu email allaqachon mavjud' });
    const user = await User.create({ name, email, password, role, group: group || null, subject: subject || '' });
    if (group) {
      if (role === 'student') await Group.findByIdAndUpdate(group, { $addToSet: { students: user._id } });
      if (role === 'teacher') await Group.findByIdAndUpdate(group, { teacher: user._id });
    }
    const populated = await User.findById(user._id).select('-password').populate('group', 'name subject');
    res.status(201).json({ success: true, user: populated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/:id - admin edits user
router.put('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    const { name, email, role, group, subject, isActive, phone } = req.body;
    const updates = { name, email, role, subject, isActive, phone };
    if (group) updates.group = group;
    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(req.body.password, 12);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password').populate('group', 'name subject');
    if (!user) return res.status(404).json({ success: false, message: 'Foydalanuvchi topilmadi' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', protect, requireRole('admin'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Foydalanuvchi o\'chirildi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/notifications
router.get('/notifications/my', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('notifications');
    res.json({ success: true, notifications: user.notifications.reverse() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/users/notifications/read-all
router.put('/notifications/read-all', protect, async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { $set: { 'notifications.$[].read': true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
