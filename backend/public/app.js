// ===== CONFIG & STATE =====
const API = window.location.origin + '/api';
let currentLang = 'uz', currentRole = 'admin', loginRole = 'admin', currentUser = null;
let testQuestions = [], testAnswers = {}, testTimerInterval = null, testTimeLeft = 600;
let chatPollingInterval = null, notifPollingInterval = null;
let currentChatUserId = null;
let submitAssignId = null, editingUserId = null;

// ===== TRANSLATIONS =====
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
    noData:"Ma'lumot yo'q", loading:'Yuklanmoqda...', active:'Faol', blocked:'Bloklangan',
    submitted:'Topshirildi', graded:'Baholandi', pending:'Kutilmoqda', overdue:"Muddati o'tdi",
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
    noData:'Нет данных', loading:'Загрузка...', active:'Активный', blocked:'Заблокирован',
    submitted:'Сдано', graded:'Оценено', pending:'Ожидание', overdue:'Просрочено',
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
    noData:'No data', loading:'Loading...', active:'Active', blocked:'Blocked',
    submitted:'Submitted', graded:'Graded', pending:'Pending', overdue:'Overdue',
  }
};
function t(k) { return T[currentLang]?.[k] || T.uz[k] || k; }

// ===== API HELPER =====
async function apiCall(method, endpoint, data = null, formData = null) {
  const token = localStorage.getItem('edutoken');
  const opts = { method, headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) } };
  if (formData) { opts.body = formData; }
  else if (data) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(data); }
  try {
    const res = await fetch(API + endpoint, opts);
    return await res.json();
  } catch { return { success: false, message: "Server bilan bog'lanib bo'lmadi" }; }
}

// ===== LANGUAGE =====
function setLang(lang, btn) {
  currentLang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  document.getElementById('loginTitle').textContent = t('welcome');
  document.getElementById('loginSubtitle').textContent = t('loginSubtitle');
  document.getElementById('emailLabel').textContent = t('emailLabel');
  document.getElementById('passLabel').textContent = t('passLabel');
  document.getElementById('loginBtn').textContent = t('loginBtn');
  document.querySelectorAll('.rp-name[data-i18n]').forEach(el => el.textContent = t(el.dataset.i18n));
}
function changeLang(lang) {
  currentLang = lang;
  document.querySelectorAll('.tb-lang-btn,.sb-lang-btn').forEach(b => {
    b.classList.toggle('active', b.getAttribute('onclick')?.includes(`'${lang}'`));
  });
  applyTranslations();
  if (currentUser) buildSidebar(currentRole);
  apiCall('PUT', '/auth/language', { language: lang });
  showToast(lang === 'uz' ? "Til o'zgartirildi" : lang === 'ru' ? 'Язык изменён' : 'Language changed', 'success');
}
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (T[currentLang]?.[el.dataset.i18n]) el.textContent = T[currentLang][el.dataset.i18n];
  });
  if (document.getElementById('logoutText')) document.getElementById('logoutText').textContent = t('logout');
}

// ===== LOGIN =====
function selectLoginRole(el, role) {
  document.querySelectorAll('.role-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active'); loginRole = role;
}
async function doLogin() {
  const email = document.getElementById('loginInput').value.trim();
  const password = document.getElementById('passInput').value;
  if (!email || !password) { showToast('Email va parol kiriting!', 'error'); return; }
  const btn = document.getElementById('loginBtn');
  btn.textContent = '...'; btn.disabled = true;
  const res = await apiCall('POST', '/auth/login', { email, password });
  btn.textContent = t('loginBtn'); btn.disabled = false;
  if (res.success) {
    localStorage.setItem('edutoken', res.token);
    localStorage.setItem('eduuser', JSON.stringify(res.user));
    currentUser = res.user;
    currentLang = res.user.language || 'uz';
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'flex';
    setupApp(res.user);
  } else { showToast(res.message || 'Email yoki parol noto\'g\'ri!', 'error'); }
}
function doLogout() {
  if (chatPollingInterval) clearInterval(chatPollingInterval);
  if (notifPollingInterval) clearInterval(notifPollingInterval);
  localStorage.removeItem('edutoken'); localStorage.removeItem('eduuser');
  document.getElementById('appScreen').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  currentUser = null;
}

// ===== SETUP =====
function setupApp(user) {
  currentRole = user.role; currentLang = user.language || 'uz';
  const initials = user.name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  const av = user.avatar ? `<img src="${user.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">` : initials;
  document.getElementById('sidebarAvatar').innerHTML = av;
  document.getElementById('sidebarName').textContent = user.name;
  document.getElementById('sidebarRole').textContent = t(user.role);
  document.getElementById('topbarAvatar').innerHTML = av;
  document.getElementById('topbarName').textContent = user.name.split(' ')[0];
  buildSidebar(user.role); applyTranslations(); buildChart();
  startNotifPolling();
}

function startNotifPolling() {
  if (notifPollingInterval) clearInterval(notifPollingInterval);
  notifPollingInterval = setInterval(async () => {
    const res = await apiCall('GET', '/users/notifications/my');
    if (res.success) {
      const unread = res.notifications.filter(n => !n.read).length;
      const dot = document.getElementById('notifDot');
      if (dot) dot.style.display = unread > 0 ? 'block' : 'none';
      document.querySelectorAll('.nav-badge').forEach(b => { if (unread > 0) { b.textContent = unread; b.style.display = 'inline'; } else b.style.display = 'none'; });
    }
  }, 8000);
}

// ===== SIDEBAR =====
function buildSidebar(role) {
  const navDefs = {
    admin: [
      { label:'Asosiy', items:[{id:'dashboard',icon:'📊',key:'dashboard'},{id:'notifications',icon:'🔔',key:'notifications',badge:true},{id:'ai',icon:'🤖',key:'aiAnalytics'}]},
      { label:'Boshqaruv', items:[{id:'users',icon:'👥',key:'users'},{id:'groups',icon:'🏫',key:'groups'},{id:'announcements',icon:'📢',key:'announcements'},{id:'reports',icon:'📈',key:'reports'}]},
    ],
    teacher: [
      { label:'Asosiy', items:[{id:'teacher-dashboard',icon:'📊',key:'dashboard'},{id:'notifications',icon:'🔔',key:'notifications',badge:true},{id:'teacher-submissions',icon:'📥',key:'submissions'}]},
      { label:'Guruh', items:[{id:'teacher-grades',icon:'🎯',key:'grades'},{id:'teacher-messages',icon:'💬',key:'messages'},{id:'teacher-reports',icon:'📈',key:'reports'}]},
    ],
    student: [
      { label:'Asosiy', items:[{id:'student-dashboard',icon:'📊',key:'dashboard'},{id:'student-ai',icon:'🤖',key:'aiAnalytics'},{id:'notifications',icon:'🔔',key:'notifications',badge:true}]},
      { label:"O'qish", items:[{id:'student-tasks',icon:'📋',key:'tasks'},{id:'student-test',icon:'🧪',key:'aiTest'},{id:'student-messages',icon:'💬',key:'messages'}]},
    ],
  };
  const nav = document.getElementById('sidebarNav'); nav.innerHTML = '';
  (navDefs[role]||navDefs.admin).forEach(sec => {
    const lbl = document.createElement('div'); lbl.className = 'nav-section-label'; lbl.textContent = sec.label; nav.appendChild(lbl);
    sec.items.forEach(item => {
      const el = document.createElement('div'); el.className = 'nav-item'; el.dataset.page = item.id;
      el.innerHTML = `<span class="nav-icon">${item.icon}</span><span class="nav-label">${t(item.key)}</span>${item.badge?`<span class="nav-badge" style="display:none">0</span>`:''}`;
      el.onclick = () => showPage(item.id); nav.appendChild(el);
    });
  });
  showPage((navDefs[role]||navDefs.admin)[0].items[0].id);
}

