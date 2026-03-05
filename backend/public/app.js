// ===== i18n TRANSLATIONS =====
const T = {
  uz: {
    welcome:'Xush kelibsiz', loginSubtitle:'Tizimga kirish uchun rolni tanlang',
    emailLabel:'Email yoki Login', passLabel:'Parol', loginBtn:'Kirish →',
    admin:'Admin', teacher:"O'qituvchi", student:'Talaba',
    dashboard:'Dashboard', users:"Foydalanuvchilar", groups:'Guruhlar va Fanlar',
    announcements:"E'lonlar", reports:'Hisobotlar', notifications:'Bildirishnomalar',
    aiAnalytics:'AI Tahlilchi', attendance:'Davomat', grades:'Baholar',
    messages:'Xabarlar', tasks:'Topshiriqlar', aiTest:'AI Test',
    submissions:'Topshiriqlar qabuli', logout:'Chiqish',
    totalStudents:'Jami talabalar', teachers:"O'qituvchilar", activeGroups:'Faol guruhlar',
    teachersList:"O'qituvchilar ro'yxati", studentsList:"Talabalar ro'yxati",
    fullname:'Ism Familiya', subject:'Fan', group:'Guruh', status:'Holat', actions:'Amallar',
    add:"Qo'shish", save:'Saqlash', cancel:'Bekor', send:'Yuborish',
    newAnnouncement:"Yangi E'lon", title:'Sarlavha', sendTo:'Kimga yuborish', message:'Matn',
    groupsSubjects:'Guruhlar va Fanlar', subjects:'Fanlar soni',
    weeklyAttendance:'Haftalik davomat', attendanceDist:'Davomat taqsimoti',
    subjectProgress:"Fan bo'yicha o'zlashtirish", recentActivity:"So'nggi faoliyat",
  },
  ru: {
    welcome:'Добро пожаловать', loginSubtitle:'Выберите роль для входа',
    emailLabel:'Email или Логин', passLabel:'Пароль', loginBtn:'Войти →',
    admin:'Администратор', teacher:'Преподаватель', student:'Студент',
    dashboard:'Главная', users:'Пользователи', groups:'Группы и Предметы',
    announcements:'Объявления', reports:'Отчёты', notifications:'Уведомления',
    aiAnalytics:'AI Аналитик', attendance:'Посещаемость', grades:'Оценки',
    messages:'Сообщения', tasks:'Задания', aiTest:'AI Тест',
    submissions:'Сдача заданий', logout:'Выйти',
    totalStudents:'Всего студентов', teachers:'Преподаватели', activeGroups:'Активные группы',
    teachersList:'Список преподавателей', studentsList:'Список студентов',
    fullname:'Имя Фамилия', subject:'Предмет', group:'Группа', status:'Статус', actions:'Действия',
    add:'Добавить', save:'Сохранить', cancel:'Отмена', send:'Отправить',
    newAnnouncement:'Новое объявление', title:'Заголовок', sendTo:'Кому отправить', message:'Текст',
    groupsSubjects:'Группы и Предметы', subjects:'Количество предметов',
    weeklyAttendance:'Посещаемость за неделю', attendanceDist:'Распределение',
    subjectProgress:'Успеваемость по предметам', recentActivity:'Последняя активность',
  },
  en: {
    welcome:'Welcome', loginSubtitle:'Select your role to login',
    emailLabel:'Email or Login', passLabel:'Password', loginBtn:'Login →',
    admin:'Admin', teacher:'Teacher', student:'Student',
    dashboard:'Dashboard', users:'Users', groups:'Groups & Subjects',
    announcements:'Announcements', reports:'Reports', notifications:'Notifications',
    aiAnalytics:'AI Analytics', attendance:'Attendance', grades:'Grades',
    messages:'Messages', tasks:'Assignments', aiTest:'AI Test',
    submissions:'Submission Inbox', logout:'Logout',
    totalStudents:'Total Students', teachers:'Teachers', activeGroups:'Active Groups',
    teachersList:'Teachers List', studentsList:'Students List',
    fullname:'Full Name', subject:'Subject', group:'Group', status:'Status', actions:'Actions',
    add:'Add', save:'Save', cancel:'Cancel', send:'Send',
    newAnnouncement:'New Announcement', title:'Title', sendTo:'Send To', message:'Message',
    groupsSubjects:'Groups & Subjects', subjects:'Subjects',
    weeklyAttendance:'Weekly Attendance', attendanceDist:'Attendance Distribution',
    subjectProgress:'Subject Progress', recentActivity:'Recent Activity',
  }
};

// ===== STATE =====
let currentLang = 'uz';
let currentRole = 'admin';
let loginRole = 'admin';
let currentUser = null;
let testQuestions = [];
let testAnswers = {};
let testTimerInterval = null;
let testTimeLeft = 600;
const API = window.location.origin + '/api';

// ===== LANGUAGE =====
function t(key) { return T[currentLang][key] || T['uz'][key] || key; }

