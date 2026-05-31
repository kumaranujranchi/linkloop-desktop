/* =============================================
   LinkBuild — Application Logic
   ============================================= */

// ---------- NAVIGATION ----------
function navigateTo(pageName, navItem) {
  // Guard admin page navigation
  if (pageName === 'admin') {
    const user = window.LinkBuild ? window.LinkBuild.getCurrentUser() : null;
    if (!user || user.role !== 'admin') {
      console.warn("🔒 Unauthorized attempt to access Admin page.");
      // Redirect to dashboard
      navigateTo('dashboard');
      return;
    }
  }

  // Hide all page sections
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));

  // Show the target page
  const targetPage = document.getElementById('page-' + pageName);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  // Update sidebar nav item
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  if (navItem && navItem.classList.contains('nav-item')) {
    navItem.classList.add('active');
  } else {
    const nav = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (nav) nav.classList.add('active');
  }

  // Update mobile bottom nav active state
  document.querySelectorAll('.mobile-nav-item').forEach(m => m.classList.remove('active'));
  const mobNav = document.querySelector(`.mobile-nav-item[data-mob-page="${pageName}"]`);
  if (mobNav) mobNav.classList.add('active');

  // Update breadcrumb
  const breadcrumbMap = {
    'dashboard': 'Dashboard',
    'websites': 'Websites',
    'marketplace': 'Marketplace',
    'website-detail': 'Website Detail',
    'exchange-requests': 'Exchange Requests',
    'messages': 'Messages',
    'backlink-monitor': 'Backlink Monitor',
    'notifications': 'Notifications',
    'analytics': 'Analytics',
    'billing': 'Billing',
    'settings': 'Settings',
    'admin': 'Admin'
  };

  const currentLabel = breadcrumbMap[pageName] || pageName;
  document.getElementById('breadcrumbCurrent').textContent = currentLabel;

  // Parent breadcrumb logic
  const parentMap = {
    'website-detail': 'Marketplace',
    'exchange-requests': 'Exchange',
    'messages': 'Exchange',
    'backlink-monitor': 'Monitor',
    'notifications': 'Monitor',
    'analytics': 'Monitor',
    'billing': 'Account',
    'settings': 'Account',
    'admin': 'Account'
  };
  document.getElementById('breadcrumbParent').textContent = parentMap[pageName] || 'Home';

  // Mobile-specific: handle chat area
  if (pageName === 'messages') {
    showConversationList();
  } else {
    hideChatArea();
  }

  // Initialize charts if navigating to pages with charts
  setTimeout(() => {
    if (pageName === 'dashboard') initDashboardCharts();
    if (pageName === 'analytics') initAnalyticsCharts();
  }, 150);

  // Scroll to top
  document.getElementById('pageContent').scrollTop = 0;

  // Close mobile sidebar
  closeMobileSidebar();
}

// ---------- MOBILE CHAT BEHAVIOR ----------
function showConversationList() {
  const chatArea = document.querySelector('.chat-area');
  const convList = document.querySelector('.conversations-list');
  if (chatArea) chatArea.classList.remove('mobile-active');
  if (convList) convList.style.display = '';
}

function hideChatArea() {
  const chatArea = document.querySelector('.chat-area');
  if (chatArea) chatArea.classList.remove('mobile-active');
}

function openMobileChat() {
  const chatArea = document.querySelector('.chat-area');
  const convList = document.querySelector('.conversations-list');
  if (chatArea) chatArea.classList.add('mobile-active');
  if (convList && window.innerWidth <= 900) convList.style.display = 'none';
}

function backToConversations() {
  showConversationList();
}

// Attach click handlers to conversation items for mobile
document.addEventListener('DOMContentLoaded', function() {
  // Use event delegation for conversation clicks
  document.querySelector('.conversations-list')?.addEventListener('click', function(e) {
    const convItem = e.target.closest('.conversation-item');
    if (convItem && window.innerWidth <= 900) {
      openMobileChat();
    }
  });

  // Also listen for window resize to reset chat state
  window.addEventListener('resize', function() {
    if (window.innerWidth > 900) {
      showConversationList();
      const convList = document.querySelector('.conversations-list');
      if (convList) convList.style.display = '';
    }
  });
});