// ===== NAVIGATION =====
async function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const page = document.getElementById('page-'+pageId);
  if (page) page.classList.add('active');
  const nav = document.querySelector(`.nav-item[data-page="${pageId}"]`);
  if (nav) nav.classList.add('active');
  const titles = { dashboard:t('dashboard'), users:t('users'), groups:t('groups'), announcements:t('announcements'), reports:t('reports'), notifications:t('notifications'), ai:t('aiAnalytics'), 'teacher-dashboard':t('dashboard'), 'teacher-grades':t('grades'), 'teacher-messages':t('messages'), 'teacher-reports':t('reports'), 'teacher-submissions':t('submissions'), 'student-dashboard':t('dashboard'), 'student-tasks':t('tasks'), 'student-test':t('aiTest'), 'student-messages':t('messages'), 'student-ai':t('aiAnalytics') };
  document.getElementById('topbarTitle').textContent = titles[pageId]||pageId;
  document.getElementById('topbarSub').textContent = currentUser?.name||'';
  const loaders = { dashboard:loadAdminDashboard, users:loadUsersPage, groups:loadGroupsPage, announcements:loadAnnouncementsPage, notifications:loadNotificationsPage, reports:loadAdminReports, 'teacher-dashboard':loadTeacherDashboard, 'teacher-submissions':loadSubmissionsPage, 'teacher-grades':loadGradesPage, 'teacher-messages':loadTeacherMessages, 'teacher-reports':loadTeacherReports, 'student-dashboard':loadStudentDashboard, 'student-tasks':loadStudentTasks, 'student-messages':loadStudentMessages, 'student-ai':()=>{}, 'student-test':loadStudentTest, ai:()=>{} };
  if (loaders[pageId]) await loaders[pageId]();
}

// ===== ADMIN DASHBOARD =====
async function loadAdminDashboard() {
  const [uRes, gRes] = await Promise.all([apiCall('GET','/users'), apiCall('GET','/groups')]);
  if (uRes.success) {
    const s = uRes.users.filter(u=>u.role==='student').length;
    const t2 = uRes.users.filter(u=>u.role==='teacher').length;
    document.getElementById('sc-students').textContent = s;
    document.querySelectorAll('.sc-teachers').forEach(el=>el.textContent=t2);
  }
  if (gRes.success) document.querySelectorAll('.sc-groups').forEach(el=>el.textContent=gRes.groups.length);
  buildChart();
}