function setLang(lang, btn) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  if(btn) btn.classList.add('active');
  applyTranslations();
  document.getElementById('loginTitle').textContent = t('welcome');
  document.getElementById('loginSubtitle').textContent = t('loginSubtitle');
  document.getElementById('emailLabel').textContent = t('emailLabel');
  document.getElementById('passLabel').textContent = t('passLabel');
  document.getElementById('loginBtn').textContent = t('loginBtn');
  document.querySelectorAll('.rp-name[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    el.textContent = t(key);
  });
}

function changeLang(lang, btn) {
  currentLang = lang;
  // Update all lang buttons
  document.querySelectorAll('.tb-lang-btn, .sb-lang-btn').forEach(b => b.classList.remove('active'));
  document.querySelectorAll(`.tb-lang-btn, .sb-lang-btn`).forEach(b => {
    if(b.getAttribute('onclick')?.includes(`'${lang}'`)) b.classList.add('active');
  });
  applyTranslations();
  if(currentUser) buildSidebar(currentRole);
  if(btn) btn.classList.add('active');
  showToast(lang === 'uz' ? "Til o'zgartirildi" : lang === 'ru' ? 'Язык изменён' : 'Language changed', 'success');
  apiCall('PUT', '/auth/language', { language: lang }).catch(()=>{});
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (T[currentLang][key]) el.textContent = T[currentLang][key];
  });
  if(document.getElementById('logoutText')) document.getElementById('logoutText').textContent = t('logout');
}

// ===== API HELPER =====
async function apiCall(method, endpoint, data = null) {
  const token = localStorage.getItem('edutoken');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }
  };
  if (data && method !== 'GET') opts.body = JSON.stringify(data);
  try {
    const res = await fetch(API + endpoint, opts);
    return await res.json();
  } catch {
    return { success: false, message: 'Server bilan bog\'lanib bo\'lmadi' };
  }
}

// ===== LOGIN =====
function selectLoginRole(el, role) {
  document.querySelectorAll('.role-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  loginRole = role;
}

async function doLogin() {
  const email = document.getElementById('loginInput').value.trim();
  const password = document.getElementById('passInput').value;
  if (!email || !password) { showToast(t('emailLabel') + ' va parol kiriting!', 'error'); return; }

  const btn = document.getElementById('loginBtn');
  btn.textContent = '...'; btn.disabled = true;

  try {
    const res = await apiCall('POST', '/auth/login', { email, password });
    if (res.success) {
      localStorage.setItem('edutoken', res.token);
      localStorage.setItem('eduuser', JSON.stringify(res.user));
      currentUser = res.user;
      currentLang = res.user.language || 'uz';
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('appScreen').style.display = 'flex';
      setupApp(res.user);
    } else {
      showToast(res.message || 'Xato!', 'error');
    }
  } catch {
    // Demo mode if backend is not available
    demoLogin(email, loginRole);
  }
  btn.textContent = t('loginBtn'); btn.disabled = false;
}

function demoLogin(email, role) {
  const demoUsers = {
    admin: { id: '1', name: 'Admin User', email: 'admin@edu.uz', role: 'admin', language: currentLang },
    teacher: { id: '2', name: 'Alisher Nazarov', email: 'alisher@edu.uz', role: 'teacher', language: currentLang, subject: 'Dasturlash texnologiyalari', group: { name: 'IT-201' } },
    student: { id: '3', name: 'Aziz Karimov', email: 'aziz@student.uz', role: 'student', language: currentLang, group: { name: 'IT-201' } }
  };
  const user = demoUsers[role] || demoUsers.admin;
  currentUser = user;
  localStorage.setItem('eduuser', JSON.stringify(user));
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('appScreen').style.display = 'flex';
  setupApp(user);
  showToast('Demo rejim (backend ulanmagan)', 'warn');
}

function doLogout() {
  localStorage.removeItem('edutoken');
  localStorage.removeItem('eduuser');
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  currentUser = null;
}

// ===== APP SETUP =====
function setupApp(user) {
  currentRole = user.role;
  currentLang = user.language || 'uz';

  // Update sidebar user info
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  document.getElementById('sidebarAvatar').innerHTML = user.avatar ? `<img src="${user.avatar}" alt="">` : initials;
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarRole').textContent = t(user.role);
  document.getElementById('topbarAvatar').innerHTML = user.avatar ? `<img src="${user.avatar}" alt="">` : initials;
  document.getElementById('topbarName').textContent = user.name.split(' ')[0];

  buildSidebar(user.role);
  applyTranslations();
  buildChart();
  loadTestQuestions();
  checkNotifications();
}

// ===== SIDEBAR =====
function buildSidebar(role) {
  const navDefs = {
    admin: [
      { label: 'Asosiy', items: [
        { id: 'dashboard', icon: '📊', key: 'dashboard' },
        { id: 'notifications', icon: '🔔', key: 'notifications', badge: 4 },
        { id: 'ai', icon: '🤖', key: 'aiAnalytics' },
      ]},
      { label: 'Boshqaruv', items: [
        { id: 'users', icon: '👥', key: 'users' },
        { id: 'groups', icon: '🏫', key: 'groups' },
        { id: 'announcements', icon: '📢', key: 'announcements' },
        { id: 'reports', icon: '📈', key: 'reports' },
      ]},
    ],
    teacher: [
      { label: 'Asosiy', items: [
        { id: 'teacher-dashboard', icon: '📊', key: 'dashboard' },
        { id: 'notifications', icon: '🔔', key: 'notifications', badge: 2 },
        { id: 'teacher-submissions', icon: '📥', key: 'submissions' },
      ]},
      { label: 'Guruh', items: [
        { id: 'teacher-grades', icon: '🎯', key: 'grades' },
        { id: 'teacher-messages', icon: '💬', key: 'messages' },
        { id: 'teacher-reports', icon: '📈', key: 'reports' },
      ]},
    ],
    student: [
      { label: 'Asosiy', items: [
        { id: 'student-dashboard', icon: '📊', key: 'dashboard' },
        { id: 'student-ai', icon: '🤖', key: 'aiAnalytics' },
        { id: 'notifications', icon: '🔔', key: 'notifications', badge: 2 },
      ]},
      { label: "O'qish", items: [
        { id: 'student-tasks', icon: '📋', key: 'tasks' },
        { id: 'student-test', icon: '🧪', key: 'aiTest' },
        { id: 'student-messages', icon: '💬', key: 'messages' },
      ]},
    ],
  };
  const nav = document.getElementById('sidebarNav');
  nav.innerHTML = '';
  const sections = navDefs[role] || navDefs.admin;
  sections.forEach(section => {
    const lbl = document.createElement('div');
    lbl.className = 'nav-section-label';
    lbl.textContent = section.label;
    nav.appendChild(lbl);
    section.items.forEach(item => {
      const el = document.createElement('div');
      el.className = 'nav-item';
      el.dataset.page = item.id;
      el.innerHTML = `<span class="nav-icon">${item.icon}</span><span class="nav-label">${t(item.key)}</span>${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}`;
      el.onclick = () => showPage(item.id);
      nav.appendChild(el);
    });
  });
  // Show first page
  const firstPage = sections[0].items[0].id;
  showPage(firstPage);
}

// ===== NAVIGATION =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const navItem = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (navItem) navItem.classList.add('active');
  const titles = {
    'dashboard': t('dashboard'), 'users': t('users'), 'groups': t('groups'),
    'announcements': t('announcements'), 'reports': t('reports'),
    'notifications': t('notifications'), 'ai': t('aiAnalytics'),
    'teacher-dashboard': t('dashboard'), 'teacher-grades': t('grades'),
    'teacher-messages': t('messages'), 'teacher-reports': t('reports'),
    'teacher-submissions': t('submissions'),
    'student-dashboard': t('dashboard'), 'student-tasks': t('tasks'),
    'student-test': t('aiTest'), 'student-messages': t('messages'),
    'student-ai': t('aiAnalytics')
  };
  document.getElementById('topbarTitle').textContent = titles[pageId] || pageId;
  document.getElementById('topbarSub').textContent = currentUser?.name || '';
  if (pageId === 'student-test') startTestTimer();
}

