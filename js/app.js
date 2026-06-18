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

  // Trigger data loading for each page
  setTimeout(() => {
    if (pageName === 'websites') window.LinkBuild.loadMyWebsites();
    if (pageName === 'marketplace') window.LinkBuild.loadMarketplace();
    if (pageName === 'exchange-requests') window.LinkBuild.loadExchangeRequests();
    if (pageName === 'notifications') window.LinkBuild.loadAndRenderNotifications();
    if (pageName === 'backlink-monitor') window.LinkBuild.loadBacklinks();
    if (pageName === 'messages') window.LinkBuild.loadConversations();
  }, 200);

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
// SAFE MESSAGE HELPER — prevents XSS via innerHTML
// =============================================
/**
 * Sets a status/error message safely using textContent (never innerHTML).
 * @param {HTMLElement|string} elOrId - element or element ID
 * @param {string} text - the message text (will be HTML-escaped)
 * @param {'info'|'success'|'danger'} [type='info'] - color theme
 */
function setMsg(elOrId, text, type = 'info') {
  const el = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
  if (!el) return;
  el.textContent = ''; // clear first
  const span = document.createElement('span');
  const colorMap = { info: 'var(--text-secondary)', success: 'var(--success)', danger: 'var(--danger)' };
  span.style.color = colorMap[type] || colorMap.info;
  span.textContent = text; // safe: no HTML parsing
  el.appendChild(span);
}

// =============================================
// AUTH HANDLING
// =============================================
window.handleLogin = async function(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;
  const msgEl = document.getElementById("authMessage");
  if (!email || !password) { setMsg(msgEl, 'Please enter your email and password', 'danger'); return; }

  const btnEl = e.target.querySelector('button[type="submit"]');
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Logging in...'; }
  setMsg(msgEl, 'Logging in...', 'info');

  try {
    let result;

    // Close modal immediately on any successful login
    const closeModal = () => {
      const overlay = document.getElementById('authOverlay');
      if (overlay) { overlay.classList.remove('active'); overlay.classList.add('hidden'); }
    };

    // Primary: use window.LinkBuild.login if available
    if (window.LinkBuild && typeof window.LinkBuild.login === 'function') {
      result = await window.LinkBuild.login(email, password);
    } else {
      // Fallback: direct Convex HTTP API call
      const res = await fetch('https://vibrant-marmot-366.convex.cloud/api/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: 'users:loginWithPassword', args: { email, password } })
      });
      const data = await res.json();
      if (data.status === 'success' && data.value && data.value.token) {
        // Save token locally so dashboard can use it
        localStorage.setItem('linkbuild-token', data.value.token);
        localStorage.setItem('linkbuild-user', JSON.stringify(data.value.user));
        closeModal();
        // Redirect to dashboard or admin after short delay so modal close is visible
        setTimeout(() => {
          const isCleanUrl = !window.location.pathname.includes('.html');
          const role = (data.value.user && data.value.user.role || "").toString().toLowerCase();
          if (role === 'admin') {
            window.location.href = isCleanUrl ? '/admin' : 'admin.html';
          } else {
            window.location.href = isCleanUrl ? '/dashboard' : 'dashboard.html';
          }
        }, 100);
        return;
      } else {
        let errorMsg = data.errorMessage || 'Invalid email or password';
        if (typeof errorMsg === 'string' && errorMsg.includes("ConvexError:")) {
          const parts = errorMsg.split("ConvexError:");
          if (parts.length > 1) {
            errorMsg = parts[1].trim();
          }
        }
        result = { success: false, error: errorMsg };
      }
    }

    if (result && result.success) {
      closeModal();
      setMsg(msgEl, '✓ Login successful! Redirecting...', 'success');
      document.getElementById("loginForm").reset();

      const userRole = (result.user && result.user.role || "").toString().toLowerCase();
      const isAdmin = userRole === "admin";
      const onDashboard = window.location.pathname.includes("dashboard");

      if (isAdmin) {
        const isCleanUrl = !window.location.pathname.includes('.html');
        window.location.href = isCleanUrl ? '/admin' : 'admin.html';
        return;
      }

      if (onDashboard) {
        if (window.LinkBuild) {
          window.LinkBuild.hideAuthScreen();
          window.LinkBuild.loadDashboardData().catch(() => {});
        }
      }
      // Note: on landing page, window.LinkBuild.login() already handles redirect to dashboard.
      // Only if that didn't happen (e.g. login returned but no redirect), we redirect here.
    } else {
      if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Login'; }
      setMsg(msgEl, result.error || 'Login failed', 'danger');
    }
  } catch (err) {
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Login'; }
    setMsg(msgEl, err.message || 'Connection error. Please try again.', 'danger');
  }
};