// ===== ADMIN USERS =====
async function loadUsersPage() {
  const [uRes, gRes] = await Promise.all([apiCall('GET','/users'), apiCall('GET','/groups')]);
  if (!uRes.success) return;
  renderTeachersTable(uRes.users.filter(u=>u.role==='teacher'));
  renderStudentsTable(uRes.users.filter(u=>u.role==='student'));
  if (gRes.success) {
    ['teacherGroupFilter','studentGroupFilter'].forEach(id => {
      const sel = document.getElementById(id); if (!sel) return;
      sel.innerHTML = '<option value="">Barcha guruhlar</option>';
      gRes.groups.forEach(g => sel.innerHTML += `<option value="${g._id}">${g.name}</option>`);
    });
  }
}
function renderTeachersTable(teachers) {
  const tbody = document.getElementById('teacherTableBody'); if (!tbody) return;
  if (!teachers.length) { tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;color:var(--gray-400)">${t('noData')}</td></tr>`; return; }
  tbody.innerHTML = teachers.map(u=>`
    <tr data-group-id="${u.group?._id||u.group||''}">
      <td><strong>${u.name}</strong><div style="font-size:.75rem;color:var(--gray-400)">${u.email}</div></td>
      <td>${u.subject||'—'}</td>
      <td>${u.group?.name||'—'}</td>
      <td><span class="badge badge-${u.isActive!==false?'success':'danger'}">${u.isActive!==false?t('active'):t('blocked')}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick='openEditUser(${JSON.stringify({_id:u._id,name:u.name,email:u.email,subject:u.subject||"",group:u.group?._id||u.group||""})})'>✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}',this)">🗑️</button>
      </td>
    </tr>`).join('');
}
function renderStudentsTable(students) {
  const tbody = document.getElementById('studentTableBody'); if (!tbody) return;
  if (!students.length) { tbody.innerHTML=`<tr><td colspan="5" style="text-align:center;color:var(--gray-400)">${t('noData')}</td></tr>`; return; }
  tbody.innerHTML = students.map(u=>`
    <tr data-group-id="${u.group?._id||u.group||''}">
      <td><strong>${u.name}</strong><div style="font-size:.75rem;color:var(--gray-400)">${u.email}</div></td>
      <td>${u.group?.name||'—'}</td>
      <td>—</td>
      <td><span class="badge badge-${u.isActive!==false?'success':'danger'}">${u.isActive!==false?t('active'):t('blocked')}</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick='openEditUser(${JSON.stringify({_id:u._id,name:u.name,email:u.email,subject:u.subject||"",group:u.group?._id||u.group||""})})'>✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteUser('${u._id}',this)">🗑️</button>
      </td>
    </tr>`).join('');
}
async function deleteUser(id, btn) {
  if (!confirm("O'chirishni tasdiqlaysizmi?")) return;
  const res = await apiCall('DELETE', `/users/${id}`);
  if (res.success) { btn.closest('tr').remove(); showToast("O'chirildi!", 'success'); }
  else showToast(res.message, 'error');
}
function filterTable(input, tableId) {
  const val = input.value.toLowerCase();
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(r => r.style.display = r.textContent.toLowerCase().includes(val)?'':'none');
}
function filterByGroup(tableId, groupId) {
  document.querySelectorAll(`#${tableId} tbody tr`).forEach(r => {
    if (!groupId) { r.style.display=''; return; }
    r.style.display = r.dataset.groupId === groupId ? '' : 'none';
  });
}
async function loadGroupsForModal() {
  const res = await apiCall('GET', '/groups'); if (!res.success) return;
  ['newTeacherGroup','newStudentGroup','editGroup'].forEach(id => {
    const sel = document.getElementById(id); if (!sel) return;
    const cur = sel.value;
    sel.innerHTML = '<option value="">Guruh tanlang</option>';
    res.groups.forEach(g => sel.innerHTML += `<option value="${g._id}" ${cur===g._id?'selected':''}>${g.name} — ${g.subject}</option>`);
  });
}
async function addUser(role) {
  const pre = role==='teacher'?'newTeacher':'newStudent';
  const name = document.getElementById(pre+'Name').value.trim();
  const email = document.getElementById(pre+'Email').value.trim();
  const password = document.getElementById(pre+'Pass').value;
  const group = document.getElementById(pre+'Group').value;
  const subject = role==='teacher' ? document.getElementById('newTeacherSubject').value : '';
  if (!name||!email||!password) { showToast("Barcha maydonlarni to'ldiring!", 'error'); return; }
  const res = await apiCall('POST', '/users', {name,email,password,role,group,subject});
  if (res.success) {
    showToast(`${name} qo'shildi!`, 'success');
    closeModal(role==='teacher'?'addTeacherModal':'addStudentModal');
    await loadUsersPage();
  } else showToast(res.message, 'error');
}
function openEditUser(user) {
  editingUserId = user._id;
  document.getElementById('editName').value = user.name||'';
  document.getElementById('editEmail').value = user.email||'';
  document.getElementById('editUserTitle').textContent = `✏️ ${user.name}`;
  loadGroupsForModal().then(()=>{ const s=document.getElementById('editGroup'); if(s&&user.group) s.value=user.group; });
  openModal('editUserModal');
}
// Keep alias for old inline onclick
function editUserModal(user) { openEditUser(user); }
async function saveEditUser() {
  const name = document.getElementById('editName').value.trim();
  const email = document.getElementById('editEmail').value.trim();
  const group = document.getElementById('editGroup').value;
  const pass = document.getElementById('editPass').value;
  if (!name) { showToast('Ism kiritilishi shart!', 'error'); return; }
  const data = {name,email,group}; if (pass) data.password = pass;
  const res = await apiCall('PUT', `/users/${editingUserId}`, data);
  if (res.success) { showToast('Saqlandi!','success'); closeModal('editUserModal'); await loadUsersPage(); }
  else showToast(res.message,'error');
}

// ===== ADMIN GROUPS =====
async function loadGroupsPage() {
  const res = await apiCall('GET', '/groups'); if (!res.success) return;
  const tbody = document.getElementById('groupsTableBody'); if (!tbody) return;
  tbody.innerHTML = res.groups.map(g=>`
    <tr>
      <td><strong>${g.name}</strong></td>
      <td>${g.subject}</td>
      <td>${g.teacher?.name||'—'}</td>
      <td>${g.students?.length||0}</td>
      <td><span class="badge badge-success">Faol</span></td>
      <td>
        <button class="btn btn-sm btn-outline" onclick="editGroupModal('${g._id}','${g.name}','${g.subject}')">✏️</button>
        <button class="btn btn-sm btn-danger" onclick="deleteGroup('${g._id}',this)">🗑️</button>
      </td>
    </tr>`).join('');
  document.querySelectorAll('.sc-groups').forEach(el=>el.textContent=res.groups.length);
}
async function addGroup() {
  const name = document.getElementById('newGroupName').value.trim();
  const subject = document.getElementById('newGroupSubject').value;
  const teacher = document.getElementById('newGroupTeacher').value;
  if (!name) { showToast('Guruh nomi kiritilishi shart!', 'error'); return; }
  const res = await apiCall('POST', '/groups', {name,subject,teacher:teacher||undefined});
  if (res.success) { showToast('Guruh yaratildi!','success'); closeModal('addGroupModal'); await loadGroupsPage(); }
  else showToast(res.message,'error');
}
async function deleteGroup(id, btn) {
  if (!confirm("Guruhni o'chirishni tasdiqlaysizmi?")) return;
  const res = await apiCall('DELETE', `/groups/${id}`);
  if (res.success) { btn.closest('tr').remove(); showToast("O'chirildi!",'success'); }
  else showToast(res.message,'error');
}
function editGroupModal(id, name, subject) {
  document.getElementById('editGroupId').value = id;
  document.getElementById('editGroupName').value = name;
  document.getElementById('editGroupSubject').value = subject;
  openModal('editGroupModal');
}
async function saveGroup() {
  const id = document.getElementById('editGroupId').value;
  const name = document.getElementById('editGroupName').value.trim();
  const subject = document.getElementById('editGroupSubject').value;
  const res = await apiCall('PUT', `/groups/${id}`, {name,subject});
  if (res.success) { showToast('Saqlandi!','success'); closeModal('editGroupModal'); await loadGroupsPage(); }
  else showToast(res.message,'error');
}
async function loadTeachersForGroupModal() {
  const res = await apiCall('GET', '/users'); if (!res.success) return;
  const sel = document.getElementById('newGroupTeacher'); if (!sel) return;
  sel.innerHTML = "<option value=''>O'qituvchi tanlang</option>";
  res.users.filter(u=>u.role==='teacher').forEach(t2 => sel.innerHTML+=`<option value="${t2._id}">${t2.name}</option>`);
}

// ===== ANNOUNCEMENTS =====
async function loadAnnouncementsPage() {
  const res = await apiCall('GET', '/announcements'); if (!res.success) return;
  const list = document.getElementById('announcementsList'); if (!list) return;
  if (!res.announcements.length) { list.innerHTML=`<div style="text-align:center;color:var(--gray-400);padding:1.5rem">${t('noData')}</div>`; return; }
  list.innerHTML = res.announcements.map(a=>`
    <div class="notif-item ${a.priority==='urgent'?'danger':a.priority==='important'?'warn':''}">
      <div class="notif-icon">${a.priority==='urgent'?'🚨':a.priority==='important'?'⚠️':'📢'}</div>
      <div class="notif-content">
        <div class="notif-title">${a.title}</div>
        <div class="notif-desc">${a.content}</div>
        <div style="font-size:.72rem;color:var(--gray-400);margin-top:4px">${a.author?.name||'Admin'} · ${new Date(a.createdAt).toLocaleDateString('uz-UZ')}</div>
      </div>
      ${currentRole==='admin'?`<button class="btn btn-sm btn-danger" onclick="deleteAnnouncement('${a._id}',this)" style="margin-left:auto;flex-shrink:0">🗑️</button>`:''}
    </div>`).join('');
}
async function sendAnnouncement() {
  const title = document.getElementById('annTitle').value.trim();
  const content = document.getElementById('annContent').value.trim();
  const target = document.getElementById('annTarget').value;
  const priority = document.getElementById('annPriority').value;
  if (!title||!content) { showToast("Sarlavha va matn kiritilishi shart!", 'error'); return; }
  const res = await apiCall('POST', '/announcements', {title,content,target,priority});
  if (res.success) {
    showToast("E'lon yuborildi!", 'success');
    document.getElementById('annTitle').value='';
    document.getElementById('annContent').value='';
    await loadAnnouncementsPage();
  } else showToast(res.message,'error');
}
async function deleteAnnouncement(id, btn) {
  const res = await apiCall('DELETE', `/announcements/${id}`);
  if (res.success) { btn.closest('.notif-item').remove(); showToast("O'chirildi!",'success'); }
}

// ===== NOTIFICATIONS =====
async function loadNotificationsPage() {
  const res = await apiCall('GET', '/users/notifications/my');
  const list = document.getElementById('notifList'); if (!list) return;
  if (!res.success||!res.notifications.length) { list.innerHTML=`<div style="text-align:center;color:var(--gray-400);padding:2rem">${t('noData')}</div>`; return; }
  list.innerHTML = res.notifications.slice(0,30).map(n=>`
    <div class="notif-item ${n.type==='warning'?'warn':n.type==='danger'?'danger':n.type==='success'?'success':''}">
      <div class="notif-icon">${n.type==='warning'?'⚠️':n.type==='danger'?'🚨':n.type==='success'?'✅':'🔔'}</div>
      <div class="notif-content">
        <div class="notif-title">${n.title}</div>
        <div class="notif-desc">${n.message}</div>
      </div>
      <div class="notif-time">${new Date(n.createdAt).toLocaleDateString('uz-UZ')}</div>
    </div>`).join('');
}
async function markAllRead() {
  await apiCall('PUT', '/users/notifications/read-all');
  const dot = document.getElementById('notifDot'); if (dot) dot.style.display='none';
  showToast("Hammasi o'qildi!", 'success');
  await loadNotificationsPage();
}

// ===== TEACHER DASHBOARD =====
async function loadTeacherDashboard() {
  const groupId = currentUser.group?._id||currentUser.group; if (!groupId) return;
  const gRes = await apiCall('GET', '/groups');
  if (!gRes.success) return;
  const myGroup = gRes.groups.find(g=>g._id===String(groupId)||String(g._id)===String(groupId));
  if (!myGroup) return;
  document.querySelectorAll('.teacher-group-name').forEach(el=>el.textContent=myGroup.name);
  document.querySelectorAll('.teacher-subject-name').forEach(el=>el.textContent=myGroup.subject||currentUser.subject||'—');
  document.querySelectorAll('.teacher-students-count').forEach(el=>el.textContent=myGroup.students?.length||0);
  // Fill subject dropdown
  const subSel = document.getElementById('assignSubject');
  if (subSel) subSel.innerHTML = `<option value="${myGroup.subject||currentUser.subject}">${myGroup.subject||currentUser.subject||'Fan'}</option>`;
  // Attendance modal
  const attTbody = document.getElementById('attModalTbody');
  if (attTbody&&myGroup.students?.length) {
    attTbody.innerHTML = myGroup.students.map((s,i)=>`
      <tr>
        <td>${s.name||s}</td>
        <td><input type="radio" name="att${i}" value="present" data-student="${s._id||s}" checked></td>
        <td><input type="radio" name="att${i}" value="late" data-student="${s._id||s}"></td>
        <td><input type="radio" name="att${i}" value="absent" data-student="${s._id||s}"></td>
      </tr>`).join('');
  }
}
async function saveAttendance() {
  const groupId = currentUser.group?._id||currentUser.group;
  const date = new Date().toISOString().split('T')[0];
  const records = [];
  document.querySelectorAll('#attModalTbody tr').forEach((row,i)=>{
    const checked = row.querySelector(`input[name="att${i}"]:checked`);
    if (checked) records.push({student:checked.dataset.student, status:checked.value});
  });
  const res = await apiCall('POST', '/attendance', {group:groupId,date,lesson:1,records});
  if (res.success) { showToast('Davomat saqlandi!','success'); closeModal('attendanceModal'); }
  else showToast(res.message||'Xato!','error');
}
async function uploadAssignment() {
  const title = document.getElementById('assignTitle').value.trim();
  const deadline = document.getElementById('assignDeadline').value;
  const subject = document.getElementById('assignSubject')?.value||currentUser.subject;
  const groupId = currentUser.group?._id||currentUser.group;
  if (!title) { showToast('Topshiriq nomi kiritilishi shart!', 'error'); return; }
  if (!deadline) { showToast('Muddat belgilanishi shart!', 'error'); return; }
  const formData = new FormData();
  formData.append('title', title);
  formData.append('deadline', deadline);
  formData.append('subject', subject);
  formData.append('group', groupId);
  const fileInput = document.getElementById('assignFile');
  if (fileInput?.files?.length) Array.from(fileInput.files).forEach(f=>formData.append('files',f));
  const res = await apiCall('POST', '/assignments', null, formData);
  if (res.success) {
    showToast(`"${title}" topshirig'i yuklandi va talabalar habardor qilindi!`, 'success');
    document.getElementById('assignTitle').value='';
    document.getElementById('assignDeadline').value='';
    document.getElementById('uploadAreaText').textContent='Fayl yuklash uchun bosing';
  } else showToast(res.message,'error');
}
function fileSelected(input) {
  const files = Array.from(input.files);
  document.getElementById('uploadAreaText').textContent = files.map(f=>f.name).join(', ')||'Fayl yuklash uchun bosing';
}
function generateTeacherAITest() {
  const subject = document.getElementById('assignSubject')?.value||currentUser.subject||'Dasturlash';
  showToast(`"${subject}" bo'yicha AI test tayyor! Talabalar ko'ra oladi.`, 'success');
}

// ===== TEACHER SUBMISSIONS =====
async function loadSubmissionsPage() {
  const groupId = currentUser.group?._id||currentUser.group; if (!groupId) return;
  const [aRes, gRes] = await Promise.all([apiCall('GET',`/assignments/group/${groupId}`), apiCall('GET','/groups')]);
  if (!aRes.success) return;
  const myGroup = gRes.success ? gRes.groups.find(g=>String(g._id)===String(groupId)) : null;
  const groupStudents = myGroup?.students||[];
  // Filter selector
  const sel = document.getElementById('submissionAssignFilter');
  if (sel) {
    sel.innerHTML='<option value="">Barcha topshiriqlar</option>';
    aRes.assignments.forEach(a=>sel.innerHTML+=`<option value="${a._id}">${a.title}</option>`);
  }
  // Submitted
  const submittedTbody = document.getElementById('submittedTbody');
  if (submittedTbody) {
    let rows='';
    aRes.assignments.forEach(a=>{
      (a.submissions||[]).forEach(sub=>{
        const sName = sub.student?.name||'Talaba';
        const sId = sub.student?._id||sub.student;
        const files = (sub.files||[]).map(f=>`<a href="${API}/assignments/download/${f.filename}" target="_blank" style="color:var(--accent);font-size:.8rem">📄 ${f.originalname}</a>`).join(' ');
        rows+=`<tr data-assign-id="${a._id}">
          <td><strong>${sName}</strong></td>
          <td>${a.title}</td>
          <td>${new Date(sub.submittedAt).toLocaleDateString('uz-UZ')}</td>
          <td>${files||'—'}</td>
          <td><input type="number" class="grade-input" min="0" max="100" value="${sub.grade||''}" placeholder="Baho" id="gr-${a._id}-${sId}" style="width:70px"></td>
          <td>
            <button class="btn btn-success btn-sm" onclick="gradeSubmission('${a._id}','${sId}')">✅</button>
            <button class="btn btn-sm btn-outline" onclick="openChatWith('${sId}','${sName}')">💬</button>
          </td></tr>`;
      });
    });
    submittedTbody.innerHTML = rows||`<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">${t('noData')}</td></tr>`;
  }
  // Missing
  const missingTbody = document.getElementById('missingTbody');
  if (missingTbody&&groupStudents.length) {
    let rows='';
    aRes.assignments.forEach(a=>{
      const submittedIds = (a.submissions||[]).map(s=>String(s.student?._id||s.student));
      groupStudents.forEach(s=>{
        if (!submittedIds.includes(String(s._id||s))) {
          const over = new Date()>new Date(a.deadline);
          rows+=`<tr>
            <td><strong>${s.name||s}</strong></td>
            <td>${a.title}</td>
            <td><span class="badge badge-${over?'danger':'warning'}">${over?t('overdue'):t('pending')}</span></td>
            <td><button class="btn btn-warning btn-sm" onclick="sendWarning('${s._id||s}','${s.name||'Talaba'}','${a.title}')">⚠️ Ogohlantirish</button></td></tr>`;
        }
      });
    });
    missingTbody.innerHTML = rows||`<tr><td colspan="4" style="text-align:center;color:var(--success)">✅ Barcha talabalar topshirdi!</td></tr>`;
  }
}
async function gradeSubmission(assignId, studentId) {
  const input = document.getElementById(`gr-${assignId}-${studentId}`);
  if (!input?.value) { showToast('Baho kiriting!', 'error'); return; }
  const res = await apiCall('PUT', `/assignments/${assignId}/grade/${studentId}`, {grade:Number(input.value),feedback:''});
  if (res.success) { showToast('Baho saqlandi!','success'); input.disabled=true; }
  else showToast(res.message,'error');
}
async function sendWarning(studentId, name, assignTitle) {
  const res = await apiCall('POST', '/messages', {to:studentId, message:`⚠️ "${assignTitle}" topshirig'ingizni topshirish muddati keldi! Iltimos tezda topshiring.`, type:'warning'});
  if (res.success) showToast(`${name} ga ogohlantirish yuborildi!`,'warn');
  else showToast(res.message,'error');
}
async function sendWarningAll() {
  const btns = document.querySelectorAll('#missingTbody .btn-warning');
  btns.forEach(b=>b.click());
  if (btns.length) showToast(`${btns.length} ta talabaga ogohlantirish yuborildi!`,'warn');
}
function filterSubmissions(assignId) {
  document.querySelectorAll('#submittedTbody tr').forEach(r=>{
    r.style.display = !assignId||r.dataset.assignId===assignId?'':'none';
  });
}

// ===== TEACHER GRADES =====
async function loadGradesPage() {
  const groupId = currentUser.group?._id||currentUser.group; if (!groupId) return;
  const [gRes, grRes] = await Promise.all([apiCall('GET','/groups'), apiCall('GET',`/grades/group/${groupId}`)]);
  const myGroup = gRes.success ? gRes.groups.find(g=>String(g._id)===String(groupId)) : null;
  const grades = grRes.success ? grRes.grades : [];
  const students = myGroup?.students||[];
  document.querySelectorAll('.teacher-group-name').forEach(el=>el.textContent=myGroup?.name||'');
  document.querySelectorAll('.teacher-subject-name').forEach(el=>el.textContent=myGroup?.subject||currentUser.subject||'');
  const groupSel = document.getElementById('gradeGroupFilter');
  if (groupSel) groupSel.innerHTML = `<option value="${groupId}">${myGroup?.name||'Guruh'}</option>`;
  const tbody = document.getElementById('gradesTableBody'); if (!tbody) return;
  if (!students.length) { tbody.innerHTML=`<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">Guruhda talabalar yo'q</td></tr>`; return; }
  tbody.innerHTML = students.map(s=>{
    const g = grades.find(gr=>String(gr.student?._id||gr.student)===String(s._id||s))||{};
    return `<tr data-student-id="${s._id||s}" data-student-name="${s.name||s}">
      <td><strong>${s.name||s}</strong></td>
      <td><input type="number" class="grade-input" min="0" max="100" value="${g.module1||''}" placeholder="0" onchange="calcAvg(this)"></td>
      <td><input type="number" class="grade-input" min="0" max="100" value="${g.module2||''}" placeholder="0" onchange="calcAvg(this)"></td>
      <td><input type="number" class="grade-input" min="0" max="100" value="${g.midterm||''}" placeholder="0" onchange="calcAvg(this)"></td>
      <td><input type="number" class="grade-input" min="0" max="100" value="${g.final||''}" placeholder="0" onchange="calcAvg(this)"></td>
      <td class="avg-cell"><strong>${g.average||'—'}</strong></td>
    </tr>`;
  }).join('');
}
function calcAvg(input) {
  const row = input.closest('tr');
  const inputs = row.querySelectorAll('.grade-input');
  const vals = Array.from(inputs).map(i=>parseFloat(i.value)||0);
  const sum = vals.reduce((a,b)=>a+b,0);
  const avg = (sum/(vals.length*100)*5).toFixed(2);
  const cell = row.querySelector('.avg-cell');
  if (cell) { const c = avg>=4?'var(--success)':avg>=3?'var(--primary)':'var(--danger)'; cell.innerHTML=`<strong style="color:${c}">${avg}</strong>`; }
}
// Keep alias
function calcAvg2(input) { calcAvg(input); }
async function saveGrades() {
  const groupId = currentUser.group?._id||currentUser.group;
  const subject = currentUser.subject||'Fan';
  const gradesData = [];
  document.querySelectorAll('#gradesTableBody tr').forEach(row=>{
    const inputs = row.querySelectorAll('.grade-input');
    const studentId = row.dataset.studentId; if (!studentId) return;
    gradesData.push({student:studentId, group:groupId, subject, semester:'2024-2025-1',
      module1:parseFloat(inputs[0]?.value)||0, module2:parseFloat(inputs[1]?.value)||0,
      midterm:parseFloat(inputs[2]?.value)||0, final:parseFloat(inputs[3]?.value)||0});
  });
  const res = await apiCall('POST', '/grades/bulk', {grades:gradesData});
  if (res.success) showToast('Baholar saqlandi!','success');
  else showToast(res.message||'Xato!','error');
}
function filterGrades() {
  const mod = document.getElementById('gradeModuleFilter')?.value;
  document.querySelectorAll('#gradesTableBody tr').forEach(row=>{
    if (!mod||mod==='all') { row.style.display=''; return; }
    const inputs = row.querySelectorAll('.grade-input');
    const idx = {m1:0,m2:1,mid:2,final:3}[mod];
    if (idx!==undefined) row.style.display = (parseFloat(inputs[idx]?.value)||0)>0?'':'none';
  });
}

// ===== TEACHER MESSAGES =====
async function loadTeacherMessages() {
  const groupId = currentUser.group?._id||currentUser.group;
  const gRes = await apiCall('GET', '/groups');
  const myGroup = gRes.success ? gRes.groups.find(g=>String(g._id)===String(groupId)) : null;
  const students = myGroup?.students||[];
  const sel = document.getElementById('msgToTeacher');
  if (sel) {
    sel.innerHTML = "<option value=''>Talaba tanlang</option>";
    students.forEach(s=>sel.innerHTML+=`<option value="${s._id||s}">${s.name||s}</option>`);
  }
  // Load recent inbox messages
  const mRes = await apiCall('GET', '/messages/inbox');
  if (mRes.success&&mRes.messages.length) {
    const chat = document.getElementById('teacherChatMessages'); if (chat) chat.innerHTML='';
    mRes.messages.slice(-20).forEach(m=>{
      const isMe = String(m.from?._id||m.from)===String(currentUser._id||currentUser.id);
      addChatBubble('teacherChatMessages', m.message, isMe, m.from?.name||'');
    });
  }
}
async function sendTeacherMessage() {
  const to = document.getElementById('msgToTeacher').value;
  const text = document.getElementById('msgTextTeacher').value.trim();
  const type = document.getElementById('msgTypeTeacher')?.value||'message';
  if (!to) { showToast('Talabani tanlang!', 'error'); return; }
  if (!text) { showToast('Xabar kiriting!', 'error'); return; }
  const res = await apiCall('POST', '/messages', {to,message:text,type});
  if (res.success) {
    showToast("Xabar yuborildi!", 'success');
    document.getElementById('msgTextTeacher').value='';
    addChatBubble('teacherChatMessages', text, true, currentUser.name);
    currentChatUserId = to;
    startChatPolling('teacherChatMessages', to);
  } else showToast(res.message,'error');
}
async function sendTeacherChat() {
  const input = document.getElementById('teacherChatInput'); if (!input) return;
  const text = input.value.trim(); if (!text) return;
  const to = document.getElementById('msgToTeacher')?.value||currentChatUserId;
  if (!to) { showToast("Avval talabani tanlang!", 'warn'); return; }
  const res = await apiCall('POST', '/messages', {to,message:text,type:'message'});
  if (res.success) { addChatBubble('teacherChatMessages', text, true, currentUser.name); input.value=''; }
}
function openChatWith(userId, name) {
  currentChatUserId = userId;
  const sel = document.getElementById('msgToTeacher'); if (sel) sel.value = userId;
  loadConversation('teacherChatMessages', userId);
  startChatPolling('teacherChatMessages', userId);
  showToast(`${name} bilan chat ochildi`,'success');
}

// ===== TEACHER REPORTS =====
async function loadTeacherReports() {
  const groupId = currentUser.group?._id||currentUser.group; if (!groupId) return;
  const [gRes, grRes] = await Promise.all([apiCall('GET','/groups'), apiCall('GET',`/grades/group/${groupId}`)]);
  const myGroup = gRes.success ? gRes.groups.find(g=>String(g._id)===String(groupId)) : null;
  const students = myGroup?.students||[];
  const grades = grRes.success ? grRes.grades : [];
  const tbody = document.getElementById('teacherReportTbody'); if (!tbody) return;
  tbody.innerHTML = students.map(s=>{
    const sid = String(s._id||s);
    const g = grades.find(gr=>String(gr.student?._id||gr.student)===sid);
    const avg = g?.average||0;
    return `<tr data-student="${s.name||s}">
      <td>${s.name||s}</td>
      <td>—</td>
      <td>${avg||'—'}</td>
      <td>—</td>
      <td>—</td>
      <td><span class="badge badge-${avg>=4?'success':avg>=3?'warning':'danger'}">${avg>=4?'Yaxshi':avg>=3?"O'rtacha":'Zaif'}</span></td>
    </tr>`;
  }).join('')||`<tr><td colspan="6" style="text-align:center;color:var(--gray-400)">${t('noData')}</td></tr>`;
}
function filterTeacherReport() { showToast('Filtr qollanildi','success'); }

// ===== STUDENT DASHBOARD =====
async function loadStudentDashboard() {
  const uid = currentUser._id||currentUser.id;
  const [grRes, aRes] = await Promise.all([apiCall('GET',`/grades/student/${uid}`), apiCall('GET','/assignments/my')]);
  if (grRes.success&&grRes.grades.length) {
    const avg = (grRes.grades.reduce((s,g)=>s+(g.average||0),0)/grRes.grades.length).toFixed(2);
    document.querySelectorAll('.s-avg-grade').forEach(el=>el.textContent=avg);
    const tbody = document.getElementById('studentGradesTbody');
    if (tbody) tbody.innerHTML = grRes.grades.map(g=>`
      <tr><td>${g.subject}</td><td>${g.module1||'—'}</td><td>${g.module2||'—'}</td><td>${g.midterm||'—'}</td><td>${g.final||'—'}</td></tr>`).join('');
  }
  if (aRes.success) {
    const myId = String(uid);
    const pending = aRes.assignments.filter(a=>!(a.submissions||[]).find(s=>String(s.student?._id||s.student)===myId)).length;
    document.querySelectorAll('.s-pending-count').forEach(el=>el.textContent=pending);
  }
}

// ===== STUDENT TASKS =====
async function loadStudentTasks() {
  const res = await apiCall('GET', '/assignments/my'); if (!res.success) return;
  const myId = String(currentUser._id||currentUser.id);
  let pendingHtml='', submittedRows='';
  res.assignments.forEach(a=>{
    const mySub = (a.submissions||[]).find(s=>String(s.student?._id||s.student)===myId);
    const over = new Date()>new Date(a.deadline);
    const fileLinks = (a.files||[]).map(f=>`<button class="btn btn-outline btn-sm" onclick="downloadFile('${f.filename}','${f.originalname}')">⬇️ ${f.originalname}</button>`).join(' ');
    if (!mySub) {
      pendingHtml+=`
        <div class="card" style="border:1px solid ${over?'var(--danger)':'var(--gray-200)'};margin-bottom:1rem;padding:1rem">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;flex-wrap:wrap">
            <div>
              <h4 style="font-size:.95rem;color:var(--primary-dark);margin-bottom:.3rem">${a.title}</h4>
              <p style="font-size:.8rem;color:${over?'var(--danger)':'var(--gray-400)'}">
                ${over?'⚠️ Muddati o\'tdi!':'📅 Muddat: '+new Date(a.deadline).toLocaleDateString('uz-UZ')} · O'qituvchi: ${a.teacher?.name||'—'}
              </p>
              ${a.description?`<p style="font-size:.8rem;margin-top:.3rem">${a.description}</p>`:''}
            </div>
            <div style="display:flex;gap:.5rem;flex-wrap:wrap">
              ${fileLinks}
              <button class="btn btn-${over?'danger':'primary'} btn-sm" onclick="openSubmitModal('${a._id}')">📤 Topshirish</button>
            </div>
          </div>
        </div>`;
    } else {
      submittedRows+=`<tr>
        <td>${a.title}</td>
        <td>${a.teacher?.name||'—'}</td>
        <td>${new Date(mySub.submittedAt).toLocaleDateString('uz-UZ')}</td>
        <td>${mySub.grade||'—'}</td>
        <td><span class="badge badge-${mySub.status==='graded'?'success':'warning'}">${mySub.status==='graded'?t('graded'):t('pending')}</span></td>
      </tr>`;
    }
  });
  const pDiv = document.getElementById('s-tab-pending');
  const sDiv = document.getElementById('s-tab-submitted');
  if (pDiv) pDiv.innerHTML = pendingHtml||`<div style="text-align:center;padding:2rem;color:var(--success)">✅ Barcha topshiriqlar bajarilgan!</div>`;
  if (sDiv) sDiv.innerHTML = submittedRows
    ? `<div class="table-wrap"><table><thead><tr><th>Topshiriq</th><th>O'qituvchi</th><th>Topshirilgan</th><th>Baho</th><th>Holat</th></tr></thead><tbody>${submittedRows}</tbody></table></div>`
    : `<div style="text-align:center;padding:2rem;color:var(--gray-400)">${t('noData')}</div>`;
}
function openSubmitModal(assignId) {
  submitAssignId = assignId;
  document.getElementById('submitFileText').textContent = 'Faylingizni tanlang';
  openModal('submitModal');
}
function submitFileSelected(input) {
  if (input.files[0]) document.getElementById('submitFileText').textContent = `✅ ${input.files[0].name}`;
}
async function submitAssignment() {
  const file = document.getElementById('submitFile').files[0];
  if (!file) { showToast('Fayl tanlanmagan!', 'error'); return; }
  if (!submitAssignId) { showToast('Topshiriq tanlanmagan!', 'error'); return; }
  const fd = new FormData(); fd.append('files', file);
  const res = await apiCall('POST', `/assignments/${submitAssignId}/submit`, null, fd);
  if (res.success) { showToast('Topshiriq muvaffaqiyatli yuborildi!','success'); closeModal('submitModal'); await loadStudentTasks(); }
  else showToast(res.message||'Xato!','error');
}
function downloadFile(filename, originalname) {
  const a = document.createElement('a');
  a.href = `${API}/assignments/download/${filename}`;
  a.download = originalname; a.target='_blank'; a.click();
  showToast(`${originalname} yuklanmoqda...`,'success');
}

// ===== STUDENT TEST =====
const testQuestionBank = {
  'Dasturlash texnologiyalari': [
    {q:"Python da ro'yxat elementiga murojaat?",opts:['list{0}','list[0]','list(0)','list.get(0)'],a:1},
    {q:"Funksiya aniqlash operatori?",opts:['function','func','def','lambda'],a:2},
    {q:"Lug'at (dictionary) uchun belgi?",opts:['[]','()','{}','<>'],a:2},
    {q:"OOP da encapsulation nima?",opts:['Meros olish',"Ma'lumotni yashirish",'Polimorfizm','Abstraktsiya'],a:1},
    {q:"Git da yangi branch yaratish?",opts:['git new branch','git branch name','git checkout -b name','git create name'],a:2},
    {q:"SQL da barcha ma'lumot olish?",opts:['GET * FROM t','SELECT * FROM t','FETCH * FROM t','READ * FROM t'],a:1},
    {q:"Yangi resurs yaratish HTTP method?",opts:['GET','PUT','POST','DELETE'],a:2},
    {q:"Rekursiya nima?",opts:['Tsikl',"O'zini chaqiruvchi funksiya",'Massiv',"Ob'ekt"],a:1},
    {q:"O(n²) nimani anglatadi?",opts:['Chiziqli','Kvadratik','Logarifmik','Konstantli'],a:1},
    {q:"Docker nima uchun?",opts:["Ma'lumotlar bazasi",'Konteynerizatsiya','Test','Monitoring'],a:1},
    {q:"API nima?",opts:['Dastur','Interfeys','Protokol','Dasturlararo interfeys'],a:3},
    {q:"JSON nima uchun?",opts:['Rasm',"Ma'lumot almashuv",'Video','Audio'],a:1},
    {q:"Frontend nima?",opts:['Server qismi','Foydalanuvchi interfeysi',"Ma'lumotlar bazasi",'Tarmoq'],a:1},
    {q:"CSS nima?",opts:['Dasturlash tili','Uslub varaqasi',"Ma'lumotlar bazasi",'Protokol'],a:1},
    {q:"HTML teglari qanday yoziladi?",opts:['<tag>','[tag]','{tag}','(tag)'],a:0},
  ],
  'Oliy matematika': [
    {q:"f(x)=x³ hosila?",opts:['3x','3x²','x²','2x³'],a:1},
    {q:"∫x dx = ?",opts:['x²/2 + C','x² + C','2x + C','x/2 + C'],a:0},
    {q:"Matritsalar ko'paytmasi sharti?",opts:["Har doim",'A ustunlari = B satrlari',"Teng o'lchamli",'Hech qachon'],a:1},
    {q:"sin²x + cos²x = ?",opts:['0','2','1','sin2x'],a:2},
    {q:"lim(x→0) sin(x)/x = ?",opts:['0','∞','1','Mavjud emas'],a:2},
    {q:"e soni qiymati?",opts:['2.718','3.141','1.414','1.618'],a:0},
    {q:"Taylor qatorining maqsadi?",opts:['Integrallash','Funksiyani polinomga yoyish','Differensiallash','Limitni hisoblash'],a:1},
    {q:"Determinant nima?",opts:['Matritsa yig\'indisi','Maxsus son','Vektor','Gradient'],a:1},
    {q:"Gradient nima?",opts:['Skalar',"Maksimal o'sish yo'nalishi",'Minimum','Integral'],a:1},
    {q:"Euler formulasi?",opts:['e^(iπ)+1=0','e^x=sinx','e^(iπ)=1','cosx+sinx=1'],a:0},
    {q:"Ehtimollik qiymati?",opts:['[0,1]','(-1,1)','[0,∞)','Hech biri'],a:0},
    {q:"Normal taqsimot egri chizig'i?",opts:['Kvadrat',"Qo'ng'iroqsimon",'Chiziqli','Eksponensial'],a:1},
    {q:"Integral geometrik ma'nosi?",opts:['Tezlik','Egri ostidagi yuza',"Og'irlik",'Massa'],a:1},
    {q:"Matritsaning transponiri?",opts:["Satr va ustunlar o'rni almashadi",'Barcha elementlar 0 bo\'ladi','Teskari matritsa','Hech biri'],a:0},
    {q:"Chiziqli bog'liqlik nima?",opts:["Vektorlar yig'indisi 0",'Faqat trivial kombinatsiya 0',"Vektorlar teng",'Hech biri'],a:1},
  ],
  'Umumiy fizika': [
    {q:"Nyutonning 2-qonuni?",opts:['F=ma','E=mc²','p=mv','W=Fd'],a:0},
    {q:"Elektr qarshiligi birligi?",opts:['Volt','Amper','Om','Vatt'],a:2},
    {q:"Yorug'lik tezligi?",opts:['3×10⁶ m/s','3×10⁸ m/s','3×10⁵ m/s','3×10⁴ m/s'],a:1},
    {q:"Termodinamikaning 1-qonuni?",opts:["Entropiya ortadi",'Energiya saqlanadi',"Absolyut nol mavjud",'Issiqlik o\'tmaydi'],a:1},
    {q:"Gravitatsion tortishish?",opts:['F=kq₁q₂/r²','F=Gm₁m₂/r²','F=ma','F=mv²/r'],a:1},
    {q:"Foton nima?",opts:["Zaryadli zarracha",'Og\'ir zarracha',"Yorug'lik kvanti",'Elektron'],a:2},
    {q:"Issiqlik sig'imi birligi?",opts:['J/kg','J/(kg·K)','J·K','W/m'],a:1},
    {q:"Rezonans nima?",opts:["Tebranish kuchayishi",'Tebranish so\'nishi','Interferensiya','Difraksiya'],a:0},
    {q:"Elektromagnit induksiya?",opts:['Faraday','Nyuton','Galiley','Kepler'],a:0},
    {q:"Absolyut nol temperatura?",opts:['0 K','273 K','-100 K','100 K'],a:0},
    {q:"Kvant mexanikasi asoslari?",opts:['Nyuton','Plank va Bohr','Einstein','Faraday'],a:1},
    {q:"Yarimo'tkazgich nima?",opts:["O'tkazgich",'Izolyator',"O'rtacha o'tkazgich",'Magnit'],a:2},
    {q:"Lazer prinsipi?",opts:["Spontan emissiya",'Majburiy emissiya','Yutish','Yutilish'],a:1},
    {q:"Nisbiylik nazariyasi kim tomonidan?",opts:['Nyuton','Einstein','Bohr','Plank'],a:1},
    {q:"Yadro fizikasi asosi?",opts:['Proton va neytron','Elektron va foton','Kvark','Atom'],a:0},
  ],
};
async function loadStudentTest() {
  const subject = currentUser.subject||'Dasturlash texnologiyalari';
  // Try to get from teacher's assignment
  const aRes = await apiCall('GET', '/assignments/my');
  if (aRes.success&&aRes.assignments.length) {
    const withTest = aRes.assignments.find(a=>a.aiTest?.questions?.length);
    if (withTest) {
      testQuestions = withTest.aiTest.questions.map(q=>({q:q.question,opts:q.options,a:q.correct}));
    } else {
      const bank = testQuestionBank[subject]||testQuestionBank['Dasturlash texnologiyalari'];
      testQuestions = [...bank].sort(()=>Math.random()-.5).slice(0,15);
    }
  } else {
    const bank = testQuestionBank[subject]||testQuestionBank['Dasturlash texnologiyalari'];
    testQuestions = [...bank].sort(()=>Math.random()-.5).slice(0,15);
  }
  testAnswers = {};
  document.getElementById('testSubTitle').textContent = `${subject} · ${testQuestions.length} ta savol`;
  renderTest(); startTestTimer();
}
function loadTestQuestions() {
  const subject = currentUser?.subject||'Dasturlash texnologiyalari';
  const bank = testQuestionBank[subject]||testQuestionBank['Dasturlash texnologiyalari'];
  testQuestions = [...bank].sort(()=>Math.random()-.5);
  testAnswers = {}; renderTest();
}
function renderTest() {
  const c = document.getElementById('testContainer'); if (!c) return;
  const sub = document.getElementById('testSubTitle');
  if (sub) sub.textContent = `${currentUser?.subject||'Dasturlash texnologiyalari'} · ${testQuestions.length} ta savol`;
  c.innerHTML = testQuestions.map((q,i)=>`
    <div class="test-card" id="tq-${i}">
      <div class="test-q">${i+1}. ${q.q}</div>
      <div class="test-options">
        ${q.opts.map((opt,j)=>`
          <label class="test-option" id="to-${i}-${j}" onclick="selectAnswer(${i},${j},this)">
            <input type="radio" name="q${i}" value="${j}" style="pointer-events:none">
            ${String.fromCharCode(65+j)}) ${opt}
          </label>`).join('')}
      </div>
    </div>`).join('');
  document.getElementById('testResult').style.display='none';
  document.getElementById('testFooter').style.display='flex';
  document.getElementById('testSubmitBtn').style.display='inline-flex';
  updateTestProgress();
}
function selectAnswer(qIdx, aIdx, label) {
  testAnswers[qIdx] = aIdx;
  const card = document.getElementById(`tq-${qIdx}`);
  card.querySelectorAll('.test-option').forEach(l=>{l.style.borderColor='';l.style.background='';});
  label.style.borderColor='var(--primary)'; label.style.background='var(--gray-100)';
  updateTestProgress();
}
function updateTestProgress() {
  const prog = document.getElementById('testProgress');
  if (prog) prog.textContent=`${Object.keys(testAnswers).length} / ${testQuestions.length} javob berildi`;
}
function startTestTimer() {
  if (testTimerInterval) clearInterval(testTimerInterval);
  testTimeLeft = testQuestions.length*60;
  testTimerInterval = setInterval(()=>{
    testTimeLeft--;
    const el = document.getElementById('testTimer'); if (!el){clearInterval(testTimerInterval);return;}
    const m=Math.floor(testTimeLeft/60), s=testTimeLeft%60;
    el.textContent = `⏱ ${m}:${s.toString().padStart(2,'0')}`;
    if (testTimeLeft<=0){clearInterval(testTimerInterval);submitTest();}
  },1000);
}
function submitTest() {
  if (testTimerInterval) clearInterval(testTimerInterval);
  let correct=0;
  testQuestions.forEach((q,i)=>{
    document.querySelectorAll(`#tq-${i} .test-option`).forEach((opt,j)=>{
      opt.querySelector('input').disabled=true;
      if (j===q.a) opt.classList.add('correct');
      else if (testAnswers[i]===j) opt.classList.add('wrong');
    });
    if (testAnswers[i]===q.a) correct++;
  });
  const pct = Math.round(correct/testQuestions.length*100);
  document.getElementById('testSubmitBtn').style.display='none';
  const emoji = pct>=80?'🎉':pct>=60?'👍':'😔';
  const desc = pct>=80?`A'lo natija! ${pct}% to'g'ri.`:pct>=60?`Yaxshi! ${pct}% to'g'ri.`:`${pct}% to'g'ri. Ko'proq o'qing.`;
  document.getElementById('testResultEmoji').textContent=emoji;
  document.getElementById('testResultTitle').textContent='Test yakunlandi!';
  document.getElementById('testResultScore').textContent=`${correct}/${testQuestions.length}`;
  document.getElementById('testResultDesc').textContent=desc;
  openModal('testResultModal');
}
function restartTest() { loadStudentTest(); }

