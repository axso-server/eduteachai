// routes/attendance.js
const express = require('express');
const { Attendance } = require('../models/index');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const router = express.Router();

router.post('/', protect, requireRole('teacher'), async (req, res) => {
  try {
    const { group, date, lesson, records } = req.body;
    let att = await Attendance.findOne({ group, date: new Date(date).toISOString().split('T')[0], lesson });
    if (att) {
      att.records = records;
      await att.save();
    } else {
      att = await Attendance.create({ group, teacher: req.user._id, date, lesson, records });
    }
    // Send notification to absent students
    for (const rec of records) {
      if (rec.status === 'absent') {
        await User.findByIdAndUpdate(rec.student, {
          $push: { notifications: { title: 'Davomat', message: `Siz ${new Date(date).toLocaleDateString('uz-UZ')} kuni darsga kelmadingiz`, type: 'warning' } }
        });
      }
    }
    res.json({ success: true, attendance: att });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const { from, to } = req.query;
    let filter = { group: req.params.groupId };
    if (from && to) filter.date = { $gte: new Date(from), $lte: new Date(to) };
    const records = await Attendance.find(filter).sort('-date');
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const records = await Attendance.find({ 'records.student': req.params.studentId }).sort('-date');
    res.json({ success: true, records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