// ===== TABS =====
function switchTab(btn, tabId) {
  const parent = btn.closest('.page, .card');
  parent.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const container = btn.closest('.page, .card');
  const allTabs = container.querySelectorAll('[id^="tab-"],[id^="s-tab-"],[id^="sub-tab-"]');
  allTabs.forEach(t => t.style.display = 'none');
  const target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
}

// ===== MODALS =====
function openModal(id) { document.getElementById(id).classList.add('show'); }
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeOnOverlay(e, el) { if (e.target === el) el.classList.remove('show'); }

// ===== PROFILE =====
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('profileName').value = currentUser.name || '';
  document.getElementById('profileEmail').value = currentUser.email || '';
  document.getElementById('profilePhone').value = currentUser.phone || '';
  document.getElementById('profileLang').value = currentLang;
  const initials = currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const preview = document.getElementById('profileAvatarPreview');
  preview.innerHTML = currentUser.avatar ? `<img src="${currentUser.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" alt="">` : `<span id="profileAvatarInitial">${initials}</span>`;
  openModal('profileModal');
}

function previewAvatar(input) {
  if (input.files && input.files[0]) {
    const reader = new FileReader();
    reader.onload = e => {
      document.getElementById('profileAvatarPreview').innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%" alt="">`;
      if (currentUser) currentUser._avatarData = e.target.result;
    };
    reader.readAsDataURL(input.files[0]);
  }
}

async function saveProfile() {
  const name = document.getElementById('profileName').value.trim();
  const phone = document.getElementById('profilePhone').value.trim();
  const lang = document.getElementById('profileLang').value;
  const pass = document.getElementById('profileNewPass').value;
  if (!name) { showToast('Ism kiritilishi shart!', 'error'); return; }
  const updates = { name, phone, language: lang };
  if (pass) updates.password = pass;
  if (currentUser._avatarData) updates.avatar = currentUser._avatarData;

  const res = await apiCall('PUT', '/auth/profile', updates);
  if (res.success || !res.message?.includes('Server')) {
    currentUser = { ...currentUser, name, phone, language: lang };
    if (updates.avatar) currentUser.avatar = updates.avatar;
    localStorage.setItem('eduuser', JSON.stringify(currentUser));
    currentLang = lang;
    setupApp(currentUser);
    closeModal('profileModal');
    showToast('Profil saqlandi!', 'success');
  } else {
    // Demo mode
    currentUser = { ...currentUser, name, phone, language: lang };
    localStorage.setItem('eduuser', JSON.stringify(currentUser));
    setupApp(currentUser);
    closeModal('profileModal');
    showToast('Profil saqlandi!', 'success');
  }
}