// ===== STUDENT MESSAGES =====
async function loadStudentMessages() {
  const groupId = currentUser.group?._id||currentUser.group;
  const gRes = await apiCall('GET', '/groups');
  const myGroup = gRes.success ? gRes.groups.find(g=>String(g._id)===String(groupId)) : null;
  const sel = document.getElementById('studentMsgTo');
  if (sel&&myGroup?.teacher) {
    const tId = myGroup.teacher._id||myGroup.teacher;
    const tName = myGroup.teacher.name||"O'qituvchi";
    sel.innerHTML = `<option value="${tId}">${tName}</option>`;
    currentChatUserId = tId;
    await loadConversation('studentChatMessages', tId);
    startChatPolling('studentChatMessages', tId);
  }
}
async function sendStudentMessage() {
  const to = document.getElementById('studentMsgTo')?.value||currentChatUserId;
  const text = document.getElementById('studentMsgText').value.trim();
  if (!to) { showToast("O'qituvchini tanlang!", 'error'); return; }
  if (!text) { showToast('Xabar kiriting!', 'error'); return; }
  const res = await apiCall('POST', '/messages', {to,message:text,type:'message'});
  if (res.success) { showToast('Xabar yuborildi!','success'); document.getElementById('studentMsgText').value=''; addChatBubble('studentChatMessages',text,true,currentUser.name); }
  else showToast(res.message,'error');
}
async function sendStudentChat() {
  const input = document.getElementById('studentChatInput'); if (!input) return;
  const text = input.value.trim(); if (!text) return;
  const to = document.getElementById('studentMsgTo')?.value||currentChatUserId;
  if (!to) { showToast("O'qituvchini tanlang!",'warn'); return; }
  const res = await apiCall('POST', '/messages', {to,message:text,type:'message'});
  if (res.success) { addChatBubble('studentChatMessages',text,true,currentUser.name); input.value=''; }
}

