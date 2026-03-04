// routes/reports.js
const express = require('express');
const ExcelJS = require('exceljs');
const { Attendance, Grade, Assignment } = require('../models/index');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// GET summary report
router.get('/summary', protect, async (req, res) => {
  try {
    const { groupId, from, to } = req.query;
    let attFilter = {};
    if (groupId) attFilter.group = groupId;
    if (from && to) attFilter.date = { $gte: new Date(from), $lte: new Date(to) };

    const attendances = await Attendance.find(attFilter).populate('records.student', 'name');
    const grades = await Grade.find(groupId ? { group: groupId } : {}).populate('student', 'name');

    const studentStats = {};
    for (const att of attendances) {
      for (const rec of att.records) {
        const sid = rec.student?._id?.toString();
        if (!sid) continue;
        if (!studentStats[sid]) studentStats[sid] = { name: rec.student?.name, present: 0, absent: 0, late: 0 };
        studentStats[sid][rec.status]++;
      }
    }

    const report = Object.entries(studentStats).map(([id, s]) => {
      const total = s.present + s.absent + s.late;
      const grade = grades.find(g => g.student?._id?.toString() === id);
      return { id, name: s.name, present: s.present, absent: s.absent, late: s.late, total, attendancePct: total ? Math.round(s.present / total * 100) : 0, avgGrade: grade?.average || 0 };
    });

    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET export to Excel
router.get('/export/excel', protect, async (req, res) => {
  try {
    const { groupId, from, to } = req.query;
    let attFilter = {};
    if (groupId) attFilter.group = groupId;
    if (from && to) attFilter.date = { $gte: new Date(from), $lte: new Date(to) };

    const attendances = await Attendance.find(attFilter).populate('records.student', 'name');
    const grades = await Grade.find(groupId ? { group: groupId } : {}).populate('student', 'name');

    const wb = new ExcelJS.Workbook();
    wb.creator = 'EduTeachAI';

    // Sheet 1: Attendance
    const attSheet = wb.addWorksheet('Davomat');
    attSheet.columns = [
      { header: 'Talaba', key: 'name', width: 25 },
      { header: 'Keldi', key: 'present', width: 10 },
      { header: 'Kelmadi', key: 'absent', width: 10 },
      { header: 'Kech', key: 'late', width: 10 },
      { header: 'Jami', key: 'total', width: 10 },
      { header: 'Davomat %', key: 'pct', width: 12 },
    ];
    attSheet.getRow(1).font = { bold: true };
    attSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a8f' } };
    attSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

    const studentStats = {};
    for (const att of attendances) {
      for (const rec of att.records) {
        const sid = rec.student?._id?.toString();
        if (!sid) continue;
        if (!studentStats[sid]) studentStats[sid] = { name: rec.student?.name, present: 0, absent: 0, late: 0 };
        studentStats[sid][rec.status]++;
      }
    }
    Object.values(studentStats).forEach(s => {
      const total = s.present + s.absent + s.late;
      attSheet.addRow({ name: s.name, present: s.present, absent: s.absent, late: s.late, total, pct: total ? Math.round(s.present / total * 100) + '%' : '0%' });
    });

    // Sheet 2: Grades
    const gradeSheet = wb.addWorksheet('Baholar');
    gradeSheet.columns = [
      { header: 'Talaba', key: 'name', width: 25 },
      { header: '1-Modul', key: 'm1', width: 12 },
      { header: '2-Modul', key: 'm2', width: 12 },
      { header: 'Oraliq', key: 'mid', width: 12 },
      { header: 'Yakuniy', key: 'fin', width: 12 },
      { header: "O'rtacha", key: 'avg', width: 12 },
    ];
    gradeSheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    gradeSheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a3a8f' } };
    grades.forEach(g => {
      gradeSheet.addRow({ name: g.student?.name, m1: g.module1, m2: g.module2, mid: g.midterm, fin: g.final, avg: g.average });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=hisobot_${Date.now()}.xlsx`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