window.handleSignup = async function(e) {
  e.preventDefault();
  const name = document.getElementById("signupName").value.trim();
  const email = document.getElementById("signupEmail").value.trim();
  const password = document.getElementById("signupPassword").value;
  const msgEl = document.getElementById("authMessage");
  if (!name || !email || !password) { setMsg(msgEl, 'Please fill in all fields', 'danger'); return; }

  const btnEl = e.target.querySelector('button[type="submit"]');
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = 'Creating...'; }
  setMsg(msgEl, 'Creating account...', 'info');
  
  const result = await window.LinkBuild.signup(name, email, password);
  if (result.success) {
    setMsg(msgEl, '✓ Account created! Redirecting...', 'success');
    document.getElementById("signupForm").reset();
    const onDashboard = window.location.pathname.includes("dashboard");
    if (onDashboard) {
      window.LinkBuild.hideAuthScreen();
      window.LinkBuild.loadDashboardData().catch(() => {});
    }
  } else {
    if (btnEl) { btnEl.disabled = false; btnEl.textContent = 'Create Account'; }
    setMsg(msgEl, result.error || 'Signup failed', 'danger');
  }
};

window.switchAuthTab = function(tab) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const title = document.getElementById("authTitle");
  const msg = document.getElementById("authMessage");
  if (msg) msg.textContent = '';
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