// ===== CHAT HELPERS =====
async function loadConversation(containerId, userId) {
  const res = await apiCall('GET', `/messages/conversation/${userId}`); if (!res.success) return;
  const chat = document.getElementById(containerId); if (!chat) return;
  chat.innerHTML='';
  const myId = String(currentUser._id||currentUser.id);
  res.messages.slice(-30).forEach(m=>{
    const isMe = String(m.from?._id||m.from)===myId;
    addChatBubble(containerId, m.message, isMe, m.from?.name||'');
  });
}
function startChatPolling(containerId, userId) {
  if (chatPollingInterval) clearInterval(chatPollingInterval);
  chatPollingInterval = setInterval(()=>loadConversation(containerId, userId), 5000);
}
function addChatBubble(containerId, text, isMe, senderName) {
  const c = document.getElementById(containerId); if (!c) return;
  const div = document.createElement('div'); div.className='chat-msg-row'+(isMe?' me':'');
  const initials = (senderName||'U').split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  div.innerHTML = `<div class="chat-av" style="${isMe?'background:var(--accent);color:white':''}">${initials}</div><div><div class="chat-bubble">${text}</div></div>`;
  c.appendChild(div); c.scrollTop=c.scrollHeight;
}

// ===== ADMIN REPORTS =====
async function loadAdminReports() {
  const gRes = await apiCall('GET', '/groups'); if (!gRes.success) return;
  const tbody = document.getElementById('reportTableBody'); if (!tbody) return;
  tbody.innerHTML = gRes.groups.map(g=>`
    <tr data-group="${g.name}">
      <td><strong>${g.name}</strong></td>
      <td>${g.subject}</td>
      <td>${g.students?.length||0}</td>
      <td>${g.teacher?.name||'—'}</td>
      <td>—</td>
      <td><span class="badge badge-success">Faol</span></td>
    </tr>`).join('');
  // Fill group filter
  const sel = document.getElementById('reportGroup');
  if (sel) {
    sel.innerHTML='<option value="">Barcha guruhlar</option>';
    gRes.groups.forEach(g=>sel.innerHTML+=`<option value="${g.name}">${g.name}</option>`);
  }
}
function filterReportTable(groupVal) {
  document.querySelectorAll('#reportTableBody tr').forEach(r=>{
    if (!groupVal){r.style.display='';return;}
    r.style.display = r.dataset.group===groupVal?'':'none';
  });
}
function generateReport() { showToast('Hisobot yangilandi!','success'); loadAdminReports(); }

