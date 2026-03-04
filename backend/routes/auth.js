// routes/auth.js
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

const signToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, message: 'Email va parol kiritilishi shart' });
    const user = await User.findOne({ email }).populate('group', 'name subject');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Email yoki parol noto\'g\'ri' });
    }
    if (!user.isActive) return res.status(403).json({ success: false, message: 'Hisob bloklangan' });
    const token = signToken(user._id);
    res.json({
      success: true,
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, language: user.language, group: user.group, subject: user.subject }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('group', 'name subject').select('-password');
  res.json({ success: true, user });
});

// PUT /api/auth/profile - update own profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, language, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (language) updates.language = language;
    if (avatar) updates.avatar = avatar;
    if (req.body.password) {
      const bcrypt = require('bcryptjs');
      updates.password = await bcrypt.hash(req.body.password, 12);
    }
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password').populate('group', 'name subject');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/auth/language
router.put('/language', protect, async (req, res) => {
  try {
    const { language } = req.body;
    if (!['uz', 'ru', 'en'].includes(language)) return res.status(400).json({ success: false, message: 'Noto\'g\'ri til' });
    await User.findByIdAndUpdate(req.user._id, { language });
    res.json({ success: true, message: 'Til o\'zgartirildi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