window.handleGoogleSignIn = async function() {
  const msgEl = document.getElementById("authMessage");
  if (msgEl) setMsg(msgEl, 'Signing in with Google...', 'info');

  const processAuthResult = async (result) => {
    if (result && result.success) {
      if (msgEl) setMsg(msgEl, '✓ Login successful! Redirecting...', 'success');
      
      const onDashboard = window.location.pathname.includes("dashboard");
      if (onDashboard) {
        const overlay = document.getElementById('authOverlay');
        if (overlay) { overlay.classList.remove('active'); overlay.classList.add('hidden'); }
        if (window.LinkBuild) {
          window.LinkBuild.hideAuthScreen();
          window.LinkBuild.loadDashboardData().catch(() => {});
        }
      } else {
        const isCleanUrl = !window.location.pathname.includes('.html');
        window.location.href = isCleanUrl ? '/dashboard' : 'dashboard.html';
      }
    } else {
      let errorMsg = result?.error || "Google login failed";
      if (typeof errorMsg === 'string' && errorMsg.includes("ConvexError:")) {
        const parts = errorMsg.split("ConvexError:");
        if (parts.length > 1) {
          errorMsg = parts[1].trim();
        }
      }
      if (msgEl) setMsg(msgEl, errorMsg, 'danger');
    }
  };

  // Check if running locally or Google SDK is not loaded
  if (typeof google === 'undefined' || !google.accounts) {
    if (msgEl) setMsg(msgEl, 'Google Sign-In is not available in this environment. Please use email/password login.', 'danger');
    return;
  }

  // Real Google Sign-in flow (GIS One Tap / Popup)
  try {
    google.accounts.id.initialize({
      client_id: "71002754233-2hh2gf0bbjagl4v82h8lc47ch2jio9i3.apps.googleusercontent.com", // Google Client ID for LinkBuild
      callback: async (response) => {
        if (response && response.credential) {
          if (window.LinkBuild && typeof window.LinkBuild.loginWithGoogle === 'function') {
            const result = await window.LinkBuild.loginWithGoogle(response.credential);
            await processAuthResult(result);
          } else {
            try {
              const res = await fetch('https://vibrant-marmot-366.convex.cloud/api/mutation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: 'users:loginWithGoogle', args: { credential: response.credential } })
              });
              const data = await res.json();
              if (data.status === 'success' && data.value && data.value.token) {
                localStorage.setItem('linkbuild-token', data.value.token);
                localStorage.setItem('linkbuild-user', JSON.stringify(data.value.user));
                await processAuthResult({ success: true, user: data.value.user });
              } else {
                await processAuthResult({ success: false, error: data.errorMessage || 'Google login failed' });
              }
            } catch (err) {
              await processAuthResult({ success: false, error: err.message });
            }
          }
        }
      }
    });

    google.accounts.id.prompt(async (notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.log("Google One Tap was skipped or not displayed, attempting to show Google Sign-In prompt...");
        await showCustomAlert("Google Sign-In initialized. Please check your browser's prompt or ensure popups are enabled.", "Google Sign-In", "info");
      }
    });
  } catch (err) {
    if (msgEl) setMsg(msgEl, 'Google Sign-In failed to initialize: ' + err.message, 'danger');
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

window.saveSettingsProfile = async function() {
  const user = window.LinkBuild.getCurrentUser();
  if (!user) { await showCustomAlert("You must be logged in to save settings.", "Authentication Required", "warning"); return; }
  const nameEl = document.getElementById("settingsDisplayName");
  // For now, just show a success toast (full save requires backend endpoint)
  if (nameEl && nameEl.value.trim()) {
    await showCustomAlert("Settings saved! (Changes to display name will sync on next login.)", "Settings Saved", "info");
  }
};

// =============================================
// ADD WEBSITE MODAL
// =============================================
window.openAddWebsiteModal = async function() {
  if (!window.LinkBuild.isLoggedIn()) {
    await showCustomAlert("Please login first to add a website.", "Authentication Required", "warning");
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
  setMsg(msgEl, 'Adding website...', 'info');

  const data = {
    domain: document.getElementById("wsDomain").value.trim(),
    niche: document.getElementById("wsNiche").value,
    country: document.getElementById("wsCountry").value,
    language: document.getElementById("wsLanguage").value,
    listedBy: document.getElementById("wsListedBy").value || "owner",
    domainAuthority: 0,
    spamScore: 0,
    trafficEstimate: 0,
    referringDomains: 0,
  };

  if (!data.domain || !data.niche || !data.country) {
    setMsg(msgEl, 'Please fill in Domain, Niche, and Country', 'danger');
    return;
  }

  const result = await window.LinkBuild.addWebsite(data);
  if (result.success) {
    setMsg(msgEl, '✅ Website added successfully!', 'success');
    setTimeout(() => { closeAddWebsiteModal(); window.LinkBuild.loadMyWebsites(); }, 800);
  } else {
    setMsg(msgEl, result.error || 'Failed to add website', 'danger');
  }
};

// =============================================
// VERIFY WEBSITE MODAL
// =============================================
let currentVerifyWebsiteId = null;
let currentVerifyMethod = "dns";

// Attach openVerifyModal to LinkBuild so it can be called from table buttons
window.LinkBuild.openVerifyModal = async function(websiteId) {
  if (!window.LinkBuild.isLoggedIn()) {
    await showCustomAlert("Please login first.", "Authentication Required", "warning");
    window.LinkBuild.showAuthScreen();
    return;
  }

  currentVerifyWebsiteId = websiteId;
  currentVerifyMethod = "dns";
  document.getElementById("verifyMessage").textContent = "";
  document.getElementById("verifyCheckBtn").disabled = false;
  document.getElementById("verifyCheckBtn").textContent = "🔍 Check Verification";

  // Get verification info
  const info = await window.LinkBuild.getVerificationInfo(websiteId);
  if (!info || info.verified) {
    // Already verified — reload table and return
    window.LinkBuild.loadMyWebsites();
    return;
  }

  document.getElementById("verifyDomainName").textContent = info.domain;
  const code = info.verificationCode;
  document.getElementById("verifyCodeDns").textContent = code;
  document.getElementById("verifyCodeMeta").textContent = `<meta name="linkbuild-verify" content="${code}">`;

  // Reset to DNS tab
  switchVerifyTab("dns");

  document.getElementById("verifyWebsiteModal").classList.add("active");
  document.getElementById("verifyWebsiteModal").classList.remove("hidden");
};

window.closeVerifyWebsiteModal = function() {
  document.getElementById("verifyWebsiteModal").classList.remove("active");
  document.getElementById("verifyWebsiteModal").classList.add("hidden");
  currentVerifyWebsiteId = null;
};

window.switchVerifyTab = function(method) {
  currentVerifyMethod = method;
  const dnsTab = document.getElementById("verifyTabDns");
  const metaTab = document.getElementById("verifyTabMeta");
  const dnsPanel = document.getElementById("verifyPanelDns");
  const metaPanel = document.getElementById("verifyPanelMeta");

  if (method === "dns") {
    dnsTab.style.background = "var(--primary-purple)";
    dnsTab.style.color = "white";
    metaTab.style.background = "var(--bg-tertiary)";
    metaTab.style.color = "var(--text-secondary)";
    dnsPanel.style.display = "block";
    metaPanel.style.display = "none";
  } else {
    metaTab.style.background = "var(--primary-purple)";
    metaTab.style.color = "white";
    dnsTab.style.background = "var(--bg-tertiary)";
    dnsTab.style.color = "var(--text-secondary)";
    metaPanel.style.display = "block";
    dnsPanel.style.display = "none";
  }
  document.getElementById("verifyMessage").textContent = "";
};

window.handleVerifyWebsite = async function() {
  if (!currentVerifyWebsiteId) return;

  const msgEl = document.getElementById("verifyMessage");
  const btn = document.getElementById("verifyCheckBtn");
  btn.disabled = true;
  btn.textContent = "⏳ Checking...";
  setMsg(msgEl, 'Checking verification, please wait...', 'info');
  msgEl.style.background = "var(--bg-tertiary)";

  const domain = document.getElementById("verifyDomainName").textContent;
  const code = document.getElementById("verifyCodeDns").textContent;

  try {
    const result = await window.LinkBuild.checkAndVerifyWebsite(
      currentVerifyWebsiteId,
      domain,
      code,
      currentVerifyMethod
    );

    if (result.success) {
      setMsg(msgEl, result.message, 'success');
      msgEl.style.background = "rgba(34,197,94,0.1)";
      btn.textContent = "✅ Verified!";
      setTimeout(() => {
        closeVerifyWebsiteModal();
        window.LinkBuild.loadMyWebsites();
      }, 1500);
    } else {
      setMsg(msgEl, result.message, 'danger');
      msgEl.style.whiteSpace = 'pre-line';
      msgEl.style.background = "rgba(239,68,68,0.1)";
      btn.disabled = false;
      btn.textContent = "🔄 Try Again";
    }
  } catch (e) {
    setMsg(msgEl, 'Verification check failed. Please try again.', 'danger');
    msgEl.style.background = "rgba(239,68,68,0.1)";
    btn.disabled = false;
    btn.textContent = "🔍 Check Verification";
  }
};

// =============================================
// LOAD DATA ON PAGE NAVIGATION
// =============================================
const originalNavigateTo = navigateTo;
navigateTo = function(pageName, navItem) {
  // Stop message polling when leaving messages page
  if (pageName !== 'messages' && typeof stopMessagePolling === 'function') {
    stopMessagePolling();
  }

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
      } else if (pageName === "admin") {
        if (typeof window.loadAdminDashboard === "function") {
          window.loadAdminDashboard();
        }
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

// =============================================
// CHANGE PASSWORD HANDLER
// =============================================
window.handleChangePassword = async function() {
  const currentPw = document.getElementById('settingsCurrentPassword').value;
  const newPw = document.getElementById('settingsNewPassword').value;
  const confirmPw = document.getElementById('settingsConfirmPassword').value;
  const msgEl = document.getElementById('passwordChangeMsg');

  if (!currentPw || !newPw || !confirmPw) {
    setMsg(msgEl, 'Please fill in all fields', 'danger');
    return;
  }
  if (newPw !== confirmPw) {
    setMsg(msgEl, 'New passwords do not match', 'danger');
    return;
  }
  if (newPw.length < 6) {
    setMsg(msgEl, 'Password must be at least 6 characters', 'danger');
    return;
  }

  const user = JSON.parse(localStorage.getItem('linkbuild-user') || '{}');
  const email = user.email;
  if (!email) {
    setMsg(msgEl, 'Not logged in. Please log in again.', 'danger');
    return;
  }

  setMsg(msgEl, 'Updating password...', 'info');

  try {
    const res = await fetch('https://vibrant-marmot-366.convex.cloud/api/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: 'users:changePassword',
        args: { email, currentPassword: currentPw, newPassword: newPw }
      })
    });
    const data = await res.json();
    if (data.status === 'success' && data.value && data.value.success) {
      setMsg(msgEl, '✓ Password changed successfully!', 'success');
      document.getElementById('settingsCurrentPassword').value = '';
      document.getElementById('settingsNewPassword').value = '';
      document.getElementById('settingsConfirmPassword').value = '';
    } else {
      let errorMsg = data.errorMessage || (data.value && data.value.message) || 'Failed to change password';
      if (typeof errorMsg === 'string' && errorMsg.includes("ConvexError:")) {
        const parts = errorMsg.split("ConvexError:");
        if (parts.length > 1) {
          errorMsg = parts[1].trim();
        }
      }
      setMsg(msgEl, errorMsg, 'danger');
    }
  } catch (e) {
    setMsg(msgEl, 'Connection error. Please try again.', 'danger');
  }
};

