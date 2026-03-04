// models/Group.js
const mongoose = require('mongoose');

const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subject: { type: String, required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Group = mongoose.model('Group', groupSchema);

// models/Attendance.js
const attendanceSchema = new mongoose.Schema({
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  lesson: { type: Number, default: 1 },
  records: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['present', 'absent', 'late'], default: 'present' }
  }],
}, { timestamps: true });

const Attendance = mongoose.model('Attendance', attendanceSchema);

// models/Grade.js
const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  subject: { type: String, required: true },
  module1: { type: Number, min: 0, max: 100, default: 0 },
  module2: { type: Number, min: 0, max: 100, default: 0 },
  midterm: { type: Number, min: 0, max: 100, default: 0 },
  final: { type: Number, min: 0, max: 100, default: 0 },
  average: { type: Number, default: 0 },
  semester: { type: String, default: '2024-2025-1' },
}, { timestamps: true });

gradeSchema.pre('save', function(next) {
  const sum = (this.module1 + this.module2 + this.midterm + this.final);
  this.average = parseFloat((sum / 40 * 5).toFixed(2));
  next();
});

const Grade = mongoose.model('Grade', gradeSchema);

// models/Assignment.js
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  teacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  subject: { type: String, required: true },
  deadline: { type: Date, required: true },
  files: [{ filename: String, originalname: String, mimetype: String, size: Number }],
  submissions: [{
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    files: [{ filename: String, originalname: String }],
    submittedAt: { type: Date, default: Date.now },
    grade: { type: Number, default: null },
    feedback: { type: String, default: '' },
    status: { type: String, enum: ['submitted', 'graded', 'late'], default: 'submitted' }
  }],
  aiTest: {
    questions: [{
      question: String,
      options: [String],
      correct: Number
    }],
    generatedAt: { type: Date, default: null }
  }
}, { timestamps: true });

const Assignment = mongoose.model('Assignment', assignmentSchema);

// models/Message.js
const messageSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['message', 'warning', 'notification'], default: 'message' },
}, { timestamps: true });

const Message = mongoose.model('Message', messageSchema);

// models/Announcement.js
const announcementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  target: { type: String, enum: ['all', 'teachers', 'students', 'group'], default: 'all' },
  targetGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  priority: { type: String, enum: ['normal', 'important', 'urgent'], default: 'normal' },
}, { timestamps: true });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = { Group, Attendance, Grade, Assignment, Message, Announcement };