// ===== USERS =====
function editUserModal(user) {
  document.getElementById('editName').value = user.name || '';
  document.getElementById('editEmail').value = user.email || '';
  document.getElementById('editUserTitle').textContent = `✏️ ${user.name} ni tahrirlash`;
  openModal('editUserModal');
}

function saveEditUser() {
  const name = document.getElementById('editName').value;
  showToast(`${name} ma'lumotlari yangilandi!`, 'success');
  closeModal('editUserModal');
}

async function addUser(role) {
  const name = document.getElementById(role === 'teacher' ? 'newTeacherName' : 'newStudentName').value;
  const email = document.getElementById(role === 'teacher' ? 'newTeacherEmail' : 'newStudentEmail').value;
  if (!name || !email) { showToast("Ism va email kiritilishi shart!", 'error'); return; }
  showToast(`${name} tizimga qo'shildi!`, 'success');
  closeModal(role === 'teacher' ? 'addTeacherModal' : 'addStudentModal');
  // Add row to table
  const tbody = document.getElementById(role === 'teacher' ? 'teacherTableBody' : 'studentTableBody');
  if (tbody) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${name}</td><td>${role === 'teacher' ? 'Dasturlash texnologiyalari' : 'IT-201'}</td><td>IT-201</td>${role === 'teacher' ? '<td><span class="badge badge-warning">Yo\'q</span></td>' : '<td>—</td><td>—</td>'}<td><span class="badge badge-success">Faol</span></td><td><button class="btn btn-sm btn-outline" onclick="editUserModal({name:'${name}',email:'${email}',role:'${role}'})">✏️</button> <button class="btn btn-sm btn-danger" onclick="deleteRow(this)">🗑️</button></td>`;
    tbody.appendChild(tr);
  }
}

function deleteRow(btn) {
  if (confirm(currentLang === 'ru' ? 'Удалить?' : currentLang === 'en' ? 'Delete?' : "O'chirishni tasdiqlaysizmi?")) {
    btn.closest('tr').style.animation = 'fadeUp .3s ease reverse';
    setTimeout(() => btn.closest('tr').remove(), 300);
    showToast("O'chirildi!", 'success');
  }
}

// ===== TABLE FILTERS =====
function filterTable(input, tableId) {
  const val = input.value.toLowerCase();
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(val) ? '' : 'none';
  });
}

function filterByGroup(tableId, groupVal, role) {
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(row => {
    if (!groupVal) { row.style.display = ''; return; }
    const groupCell = row.querySelector('td[data-group]');
    if (groupCell) row.style.display = groupCell.dataset.group === groupVal ? '' : 'none';
    else row.style.display = row.textContent.includes(groupVal) ? '' : 'none';
  });
}

function filterReportTable(groupVal) {
  document.querySelectorAll('#reportTableBody tr').forEach(row => {
    if (!groupVal) { row.style.display = ''; return; }
    row.style.display = row.dataset.group === groupVal ? '' : 'none';
  });
}

// ===== ATTENDANCE =====
function saveAttendance() {
  closeModal('attendanceModal');
  showToast('Davomat saqlandi!', 'success');
}

// ===== GRADES =====
function calcAvg(input) {
  const row = input.closest('tr');
  const inputs = row.querySelectorAll('.grade-input');
  const vals = Array.from(inputs).map(i => parseFloat(i.value) || 0);
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = (sum / (vals.length * 100) * 5).toFixed(2);
  const avgCell = row.querySelector('.avg-cell');
  if (avgCell) {
    const color = avg >= 4.5 ? 'var(--success)' : avg >= 3 ? 'var(--primary)' : 'var(--danger)';
    avgCell.innerHTML = `<strong style="color:${color}">${avg}</strong>`;
  }
}

function saveGrades() { showToast('Baholar saqlandi!', 'success'); }

function filterGrades() {
  const mod = document.getElementById('gradeModuleFilter')?.value;
  // In real app, filter by module
  showToast('Filtr qo\'llanildi', 'success');
}

// ===== ASSIGNMENTS =====
function fileSelected(input) {
  const files = Array.from(input.files);
  const text = files.map(f => `📄 ${f.name}`).join(', ');
  document.getElementById('uploadAreaText').textContent = text || 'Fayl yuklash uchun bosing';
}

function submitFileSelected(input) {
  const files = Array.from(input.files);
  if (files.length > 0) {
    document.getElementById('submitFileText').textContent = `✅ ${files[0].name} tanlandi`;
    showToast(`${files[0].name} tanlandi`, 'success');
  }
}

async function uploadAssignment() {
  const title = document.getElementById('assignTitle').value.trim();
  const deadline = document.getElementById('assignDeadline').value;
  if (!title) { showToast('Topshiriq nomi kiritilishi shart!', 'error'); return; }
  if (!deadline) { showToast('Muddat belgilanishi shart!', 'error'); return; }
  showToast(`"${title}" topshirig'i yuklandi!`, 'success');
  document.getElementById('assignTitle').value = '';
  document.getElementById('assignDeadline').value = '';
  document.getElementById('uploadAreaText').textContent = 'Fayl yuklash uchun bosing';
}

