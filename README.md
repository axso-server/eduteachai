# EduTeachAI — O'rnatish va Ishga Tushirish

## Loyiha Tuzilmasi
```
eduteachai/
├── backend/          # Node.js + MongoDB server
│   ├── server.js     # Asosiy server
│   ├── models/       # MongoDB modellari
│   ├── routes/       # API yo'nalishlari
│   ├── middleware/   # Auth middleware
│   └── .env          # Sozlamalar
└── frontend/
    ├── index.html    # Asosiy sahifa
    └── app.js        # JavaScript mantiq
```

## O'rnatish

### 1. Node.js o'rnatilganligini tekshiring
```bash
node --version   # v18+ tavsiya etiladi
npm --version
```

### 2. MongoDB
**Local:**
```bash
# MongoDB Community Server ni o'rnating: https://www.mongodb.com/try/download/community
mongod --dbpath /data/db
```

**Online (MongoDB Atlas - bepul):**
1. https://cloud.mongodb.com ga kiring
2. Bepul cluster yarating
3. Connection string ni .env ga joylashtiring

### 3. Backend o'rnatish
```bash
cd eduteachai/backend
npm install
```

### 4. .env faylni sozlang
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/eduteachai
# YOKI Atlas uchun:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/eduteachai
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
```

### 5. Serverni ishga tushiring
```bash
npm start
# Yoki development uchun:
npm run dev
```

### 6. Demo ma'lumotlarni yuklang
```bash
curl -X POST http://localhost:5000/api/seed
```

### 7. Saytni oching
```
http://localhost:5000
```

## Demo Kirish Ma'lumotlari

| Rol         | Email                  | Parol       |
|-------------|------------------------|-------------|
| Admin       | admin@edu.uz           | admin123    |
| O'qituvchi  | alisher@edu.uz         | teacher123  |
| Talaba      | aziz@student.uz        | student123  |

## Funksiyalar

### Admin Panel
- 📊 Dashboard — statistika va grafiklar
- 👥 Foydalanuvchilar — qo'shish/tahrirlash/o'chirish
- 🏫 Guruhlar — boshqaruv
- 📢 E'lonlar — yuborish
- 📈 Hisobotlar — Excel/Word eksport
- 🤖 AI Tahlilchi — kunlik/haftalik/oylik/yillik

### O'qituvchi Panel
- ✅ Davomat belgilash
- 🎯 Baholar (Excel/Word eksport)
- 📥 Topshiriqlar qabuli
- 📤 Topshiriq yuklash (PDF/DOCX/PPTX/MP4)
- 💬 Talabalar bilan xabarlar
- 🤖 AI Test yaratish

### Talaba Panel
- 📊 Baholar va davomat
- 📋 Topshiriqlar (yuklab olish + topshirish)
- 🧪 AI Test (natija bilan)
- 💬 O'qituvchiga xabar
- 🤖 Shaxsiy AI tahlil

## Tillar
- 🇺🇿 O'zbek
- 🇷🇺 Русский
- 🇬🇧 English

## Texnologiyalar
- **Backend:** Node.js, Express, MongoDB, Mongoose, JWT
- **Frontend:** HTML5, CSS3, Vanilla JS
- **Export:** ExcelJS
- **Auth:** JWT Token
