require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static files - serve uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/attendance', require('./routes/attendance'));
app.use('/api/grades', require('./routes/grades'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/announcements', require('./routes/announcements'));
app.use('/api/reports', require('./routes/reports'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'EduTeachAI Backend ishlayapti' }));

// Seed initial data
app.post('/api/seed', async (req, res) => {
  try {
    const User = require('./models/User');
    const { Group } = require('./models/index');
    
    const adminExists = await User.findOne({ email: 'admin@edu.uz' });
    if (adminExists) return res.json({ success: true, message: 'Ma\'lumotlar allaqachon mavjud' });

    // Create admin
    const admin = await User.create({ name: 'Admin User', email: 'admin@edu.uz', password: 'admin123', role: 'admin' });

    // Create groups
    const groups = await Group.insertMany([
      { name: 'IT-201', subject: 'Dasturlash texnologiyalari' },
      { name: 'IT-202', subject: 'Web dasturlash' },
      { name: 'MT-101', subject: 'Oliy matematika' },
      { name: 'FZ-101', subject: 'Umumiy fizika' },
      { name: 'EK-301', subject: 'Iqtisodiyot nazariyasi' },
    ]);

    // Create teachers
    const t1 = await User.create({ name: 'Alisher Nazarov', email: 'alisher@edu.uz', password: 'teacher123', role: 'teacher', group: groups[0]._id, subject: 'Dasturlash texnologiyalari' });
    const t2 = await User.create({ name: 'Sarvar Toshmatov', email: 'sarvar@edu.uz', password: 'teacher123', role: 'teacher', group: groups[2]._id, subject: 'Oliy matematika' });
    const t3 = await User.create({ name: 'Nodira Karimova', email: 'nodira@edu.uz', password: 'teacher123', role: 'teacher', group: groups[1]._id, subject: 'Web dasturlash' });

    // Update groups with teachers
    await Group.findByIdAndUpdate(groups[0]._id, { teacher: t1._id });
    await Group.findByIdAndUpdate(groups[2]._id, { teacher: t2._id });
    await Group.findByIdAndUpdate(groups[1]._id, { teacher: t3._id });

    // Create students
    const s1 = await User.create({ name: 'Aziz Karimov', email: 'aziz@student.uz', password: 'student123', role: 'student', group: groups[0]._id });
    const s2 = await User.create({ name: 'Malika Yusupova', email: 'malika@student.uz', password: 'student123', role: 'student', group: groups[0]._id });
    const s3 = await User.create({ name: 'Jasur Toshmatov', email: 'jasur@student.uz', password: 'student123', role: 'student', group: groups[1]._id });

    await Group.findByIdAndUpdate(groups[0]._id, { $push: { students: { $each: [s1._id, s2._id] } } });
    await Group.findByIdAndUpdate(groups[1]._id, { $push: { students: s3._id } });

    res.json({ 
      success: true, 
      message: 'Demo ma\'lumotlar yaratildi!',
      credentials: [
        { role: 'admin', email: 'admin@edu.uz', password: 'admin123' },
        { role: 'teacher', email: 'alisher@edu.uz', password: 'teacher123' },
        { role: 'student', email: 'aziz@student.uz', password: 'student123' },
      ]
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Serve frontend for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Connect to MongoDB and start server
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URL || process.env.MONGO_PUBLIC_URL;
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB ulandi');
    app.listen(PORT, () => {
      console.log(`🚀 EduTeachAI Server: http://localhost:${PORT}`);
      console.log(`📋 Seed uchun: POST http://localhost:${PORT}/api/seed`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB xatosi:', err.message);
    process.exit(1);
  });