function downloadAssignment(filename) {
  showToast(`${filename} yuklanmoqda...`, 'success');
  // In real: window.open(`${API}/assignments/download/${filename}`);
  const a = document.createElement('a');
  a.href = '#'; a.download = filename;
  showToast('Topshiriq yuklab olindi (demo)', 'success');
}

function downloadSub(e, filename) {
  e.preventDefault();
  showToast(`${filename} yuklanmoqda...`, 'success');
}

async function submitAssignment() {
  const file = document.getElementById('submitFile').files[0];
  if (!file) { showToast('Fayl tanlanmagan!', 'error'); return; }
  showToast(`"${file.name}" topshirildi!`, 'success');
  closeModal('submitModal');
}

function gradeSubmission(btn) {
  const row = btn.closest('tr');
  const input = row.querySelector('input[type=number]');
  if (!input.value) { showToast('Baho kiriting!', 'error'); return; }
  showToast(`Baho saqlandi: ${input.value}`, 'success');
  btn.textContent = '✅ Baholangan'; btn.disabled = true;
}

function sendWarning(name) {
  showToast(`${name} ga ogohlantirish yuborildi!`, 'warn');
}

function sendWarningAll() {
  showToast('Barcha topshirmaganlar ogohlantirish oldi!', 'warn');
}

function openChatWith(name) {
  showToast(`${name} bilan chat (demo)`, 'success');
}

// ===== MESSAGES =====
function sendTeacherMessage() {
  const text = document.getElementById('msgTextTeacher').value.trim();
  const to = document.getElementById('msgToTeacher').value;
  if (!text) { showToast('Xabar kiritilmagan!', 'error'); return; }
  showToast(`${to} ga xabar yuborildi!`, 'success');
  document.getElementById('msgTextTeacher').value = '';
  addChatBubble('teacherChatMessages', text, true);
}

function sendTeacherChat() {
  const input = document.getElementById('teacherChatInput');
  const text = input.value.trim();
  if (!text) return;
  addChatBubble('teacherChatMessages', text, true);
  input.value = '';
  setTimeout(() => addChatBubble('teacherChatMessages', "Tushundim, rahmat!", false), 800);
}

function sendStudentMessage() {
  const text = document.getElementById('studentMsgText').value.trim();
  if (!text) { showToast('Xabar kiritilmagan!', 'error'); return; }
  showToast('Xabar yuborildi!', 'success');
  document.getElementById('studentMsgText').value = '';
  addChatBubble('studentChatMessages', text, true);
}

function sendStudentChat() {
  const input = document.getElementById('studentChatInput');
  const text = input.value.trim();
  if (!text) return;
  addChatBubble('studentChatMessages', text, true);
  input.value = '';
  setTimeout(() => addChatBubble('studentChatMessages', "Javobingiz uchun rahmat!", false), 800);
}

function addChatBubble(containerId, text, isMe) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const div = document.createElement('div');
  div.className = 'chat-msg-row' + (isMe ? ' me' : '');
  const initials = isMe ? (currentUser?.name?.substring(0, 2) || 'Me') : 'AN';
  div.innerHTML = `<div class="chat-av" style="${isMe ? 'background:var(--accent);color:white' : ''}">${initials}</div><div><div class="chat-bubble">${text}</div></div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

// ===== ANNOUNCEMENTS =====
async function sendAnnouncement() {
  const title = document.getElementById('annTitle').value.trim();
  const content = document.getElementById('annContent').value.trim();
  if (!title || !content) { showToast("Sarlavha va matn kiritilishi shart!", 'error'); return; }
  showToast(`E'lon yuborildi: "${title}"`, 'success');
  document.getElementById('annTitle').value = '';
  document.getElementById('annContent').value = '';
}

// ===== REPORTS =====
function generateReport() { showToast('Hisobot yangilandi!', 'success'); }

function exportToExcel(type) {
  showToast('Excel fayl yuklanmoqda...', 'success');
  // In production: window.location.href = `${API}/reports/export/excel`;
  // Demo: create simple CSV download
  const rows = type === 'admin'
    ? [['Guruh','Talabalar','Davomat','Baho','Topshiriqlar'], ['IT-201','28','91%','4.3','95%'], ['IT-202','25','72%','3.5','78%'], ['MT-101','30','88%','4.1','90%']]
    : [['Talaba','Davomat','Baho','Topshiriqlar','Test'], ['Aziz Karimov','91%','4.5','95%','8/10'], ['Malika Yusupova','98%','5.0','100%','10/10']];
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'EduTeachAI_hisobot.csv'; a.click();
  URL.revokeObjectURL(url);
}