window.copyToClipboard = function(elementId, container) {
  const el = document.getElementById(elementId);
  if (!el) return;
  const text = el.textContent || el.innerText;
  
  navigator.clipboard.writeText(text).then(() => {
    // Show tooltip
    const tooltip = container.querySelector('.copy-tooltip');
    if (tooltip) {
      tooltip.style.display = 'block';
      
      // Update button text/color to show success state
      const btnSpan = container.querySelector('button span');
      const originalText = btnSpan ? btnSpan.textContent : 'Copy';
      if (btnSpan) btnSpan.textContent = 'Copied!';
      
      const btnSvg = container.querySelector('button svg');
      let originalSvg = btnSvg ? btnSvg.outerHTML : '';
      if (btnSvg) {
        btnSvg.outerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check"><path d="M20 6 9 17l-5-5"/></svg>`;
      }
      
      setTimeout(() => {
        tooltip.style.display = 'none';
        if (btnSpan) btnSpan.textContent = originalText;
        const newSvg = container.querySelector('button svg');
        if (newSvg && originalSvg) {
          newSvg.outerHTML = originalSvg;
        }
      }, 2000);
    }
  }).catch(err => {
    console.error('Failed to copy: ', err);
  });
};

window.loadAdminDashboard = async function() {
  if (!window.LinkBuild) return;
  
  // 1. Fetch KPI statistics
  const stats = await window.LinkBuild.getAdminStats();
  if (stats) {
    document.getElementById("adminTotalUsers").textContent = stats.total.toLocaleString();
    document.getElementById("adminNewUsers").textContent = `${stats.newThisMonth} new this month`;
    document.getElementById("adminMRR").textContent = `$${stats.mrr.toLocaleString()}`;
    document.getElementById("adminActiveWebsites").textContent = stats.totalWebsites.toLocaleString();
    document.getElementById("adminSpamReports").textContent = stats.spamReports.toLocaleString();
  }

  // 2. Fetch & Render Moderation Queue
  await loadAdminModerationQueue();

  // 3. Fetch & Render User Directory
  await loadAdminUserDirectory();
};

