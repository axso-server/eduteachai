// routes/grades.js
const express = require('express');
const { Grade } = require('../models/index');
const { protect, requireRole } = require('../middleware/auth');
const ExcelJS = require('exceljs');
const router = express.Router();

router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const grades = await Grade.find({ group: req.params.groupId })
      .populate('student', 'name email').populate('teacher', 'name');
    res.json({ success: true, grades });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/student/:studentId', protect, async (req, res) => {
  try {
    const grades = await Grade.find({ student: req.params.studentId });
    res.json({ success: true, grades });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, requireRole('teacher'), async (req, res) => {
  try {
    const { student, group, subject, module1, module2, midterm, final, semester } = req.body;
    let grade = await Grade.findOne({ student, group, semester });
    if (grade) {
      grade.module1 = module1; grade.module2 = module2;
      grade.midterm = midterm; grade.final = final;
      await grade.save();
    } else {
      grade = await Grade.create({ student, teacher: req.user._id, group, subject, module1, module2, midterm, final, semester });
    }
    res.json({ success: true, grade });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/grades/bulk - save multiple grades at once
router.post('/bulk', protect, requireRole('teacher'), async (req, res) => {
  try {
    const { grades } = req.body;
    for (const g of grades) {
      let existing = await Grade.findOne({ student: g.student, group: g.group, semester: g.semester });
      if (existing) {
        Object.assign(existing, g);
        await existing.save();
      } else {
        await Grade.create({ ...g, teacher: req.user._id });
      }
    }
    res.json({ success: true, message: 'Baholar saqlandi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/grades/export/excel/:groupId
router.get('/export/excel/:groupId', protect, async (req, res) => {
  try {
    const grades = await Grade.find({ group: req.params.groupId }).populate('student', 'name');
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Baholar');
    sheet.columns = [
      { header: 'Talaba', key: 'name', width: 25 },
      { header: '1-Modul', key: 'module1', width: 12 },
      { header: '2-Modul', key: 'module2', width: 12 },
      { header: 'Oraliq', key: 'midterm', width: 12 },
      { header: 'Yakuniy', key: 'final', width: 12 },
      { header: "O'rtacha", key: 'average', width: 12 },
    ];
    grades.forEach(g => {
      sheet.addRow({ name: g.student?.name || '', module1: g.module1, module2: g.module2, midterm: g.midterm, final: g.final, average: g.average });
    });
    sheet.getRow(1).font = { bold: true };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=baholar.xlsx');
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