function exportToWord(type) {
  showToast('Word fayl yuklanmoqda...', 'success');
  const now = new Date().toLocaleDateString('uz-UZ');
  const content = type === 'admin'
    ? `EduTeachAI - Hisobot\nSana: ${now}\n\nGuruh | Talabalar | Davomat | Baho\nIT-201 | 28 | 91% | 4.3\nIT-202 | 25 | 72% | 3.5\nMT-101 | 30 | 88% | 4.1`
    : `EduTeachAI - O'qituvchi Hisoboti\nSana: ${now}\n\nTalaba | Davomat | Baho | Test\nAziz Karimov | 91% | 4.5 | 8/10\nMalika Yusupova | 98% | 5.0 | 10/10`;
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'EduTeachAI_hisobot.txt'; a.click();
  URL.revokeObjectURL(url);
}

// ===== AI ANALYTICS =====
const aiData = {
  day:   { d:'89%', g:'4.2', t:'78%', x:'7', text:"Bugungi tahlil: 89% davomat ko'rsatkichi maqbul. 7 ta talaba xavfli. IT-202 guruhiga alohida e'tibor kerak. Dasturlash texnologiyalari eng yaxshi o'zlashtirish (4.3)." },
  week:  { d:'87%', g:'4.1', t:'82%', x:'5', text:"Haftalik tahlil: o'rtacha davomat 87%. O'tgan haftaga nisbatan IT-202 davomati 6% pasaydi. 5 ta talaba diqqatga loyiq." },
  month: { d:'91%', g:'4.3', t:'88%', x:'3', text:"Oylik tahlil: davomat 91%. Dasturlash texnologiyalari fani eng yaxshi o'zlashtirish (4.5). 3 ta talaba kuzatuvda." },
  year:  { d:'90%', g:'4.2', t:'91%', x:'12', text:"Yillik tahlil: umumiy davomat 90%. 12 ta talaba yil davomida muammo ko'rsatdi. IT-201 eng yaxshi guruh — 4.4 baho." }
};

