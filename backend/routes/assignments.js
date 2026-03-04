// routes/assignments.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { Assignment } = require('../models/index');
const User = require('../models/User');
const { protect, requireRole } = require('../middleware/auth');
const router = express.Router();

const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt', '.mp4', '.zip', '.rar'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Fayl formati qo\'llab-quvvatlanmaydi'), false);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 100 * 1024 * 1024 } });

// GET all assignments for a group
router.get('/group/:groupId', protect, async (req, res) => {
  try {
    const assignments = await Assignment.find({ group: req.params.groupId })
      .populate('teacher', 'name').sort('-createdAt');
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET assignments for student
router.get('/my', protect, requireRole('student'), async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user._id).populate('group');
    if (!user.group) return res.json({ success: true, assignments: [] });
    const assignments = await Assignment.find({ group: user.group._id }).populate('teacher', 'name').sort('-createdAt');
    res.json({ success: true, assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create assignment (teacher)
router.post('/', protect, requireRole('teacher'), upload.array('files', 5), async (req, res) => {
  try {
    const { title, description, group, subject, deadline } = req.body;
    const files = (req.files || []).map(f => ({ filename: f.filename, originalname: f.originalname, mimetype: f.mimetype, size: f.size }));
    const assignment = await Assignment.create({ title, description, teacher: req.user._id, group, subject, deadline, files });
    // Notify all students in group
    const { Group } = require('../models/index');
    const grp = await Group.findById(group).populate('students');
    for (const student of grp.students) {
      await User.findByIdAndUpdate(student._id, {
        $push: { notifications: { title: 'Yangi topshiriq', message: `"${title}" topshirig'i yuklandi. Muddat: ${new Date(deadline).toLocaleDateString('uz-UZ')}`, type: 'info' } }
      });
    }
    res.status(201).json({ success: true, assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST submit assignment (student)
router.post('/:id/submit', protect, requireRole('student'), upload.array('files', 3), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Topshiriq topilmadi' });
    const files = (req.files || []).map(f => ({ filename: f.filename, originalname: f.originalname }));
    const isLate = new Date() > new Date(assignment.deadline);
    const existing = assignment.submissions.findIndex(s => s.student.toString() === req.user._id.toString());
    if (existing >= 0) {
      assignment.submissions[existing].files = files;
      assignment.submissions[existing].submittedAt = new Date();
      assignment.submissions[existing].status = isLate ? 'late' : 'submitted';
    } else {
      assignment.submissions.push({ student: req.user._id, files, status: isLate ? 'late' : 'submitted' });
    }
    await assignment.save();
    res.json({ success: true, message: 'Topshiriq yuborildi' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT grade submission (teacher)
router.put('/:id/grade/:studentId', protect, requireRole('teacher'), async (req, res) => {
  try {
    const { grade, feedback } = req.body;
    const assignment = await Assignment.findById(req.params.id);
    const sub = assignment.submissions.find(s => s.student.toString() === req.params.studentId);
    if (!sub) return res.status(404).json({ success: false, message: 'Topshiriq topilmadi' });
    sub.grade = grade; sub.feedback = feedback; sub.status = 'graded';
    await assignment.save();
    await User.findByIdAndUpdate(req.params.studentId, {
      $push: { notifications: { title: 'Topshiriq baholandi', message: `"${assignment.title}" topshirig'ingiz baholandi: ${grade}`, type: 'success' } }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET download file
router.get('/download/:filename', protect, (req, res) => {
  const filepath = path.join(uploadDir, req.params.filename);
  if (!fs.existsSync(filepath)) return res.status(404).json({ success: false, message: 'Fayl topilmadi' });
  res.download(filepath);
});

// POST generate AI test for assignment
router.post('/:id/generate-test', protect, requireRole('teacher'), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ success: false, message: 'Topilmadi' });
    // Generate 10 questions based on subject/title
    const questions = generateAITest(assignment.title, assignment.subject);
    assignment.aiTest = { questions, generatedAt: new Date() };
    await assignment.save();
    res.json({ success: true, questions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

function generateAITest(title, subject) {
  const subjects = {
    'Matematika': [
      { question: 'Integralni hisoblashning asosiy teoremasi nima?', options: ['Nyuton-Leybnis', 'Pifagor', 'Ferma', 'Evklid'], correct: 0 },
      { question: 'Differensial tenglamalar nechi tartibli bo\'ladi?', options: ['Faqat birinchi', 'Faqat ikkinchi', 'Istalgan tartibda', 'Faqat juft'], correct: 2 },
      { question: 'Laplace transformatsiyasi qaysi sohada qo\'llaniladi?', options: ['Geometriya', 'Differensial tenglamalar', 'Statistika', 'Kombinatorika'], correct: 1 },
      { question: 'Matritsa determinantini hisoblash usuli?', options: ['Sarrus qoidasi', 'Gauss usuli', 'Kramer qoidasi', 'Barchaasi'], correct: 3 },
      { question: 'Chiziqli algebra asosiy ob\'ekti?', options: ['Sonlar', 'Vektor fazo', 'Graflar', 'To\'plamlar'], correct: 1 },
      { question: 'Taylor qatori nima?', options: ['Trigonometrik qator', 'Funksiyani kuch qatoriga yoyish', 'Murakkab son', 'Matritsa'], correct: 1 },
      { question: 'Evklid masofa formulasi?', options: ['|a-b|', '√(Σ(xi-yi)²)', 'a+b', 'a·b'], correct: 1 },
      { question: 'Fourier transformatsiyasi nima uchun?', options: ['Integrallash', 'Signal tahlili', 'Matritsa ko\'paytirish', 'Limit hisoblash'], correct: 1 },
      { question: 'Chiziqli dasturlashning maqsadi?', options: ['Minimum topish', 'Maximum topish', 'Ikkalasi ham', 'Hech biri'], correct: 2 },
      { question: 'Ehtimollik nazariyasida sigma qoidasi?', options: ['68-95-99.7%', '50-75-95%', '33-66-99%', '60-80-100%'], correct: 0 },
    ],
    'Fizika': [
      { question: 'Kvant mexanikasi asosiy tenglamasi?', options: ['Nyuton qonuni', 'Shredinger tenglamasi', 'Maxwell tenglamalari', 'Faraday qonuni'], correct: 1 },
      { question: 'Umumiy nisbiylik nazariyasi muallifi?', options: ['Nyuton', 'Bohr', 'Einstein', 'Plank'], correct: 2 },
      { question: 'Elektromagnit to\'lqinlar tezligi bo\'shliqda?', options: ['300000 km/s', '150000 km/s', '30000 km/s', '3000000 km/s'], correct: 0 },
      { question: 'Termodynamikaning birinchi qonuni?', options: ['Entropiya ortadi', 'Energiya saqlanadi', 'Bosim hajmga teskari', 'Temperatura o\'zgarmas'], correct: 1 },
      { question: 'Fotoelektrik effektni kim tushuntirdi?', options: ['Plank', 'Bohr', 'Einstein', 'Heisenberg'], correct: 2 },
      { question: 'Nisbiylik nazariyasida massa-energiya tenglamasi?', options: ['E=mv', 'E=mc²', 'E=hv', 'E=kT'], correct: 1 },
      { question: 'Elektr o\'tkazuvchanlikning birligi?', options: ['Om', 'Siemens', 'Volt', 'Amper'], correct: 1 },
      { question: 'Yaderoviy reaksiyada qaysi kuch ustunlik qiladi?', options: ['Gravitatsion', 'Elektromagnit', 'Kuchli yadero', 'Zaif yadero'], correct: 2 },
      { question: 'Absolyut nol temperatura necha K?', options: ['0 K', '273 K', '-100 K', '100 K'], correct: 0 },
      { question: 'Lazer nima asosida ishlaydi?', options: ['Spontan emissiya', 'Majburiy emissiya', 'Yutish', 'Yutilish'], correct: 1 },
    ],
    'default': [
      { question: `${title} mavzusidagi asosiy tushuncha nima?`, options: ['Nazariya', 'Amaliyot', 'Ikkalasi', 'Hech biri'], correct: 2 },
      { question: `${subject || 'Fan'} sohasidagi ilk tadqiqotchilar?`, options: ['Yevropaliklarmi', 'Osiyoliklarmi', 'Amerikaliklarmi', 'Barchasi'], correct: 3 },
      { question: 'Ilmiy metod qadamlari?', options: ['Kuzatish', 'Gipoteza', 'Eksperiment', 'Barchasi'], correct: 3 },
      { question: 'Akademik yozuvning asosiy talablari?', options: ['Aniqlik', 'Izchillik', 'Manbalar', 'Barchasi'], correct: 3 },
      { question: 'Tadqiqot turlaridan biri?', options: ['Sifatli', 'Miqdoriy', 'Aralash', 'Barchasi'], correct: 3 },
      { question: 'Ma\'lumot tahlilida qaysi usul ishlatiladi?', options: ['Statistika', 'Mantiq', 'Kuzatish', 'Barchasi'], correct: 3 },
      { question: 'Ilmiy maqola tuzilishi?', options: ['Kirish+Asosiy+Xulosa', 'Faqat xulosa', 'Faqat kirish', 'Hech biri'], correct: 0 },
      { question: 'Etika ilmiy tadqiqotda nima uchun muhim?', options: ['Obro\'', 'Ishonchlilik', 'Natijalar', 'Barchasi'], correct: 3 },
      { question: 'Peer-review jarayoni nima?', options: ['O\'z-o\'zini tekshirish', 'Tengdoshlar baholashi', 'Professor baholashi', 'Kompyuter baholashi'], correct: 1 },
      { question: 'Plagiatorlik nima?', options: ['Tarjima', 'Boshqa ish nusxalash', 'Iqtibos keltirish', 'Manbaga havola'], correct: 1 },
    ]
  };
  return subjects[subject] || subjects['default'];
}

module.exports = router;