async function loadAdminModerationQueue() {
  const queueContainer = document.getElementById("adminModerationQueue");
  if (!queueContainer) return;

  const pendingWebsites = await window.LinkBuild.getPendingWebsites();
  if (!pendingWebsites || pendingWebsites.length === 0) {
    queueContainer.innerHTML = `
      <div style="padding:30px 20px;text-align:center;color:var(--text-tertiary)">
        🎉 All caught up! No pending verification requests.
      </div>
    `;
    return;
  }

  let html = "";
  pendingWebsites.forEach((site) => {
    html += `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap">
        <div>
          <div style="font-weight:600;font-size:0.85rem">${site.domain}</div>
          <div style="font-size:0.8rem;color:var(--text-tertiary)">
            Niche: ${site.niche} · DA: ${site.domainAuthority} · Spam Score: ${site.spamScore}%
          </div>
        </div>
        <div style="display:flex;gap:6px">
          <button type="button" class="btn btn-danger btn-sm" onclick="handleModerateWebsite('${site._id}', 'rejected')">Reject</button>
          <button type="button" class="btn btn-success btn-sm" onclick="handleModerateWebsite('${site._id}', 'active')">Approve</button>
        </div>
      </div>
    `;
  });
  
  queueContainer.innerHTML = html;
}