function setAIPeriod(period, btn) {
  btn.closest('.ai-panel').querySelectorAll('.ai-p-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const d = aiData[period];
  const els = ['ai-davomat','ai-baho','ai-topshiriq','ai-xavfli'];
  const vals = [d.d, d.g, d.t, d.x];
  els.forEach((id, i) => { const el = document.getElementById(id); if(el) el.textContent = vals[i]; });
  const txt = document.getElementById('aiAnalysisText');
  if(txt) txt.textContent = d.text;
}

const sAiData = {
  day:   { a:'91%', g:'4.3', t:'8/10', s:'95%', text:"Bugun yaxshi holatdasiz! 91% davomat. Ingliz tili davomatingiz 78% — kuzatish kerak. Matematika vazifasi bugun!" },
  week:  { a:'88%', g:'4.2', t:'7/10', s:'90%', text:"Haftalik: 88% davomat. Fizika fanidagi baholaringiz yaxshilandi. 2 ta topshiriq muddati kelmoqda." },
  month: { a:'91%', g:'4.3', t:'8/10', s:'95%', text:"Oylik: o'rtacha 4.3 baho. Eng yaxshi fan: Dasturlash texnologiyalari (4.5). Muddatni o'tkazib yubormang!" },
  year:  { a:'90%', g:'4.2', t:'7.5/10', s:'92%', text:"Yillik: 90% davomat va 4.2 baho — yaxshi natija. Keyingi semestrda ingliz tiliga ko'proq e'tibor bering." }
};

function setStudentAIPeriod(period, btn) {
  btn.closest('.ai-panel').querySelectorAll('.ai-p-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  const d = sAiData[period];
  const m = {'s-ai-att':d.a,'s-ai-grade':d.g,'s-ai-test':d.t,'s-ai-assign':d.s};
  Object.entries(m).forEach(([id, val]) => { const el = document.getElementById(id); if(el) el.textContent = val; });
  const txt = document.getElementById('s-aiText');
  if(txt) txt.textContent = d.text;
}

// ===== AI TEST =====
const testQuestionBank = {
  'Dasturlash texnologiyalari': [
    { q:'Python da ro\'yxat (list) elementiga qanday murojaat qilinadi?', opts:['list{0}','list[0]','list(0)','list.get(0)'], a:1 },
    { q:'Qaysi operator Python da funksiya aniqlash uchun ishlatiladi?', opts:['function','func','def','lambda'], a:2 },
    { q:'Python da lug\'at (dictionary) uchun qaysi belgi?', opts:['[]','()','{}','<>'], a:2 },
    { q:'OOP da encapsulation nima?', opts:['Meros olish','Ma\'lumotni yashirish','Polimorfizm','Abstraktsiya'], a:1 },
    { q:'Git da yangi branch yaratish buyrug\'i?', opts:['git new branch','git branch name','git checkout -b name','git create name'], a:2 },
    { q:'SQL da jadvaldan barcha ma\'lumot olish?', opts:['GET * FROM t','SELECT * FROM t','FETCH * FROM t','READ * FROM t'], a:1 },
    { q:'REST API da yangi resurs yaratish uchun qaysi HTTP method?', opts:['GET','PUT','POST','DELETE'], a:2 },
    { q:'Rekursiya nima?', opts:['Tsikl','O\'zini chaqiruvchi funksiya','Massiv','Ob\'ekt'], a:1 },
    { q:'Big O notation O(n²) nima degani?', opts:['Chiziqli','Kvadratik','Logarifmik','Konstantli'], a:1 },
    { q:'Docker nima uchun ishlatiladi?', opts:['Ma\'lumotlar bazasi','Konteynerizatsiya','Test','Monitoring'], a:1 },
  ],
  'Oliy matematika': [
    { q:'f(x)=x³ ning hosilasi?', opts:['3x','3x²','x²','2x³'], a:1 },
    { q:'∫x dx = ?', opts:['x²/2 + C','x² + C','2x + C','x/2 + C'], a:0 },
    { q:'Matritsalar ko\'paytmasi qachon mavjud?', opts:['Har doim','A ustunlari = B satrlari','Teng o\'lchamli','Hech qachon'], a:1 },
    { q:'Chiziqli tenglama sistemasida yechim soni?', opts:['Doim 1 ta','0, 1 yoki ∞','Faqat 2 ta','Doim ∞'], a:1 },
    { q:'sin²x + cos²x = ?', opts:['0','2','1','sin2x'], a:2 },
    { q:'Limit lim(x→0) sin(x)/x = ?', opts:['0','∞','1','Mavjud emas'], a:2 },
    { q:'e soni qiymatiga yaqin qiymat?', opts:['2.718','3.141','1.414','1.618'], a:0 },
    { q:'Vektorlar skalyar ko\'paytmasi natijasi?', opts:['Vektor','Matritsa','Skalyar','Tensor'], a:2 },
    { q:'Taylor qatorida asosiy g\'oya?', opts:['Funksiyani polinomga yoyish','Integrallash','Differensiallash','Chiziqli approximatsiya'], a:0 },
    { q:'Laplace transformatsiyasi nima uchun?', opts:['Algebraik','Differensial tenglamalar','Geometrik','Statistik'], a:1 },
  ],
  'Umumiy fizika': [
    { q:'Nyutonning 2-qonuni?', opts:['F=ma','E=mc²','p=mv','W=Fd'], a:0 },
    { q:'Elektr qarshiligi birligi?', opts:['Volt','Amper','Om','Vatt'], a:2 },
    { q:'Yorug\'lik tezligi vakuumda?', opts:['3×10⁶ m/s','3×10⁸ m/s','3×10⁵ m/s','3×10⁴ m/s'], a:1 },
    { q:'Termodinamikaning birinchi qonuni?', opts:['Entropiya ortadi','Energiya saqlanadi','Absolyut nol mavjud','Issiqlik o\'tmaydi'], a:1 },
    { q:'Gravitatsion tortishish formulasi?', opts:['F=kq₁q₂/r²','F=Gm₁m₂/r²','F=ma','F=mv²/r'], a:1 },
    { q:'Kvant mexanikasi kim tomonidan?', opts:['Nyuton','Eyns htein','Plank va Bohr','Faraday'], a:2 },
    { q:'Elektromagnit to\'lqin tezligi?', opts:['Ovoz tezligi','Yorug\'lik tezligi','Ikki baravar','Yarmisi'], a:1 },
    { q:'Issiqlik sig\'imi birligi?', opts:['J/kg','J/(kg·K)','J·K','W/m'], a:1 },
    { q:'Foton — bu?', opts:['Zaryadli zarracha','Og\'ir zarracha','Zaryadsi yorug\'lik kvanti','Elektron'], a:2 },
    { q:'Rezonans hodisasi nima?', opts:['Tebranish kuchayishi','Tebranish so\'nishi','Interferensiya','Difraksiya'], a:0 },
  ],
};

function loadTestQuestions() {
  const subject = currentUser?.subject || 'Dasturlash texnologiyalari';
  const bank = testQuestionBank[subject] || testQuestionBank['Dasturlash texnologiyalari'];
  testQuestions = [...bank].sort(() => Math.random() - 0.5);
  testAnswers = {};
  renderTest();
}

function generateTeacherAITest() {
  const subject = document.getElementById('assignSubject')?.value || 'Dasturlash texnologiyalari';
  const bank = testQuestionBank[subject] || testQuestionBank['Dasturlash texnologiyalari'];
  showToast(`"${subject}" bo'yicha 10 ta savol yaratildi! Talabalar profilida ko'rsatildi.`, 'success');
}

function renderTest() {
  const container = document.getElementById('testContainer');
  if (!container) return;
  const subTitle = document.getElementById('testSubTitle');
  if (subTitle) subTitle.textContent = `${currentUser?.subject || 'Dasturlash texnologiyalari'} · ${testQuestions.length} ta savol`;

  container.innerHTML = testQuestions.map((q, i) => `
    <div class="test-card" id="tq-${i}">
      <div class="test-q">${i+1}. ${q.q}</div>
      <div class="test-options">
        ${q.opts.map((opt, j) => `
          <label class="test-option" id="to-${i}-${j}" onclick="selectAnswer(${i},${j},this)">
            <input type="radio" name="q${i}" value="${j}" style="pointer-events:none"> ${String.fromCharCode(65+j)}) ${opt}
          </label>`).join('')}
      </div>
    </div>`).join('');

  document.getElementById('testResult').style.display = 'none';
  document.getElementById('testFooter').style.display = 'flex';
  document.getElementById('testSubmitBtn').style.display = 'inline-flex';
  updateTestProgress();
}

function selectAnswer(qIdx, aIdx, label) {
  testAnswers[qIdx] = aIdx;
  const card = document.getElementById(`tq-${qIdx}`);
  card.querySelectorAll('.test-option').forEach(l => l.style.borderColor = '');
  label.style.borderColor = 'var(--primary)';
  label.style.background = 'var(--gray-100)';
  updateTestProgress();
}

function updateTestProgress() {
  const answered = Object.keys(testAnswers).length;
  const prog = document.getElementById('testProgress');
  if (prog) prog.textContent = `${answered} / ${testQuestions.length} javob berildi`;
}

function startTestTimer() {
  if (testTimerInterval) clearInterval(testTimerInterval);
  testTimeLeft = testQuestions.length * 60;
  testTimerInterval = setInterval(() => {
    testTimeLeft--;
    const el = document.getElementById('testTimer');
    if (!el) { clearInterval(testTimerInterval); return; }
    const m = Math.floor(testTimeLeft / 60), s = testTimeLeft % 60;
    el.textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`;
    if (testTimeLeft <= 0) { clearInterval(testTimerInterval); submitTest(); }
  }, 1000);
}

function submitTest() {
  if (testTimerInterval) clearInterval(testTimerInterval);
  let correct = 0;
  testQuestions.forEach((q, i) => {
    const answered = testAnswers[i] !== undefined;
    document.querySelectorAll(`#tq-${i} .test-option`).forEach((opt, j) => {
      opt.querySelector('input').disabled = true;
      if (j === q.a) opt.classList.add('correct');
      else if (testAnswers[i] === j) opt.classList.add('wrong');
    });
    if (testAnswers[i] === q.a) correct++;
  });
  const total = testQuestions.length;
  const pct = Math.round(correct / total * 100);
  document.getElementById('testSubmitBtn').style.display = 'none';

  // Show result modal
  const emoji = pct >= 80 ? '🎉' : pct >= 60 ? '👍' : '😔';
  const desc = pct >= 80
    ? `A'lo natija! ${pct}% to'g'ri javob.`
    : pct >= 60 ? `Yaxshi! ${pct}% to'g'ri. Yana bir oz harakat qiling.`
    : `${pct}% to'g'ri. Ko'proq o'qish tavsiya etiladi.`;

  document.getElementById('testResultEmoji').textContent = emoji;
  document.getElementById('testResultTitle').textContent = 'Test yakunlandi!';
  document.getElementById('testResultScore').textContent = `${correct}/${total}`;
  document.getElementById('testResultDesc').textContent = desc;
  openModal('testResultModal');
}

