/* =============================================
   LinkLoop — Convex Integration Layer
   Email Auth + All Backend Functions
   ============================================= */

const DEFAULT_CONVEX_URL = "https://vibrant-marmot-366.convex.cloud";
const CONVEX_URL = "__CONVEX_URL__";

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

function getUserId() {
  if (currentUser && currentUser.userId) return currentUser.userId;
  const stored = localStorage.getItem("linkloop-user");
  if (stored) {
    try { currentUser = JSON.parse(stored); return currentUser.userId; }
    catch (e) { /* ignore */ }
  }
  return null;
}

function getSessionToken() {
  if (currentToken) return currentToken;
  return localStorage.getItem("linkloop-token");
}

function saveUser(user, token) {
  currentUser = user;
  currentToken = token;
  localStorage.setItem("linkloop-user", JSON.stringify(user));
  if (token) {
    localStorage.setItem("linkloop-token", token);
  }
}

function clearUser() {
  currentUser = null;
  currentToken = null;
  localStorage.removeItem("linkloop-user");
  localStorage.removeItem("linkloop-token");
}

// =============================================
// AUTH FUNCTIONS
// =============================================
async function signup(name, email, password) {
  try {
    const result = await client.mutation("users:signupWithPassword", { name, email, password });
    if (result.token) {
      saveUser(result.user, result.token);
      updateAuthUI(result.user);
      return { success: true, user: result.user };
    }
    return { success: false, error: "Signup failed" };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function login(email, password) {
  try {
    const result = await client.mutation("users:loginWithPassword", { email, password });
    if (result.token) {
      saveUser(result.user, result.token);
      updateAuthUI(result.user);
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
  showAuthScreen();
}

function updateAuthUI(user) {
  const footer = document.getElementById("sidebarFooter");
  const topbarAvatar = document.getElementById("topbarUserAvatar");
  const dashboardSubtitle = document.getElementById("dashboardSubtitle");
  const authModalClose = document.querySelector("#authOverlay .modal-close");

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
          <button class="btn btn-ghost btn-sm" onclick="window.LinkLoop.logout()" title="Logout" style="padding:4px;min-width:auto;color:var(--text-tertiary);margin-left:auto;display:flex;align-items:center;justify-content:center">
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
      topbarAvatar.textContent = initials;
      topbarAvatar.innerHTML = initials; // Ensure text only
      topbarAvatar.title = "Logged in as " + user.name + " (Click to Logout)";
    }

    if (dashboardSubtitle) {
      dashboardSubtitle.innerHTML = "Welcome back, " + user.name.split(" ")[0] + ". Here's your link exchange overview.";
    }

    if (authModalClose) {
      authModalClose.style.display = ""; // Show close button
    }
  } else {
    // Logged out / Not logged in
    if (footer) {
      footer.innerHTML = `
        <div style="width:100%">
          <button class="btn btn-primary" onclick="window.LinkLoop.showAuthScreen()" style="width:100%;display:flex;align-items:center;justify-content:center;gap:8px">
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
      topbarAvatar.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      `;
      topbarAvatar.title = "Click to Login";
    }

    if (dashboardSubtitle) {
      dashboardSubtitle.innerHTML = "Welcome to LinkLoop. Please log in to see your overview.";
    }

    if (authModalClose) {
      authModalClose.style.display = "none"; // Hide close button
    }
  }
}

function showAuthScreen() {
  const el = document.getElementById("authOverlay");
  if (el) { el.classList.add("active"); el.classList.remove("hidden"); }
}

function hideAuthScreen() {
  const el = document.getElementById("authOverlay");
  if (el) { el.classList.remove("active"); el.classList.add("hidden"); }
}

function isLoggedIn() {
  return !!getUserId();
}

function getCurrentUser() {
  return currentUser || JSON.parse(localStorage.getItem("linkloop-user") || "null");
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
    return websites;
  } catch (e) {
    console.log("🏪 Marketplace:", e.message);
    return null;
  }
}

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
// MESSAGES
// =============================================
async function loadConversations() {
  const uid = getUserId();
  if (!uid) return null;
  try {
    return await client.query("messages:listConversations", { userId: uid });
  } catch (e) { return null; }
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
    if (map[label] !== undefined && map[label] !== null && map[label] > 0) {
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
  const cols = { new: kanban.new?.length || 0, negotiating: kanban.negotiating?.length || 0, accepted: kanban.accepted?.length || 0, completed: kanban.completed?.length || 0, rejected: kanban.rejected?.length || 0 };
  document.querySelectorAll(".kanban-column-count").forEach((el) => {
    const col = el.closest(".kanban-column");
    const title = col?.querySelector(".kanban-column-title")?.textContent?.trim().toLowerCase();
    const map = { "new requests": "new", "negotiating": "negotiating", "accepted": "accepted", "completed": "completed", "rejected": "rejected" };
    const key = Object.entries(map).find(([k]) => title?.includes(k))?.[1];
    if (key && cols[key] !== undefined) el.textContent = cols[key];
  });
}

function updateMarketplaceTable(websites) {
  if (!websites || !websites.length) return;
  const tbody = document.getElementById("marketplaceTableBody");
  if (!tbody) return;
  tbody.innerHTML = websites.map(w => `
    <tr>
      <td><div style="display:flex;align-items:center;gap:8px"><div style="width:28px;height:28px;border-radius:6px;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:0.7rem">${w.domain.slice(0,2).toUpperCase()}</div><strong>${w.domain}</strong>${w.verified ? '<span class="badge badge-success" style="font-size:0.65rem">✓ Verified</span>' : ''}</div></td>
      <td><span class="badge badge-info">${w.domainAuthority}</span></td>
      <td>${(w.trafficEstimate/1000).toFixed(0)}K/mo</td>
      <td>${w.niche}</td>
      <td>${w.country}</td>
      <td><div class="health-score"><div class="health-bar"><div class="health-bar-fill good" style="width:${w.exchangeSuccessRate || 85}%"></div></div>${w.exchangeSuccessRate || 85}%</div></td>
      <td>Just now</td>
      <td><div style="display:flex;gap:6px"><button class="btn btn-ghost btn-sm">Profile</button><button class="btn btn-primary btn-sm" onclick="window.LinkLoop.sendExchangeRequest({toUserId:'${w.ownerId}',fromWebsiteId:'',toWebsiteId:'${w._id}',fromAnchorText:'guest post',fromTargetUrl:'https://example.com'})">Send Request</button></div></td>
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
      <td><span class="badge ${w.verified ? 'badge-success' : 'badge-warning'}">${w.verified ? 'Verified' : 'Pending'}</span></td>
      <td>${w.referringDomains || 0}</td>
      <td><button class="btn btn-ghost btn-sm">Manage</button></td>
    </tr>`).join("");
}

// =============================================
// INIT
// =============================================
async function init() {
  console.log("🔌 LinkLoop: Initializing...");
  const token = getSessionToken();
  const storedUser = localStorage.getItem("linkloop-user");
  
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
        console.log("🔌 Session restored securely from token:", user.name);
      } else {
        console.log("🔌 Session token expired or invalid.");
        clearUser();
        showAuthScreen();
      }
    } catch (e) {
      console.error("🔌 Session verification failed:", e.message);
      // Fallback to offline stored user if server is unreachable
      if (storedUser) {
        try {
          currentUser = JSON.parse(storedUser);
          updateAuthUI(currentUser);
          hideAuthScreen();
          console.log("🔌 Session restored offline:", currentUser.name);
        } catch (err) {
          clearUser();
          showAuthScreen();
        }
      } else {
        clearUser();
        showAuthScreen();
      }
    }
  } else {
    clearUser();
    showAuthScreen();
  }

  loadDashboardData().catch(() => {});
  console.log("🔌 LinkLoop: Ready!");
}

// =============================================
// GLOBAL API
// =============================================
window.LinkLoop = {
  client: null,
  getClient: () => client,
  signup, login, logout, isLoggedIn, getCurrentUser, getUserId,
  loadDashboardData, loadMyWebsites, addWebsite, loadMarketplace,
  loadExchangeRequests, sendExchangeRequest, loadConversations, loadNotifications,
  hideAuthScreen, showAuthScreen,
};

initClient();