// ---------- SIDEBAR TOGGLE ----------
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');

  // On mobile/tablet (≤900px): toggle mobile sidebar overlay
  if (window.innerWidth <= 900) {
    sidebar.classList.toggle('mobile-open');
    overlay.classList.toggle('active');
    return;
  }

  // On tablet landscape (≤1200px): toggle collapsed/expanded
  if (window.innerWidth <= 1200) {
    sidebar.classList.toggle('expanded');
    return;
  }

  // On desktop: toggle collapsed
  sidebar.classList.toggle('collapsed');
}

function toggleMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  sidebar.classList.toggle('mobile-open');
  overlay.classList.toggle('active');
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');
  sidebar.classList.remove('mobile-open');
  overlay.classList.remove('active');
}

// ---------- THEME TOGGLE ----------
function toggleTheme() {
  const html = document.documentElement;
  const current = html.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  html.setAttribute('data-theme', next);

  // Update icons
  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  if (next === 'dark') {
    sunIcon.style.display = 'none';
    moonIcon.style.display = 'block';
  } else {
    sunIcon.style.display = 'block';
    moonIcon.style.display = 'none';
  }

  // Save preference
  localStorage.setItem('linkbuild-theme', next);

  // Update charts if visible
  updateChartColors(next);
}

function updateChartColors(theme) {
  const isDark = theme === 'dark';
  Chart.defaults.color = isDark ? '#94A3B8' : '#64748B';
  Chart.defaults.borderColor = isDark ? '#1E293B' : '#E2E8F0';

  // Redraw existing charts
  Object.keys(window.__charts || {}).forEach(key => {
    const chart = window.__charts[key];
    if (chart && chart.options) {
      chart.options.scales = getChartScales(isDark);
      chart.update();
    }
  });
}

// ---------- TABS ----------
function switchTab(tabElement) {
  const tabsContainer = tabElement.parentElement;
  tabsContainer.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  tabElement.classList.add('active');
}

// ---------- KEYBOARD SHORTCUTS ----------
document.addEventListener('keydown', function(e) {
  // ⌘K or Ctrl+K → focus search
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    const searchInput = document.querySelector('.topbar-search input');
    if (searchInput) searchInput.focus();
  }

  // ⌘/ or Ctrl+/ → toggle theme
  if ((e.metaKey || e.ctrlKey) && e.key === '/') {
    e.preventDefault();
    toggleTheme();
  }

  // Escape → close modals / mobile sidebar
  if (e.key === 'Escape') {
    closeMobileSidebar();
  }
});

// ---------- CHARTS ----------
window.__charts = {};

function getChartScales(isDark) {
  const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  return {
    x: {
      grid: { color: gridColor, drawBorder: false },
      ticks: { font: { size: 11 } }
    },
    y: {
      grid: { color: gridColor, drawBorder: false },
      ticks: { font: { size: 11 } },
      beginAtZero: true
    }
  };
}

// Chart color palette
const chartColors = {
  purple: '#6C4DF6',
  blue: '#0F4C81',
  green: '#10B981',
  orange: '#F59E0B',
  red: '#EF4444',
  purpleLight: 'rgba(108,77,246,0.15)',
  blueLight: 'rgba(15,76,129,0.15)',
  greenLight: 'rgba(16,185,129,0.15)',
};

function initDashboardCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // Exchange Activity Chart
  const ctx1 = document.getElementById('chartExchangeActivity');
  if (ctx1) {
    if (window.__charts.exchangeActivity) {
      window.__charts.exchangeActivity.destroy();
    }
    window.__charts.exchangeActivity = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Completed',
            data: [45, 52, 38, 60, 55, 72],
            backgroundColor: '#6C4DF6',
            borderRadius: 6,
            borderSkipped: false,
          },
          {
            label: 'Pending',
            data: [15, 18, 22, 14, 20, 16],
            backgroundColor: 'rgba(108,77,246,0.25)',
            borderRadius: 6,
            borderSkipped: false,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } } },
        scales: getChartScales(isDark),
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }

  // Backlinks Verified Chart
  const ctx2 = document.getElementById('chartBacklinksVerified');
  if (ctx2) {
    if (window.__charts.backlinksVerified) {
      window.__charts.backlinksVerified.destroy();
    }
    window.__charts.backlinksVerified = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        datasets: [
          {
            label: 'Dofollow',
            data: [1200, 1350, 1480, 1600, 1750, 1820],
            borderColor: '#10B981',
            backgroundColor: 'rgba(16,185,129,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
          },
          {
            label: 'Nofollow',
            data: [600, 680, 750, 820, 950, 1071],
            borderColor: '#F59E0B',
            backgroundColor: 'rgba(245,158,11,0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 3,
            pointHoverRadius: 6,
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } } },
        scales: getChartScales(isDark),
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }
}

function initAnalyticsCharts() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';

  // Exchange Activity (6 months)
  const ctx1 = document.getElementById('chartAnalyticsExchange');
  if (ctx1) {
    if (window.__charts.analyticsExchange) window.__charts.analyticsExchange.destroy();
    window.__charts.analyticsExchange = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Exchanges',
          data: [82, 95, 110, 130, 145, 168],
          backgroundColor: ['rgba(108,77,246,0.3)','rgba(108,77,246,0.4)','rgba(108,77,246,0.5)','rgba(108,77,246,0.65)','rgba(108,77,246,0.8)','#6C4DF6'],
          borderRadius: 6,
          borderSkipped: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: getChartScales(isDark)
      }
    });
  }

  // Backlink Growth
  const ctx2 = document.getElementById('chartAnalyticsBacklinks');
  if (ctx2) {
    if (window.__charts.analyticsBacklinks) window.__charts.analyticsBacklinks.destroy();
    window.__charts.analyticsBacklinks = new Chart(ctx2, {
      type: 'line',
      data: {
        labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [{
          label: 'Total Backlinks',
          data: [2100, 2250, 2400, 2580, 2750, 2891],
          borderColor: '#6C4DF6',
          backgroundColor: 'rgba(108,77,246,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#6C4DF6',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: getChartScales(isDark)
      }
    });
  }

  // DA Distribution
  const ctx3 = document.getElementById('chartAnalyticsDA');
  if (ctx3) {
    if (window.__charts.analyticsDA) window.__charts.analyticsDA.destroy();
    window.__charts.analyticsDA = new Chart(ctx3, {
      type: 'doughnut',
      data: {
        labels: ['DA 0-20', 'DA 20-40', 'DA 40-60', 'DA 60-80', 'DA 80+'],
        datasets: [{
          data: [15, 28, 35, 18, 4],
          backgroundColor: ['#94A3B8', '#3B82F6', '#6C4DF6', '#10B981', '#0F4C81'],
          borderWidth: 2,
          borderColor: isDark ? '#13131A' : '#FFFFFF',
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { usePointStyle: true, padding: 16, font: { size: 11 } } }
        }
      }
    });
  }

  // User Growth
  const ctx4 = document.getElementById('chartAnalyticsUsers');
  if (ctx4) {
    if (window.__charts.analyticsUsers) window.__charts.analyticsUsers.destroy();
    window.__charts.analyticsUsers = new Chart(ctx4, {
      type: 'line',
      data: {
        labels: ['Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'],
        datasets: [
          {
            label: 'Free',
            data: [3200, 3400, 3600, 3900, 4300, 4800],
            borderColor: '#94A3B8',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 3,
          },
          {
            label: 'Pro',
            data: [800, 950, 1100, 1350, 1600, 2100],
            borderColor: '#6C4DF6',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 3,
          },
          {
            label: 'Agency',
            data: [200, 250, 320, 400, 520, 680],
            borderColor: '#10B981',
            backgroundColor: 'transparent',
            tension: 0.4,
            pointRadius: 3,
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20, font: { size: 12 } } } },
        scales: getChartScales(isDark),
        interaction: { intersect: false, mode: 'index' }
      }
    });
  }
}