function restartTest() {
  loadTestQuestions();
  startTestTimer();
}

// ===== NOTIFICATIONS =====
async function checkNotifications() {
  const dot = document.getElementById('notifDot');
  if (dot) dot.style.display = 'block'; // show badge
}

function markAllRead() {
  document.querySelectorAll('.notif-item').forEach(el => el.style.opacity = '.6');
  document.getElementById('notifDot').style.display = 'none';
  showToast("Barcha bildirishnomalar o'qildi", 'success');
}

// ===== CHART =====
function buildChart() {
  const chart = document.getElementById('weekChart');
  if (!chart) return;
  const days = currentLang === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] :
               currentLang === 'en' ? ['Mo','Tu','We','Th','Fr','Sa','Su'] :
               ['Du','Se','Ch','Pa','Ju','Sha','Ya'];
  const vals = [92, 88, 95, 85, 91, 78, 82];
  chart.innerHTML = days.map((d, i) => `
    <div class="chart-bar-wrap">
      <div class="chart-bar" style="height:0" data-h="${vals[i]}%" title="${vals[i]}%"></div>
      <span class="chart-bar-label">${d}</span>
    </div>`).join('');
  setTimeout(() => chart.querySelectorAll('.chart-bar').forEach(b => b.style.height = b.dataset.h), 400);
}

// ===== TOAST =====
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type === 'error' ? 'error' : type === 'warn' ? 'warn' : ''}`;
  const icons = { success: '✅', error: '❌', warn: '⚠️' };
  toast.innerHTML = `<span>${icons[type] || '✅'}</span><span>${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transform = 'translateX(100%)'; toast.style.transition = '.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// ===== AUTO-INIT =====
window.addEventListener('DOMContentLoaded', () => {
  // Check saved session
  const savedUser = localStorage.getItem('eduuser');
  const savedToken = localStorage.getItem('edutoken');
  if (savedUser && savedToken) {
    try {
      currentUser = JSON.parse(savedUser);
      currentLang = currentUser.language || 'uz';
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('appScreen').style.display = 'flex';
      setupApp(currentUser);
    } catch { localStorage.clear(); }
  }
});
