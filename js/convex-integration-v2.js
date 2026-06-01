/* =============================================
   LinkBuild — Convex Integration Layer
   Email Auth + All Backend Functions
   ============================================= */

const DEFAULT_CONVEX_URL = "https://vibrant-marmot-366.convex.cloud";
const CONVEX_URL = "__CONVEX_URL__";
const INACTIVITY_LOGOUT_MS = 10 * 60 * 1000; // 10 minutes

// We import ConvexClient from the import map
let client;

async function initClient() {
  // Use the global convex from the browser bundle (IIFE script tag)
  if (typeof convex === "undefined" || !convex.ConvexClient) {
    console.error("Convex: Browser bundle not loaded. Make sure the convex script tag is present.");
    return;
  }
  
  client = new convex.ConvexClient(CONVEX_URL === "__CONVEX_URL__" || !CONVEX_URL ? DEFAULT_CONVEX_URL : CONVEX_URL);
  init();
}

// =============================================
// AUTH STATE
// =============================================
let currentUser = null;
let currentToken = null;
let inactivityTimer = null;
let activityEventsBound = false;

function clearInactivityTimer() {
  if (inactivityTimer) {
    window.clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
}

function resetInactivityTimer() {
  if (!currentUser) return;
  clearInactivityTimer();
  inactivityTimer = window.setTimeout(() => {
    logoutDueToInactivity();
  }, INACTIVITY_LOGOUT_MS);
}

function bindInactivityEvents() {
  if (activityEventsBound) return;
  const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
  events.forEach((eventName) => window.addEventListener(eventName, resetInactivityTimer, { passive: true }));
  activityEventsBound = true;
}

function startInactivityWatcher() {
  if (!currentUser) return;
  bindInactivityEvents();
  resetInactivityTimer();
}

function stopInactivityWatcher() {
  clearInactivityTimer();
}

function logoutDueToInactivity() {
  if (!currentUser) return;
  stopInactivityWatcher();
  alert("You have been logged out after 10 minutes of inactivity for security reasons.");
  logout();
}

function getUserId() {
  if (currentUser && currentUser.userId) return currentUser.userId;
  const stored = localStorage.getItem("linkbuild-user");
  if (stored) {
    try { currentUser = JSON.parse(stored); return currentUser.userId; }
    catch (e) { /* ignore */ }
  }
  return null;
}

function getSessionToken() {
  if (currentToken) return currentToken;
  return localStorage.getItem("linkbuild-token");
}

function saveUser(user, token) {
  currentUser = user;
  currentToken = token;
  localStorage.setItem("linkbuild-user", JSON.stringify(user));
  if (token) {
    localStorage.setItem("linkbuild-token", token);
  }
  startInactivityWatcher();
}

function clearUser() {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem("linkbuild-user");
  localStorage.removeItem("linkbuild-token");
  stopInactivityWatcher();
}

// =============================================
// AUTH FUNCTIONS
// =============================================
async function signup(name, email, password) {
  if (!client) {
    return { success: false, error: "Connection not ready. Please refresh the page and try again." };
  }
  try {
    const result = await client.mutation("users:signupWithPassword", { name, email, password });
    if (result.token) {
      saveUser(result.user, result.token);
      updateAuthUI(result.user);
      
      // Redirect to dashboard based on role if on landing page
      const path = window.location.pathname;
      if (!path.includes("dashboard") && !path.includes("dashboard.html")) {
        if (result.user.role === "admin") {
          console.log("Admin logged in. Redirecting to admin workspace...");
        } else {
          console.log("User logged in. Redirecting to dashboard...");
        }
        // Close login modal before redirecting
        const overlay = document.getElementById('authOverlay');
        if (overlay) { overlay.classList.remove('active'); overlay.classList.add('hidden'); }
        window.location.href = getDashboardUrl();
      }
      return { success: true, user: result.user };
    }
    return { success: false, error: "Signup failed" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function login(email, password) {
  if (!client) {
    return { success: false, error: "Connection not ready. Please refresh the page and try again." };
  }
  try {
    const result = await client.mutation("users:loginWithPassword", { email, password });
    if (result.token) {
      saveUser(result.user, result.token);
      updateAuthUI(result.user);
      
      // Redirect to dashboard based on role if on landing page
      const path = window.location.pathname;
      if (!path.includes("dashboard") && !path.includes("dashboard.html")) {
        if (result.user.role === "admin") {
          console.log("Admin logged in. Redirecting to admin workspace...");
        } else {
          console.log("User logged in. Redirecting to dashboard...");
        }
        // Close login modal before redirecting
        const overlay = document.getElementById('authOverlay');
        if (overlay) { overlay.classList.remove('active'); overlay.classList.add('hidden'); }
        window.location.href = getDashboardUrl();
      }
      return { success: true, user: result.user };
    }
    return { success: false, error: "Login failed" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

function logout() {
  clearUser();
  updateAuthUI(null);
  handleLoggedOutRedirect();
}

function getLandingUrl(params) {
  // On Vercel (clean URLs), origin is the root /
  // Locally (file:// or simple server), we need index.html
  const base = window.location.origin;
  const isCleanUrl = !window.location.pathname.includes(".html");
  const loginParam = params ? "?auth=" + params : "";
  
  if (isCleanUrl) {
    return "/" + loginParam;                   // Vercel: /  or /?auth=login
  } else {
    return "index.html" + loginParam;          // Local: index.html?auth=login
  }
}

function getDashboardUrl() {
  const isCleanUrl = !window.location.pathname.includes(".html");
  return isCleanUrl ? "/dashboard" : "dashboard.html";
}

function handleLoggedOutRedirect() {
  const path = window.location.pathname;
  if (path.includes("dashboard") || path.includes("dashboard.html")) {
    window.location.href = getLandingUrl("login");
  } else {
    // On landing page: check if URL params request showing auth modal
    const params = new URLSearchParams(window.location.search);
    if (params.get("auth") === "login" || params.get("auth") === "signup") {
      showAuthScreen();
      if (window.switchAuthTab) {
        window.switchAuthTab(params.get("auth"));
      }
    } else {
      hideAuthScreen();
    }
  }
}

function updateAuthUI(user) {
  const footer = document.getElementById("sidebarFooter");
  const topbarAvatar = document.getElementById("topbarUserAvatar");
  const dashboardSubtitle = document.getElementById("dashboardSubtitle");
  const authModalClose = document.querySelector("#authOverlay .modal-close");
  const adminLink = document.getElementById("sidebarAdminLink");
  const landingAuthBtn = document.getElementById("landingAuthBtn");
  const landingHeroCta = document.getElementById("landingHeroCta");

  if (user) {
    const initials = user.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
    const roleLabel = user.role === "free" ? "Free Plan" : user.role === "pro" ? "Pro Plan" : user.role === "admin" ? "Admin Plan" : "Agency Plan";

    if (footer) {
      footer.innerHTML = `
        <div class="sidebar-user" style="display:flex;align-items:center;justify-content:space-between;width:100%">
          <div style="display:flex;align-items:center;gap:12px;overflow:hidden">
            <div class="sidebar-user-avatar" id="sidebarUserAvatar" style="flex-shrink:0">${initials}</div>
            <div class="sidebar-user-info" style="overflow:hidden">
              <div class="sidebar-user-name" id="sidebarUserName" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${user.name}</div>
              <div class="sidebar-user-role" id="sidebarUserRole">${roleLabel}</div>
            </div>
          </div>
          <button class="btn btn-ghost btn-sm" onclick="window.LinkBuild.logout()" title="Logout" style="padding:4px;min-width:auto;color:var(--text-tertiary);margin-left:auto;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      `;
    }

    if (topbarAvatar) {
      topbarAvatar.style.borderRadius = "50%";
      topbarAvatar.style.width = "34px";
      topbarAvatar.style.height = "34px";
      topbarAvatar.style.padding = "";
      topbarAvatar.style.background = "";
      topbarAvatar.style.color = "";
      topbarAvatar.style.fontWeight = "";
      topbarAvatar.style.display = "";
      topbarAvatar.textContent = initials;
      topbarAvatar.title = user.name + " — Click to view profile";
    }

    // Also populate the profile dropdown header
    if (typeof updateProfileDropdown === "function") {
      updateProfileDropdown(user);
    } else if (window.updateProfileDropdown) {
      window.updateProfileDropdown(user);
    }

    if (dashboardSubtitle) {
      dashboardSubtitle.innerHTML = "Welcome back, " + user.name.split(" ")[0] + ". Here's your link exchange overview.";
    }

    if (authModalClose) {
      authModalClose.style.display = ""; // Show close button
    }

    if (adminLink) {
      if (user.role === "admin") {
        adminLink.style.display = ""; // Show admin link
      } else {
        adminLink.style.display = "none"; // Hide admin link
      }
    }

    if (landingAuthBtn) {
      landingAuthBtn.textContent = "Dashboard";
      landingAuthBtn.onclick = () => window.location.href = getDashboardUrl();
      landingAuthBtn.style.padding = "10px 24px";
    }
    if (landingHeroCta) {
      landingHeroCta.textContent = "Go to Dashboard";
      landingHeroCta.onclick = () => window.location.href = getDashboardUrl();
    }
  } else {
    // Logged out / Not logged in
    if (footer) {
      footer.innerHTML = `
        <div style="width:100%">
          <button class="btn btn-primary" onclick="window.LinkBuild.showAuthScreen()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Login / Sign Up
          </button>
        </div>
      `;
    }

    if (topbarAvatar) {
      topbarAvatar.style.borderRadius = "6px";
      topbarAvatar.style.width = "auto";
      topbarAvatar.style.height = "34px";
      topbarAvatar.style.padding = "0 16px";
      topbarAvatar.style.background = "var(--primary-gradient)";
      topbarAvatar.style.color = "white";
      topbarAvatar.style.fontWeight = "600";
      topbarAvatar.style.display = "flex";
      topbarAvatar.style.alignItems = "center";
      topbarAvatar.style.justifyContent = "center";
      topbarAvatar.innerHTML = `Login`;
      topbarAvatar.title = "Click to Login / Sign Up";
    }

    if (dashboardSubtitle) {
      dashboardSubtitle.innerHTML = "Welcome to LinkBuild. Please log in to see your overview.";
    }

    if (authModalClose) {
      // On landing page: always show close button so user can dismiss modal
      // On dashboard: hide close button (user must login to proceed)
      const onLanding = !window.location.pathname.includes("dashboard");
      authModalClose.style.display = onLanding ? "flex" : "none";
    }

    if (adminLink) {
      adminLink.style.display = "none"; // Hide admin link when logged out
    }

    if (landingAuthBtn) {
      landingAuthBtn.textContent = "Login";
      landingAuthBtn.onclick = () => { showAuthScreen(); if (window.switchAuthTab) window.switchAuthTab("login"); };
      landingAuthBtn.style.padding = "10px 24px";
    }
    if (landingHeroCta) {
      landingHeroCta.textContent = "Get Started - Free";
      landingHeroCta.onclick = () => { showAuthScreen(); if (window.switchAuthTab) window.switchAuthTab("signup"); };
    }
  }
}

function showAuthScreen() {
  const el = document.getElementById("authOverlay");
  if (!el) return;
  el.classList.add("active");
  el.classList.remove("hidden");

  const onDashboard = window.location.pathname.includes("dashboard");

  // Close button: always show on landing page, hide on dashboard (until logged in)
  const closeBtn = el.querySelector(".modal-close");
  if (closeBtn) {
    closeBtn.style.display = onDashboard ? "none" : "flex";
  }

  // Backdrop click: close on landing page, not on dashboard
  el._backdropHandler = function(e) {
    if (e.target === el && !onDashboard) {
      hideAuthScreen();
    }
  };
  el.removeEventListener("click", el._backdropHandler);
  el.addEventListener("click", el._backdropHandler);
}

function hideAuthScreen() {
  const el = document.getElementById("authOverlay");
  if (el) {
    el.classList.remove("active");
    el.classList.add("hidden");
    if (el._backdropHandler) {
      el.removeEventListener("click", el._backdropHandler);
    }
  }
}

function isLoggedIn() {
  return !!getUserId();
}

function getCurrentUser() {
  return currentUser || JSON.parse(localStorage.getItem("linkbuild-user") || "null");
}

// =============================================
// DASHBOARD DATA
// =============================================
async function loadDashboardData() {
  try {
    const kpis = await client.query("analytics:dashboardKpis", {});
    if (kpis) updateKpiCards(kpis);
    const activity = await client.query("analytics:exchangeActivity", { months: 6 });
    if (activity) updateExchangeChart(activity);
    const backlinkStats = await client.query("backlinks:stats", {});
    if (backlinkStats) updateBacklinkStats(backlinkStats);
    const uid = getUserId();
    if (uid) {
      const unreadCount = await client.query("notifications:unreadCount", { userId: uid });
      if (unreadCount !== undefined) updateNotificationBadge(unreadCount);

      // Load dashboard widgets
      const convs = await client.query('messages:listConversations', { userId: uid });
      if (convs) {
        allConversations = convs;
        renderDashboardWidgets(convs);
      }

      const websites = await client.query("websites:list", { limit: 5 });
      if (websites) {
        renderDashboardOpportunities(websites);
      }
    }
  } catch (e) {
    console.log("📊 Using demo data:", e.message);
  }
}

// =============================================
// WEBSITES
// =============================================
async function loadMyWebsites() {
  const uid = getUserId();
  if (!uid) return [];
  try {
    const sites = await client.query("websites:listByOwner", { userId: uid });
    updateWebsitesTable(sites);
    return sites;
  } catch (e) {
    console.log("📋 Websites:", e.message);
    return [];
  }
}

async function addWebsite(data) {
  const uid = getUserId();
  if (!uid) return { success: false, error: "Please login first" };
  try {
    const websiteId = await client.mutation("websites:add", { ...data, userId: uid });
    return { success: true, websiteId };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =============================================
// MARKETPLACE
// =============================================
async function loadMarketplace(filters = {}) {
  try {
    const websites = await client.query("websites:list", { ...filters, limit: 20 });
    updateMarketplaceTable(websites);
    // Update results count
    const label = document.getElementById('marketplaceResultsLabel');
    if (label) label.textContent = websites && websites.length ? `${websites.length} Results` : '0 Results';
    return websites;
  } catch (e) {
    console.log("🏪 Marketplace:", e.message);
    return null;
  }
}

// Marketplace search
function searchMarketplace() {
  const query = document.getElementById('marketplaceSearchInput')?.value?.trim() || '';
  if (query) {
    loadMarketplace({ search: query, limit: 50 });
  } else {
    loadMarketplace();
  }
}
window.searchMarketplace = searchMarketplace;

// =============================================
// EXCHANGE REQUESTS
// =============================================
async function loadExchangeRequests() {
  const uid = getUserId();
  if (!uid) return null;
  try {
    const kanban = await client.query("exchanges:listKanban", { userId: uid });
    if (kanban) updateKanbanBoard(kanban);
    return kanban;
  } catch (e) { return null; }
}

async function sendExchangeRequest(data) {
  const uid = getUserId();
  if (!uid) return { success: false, error: "Please login first" };
  try {
    return { success: true, id: await client.mutation("exchanges:send", { ...data, fromUserId: uid }) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

// =============================================
// MESSAGES — Full Real-time Chat System
// =============================================

// State
let currentConversationId = null;
let currentReceiverId = null;
let currentExchangeId = null;
let currentConversationExchange = null;
let allConversations = [];
let msgPollingTimer = null;
let lastMsgCount = 0;

const AVATAR_COLORS = ['#6C4DF6','#10B981','#3B82F6','#F59E0B','#EF4444','#8B5CF6','#EC4899','#0F4C81'];
function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}
function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return mins + 'm';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h';
  return Math.floor(hrs / 24) + 'd';
}

async function loadConversations() {
  const uid = getUserId();
  if (!uid) return null;
  try {
    const convs = await client.query('messages:listConversations', { userId: uid });
    allConversations = convs || [];
    renderConversationsList(allConversations);
    return allConversations;
  } catch (e) {
    console.log('💬 Conversations:', e.message);
    // Hide loading, show empty
    const loading = document.getElementById('convsLoading');
    const empty = document.getElementById('convsEmpty');
    if (loading) loading.style.display = 'none';
    if (empty) empty.style.display = '';
    return null;
  }
}

function renderConversationsList(conversations) {
  const inner = document.getElementById('convsListInner');
  const loading = document.getElementById('convsLoading');
  const empty = document.getElementById('convsEmpty');
  if (!inner) return;

  if (loading) loading.style.display = 'none';

  if (!conversations || conversations.length === 0) {
    inner.innerHTML = '';
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  inner.innerHTML = conversations.map(conv => {
    const name = conv.otherUser?.name || 'Unknown User';
    const initials = getInitials(name);
    const color = getAvatarColor(name);
    const preview = conv.lastMessage ? conv.lastMessage.slice(0, 55) + (conv.lastMessage.length > 55 ? '...' : '') : 'No messages yet';
    const time = timeAgo(conv.lastMessageAt);
    const isActive = conv._id === currentConversationId;
    const unread = conv.unreadCount || 0;

    return `
      <div class="conversation-item${isActive ? ' active' : ''}" 
           onclick="window.LinkBuild.openConversation('${conv._id}', '${conv.otherUser?._id || ''}', '${name.replace(/'/g, "\\'")}')"
           style="cursor:pointer">
        <div class="conversation-avatar" style="background:${color};position:relative">
          ${initials}
          ${unread > 0 ? `<span style="position:absolute;top:-3px;right:-3px;background:var(--danger);color:white;font-size:0.6rem;font-weight:700;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg-primary)">${unread > 9 ? '9+' : unread}</span>` : ''}
        </div>
        <div class="conversation-info">
          <div class="conversation-name">${name}</div>
          <div class="conversation-preview">${preview}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
          <div class="conversation-time">${time}</div>
          ${unread > 0 ? `<span style="background:var(--primary-purple);border-radius:10px;color:white;font-size:0.65rem;font-weight:700;padding:1px 6px">${unread}</span>` : ''}
        </div>
      </div>`;
  }).join('');
}

function filterConversations(query) {
  if (!query.trim()) {
    renderConversationsList(allConversations);
    return;
  }
  const q = query.toLowerCase();
  const filtered = allConversations.filter(c =>
    (c.otherUser?.name || '').toLowerCase().includes(q) ||
    (c.lastMessage || '').toLowerCase().includes(q)
  );
  renderConversationsList(filtered);
}

async function openConversation(conversationId, otherUserId, otherUserName) {
  currentConversationId = conversationId;
  currentReceiverId = otherUserId;

  // Mobile: show chat area
  if (window.innerWidth <= 900) openMobileChat();

  // Update header
  const initials = getInitials(otherUserName);
  const color = getAvatarColor(otherUserName);
  const avatarEl = document.getElementById('chatHeaderAvatar');
  const nameEl = document.getElementById('chatHeaderName');
  const subEl = document.getElementById('chatHeaderSub');
  if (avatarEl) { avatarEl.textContent = initials; avatarEl.style.background = color; }
  if (nameEl) nameEl.textContent = otherUserName;
  if (subEl) subEl.textContent = 'Exchange Partner';

  // Show active chat, hide placeholder
  document.getElementById('chatPlaceholder').style.display = 'none';
  const activeEl = document.getElementById('chatActive');
  if (activeEl) { activeEl.style.display = 'flex'; }

  // Show loading in messages
  const msgsEl = document.getElementById('chatMessages');
  if (msgsEl) msgsEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary);font-size:0.85rem">Loading messages...</div>';

  // Highlight active conversation in list
  document.querySelectorAll('.conversation-item').forEach(el => el.classList.remove('active'));
  const convItems = document.querySelectorAll('#convsListInner .conversation-item');
  convItems.forEach(el => {
    if (el.getAttribute('onclick') && el.getAttribute('onclick').includes(conversationId)) {
      el.classList.add('active');
    }
  });

  // Find conversation data
  const conv = allConversations.find(c => c._id === conversationId);
  currentExchangeId = conv?.exchangeId || null;
  currentConversationExchange = null;

  // Load exchange details in panel if linked
  if (currentExchangeId) {
    document.getElementById('chatViewExchangeBtn').style.display = '';
    loadExchangeDetails(currentExchangeId);
  } else {
    document.getElementById('chatViewExchangeBtn').style.display = 'none';
    document.getElementById('panelNoExchange').style.display = '';
    document.getElementById('panelExchangeDetails').style.display = 'none';
  }

  // Fetch and render messages
  await fetchAndRenderMessages();

  // Mark as read
  try {
    const token = getSessionToken();
    const uid = getUserId();
    await client.mutation('messages:markRead', { conversationId, token, userId: uid });
    // Refresh conversation list to clear unread badge
    loadConversations();
  } catch(e) { /* silent */ }

  // Start polling for new messages
  startMessagePolling();

  // Bind send handlers
  bindSendHandlers();
}

async function fetchAndRenderMessages() {
  if (!currentConversationId) return;
  try {
    const msgs = await client.query('messages:listMessages', { conversationId: currentConversationId, limit: 100 });
    renderMessages(msgs || []);
    lastMsgCount = (msgs || []).length;
  } catch(e) {
    const msgsEl = document.getElementById('chatMessages');
    if (msgsEl) msgsEl.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-tertiary);font-size:0.85rem">Could not load messages.</div>';
  }
}

function renderMessages(messages) {
  const msgsEl = document.getElementById('chatMessages');
  if (!msgsEl) return;
  const uid = getUserId();

  if (!messages || messages.length === 0) {
    msgsEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);gap:8px">
        <div style="font-size:2.5rem">👋</div>
        <div style="font-weight:600">Start the conversation!</div>
        <div style="font-size:0.85rem">Send a message to begin negotiating your link exchange.</div>
      </div>`;
    return;
  }

  let lastDate = null;
  const html = messages.map(msg => {
    const isSent = msg.senderId === uid;
    const msgDate = new Date(msg.createdAt).toLocaleDateString();
    let dateSep = '';
    if (msgDate !== lastDate) {
      lastDate = msgDate;
      const today = new Date().toLocaleDateString();
      const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
      const label = msgDate === today ? 'Today' : msgDate === yesterday ? 'Yesterday' : msgDate;
      dateSep = `<div style="text-align:center;margin:12px 0;font-size:0.75rem;color:var(--text-tertiary)"><span style="background:var(--bg-tertiary);padding:3px 10px;border-radius:10px">${label}</span></div>`;
    }
    const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const readTick = isSent ? (msg.read ? ' <span style="color:var(--primary-purple);font-size:0.7rem">✓✓</span>' : ' <span style="color:var(--text-tertiary);font-size:0.7rem">✓</span>') : '';

    return `${dateSep}<div class="chat-bubble ${isSent ? 'sent' : 'received'}" style="position:relative">
      ${msg.text}
      <span style="font-size:0.65rem;opacity:0.6;margin-left:8px;white-space:nowrap">${time}${readTick}</span>
    </div>`;
  }).join('');

  msgsEl.innerHTML = html;
  // Scroll to bottom
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

let sendInProgress = false;
let handlersAttached = false;

function bindSendHandlers() {
  if (handlersAttached) return;
  handlersAttached = true;

  const sendBtn = document.getElementById('msgSendBtn');
  const input = document.getElementById('msgInput');

  if (sendBtn) {
    sendBtn.addEventListener('click', doSendMessage);
  }
  if (input) {
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        doSendMessage();
      }
    });
  }
}

async function doSendMessage() {
  if (sendInProgress) return;
  const input = document.getElementById('msgInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text || !currentConversationId || !currentReceiverId) return;

  sendInProgress = true;
  input.value = '';
  input.disabled = true;

  // Optimistic UI: append bubble immediately
  const msgsEl = document.getElementById('chatMessages');
  if (msgsEl) {
    // Remove empty state if present
    if (msgsEl.querySelector('div[style*="height:100%"]')) msgsEl.innerHTML = '';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const bubble = document.createElement('div');
    bubble.className = 'chat-bubble sent';
    bubble.id = 'optimistic-msg';
    bubble.innerHTML = `${text} <span style="font-size:0.65rem;opacity:0.6;margin-left:8px">Sending...</span>`;
    msgsEl.appendChild(bubble);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  try {
    const uid = getUserId();
    const token = getSessionToken();
    await client.mutation('messages:send', {
      conversationId: currentConversationId,
      receiverId: currentReceiverId,
      text,
      exchangeId: currentExchangeId || undefined,
      senderId: uid || undefined,
      token: token || undefined,
    });
    // Remove optimistic bubble and re-fetch to get proper state
    await fetchAndRenderMessages();
    // Refresh conversations list
    await loadConversations();
  } catch(e) {
    console.error('Send failed:', e);
    // Remove optimistic bubble
    const opt = document.getElementById('optimistic-msg');
    if (opt) opt.remove();
    // Show error toast
    showMsgToast('❌ Failed to send. Please try again.', 'danger');
  }

  input.disabled = false;
  input.focus();
  sendInProgress = false;
}

function showMsgToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--bg-secondary);border:1px solid var(--border-primary);padding:10px 20px;border-radius:8px;font-size:0.85rem;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);color:var(--${type === 'danger' ? 'danger' : 'text-primary'})`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function startMessagePolling() {
  stopMessagePolling();
  msgPollingTimer = setInterval(async () => {
    if (!currentConversationId) return;
    try {
      const msgs = await client.query('messages:listMessages', { conversationId: currentConversationId, limit: 100 });
      if (msgs && msgs.length !== lastMsgCount) {
        lastMsgCount = msgs.length;
        renderMessages(msgs);
        // Also refresh unread badge on conversations
        loadConversations();
        // Mark as read
        const token = getSessionToken();
        const uid = getUserId();
        client.mutation('messages:markRead', { conversationId: currentConversationId, token, userId: uid }).catch(() => {});
      }
    } catch(e) { /* silent */ }
  }, 2500);
}

function stopMessagePolling() {
  if (msgPollingTimer) { clearInterval(msgPollingTimer); msgPollingTimer = null; }
}

async function loadExchangeDetails(exchangeId) {
  try {
    const ex = await client.query('exchanges:listByUser', { userId: getUserId() });
    const found = (ex || []).find(e => e._id === exchangeId);
    if (!found) {
      document.getElementById('panelNoExchange').style.display = '';
      document.getElementById('panelExchangeDetails').style.display = 'none';
      return;
    }
    currentConversationExchange = found;
    renderExchangePanel(found);
  } catch(e) {
    document.getElementById('panelNoExchange').style.display = '';
    document.getElementById('panelExchangeDetails').style.display = 'none';
  }
}

function renderExchangePanel(ex) {
  document.getElementById('panelNoExchange').style.display = 'none';
  document.getElementById('panelExchangeDetails').style.display = '';

  const uid = getUserId();
  const isFromUser = ex.fromUserId === uid;

  document.getElementById('panelFromDomain').textContent = isFromUser
    ? (ex.fromWebsite?.domain || 'Your Website')
    : (ex.toWebsite?.domain || 'Partner Website');
  document.getElementById('panelFromStats').textContent = isFromUser
    ? `DA ${ex.fromWebsite?.da || '?'}`
    : `DA ${ex.toWebsite?.da || '?'}`;
  document.getElementById('panelToDomain').textContent = isFromUser
    ? (ex.toWebsite?.domain || 'Partner Website')
    : (ex.fromWebsite?.domain || 'Your Website');
  document.getElementById('panelToStats').textContent = isFromUser
    ? `DA ${ex.toWebsite?.da || '?'}`
    : `DA ${ex.fromWebsite?.da || '?'}`;

  const statusMap = {
    new: { label: 'New Request', cls: 'badge-neutral' },
    negotiating: { label: 'Negotiating', cls: 'badge-warning' },
    accepted: { label: 'Accepted', cls: 'badge-success' },
    completed: { label: 'Completed ✓', cls: 'badge-success' },
    rejected: { label: 'Declined', cls: 'badge-danger' },
  };
  const statusInfo = statusMap[ex.status] || { label: ex.status, cls: 'badge-neutral' };
  const badge = document.getElementById('panelStatusBadge');
  badge.textContent = statusInfo.label;
  badge.className = `badge ${statusInfo.cls}`;

  // Show relevant deal action buttons based on status and user role
  const acceptBtn = document.getElementById('panelAcceptBtn');
  const completeBtn = document.getElementById('panelCompleteBtn');
  const negotiateBtn = document.getElementById('panelNegotiateBtn');
  const rejectBtn = document.getElementById('panelRejectBtn');

  // Hide all first
  [acceptBtn, completeBtn, negotiateBtn, rejectBtn].forEach(b => { if(b) b.style.display = 'none'; });

  if (ex.status === 'new') {
    // Receiver can accept/reject, sender can move to negotiating
    if (!isFromUser) {
      if (acceptBtn) acceptBtn.style.display = '';
      if (rejectBtn) rejectBtn.style.display = '';
    } else {
      if (negotiateBtn) negotiateBtn.style.display = '';
    }
  } else if (ex.status === 'negotiating') {
    if (acceptBtn) acceptBtn.style.display = '';
    if (rejectBtn) rejectBtn.style.display = '';
  } else if (ex.status === 'accepted') {
    if (completeBtn) completeBtn.style.display = '';
    if (rejectBtn) rejectBtn.style.display = '';
  }
  // completed and rejected show no action buttons
}

async function dealAction(newStatus) {
  if (!currentExchangeId) return;
  const confirmMap = {
    accepted: 'Accept this link exchange deal?',
    completed: 'Mark this exchange as completed? This will update both parties\' reputation.',
    rejected: 'Decline this exchange request? This cannot be undone.',
    negotiating: 'Move this exchange to Negotiating status?',
  };
  if (!confirm(confirmMap[newStatus] || 'Confirm this action?')) return;

  try {
    const token = getSessionToken();
    await client.mutation('exchanges:updateStatus', {
      exchangeId: currentExchangeId,
      status: newStatus,
      token,
    });
    showMsgToast(`✅ Exchange status updated to "${newStatus}"`);
    // Send a system message in chat
    const systemMsgs = {
      accepted: '🎉 Deal accepted! Both parties have agreed to the link exchange.',
      completed: '✅ Exchange marked as complete! Please verify the backlink is live.',
      rejected: '❌ Exchange has been declined.',
      negotiating: '💬 Exchange moved to negotiating. Let\'s work out the details.',
    };
    if (systemMsgs[newStatus] && currentReceiverId) {
      const uid = getSessionToken();
      await client.mutation('messages:send', {
        conversationId: currentConversationId,
        receiverId: currentReceiverId,
        text: systemMsgs[newStatus],
        exchangeId: currentExchangeId,
        token: uid,
        senderId: getUserId() || undefined,
      });
    }
    // Reload exchange details
    await loadExchangeDetails(currentExchangeId);
    await fetchAndRenderMessages();
  } catch(e) {
    showMsgToast('❌ Failed to update status: ' + e.message, 'danger');
  }
}

function viewExchangeFromChat() {
  navigateTo('exchange-requests');
}

// Opens conversation linked to a specific exchange from kanban cards
async function openConversationForExchange(exchangeId, fromUserId, toUserId) {
  if (!isLoggedIn()) { showAuthScreen(); return; }
  const uid = getUserId();
  const otherUserId = uid === fromUserId ? toUserId : fromUserId;
  await startConversationWith(otherUserId, exchangeId, 'Exchange Partner');
}

async function startConversationWith(otherUserId, exchangeId, otherUserName) {
  if (!isLoggedIn()) { showAuthScreen(); return; }
  const uid = getUserId();
  const token = getSessionToken();
  try {
    const convId = await client.mutation('messages:getOrCreateConversation', {
      otherUserId,
      exchangeId: exchangeId || undefined,
      userId: uid || undefined,
      token: token || undefined,
    });
    navigateTo('messages');
    // Wait for nav, then open conversation
    setTimeout(async () => {
      await loadConversations();
      if (convId) openConversation(convId, otherUserId, otherUserName || 'Partner');
    }, 300);
  } catch(e) {
    alert('Failed to start conversation: ' + e.message);
  }
}

// =============================================
// NOTIFICATIONS
// =============================================
async function loadNotifications() {
  const uid = getUserId();
  if (!uid) return null;
  try {
    return await client.query("notifications:listByUser", { userId: uid, limit: 50 });
  } catch (e) { return null; }
}

async function loadAndRenderNotifications() {
  const notifications = await loadNotifications();
  renderNotificationsList(notifications);
  return notifications;
}

// =============================================
// BACKLINKS
// =============================================
async function loadBacklinks() {
  const uid = getUserId();
  if (!uid) return null;
  try {
    const websites = await client.query("websites:listByOwner", { userId: uid });
    if (!websites || websites.length === 0) return [];
    // Get backlinks for all user websites
    const allBacklinks = [];
    for (const site of websites) {
      const bls = await client.query("backlinks:listByWebsite", { websiteId: site._id });
      if (bls) allBacklinks.push(...bls);
    }
    renderBacklinkTable(allBacklinks);
    return allBacklinks;
  } catch (e) {
    console.log('🔗 Backlinks:', e.message);
    renderBacklinkTable([]);
    return null;
  }
}

// =============================================
// UI UPDATE FUNCTIONS
// =============================================
function updateKpiCards(kpis) {
  if (!kpis) return;
  document.querySelectorAll(".kpi-card").forEach((card) => {
    const label = card.querySelector(".kpi-card-label")?.textContent?.trim();
    const valueEl = card.querySelector(".kpi-card-value");
    if (!valueEl) return;
    const map = {
      "Total Websites": kpis.totalWebsites,
      "Active Exchanges": kpis.activeExchanges,
      "Pending Requests": kpis.pendingRequests,
      "Verified Backlinks": kpis.verifiedBacklinks,
    };
    if (map[label] !== undefined && map[label] !== null) {
      valueEl.textContent = Number(map[label]).toLocaleString();
    }
  });
}

function updateExchangeChart(activity) {
  const chart = window.__charts?.exchangeActivity;
  if (!chart || !activity) return;
  const hasData = activity.some((a) => a.created > 0 || a.completed > 0);
  if (!hasData) return;
  chart.data.labels = activity.map((a) => a.month);
  chart.data.datasets[0].data = activity.map((a) => a.completed);
  chart.data.datasets[1].data = activity.map((a) => a.created);
  chart.update("none");
}

function updateBacklinkStats(stats) {
  if (!stats) return;
  document.querySelectorAll(".kpi-card").forEach((card) => {
    const label = card.querySelector(".kpi-card-label")?.textContent?.trim();
    const valueEl = card.querySelector(".kpi-card-value");
    if (!valueEl) return;
    const map = { "Active Backlinks": stats.active, "Lost Links": stats.lost, "Dofollow Links": stats.dofollow, "Nofollow Links": stats.nofollow };
    if (map[label] !== undefined) valueEl.textContent = Number(map[label]).toLocaleString();
  });
}

function updateNotificationBadge(count) {
  const badge = document.querySelector(".nav-item[data-page='notifications'] .nav-badge");
  if (badge) { badge.textContent = count; badge.style.display = count > 0 ? "" : "none"; }
}

function updateKanbanBoard(kanban) {
  if (!kanban) return;

  const statusMap = {
    new: { label: 'New', cls: 'badge-neutral' },
    negotiating: { label: 'Negotiating', cls: 'badge-warning' },
    accepted: { label: 'Accepted', cls: 'badge-success' },
    completed: { label: '✓ Done', cls: 'badge-purple' },
    rejected: { label: 'Declined', cls: 'badge-danger' },
  };

  const columns = ['new', 'negotiating', 'accepted', 'completed', 'rejected'];

  columns.forEach(status => {
    const container = document.getElementById(`kanban-${status}`);
    const countEl = document.querySelector(`#kanban-${status}`)?.closest('.kanban-column')?.querySelector('.kanban-column-count');
    const items = kanban[status] || [];

    if (countEl) countEl.textContent = items.length;

    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text-tertiary);font-size:0.8rem">No ${status} requests</div>`;
      return;
    }

    const uid = getUserId();
    container.innerHTML = items.map(ex => {
      const isFromUser = ex.fromUserId === uid;
      const partnerDomain = isFromUser
        ? (ex.toWebsite?.domain || 'Partner Website')
        : (ex.fromWebsite?.domain || 'Partner Website');
      const myDomain = isFromUser
        ? (ex.fromWebsite?.domain || 'Your Website')
        : (ex.toWebsite?.domain || 'Your Website');
      const statusInfo = statusMap[ex.status] || { label: ex.status, cls: 'badge-neutral' };
      const timeLabel = ex._creationTime
        ? timeAgo(ex._creationTime)
        : 'recently';

      return `
        <div class="kanban-card" onclick="window.LinkBuild.openConversationForExchange('${ex._id}', '${ex.fromUserId}', '${ex.toUserId}')" style="cursor:pointer">
          <div class="kanban-card-domain">${myDomain}</div>
          <div class="kanban-card-partner">Partner: ${partnerDomain}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px">Anchor: "${ex.fromAnchorText || 'N/A'}"</div>
          <div class="kanban-card-meta">
            <span>${timeLabel}</span>
            <span class="badge ${statusInfo.cls}">${statusInfo.label}</span>
          </div>
        </div>`;
    }).join('');
  });
}

function renderNotificationsList(notifications) {
  const container = document.getElementById('notificationsList');
  if (!container) return;

  if (!notifications || notifications.length === 0) {
    container.innerHTML = `
      <div style="padding:40px 20px;text-align:center;color:var(--text-tertiary)">
        <div style="font-size:2rem;margin-bottom:10px">🔔</div>
        <div style="font-weight:600;margin-bottom:4px">No notifications yet</div>
        <div style="font-size:0.82rem">You'll see exchange updates, messages, and alerts here.</div>
      </div>`;
    return;
  }

  const iconMap = {
    exchange_completed: { bg: 'var(--success-light)', color: 'var(--success)', svg: '<polyline points="20 6 9 17 4 12"/>' },
    new_message: { bg: 'var(--info-light)', color: 'var(--info)', svg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
    new_exchange: { bg: 'rgba(108,77,246,0.1)', color: 'var(--primary-purple)', svg: '<path d="M16 3h5v5M8 3H3v5"/><path d="M21 3l-7.5 7.5"/>' },
    backlink_alert: { bg: 'var(--warning-light)', color: 'var(--warning)', svg: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>' },
    link_removed: { bg: 'var(--danger-light)', color: 'var(--danger)', svg: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>' },
    reputation: { bg: 'var(--success-light)', color: 'var(--success)', svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>' },
  };

  container.innerHTML = notifications.map(n => {
    const icon = iconMap[n.type] || iconMap.new_message;
    const isUnread = !n.read;
    const timeLabel = timeAgo(n.createdAt);
    return `
      <div class="notification-item${isUnread ? ' unread' : ''}">
        <div class="notification-icon" style="background:${icon.bg}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${icon.color}" stroke-width="2">${icon.svg}</svg>
        </div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-text">${n.body}</div>
          <div class="notification-time">${timeLabel}</div>
        </div>
      </div>`;
  }).join('');
}

function renderBacklinkTable(backlinks) {
  const tbody = document.getElementById('backlinkTableBody');
  if (!tbody) return;

  if (!backlinks || backlinks.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:var(--text-tertiary)">No backlinks monitored yet. Complete an exchange to start tracking.</td></tr>';
    return;
  }

  const linkTypeMap = { dofollow: 'badge-info', nofollow: 'badge-neutral' };
  const statusMap = { healthy: 'badge-success', needs_review: 'badge-warning', removed: 'badge-danger' };
  const statusLabel = { healthy: 'Healthy', needs_review: 'Needs Review', removed: 'Removed' };
  const healthClass = { healthy: 'good', needs_review: 'warning', removed: 'danger' };

  tbody.innerHTML = backlinks.map(b => {
    const healthPct = b.healthScore || (b.status === 'healthy' ? 98 : b.status === 'needs_review' ? 65 : 12);
    const lastChecked = b.lastChecked ? timeAgo(b.lastChecked) : 'Never';
    return `
      <tr>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${b.sourceUrl || '—'}</td>
        <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis">${b.targetUrl || '—'}</td>
        <td>${b.anchorText || '—'}</td>
        <td><span class="badge ${linkTypeMap[b.linkType] || 'badge-neutral'}">${b.linkType || 'Unknown'}</span></td>
        <td><span class="badge ${statusMap[b.status] || 'badge-neutral'}">${statusLabel[b.status] || b.status}</span></td>
        <td>${lastChecked}</td>
        <td>
          <div class="health-score">
            <div class="health-bar"><div class="health-bar-fill ${healthClass[b.status] || 'warning'}" style="width:${healthPct}%"></div></div>
            ${healthPct}%
          </div>
        </td>
      </tr>`;
  }).join('');
}

function renderDashboardWidgets(conversations) {
  const container = document.getElementById('dashboardRecentMessages');
  if (!container) return;

  if (!conversations || conversations.length === 0) {
    container.innerHTML = `
      <div style="padding:32px 16px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">
        <div style="font-size:1.5rem;margin-bottom:8px">💬</div>
        No messages yet.<br>Start a conversation from the Marketplace.
      </div>`;
    return;
  }

  const recent = conversations.slice(0, 3);
  container.innerHTML = recent.map(conv => {
    const name = conv.otherUser?.name || 'Unknown User';
    const initials = getInitials(name);
    const color = getAvatarColor(name);
    const preview = conv.lastMessage ? conv.lastMessage.slice(0, 55) + (conv.lastMessage.length > 55 ? '...' : '') : 'No messages yet';
    const time = timeAgo(conv.lastMessageAt);
    return `
      <div class="conversation-item" onclick="navigateTo('messages'); setTimeout(() => window.LinkBuild.openConversation('${conv._id}', '${conv.otherUser?._id || ''}', '${name.replace(/'/g, "\\'")}'), 300)" style="cursor:pointer">
        <div class="conversation-avatar" style="background:${color}">${initials}</div>
        <div class="conversation-info">
          <div class="conversation-name">${name}</div>
          <div class="conversation-preview">${preview}</div>
        </div>
        <div class="conversation-time">${time}</div>
      </div>`;
  }).join('');
}

function renderDashboardOpportunities(websites) {
  const container = document.getElementById('dashboardOpportunities');
  if (!container) return;

  if (!websites || websites.length === 0) {
    container.innerHTML = `
      <div style="padding:32px 16px;text-align:center;color:var(--text-tertiary);font-size:0.85rem">
        <div style="font-size:1.5rem;margin-bottom:8px">🔍</div>
        No opportunities found.<br>Add your website to discover exchange partners.
      </div>`;
    return;
  }

  const recent = websites.slice(0, 3);
  const badgeMap = [['badge-success', 'High Match'], ['badge-purple', 'New'], ['badge-warning', 'Trending']];
  container.innerHTML = recent.map((w, i) => {
    const [badgeCls, badgeLabel] = badgeMap[i] || ['badge-neutral', 'Available'];
    return `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:600;font-size:0.9rem">${w.domain}</div>
          <div style="font-size:0.8rem;color:var(--text-tertiary)">DA ${w.domainAuthority || '?'} · ${w.niche || 'Unknown'} · ${w.country || '?'}</div>
        </div>
        <span class="badge ${badgeCls}">${badgeLabel}</span>
      </div>`;
  }).join('');
}

function updateMarketplaceTable(websites) {
  const tbody = document.getElementById("marketplaceTableBody");
  if (!tbody) return;

  if (!websites || !websites.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-tertiary)">No websites found. Try adjusting your search filters or check back later.</td></tr>';
    return;
  }

  tbody.innerHTML = websites.map(w => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:6px;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.7rem">${w.domain.slice(0,2).toUpperCase()}</div><strong>${w.domain}</strong>${w.verified ? '<span class="badge badge-success" style="font-size:0.65rem">✓ Verified</span>' : ''}</div></td>
      <td><span class="badge badge-info">${w.domainAuthority}</span></td>
      <td>${(w.trafficEstimate/1000).toFixed(0)}K/mo</td>
      <td>${w.niche}</td>
      <td>${w.country}</td>
      <td><div class="health-score"><div class="health-bar"><div class="health-bar-fill good" style="width:${w.exchangeSuccessRate || 85}%"></div></div>${w.exchangeSuccessRate || 85}%</div></td>
      <td>Just now</td>
      <td><div style="display:flex;gap:6px">
        <button class="btn btn-ghost btn-sm">Profile</button>
        <button class="btn btn-secondary btn-sm" onclick="window.LinkBuild.startConversationWith('${w.ownerId}', undefined, '${w.domain.replace(/'/g, "\\'")}')">💬 Message</button>
        <button class="btn btn-primary btn-sm" onclick="window.LinkBuild.sendExchangeRequest({toUserId:'${w.ownerId}',fromWebsiteId:'',toWebsiteId:'${w._id}',fromAnchorText:'guest post',fromTargetUrl:'https://example.com'})">Send Request</button>
      </div></td>
    </tr>`).join("");
}

function updateWebsitesTable(mySites) {
  const tbody = document.getElementById("myWebsitesTableBody");
  if (!tbody) return;
  if (!mySites || !mySites.length) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-tertiary)">No websites yet. Click "Add Website" to get started.</td></tr>';
    return;
  }
  tbody.innerHTML = mySites.map(w => `
    <tr>
      <td><strong>${w.domain}</strong></td>
      <td><span class="badge badge-info">${w.domainAuthority}</span></td>
      <td>${(w.trafficEstimate/1000).toFixed(0)}K/mo</td>
      <td>${w.niche}</td>
      <td>${w.country}</td>
      <td><span class="badge ${w.verified ? 'badge-success' : 'badge-warning'}">${w.verified ? '✓ Verified' : '⚠ Pending'}</span></td>
      <td>${w.referringDomains || 0}</td>
      <td>
        ${w.verified
          ? '<button class="btn btn-ghost btn-sm">Manage</button>'
          : `<button class="btn btn-primary btn-sm" onclick="window.LinkBuild.openVerifyModal('${w._id}')">🔐 Verify</button>`
        }
      </td>
    </tr>`).join("");
}

// =============================================
// VERIFICATION FUNCTIONS
// =============================================
async function getVerificationInfo(websiteId) {
  try {
    const result = await client.query("websites:getVerificationInfo", { websiteId });
    return result;
  } catch (e) {
    console.error("Failed to get verification info:", e);
    return null;
  }
}

async function checkAndVerifyWebsite(websiteId, domain, verificationCode, method) {
  try {
    const result = await client.action("verification:checkAndVerify", {
      websiteId,
      domain,
      verificationCode,
      method,
    });
    return result;
  } catch (e) {
    console.error("Verification check failed:", e);
    return { success: false, message: "Verification check failed. Please try again." };
  }
}
// SETTINGS PAGE POPULATION
// =============================================
function populateSettingsPage(user) {
  const nameEl = document.getElementById("settingsDisplayName");
  const emailEl = document.getElementById("settingsEmail");
  const roleEl = document.getElementById("settingsRole");
  if (nameEl) nameEl.value = user.name || "";
  if (emailEl) emailEl.value = user.email || "";
  if (roleEl) {
    const roleLabels = { free: "Free Plan", pro: "Pro Plan", agency: "Agency Plan", admin: "Administrator" };
    roleEl.value = roleLabels[user.role] || user.role || "Free Plan";
  }
}

// =============================================
// INIT
// =============================================
async function init() {
  console.log("🔌 LinkBuild: Initializing...");
  const token = getSessionToken();
  const storedUser = localStorage.getItem("linkbuild-user");
  const onDashboard = window.location.pathname.includes("dashboard");

  // On dashboard: auth overlay is shown by default and non-closeable.
  // showAuthScreen() will handle close button visibility based on page context.

  if (token) {
    try {
      // Query the me endpoint with our session token to verify validity
      const userProfile = await client.query("users:me", { token });
      if (userProfile) {
        const user = {
          userId: userProfile._id,
          name: userProfile.name,
          email: userProfile.email,
          role: userProfile.role,
        };
        saveUser(user, token);
        updateAuthUI(user);
        hideAuthScreen();
        populateSettingsPage(user);
        console.log("🔌 Session restored securely from token:", user.name);
        // Only load dashboard data when confirmed logged in
        if (onDashboard) loadDashboardData().catch(() => {});
      } else {
        console.log("🔌 Session token expired or invalid.");
        clearUser();
        updateAuthUI(null);
        handleLoggedOutRedirect();
      }
    } catch (e) {
      console.error("🔌 Session verification failed:", e.message);
      // Fallback to offline stored user if server is unreachable
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          updateAuthUI(currentUser);
          hideAuthScreen();
          populateSettingsPage(currentUser);
          startInactivityWatcher();
          console.log("🔌 Session restored offline:", currentUser.name);
          if (onDashboard) loadDashboardData().catch(() => {});
        } catch (err) {
          clearUser();
          updateAuthUI(null);
          handleLoggedOutRedirect();
        }
      } else {
        clearUser();
        updateAuthUI(null);
        handleLoggedOutRedirect();
      }
    }
  } else {
    clearUser();
    updateAuthUI(null);
    handleLoggedOutRedirect();
  }

  console.log("🔌 LinkBuild: Ready!");
}

// =============================================
// GLOBAL API
// =============================================
window.LinkBuild = {
  client: null,
  getClient: () => client,
  signup, login, logout, isLoggedIn, getCurrentUser, getUserId,
  loadDashboardData, loadMyWebsites, addWebsite, loadMarketplace,
  loadExchangeRequests, sendExchangeRequest, loadNotifications,
  loadAndRenderNotifications, loadBacklinks,
  hideAuthScreen, showAuthScreen, populateSettingsPage,
  getVerificationInfo, checkAndVerifyWebsite,
  // Messaging
  loadConversations,
  renderConversationsList,
  filterConversations,
  openConversation,
  startConversationWith,
  openConversationForExchange,
  dealAction,
  viewExchangeFromChat,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initClient);
} else {
  initClient();
}