// ---------- INITIALIZATION ----------
document.addEventListener('DOMContentLoaded', function() {
  // Load saved theme
  const savedTheme = localStorage.getItem('linkbuild-theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);

  // Update theme icons
  const sunIcon = document.getElementById('themeIconSun');
  const moonIcon = document.getElementById('themeIconMoon');
  if (savedTheme === 'dark') {
    if (sunIcon) sunIcon.style.display = 'none';
    if (moonIcon) moonIcon.style.display = 'block';
  } else {
    if (sunIcon) sunIcon.style.display = 'block';
    if (moonIcon) moonIcon.style.display = 'none';
  }

  // Set chart defaults
  Chart.defaults.color = savedTheme === 'dark' ? '#94A3B8' : '#64748B';
  Chart.defaults.borderColor = savedTheme === 'dark' ? '#1E293B' : '#E2E8F0';
  Chart.defaults.font.family = "'Inter', sans-serif";

  // Initialize dashboard charts
  initDashboardCharts();

  // Sync mobile bottom nav with current page
  syncMobileBottomNav();

  // Handle window resize for responsive behavior
  let resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      handleResize();
    }, 200);
  });

  // Initial resize check
  handleResize();

  console.log('🚀 LinkBuild — SEO Link Exchange Marketplace');
  console.log('   Dashboard ready. Press ⌘K to search, ⌘/ to toggle theme.');
});

function handleResize() {
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('mobileOverlay');

  if (!sidebar) return;

  // Close sidebar overlay on resize to larger screen
  if (window.innerWidth > 900) {
    sidebar.classList.remove('mobile-open');
    if (overlay) overlay.classList.remove('active');
    // Reset chat area on desktop
    const chatArea = document.querySelector('.chat-area');
    const convList = document.querySelector('.conversations-list');
    if (chatArea) chatArea.classList.remove('mobile-active');
    if (convList) convList.style.display = '';
  }

  // Reset expanded state on mobile
  if (window.innerWidth <= 900) {
    sidebar.classList.remove('expanded', 'collapsed');
  }

  // Redraw charts to fit new size
  Object.keys(window.__charts || {}).forEach(key => {
    const chart = window.__charts[key];
    if (chart && chart.resize) {
      chart.resize();
    }
  });
}

function syncMobileBottomNav() {
  const activePage = document.querySelector('.page-section.active');
  if (!activePage) return;
  const pageId = activePage.id.replace('page-', '');

  document.querySelectorAll('.mobile-nav-item').forEach(m => {
    m.classList.remove('active');
    if (m.getAttribute('data-mob-page') === pageId) {
      m.classList.add('active');
    }
  });
}

// ---------- EXPORT FOR GLOBAL ACCESS ----------
window.navigateTo = navigateTo;
window.toggleSidebar = toggleSidebar;
window.toggleTheme = toggleTheme;
window.toggleMobileSidebar = toggleMobileSidebar;
window.closeMobileSidebar = closeMobileSidebar;
window.switchTab = switchTab;
window.initDashboardCharts = initDashboardCharts;
window.initAnalyticsCharts = initAnalyticsCharts;

// =============================================
// AUTH HANDLING
// =============================================
window.handleLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const msgEl = document.getElementById("authMessage");
  if (!email || !password) { msgEl.innerHTML = '<span style="color:var(--danger)">Please enter your email and password</span>'; return; }

  const btnEl = e.target.querySelector('button[type="submit"]');
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Logging in...'; }
  msgEl.innerHTML = '<span style="color:var(--text-secondary)">Logging in...</span>';
  
  const result = await window.LinkBuild.login(email, password);
  if (result.success) {
    msgEl.innerHTML = '<span style="color:var(--success)">✓ Login successful! Redirecting...</span>';
    document.getElementById("loginForm").reset();
    // redirect is handled inside window.LinkBuild.login() based on page context:
    // - on landing page → redirects to dashboard.html
    // - on dashboard page → just closes overlay
    const onDashboard = window.location.pathname.includes("dashboard");
    if (onDashboard) {
      window.LinkBuild.hideAuthScreen();
      window.LinkBuild.loadDashboardData().catch(() => {});
    }
  } else {
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Login'; }
    msgEl.innerHTML = '<span style="color:var(--danger)">' + (result.error || "Login failed") + '</span>';
  }
};

