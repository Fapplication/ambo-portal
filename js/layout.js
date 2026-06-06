// js/layout.js  –  Renders sidebar + topbar for both roles

function renderLayout({ role, activePage }) {
  const session = Session.get();
  if (!session) { window.location.href = 'index.html'; return; }

  const studentNav = [
    { id: 'dashboard',      icon: '🏠', label: 'Dashboard',      href: 'student-dashboard.html' },
    { id: 'marks',          icon: '📊', label: 'My Marks',       href: 'student-marks.html' },
    { id: 'tests',          icon: '📝', label: 'Online Tests',    href: 'student-tests.html' },
    { id: 'notes',          icon: '📚', label: 'Lecture Notes',   href: 'student-notes.html' },
    { id: 'chatbot',        icon: '🤖', label: 'Chatbot',         href: 'student-chatbot.html' },
    { id: 'notifications',  icon: '🔔', label: 'Notifications',   href: 'student-notifications.html' },
  ];

  const instructorNav = [
    { id: 'dashboard',  icon: '🏠', label: 'Dashboard',        href: 'instructor-dashboard.html' },
    { id: 'students',   icon: '👥', label: 'Manage Marks',     href: 'instructor-marks.html' },
    { id: 'complaints', icon: '📬', label: 'Complaints',       href: 'instructor-complaints.html' },
    { id: 'tests',      icon: '📝', label: 'Upload Questions', href: 'instructor-tests.html' },
    { id: 'notes',      icon: '📚', label: 'Lecture Notes',    href: 'instructor-notes.html' },
    { id: 'notices',    icon: '📣', label: 'Send Notice',      href: 'instructor-notices.html' },
  ];

  const navItems = role === 'instructor' ? instructorNav : studentNav;
  const initials = (session.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const navHTML = navItems.map(item => `
    <button class="nav-item ${activePage === item.id ? 'active' : ''}"
            onclick="window.location.href='${item.href}'">
      <span class="nav-icon">${item.icon}</span>
      ${item.label}
    </button>
  `).join('');

  const pageTitle = navItems.find(n => n.id === activePage)?.label || 'Portal';

  document.body.innerHTML = `
    <div class="sidebar-overlay" id="sidebarOverlay" onclick="closeSidebar()"></div>
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-logo">
        <div class="logo-mark">
          <div class="logo-icon">🏛️</div>
          Civil Eng. Portal
        </div>
      </div>
      <div class="sidebar-user">
        <div class="avatar">${initials}</div>
        <div class="user-info">
          <div class="user-name">${session.name || 'User'}</div>
          <div class="user-role">${role === 'instructor' ? 'Instructor' : 'Student · ' + (session.studentId || '')}</div>
        </div>
      </div>
      <nav class="sidebar-nav">
        <div class="nav-section-label">${role === 'instructor' ? 'Instructor Tools' : 'Student Menu'}</div>
        ${navHTML}
      </nav>
      <div class="sidebar-footer">
        <button class="nav-item" onclick="doLogout()" style="color:#f87171;">
          <span class="nav-icon">🚪</span> Logout
        </button>
      </div>
    </aside>

    <div class="main-content">
      <header class="topbar">
        <div class="topbar-left">
          <button class="mobile-menu-btn" onclick="toggleSidebar()">☰</button>
          <div>
            <div class="topbar-title">${pageTitle}</div>
            <div class="topbar-breadcrumb">${role === 'instructor' ? 'Instructor' : 'Student'} Portal</div>
          </div>
        </div>
        <div class="topbar-right">
          <span class="text-sm text-muted">${new Date().toLocaleDateString('en-ET', { weekday:'short', year:'numeric', month:'short', day:'numeric' })}</span>
        </div>
      </header>
      <main class="page-content" id="pageContent">
        <!-- Page body goes here -->
      </main>
    </div>
  ` + document.body.innerHTML;
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
  document.getElementById('sidebarOverlay').classList.toggle('show');
}

function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('show');
}

function doLogout() {
  Session.clear();
  window.location.href = 'index.html';
}