// ===== EXPORT =====
function exportToExcel(type) {
  const rows = [];
  if (type==='teacher') {
    rows.push(["Talaba","Davomat","O'rtacha Baho","Topshiriqlar","Test","Holat"]);
    document.querySelectorAll('#teacherReportTbody tr').forEach(tr=>rows.push(Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim())));
  } else {
    rows.push(["Guruh","Fan","Talabalar","O'qituvchi","Holat"]);
    document.querySelectorAll('#reportTableBody tr:not([style*="none"])').forEach(tr=>rows.push(Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim())));
  }
  const csv = '\uFEFF'+rows.map(r=>r.join(',')).join('\n');
  const blob = new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`EduTeachAI_${type}_hisobot.csv`; a.click();
  URL.revokeObjectURL(url); showToast('Excel yuklab olindi!','success');
}
function exportToWord(type) {
  const now = new Date().toLocaleDateString('uz-UZ');
  let content = `EduTeachAI Hisoboti\nSana: ${now}\n\n`;
  const src = type==='teacher'?'#teacherReportTbody':'#reportTableBody';
  document.querySelectorAll(`${src} tr:not([style*="none"])`).forEach(tr=>{
    content += Array.from(tr.querySelectorAll('td')).map(td=>td.textContent.trim()).join(' | ')+'\n';
  });
  const blob = new Blob([content],{type:'text/plain;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download=`EduTeachAI_${type}_hisobot.txt`; a.click();
  URL.revokeObjectURL(url); showToast('Word yuklab olindi!','success');
}

// ===== AI ANALYTICS =====
const aiData = {
  day:  {d:'89%',g:'4.2',t:'78%',x:'7',text:"Bugungi tahlil: 89% davomat. 7 ta talaba xavfli holatda."},
  week: {d:'87%',g:'4.1',t:'82%',x:'5',text:"Haftalik: 87% davomat. IT-202 guruhida pasayish kuzatilmoqda."},
  month:{d:'91%',g:'4.3',t:'88%',x:'3',text:"Oylik: davomat 91%. 3 ta talaba kuzatuvda."},
  year: {d:'90%',g:'4.2',t:'91%',x:'12',text:"Yillik: 90% davomat. 12 talaba yil davomida muammo ko'rsatdi."}
};
function setAIPeriod(period, btn) {
  btn.closest('.ai-panel').querySelectorAll('.ai-p-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const d=aiData[period];
  [['ai-davomat',d.d],['ai-baho',d.g],['ai-topshiriq',d.t],['ai-xavfli',d.x]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  const txt=document.getElementById('aiAnalysisText'); if(txt)txt.textContent=d.text;
}
const sAiData = {
  day:  {a:'91%',g:'4.3',t:'8/10',s:'95%',text:"Bugun yaxshi! Ingliz tili davomatingiz kuzatish talab etadi."},
  week: {a:'88%',g:'4.2',t:'7/10',s:'90%',text:"Haftalik: 88% davomat. 2 ta topshiriq muddati kelmoqda."},
  month:{a:'91%',g:'4.3',t:'8/10',s:'95%',text:"Oylik: o'rtacha 4.3 baho."},
  year: {a:'90%',g:'4.2',t:'7.5/10',s:'92%',text:"Yillik: 90% davomat. Ingliz tiliga e'tibor bering."}
};
function setStudentAIPeriod(period, btn) {
  btn.closest('.ai-panel').querySelectorAll('.ai-p-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const d=sAiData[period];
  [['s-ai-att',d.a],['s-ai-grade',d.g],['s-ai-test',d.t],['s-ai-assign',d.s]].forEach(([id,v])=>{const el=document.getElementById(id);if(el)el.textContent=v;});
  const txt=document.getElementById('s-aiText'); if(txt)txt.textContent=d.text;
}

// ===== PROFILE =====
function openProfileModal() {
  if (!currentUser) return;
  document.getElementById('profileName').value=currentUser.name||'';
  document.getElementById('profileEmail').value=currentUser.email||'';
  document.getElementById('profilePhone').value=currentUser.phone||'';
  document.getElementById('profileLang').value=currentLang;
  const initials=currentUser.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('profileAvatarPreview').innerHTML=currentUser.avatar?`<img src="${currentUser.avatar}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`:`<span>${initials}</span>`;
  openModal('profileModal');
}
function previewAvatar(input) {
  if (input.files&&input.files[0]) {
    const r=new FileReader(); r.onload=e=>{
      document.getElementById('profileAvatarPreview').innerHTML=`<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">`;
      if (currentUser) currentUser._avatarData=e.target.result;
    }; r.readAsDataURL(input.files[0]);
  }
}
async function saveProfile() {
  const name=document.getElementById('profileName').value.trim();
  const phone=document.getElementById('profilePhone').value.trim();
  const lang=document.getElementById('profileLang').value;
  const pass=document.getElementById('profileNewPass').value;
  if (!name){showToast('Ism kiritilishi shart!','error');return;}
  const updates={name,phone,language:lang};
  if (pass) updates.password=pass;
  if (currentUser._avatarData) updates.avatar=currentUser._avatarData;
  await apiCall('PUT', '/auth/profile', updates);
  currentUser={...currentUser,name,phone,language:lang};
  if (updates.avatar) currentUser.avatar=updates.avatar;
  localStorage.setItem('eduuser', JSON.stringify(currentUser));
  currentLang=lang; setupApp(currentUser);
  closeModal('profileModal'); showToast('Profil saqlandi!','success');
}

// ===== TABS =====
function switchTab(btn, tabId) {
  const parent=btn.closest('.page,.card')||document.body;
  parent.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  parent.querySelectorAll('[id^="tab-"],[id^="s-tab-"],[id^="sub-tab-"]').forEach(t2=>t2.style.display='none');
  const target=document.getElementById(tabId); if(target) target.style.display='block';
}

// ===== MODALS =====
function openModal(id) {
  document.getElementById(id).classList.add('show');
  if (id==='addTeacherModal'||id==='addStudentModal'||id==='editUserModal') loadGroupsForModal();
  if (id==='addGroupModal') loadTeachersForGroupModal();
}
function closeModal(id) { document.getElementById(id).classList.remove('show'); }
function closeOnOverlay(e,el) { if(e.target===el) el.classList.remove('show'); }

// ===== CHART =====
function buildChart() {
  const chart=document.getElementById('weekChart'); if(!chart)return;
  const days=currentLang==='ru'?['Пн','Вт','Ср','Чт','Пт','Сб','Вс']:currentLang==='en'?['Mo','Tu','We','Th','Fr','Sa','Su']:['Du','Se','Ch','Pa','Ju','Sha','Ya'];
  const vals=[92,88,95,85,91,78,82];
  chart.innerHTML=days.map((d,i)=>`<div class="chart-bar-wrap"><div class="chart-bar" style="height:0" data-h="${vals[i]}%" title="${vals[i]}%"></div><span class="chart-bar-label">${d}</span></div>`).join('');
  setTimeout(()=>chart.querySelectorAll('.chart-bar').forEach(b=>b.style.height=b.dataset.h),400);
}

// ===== TOAST =====
function showToast(msg, type='success') {
  const c=document.getElementById('toastContainer'); if(!c)return;
  const toast=document.createElement('div'); toast.className=`toast ${type==='error'?'error':type==='warn'?'warn':''}`;
  const icons={success:'✅',error:'❌',warn:'⚠️'};
  toast.innerHTML=`<span>${icons[type]||'✅'}</span><span>${msg}</span>`;
  c.appendChild(toast);
  setTimeout(()=>{toast.style.opacity='0';toast.style.transform='translateX(100%)';toast.style.transition='.3s';setTimeout(()=>toast.remove(),300);},3000);
}

// ===== INIT =====
window.addEventListener('DOMContentLoaded', ()=>{
  const savedUser=localStorage.getItem('eduuser');
  const savedToken=localStorage.getItem('edutoken');
  if (savedUser&&savedToken) {
    try {
      currentUser=JSON.parse(savedUser); currentLang=currentUser.language||'uz';
      document.getElementById('loginScreen').style.display='none';
      document.getElementById('appScreen').style.display='flex';
      setupApp(currentUser);
    } catch { localStorage.clear(); }
  }
});