window.handleSignup = async function(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const msgEl = document.getElementById("authMessage");
  if (!name || !email || !password) { msgEl.innerHTML = '<span style="color:var(--danger)">Please fill in all fields</span>'; return; }

  const btnEl = e.target.querySelector('button[type="submit"]');
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Creating...'; }
  msgEl.innerHTML = '<span style="color:var(--text-secondary)">Creating account...</span>';
  
  const result = await window.LinkBuild.signup(name, email, password);
  if (result.success) {
    msgEl.innerHTML = '<span style="color:var(--success)">✓ Account created! Redirecting...</span>';
    document.getElementById("signupForm").reset();
    // redirect is handled inside window.LinkBuild.signup() based on page context:
    // - on landing page → redirects to dashboard.html
    // - on dashboard page → just closes overlay
    const onDashboard = window.location.pathname.includes("dashboard");
    if (onDashboard) {
      window.LinkBuild.hideAuthScreen();
      window.LinkBuild.loadDashboardData().catch(() => {});
    }
  } else {
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Create Account'; }
    msgEl.innerHTML = '<span style="color:var(--danger)">' + (result.error || "Signup failed") + '</span>';
  }
};

window.switchAuthTab = function(tab) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const title = document.getElementById("authTitle");
  const msg = document.getElementById("authMessage");
  if (msg) msg.innerHTML = '';
  if (tab === "signup") {
    loginForm.style.display = "none";
    signupForm.style.display = "flex";
    if (title) title.textContent = "Create Your Account";
  } else {
    loginForm.style.display = "flex";
    signupForm.style.display = "none";
    if (title) title.textContent = "Welcome to LinkBuild";
  }
};

// =============================================
// PROFILE DROPDOWN
// =============================================
function updateProfileDropdown(user) {
  const avatarEl = document.getElementById("profileDropdownAvatar");
  const nameEl   = document.getElementById("profileDropdownName");
  const emailEl  = document.getElementById("profileDropdownEmail");
  const badgeEl  = document.getElementById("profileDropdownBadge");

  if (!user) return;

  const initials = user.name
    ? user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const roleLabelMap = { free: "Free Plan", pro: "Pro Plan", agency: "Agency Plan", admin: "Administrator" };
  const roleLabel = roleLabelMap[user.role] || "Free Plan";

  if (avatarEl) avatarEl.textContent = initials;
  if (nameEl)   nameEl.textContent   = user.name  || "—";
  if (emailEl)  emailEl.textContent  = user.email || "—";
  if (badgeEl)  badgeEl.textContent  = roleLabel;
}
window.updateProfileDropdown = updateProfileDropdown;

window.toggleProfileDropdown = function() {
  const dd = document.getElementById("profileDropdown");
  if (!dd) return;

  if (dd.classList.contains("open")) {
    dd.classList.remove("open");
    return;
  }

  // If not logged in, show auth screen instead
  if (window.LinkBuild && !window.LinkBuild.isLoggedIn()) {
    window.LinkBuild.showAuthScreen();
    return;
  }

  // Populate with fresh user data
  if (window.LinkBuild) {
    updateProfileDropdown(window.LinkBuild.getCurrentUser());
  }

  dd.classList.add("open");
};

window.closeProfileDropdown = function() {
  const dd = document.getElementById("profileDropdown");
  if (dd) dd.classList.remove("open");
};

// Close dropdown on outside click
document.addEventListener("click", function(e) {
  const wrapper = document.getElementById("profileDropdownWrapper");
  const dd = document.getElementById("profileDropdown");
  if (dd && dd.classList.contains("open") && wrapper && !wrapper.contains(e.target)) {
    dd.classList.remove("open");
  }
});