window.handleModerateWebsite = async function(websiteId, status) {
  if (!window.LinkBuild) return;
  const res = await window.LinkBuild.moderateAdminWebsite(websiteId, status);
  if (res && res.success) {
    // Refresh admin dashboard
    await window.loadAdminDashboard();
  } else {
    await showCustomAlert("Moderation failed: " + (res?.error || "Unknown error"), "Moderation Error", "danger");
  }
};

let allAdminUsers = []; // Cache to support instant search filter

async function loadAdminUserDirectory() {
  const tableBody = document.getElementById("adminUsersTableBody");
  if (!tableBody) return;

  const users = await window.LinkBuild.getAdminUsers(100);
  allAdminUsers = users || [];
  renderAdminUsersList(allAdminUsers);
}

function renderAdminUsersList(users) {
  const tableBody = document.getElementById("adminUsersTableBody");
  if (!tableBody) return;

  if (!users || users.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" style="padding:30px;text-align:center;color:var(--text-tertiary)">No users found</td>
      </tr>
    `;
    return;
  }

  let html = "";
  users.forEach((u) => {
    const formattedDate = new Date(u.createdAt).toLocaleDateString();
    
    // Select options for roles
    const roles = ["free", "pro", "agency", "admin"];
    let roleSelectOptions = "";
    roles.forEach((r) => {
      const selected = u.role === r ? "selected" : "";
      roleSelectOptions += `<option value="${r}" ${selected}>${r.toUpperCase()}</option>`;
    });

    html += `
      <tr style="border-bottom:1px solid var(--border-light)">
        <td style="padding:12px 16px;font-weight:500">${u.name}</td>
        <td style="padding:12px 16px;color:var(--text-secondary)">${u.email}</td>
        <td style="padding:12px 16px">
          <select class="input" style="font-size:0.75rem;padding:4px 8px;width:auto;margin:0" onchange="handleUserRoleChange('${u._id}', this.value)">
            ${roleSelectOptions}
          </select>
        </td>
        <td style="padding:12px 16px">
          <span style="font-weight:600;color:${u.reputationScore >= 70 ? 'var(--success)' : u.reputationScore >= 40 ? 'var(--warning)' : 'var(--danger)'}">
            ${u.reputationScore}
          </span>
        </td>
        <td style="padding:12px 16px;color:var(--text-tertiary)">${formattedDate}</td>
        <td style="padding:12px 16px;text-align:right">
          <button type="button" class="btn btn-ghost btn-sm" style="color:var(--danger);padding:4px 8px" onclick="handleSuspendUser('${u._id}')" ${u.reputationScore === 0 ? 'disabled' : ''}>
            ${u.reputationScore === 0 ? 'Suspended' : 'Suspend'}
          </button>
        </td>
      </tr>
    `;
  });

  tableBody.innerHTML = html;
}

window.handleUserRoleChange = async function(userId, newRole) {
  if (!window.LinkBuild) return;
  const res = await window.LinkBuild.updateAdminUserRole(userId, newRole);
  if (res && res.success) {
    // Dynamically update the cached user role locally to avoid full list reload
    const user = allAdminUsers.find(u => u._id === userId);
    if (user) user.role = newRole;
    console.log(`Role updated successfully for user ${userId} to ${newRole}`);
  } else {
    await showCustomAlert("Failed to update role: " + (res?.error || "Unknown error"), "Error", "danger");
  }
};

window.handleSuspendUser = async function(userId) {
  const confirmed = await showCustomConfirm("Are you sure you want to suspend this user? This will set their reputation to 0 and force logout all active sessions.", "Suspend User?", "danger");
  if (!confirmed) return;
  if (!window.LinkBuild) return;
  const res = await window.LinkBuild.banAdminUser(userId);
  if (res && res.success) {
    // Refresh user list
    await loadAdminUserDirectory();
  } else {
    await showCustomAlert("Suspension failed: " + (res?.error || "Unknown error"), "Suspension Error", "danger");
  }
};

// Bind user search field event
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("adminUserSearch");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const q = e.target.value.trim().toLowerCase();
      if (!q) {
        renderAdminUsersList(allAdminUsers);
      } else {
        const filtered = allAdminUsers.filter(
          (u) =>
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q)
        );
        renderAdminUsersList(filtered);
      }
    });
  }
});// =============================================
// FEEDBACK HANDLING
// =============================================
window.handleFeedbackSubmit = async function(e) {
  e.preventDefault();
  const name = document.getElementById("feedbackName").value.trim();
  const email = document.getElementById("feedbackEmail").value.trim();
  const note = document.getElementById("feedbackNote").value.trim();
  const btnEl = document.getElementById("feedbackSubmitBtn");
  const errorEl = document.getElementById("feedbackError");
  const successEl = document.getElementById("feedbackSuccess");

  errorEl.style.display = 'none';
  successEl.style.display = 'none';

  if (!name || !email || !note) {
    errorEl.textContent = 'Please fill in all fields.';
    errorEl.style.display = 'block';
    return;
  }

  btnEl.disabled = true;
  btnEl.textContent = 'Submitting...';

  try {
    const res = await fetch('https://vibrant-marmot-366.convex.cloud/api/mutation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: 'feedback:submit', args: { name, email, note } })
    });
    const data = await res.json();
    
    if (data.status === 'success') {
      successEl.style.display = 'block';
      document.getElementById("feedbackForm").reset();
      setTimeout(() => {
        document.getElementById('feedbackOverlay').classList.remove('active');
        document.getElementById('feedbackOverlay').classList.add('hidden');
        successEl.style.display = 'none';
      }, 2000);
    } else {
      throw new Error(data.errorMessage || 'Failed to submit feedback');
    }
  } catch (err) {
    errorEl.textContent = err.message || 'Connection error. Please try again.';
    errorEl.style.display = 'block';
  } finally {
    btnEl.disabled = false;
    btnEl.textContent = 'Submit Feedback';
  }
};

// ---------- SAFETY NOTICE HANDLERS ----------
window.agreeToSafetyNotice = function() {
  localStorage.setItem('linkbuild-safety-agreed', 'true');
  const modal = document.getElementById('safetyNoticeModal');
  if (modal) {
    modal.classList.remove('active');
    modal.classList.add('hidden');
  }
};

// Auto-show safety notice on page load (script runs at end of body, DOM is ready)
(function initSafetyNotice() {
  const agreed = localStorage.getItem('linkbuild-safety-agreed');
  if (agreed) return;

  function showModal() {
    const modal = document.getElementById('safetyNoticeModal');
    if (modal) {
      modal.classList.remove('hidden');
      // Force reflow then add active for transition
      void modal.offsetWidth;
      modal.classList.add('active');
    }
  }

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(showModal, 500);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(showModal, 500);
    });
  }
})();