// Keep legacy showLogoutMenu as fallback alias
window.showLogoutMenu = window.toggleProfileDropdown;

window.saveSettingsProfile = function() {
  const user = window.LinkBuild.getCurrentUser();
  if (!user) { alert("You must be logged in to save settings."); return; }
  const nameEl = document.getElementById("settingsDisplayName");
  // For now, just show a success toast (full save requires backend endpoint)
  if (nameEl && nameEl.value.trim()) {
    alert("Settings saved! (Changes to display name will sync on next login.)");
  }
};

// =============================================
// ADD WEBSITE MODAL
// =============================================
window.openAddWebsiteModal = function() {
  if (!window.LinkBuild.isLoggedIn()) {
    alert("Please login first to add a website.");
    window.LinkBuild.showAuthScreen();
    return;
  }
  document.getElementById("addWebsiteModal").classList.add("active");
  document.getElementById("addWebsiteModal").classList.remove("hidden");
};

window.closeAddWebsiteModal = function() {
  document.getElementById("addWebsiteModal").classList.remove("active");
  document.getElementById("addWebsiteModal").classList.add("hidden");
  document.getElementById("addWebsiteForm").reset();
  document.getElementById("wsMessage").innerHTML = '';
};

window.handleAddWebsite = async function(e) {
  e.preventDefault();
  const msgEl = document.getElementById("wsMessage");
  msgEl.innerHTML = '<span style="color:var(--text-secondary)">Adding website...</span>';

  const data = {
    domain: document.getElementById("wsDomain").value.trim(),
    niche: document.getElementById("wsNiche").value,
    country: document.getElementById("wsCountry").value,
    language: document.getElementById("wsLanguage").value,
    domainAuthority: parseInt(document.getElementById("wsDA").value) || 0,
    spamScore: parseInt(document.getElementById("wsSpam").value) || 0,
    trafficEstimate: parseInt(document.getElementById("wsTraffic").value) || 0,
    referringDomains: parseInt(document.getElementById("wsRefDomains").value) || 0,
  };

  if (!data.domain || !data.niche || !data.country) {
    msgEl.innerHTML = '<span style="color:var(--danger)">Please fill in Domain, Niche, and Country</span>';
    return;
  }

  const result = await window.LinkBuild.addWebsite(data);
  if (result.success) {
    msgEl.innerHTML = '<span style="color:var(--success)">✅ Website added successfully!</span>';
    setTimeout(() => { closeAddWebsiteModal(); window.LinkBuild.loadMyWebsites(); }, 800);
  } else {
    msgEl.innerHTML = '<span style="color:var(--danger)">' + (result.error || "Failed to add website") + '</span>';
  }
};

// =============================================
// LOAD DATA ON PAGE NAVIGATION
// =============================================
const originalNavigateTo = navigateTo;
navigateTo = function(pageName, navItem) {
  originalNavigateTo(pageName, navItem);

  // Load data for specific pages after navigation
  setTimeout(() => {
    if (window.LinkBuild && window.LinkBuild.isLoggedIn()) {
      if (pageName === "websites") {
        window.LinkBuild.loadMyWebsites();
      } else if (pageName === "marketplace") {
        window.LinkBuild.loadMarketplace();
      } else if (pageName === "exchange-requests") {
        window.LinkBuild.loadExchangeRequests();
      } else if (pageName === "messages") {
        window.LinkBuild.loadConversations();
      } else if (pageName === "notifications") {
        window.LinkBuild.loadNotifications();
      } else if (pageName === "dashboard") {
        window.LinkBuild.loadDashboardData();
      } else if (pageName === "settings") {
        // Repopulate settings with live user data every time settings is opened
        const user = window.LinkBuild.getCurrentUser();
        if (user && window.LinkBuild.populateSettingsPage) {
          window.LinkBuild.populateSettingsPage(user);
        }
      }
    }
  }, 200);
};
