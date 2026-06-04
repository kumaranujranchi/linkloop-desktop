/* =============================================
   LinkBuild — Convex Integration Layer
   Email Auth + All Backend Functions
   ============================================= */

// =============================================
// CUSTOM MODAL DIALOGS
// =============================================
function showCustomAlert(message, title = "Notification", type = "info") {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";

    // Icon mapping
    const icons = {
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      danger: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><octagon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };

    overlay.innerHTML = `
      <div class="custom-modal-box">
        <div class="custom-modal-header">
          <div class="custom-modal-icon ${type}">
            ${icons[type] || icons.info}
          </div>
          <div class="custom-modal-title">${title}</div>
        </div>
        <div class="custom-modal-body">${message}</div>
        <div class="custom-modal-footer">
          <button class="btn btn-primary" id="custom-modal-ok-btn">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    setTimeout(() => overlay.classList.add("active"), 10);

    const okBtn = overlay.querySelector("#custom-modal-ok-btn");
    okBtn.focus();

    const close = () => {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 200);
    };

    okBtn.addEventListener("click", close);
  });
}

function showCustomConfirm(
  message,
  title = "Confirm Action",
  type = "warning",
) {
  return new Promise((resolve) => {
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "custom-modal-overlay";

    // Icon mapping
    const icons = {
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
      danger: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><octagon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
    };

    overlay.innerHTML = `
      <div class="custom-modal-box">
        <div class="custom-modal-header">
          <div class="custom-modal-icon ${type}">
            ${icons[type] || icons.warning}
          </div>
          <div class="custom-modal-title">${title}</div>
        </div>
        <div class="custom-modal-body">${message}</div>
        <div class="custom-modal-footer">
          <button class="btn btn-secondary" id="custom-modal-cancel-btn">Cancel</button>
          <button class="btn btn-primary" id="custom-modal-confirm-btn">Confirm</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Trigger animation
    setTimeout(() => overlay.classList.add("active"), 10);

    const cancelBtn = overlay.querySelector("#custom-modal-cancel-btn");
    const confirmBtn = overlay.querySelector("#custom-modal-confirm-btn");
    confirmBtn.focus();

    const close = (result) => {
      overlay.classList.remove("active");
      setTimeout(() => {
        overlay.remove();
        resolve(result);
      }, 200);
    };

    cancelBtn.addEventListener("click", () => close(false));
    confirmBtn.addEventListener("click", () => close(true));
  });
}

window.showCustomAlert = showCustomAlert;
window.showCustomConfirm = showCustomConfirm;

const DEFAULT_CONVEX_URL = "https://vibrant-marmot-366.convex.cloud";
const CONVEX_URL = "__CONVEX_URL__";
const INACTIVITY_LOGOUT_MS = 10 * 60 * 1000; // 10 minutes

// We import ConvexClient from the import map
let client;

async function initClient() {
  // Use the global convex from the browser bundle (IIFE script tag)
  if (typeof convex === "undefined" || !convex.ConvexClient) {
    console.error(
      "Convex: Browser bundle not loaded. Make sure the convex script tag is present.",
    );
    return;
  }

  client = new convex.ConvexClient(
    CONVEX_URL === "__CONVEX_URL__" || !CONVEX_URL
      ? DEFAULT_CONVEX_URL
      : CONVEX_URL,
  );
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
  events.forEach((eventName) =>
    window.addEventListener(eventName, resetInactivityTimer, { passive: true }),
  );
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

async function logoutDueToInactivity() {
  if (!currentUser) return;
  stopInactivityWatcher();
  await showCustomAlert(
    "You have been logged out after 10 minutes of inactivity for security reasons.",
    "Session Expired",
    "warning",
  );
  logout();
}

function getUserId() {
  if (currentUser && currentUser.userId) return currentUser.userId;
  const stored = localStorage.getItem("linkbuild-user");
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      return currentUser.userId;
    } catch (e) {
      /* ignore */
    }
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
function formatConvexError(e, defaultMsg) {
  if (e && e.data && typeof e.data === "string") {
    return e.data;
  }
  let msg = (e && e.message) || defaultMsg;
  if (typeof msg === "string" && msg.includes("ConvexError:")) {
    const parts = msg.split("ConvexError:");
    if (parts.length > 1) {
      return parts[1].trim();
    }
  }
  return msg;
}

async function signup(name, email, password) {
  if (!client) {
    return {
      success: false,
      error: "Connection not ready. Please refresh the page and try again.",
    };
  }
  try {
    const result = await client.mutation("users:signupWithPassword", {
      name,
      email,
      password,
    });
    if (result.token) {
      saveUser(result.user, result.token);
      updateAuthUI(result.user);

      // Redirect to dashboard/admin panel after signup when not already on it.
      const path = window.location.pathname;
      const shouldRedirect =
        result.user.role === "admin" ||
        (!path.includes("dashboard") &&
          !path.includes("dashboard.html") &&
          !path.includes("admin"));
      if (shouldRedirect) {
        if (result.user.role === "admin") {
          console.log("Admin signed up. Redirecting to admin panel...");
        } else {
          console.log("User signed up. Redirecting to dashboard...");
        }
        // Close login modal before redirecting
        const overlay = document.getElementById("authOverlay");
        if (overlay) {
          overlay.classList.remove("active");
          overlay.classList.add("hidden");
        }
        window.location.href = getDashboardUrl(result.user.role);
      }
      return { success: true, user: result.user };
    }
    return { success: false, error: "Signup failed" };
  } catch (e) {
    return { success: false, error: formatConvexError(e, "Signup failed") };
  }
}

async function login(email, password) {
  if (!client) {
    return {
      success: false,
      error: "Connection not ready. Please refresh the page and try again.",
    };
  }
  try {
    const result = await client.mutation("users:loginWithPassword", {
      email,
      password,
    });
    if (result.token) {
      saveUser(result.user, result.token);
      updateAuthUI(result.user);

      // Redirect to dashboard/admin panel after login when not already on it.
      const path = window.location.pathname;
      const shouldRedirect =
        result.user.role === "admin" ||
        (!path.includes("dashboard") &&
          !path.includes("dashboard.html") &&
          !path.includes("admin"));
      if (shouldRedirect) {
        if (result.user.role === "admin") {
          console.log("Admin logged in. Redirecting to admin panel...");
        } else {
          console.log("User logged in. Redirecting to dashboard...");
        }
        // Close login modal before redirecting
        const overlay = document.getElementById("authOverlay");
        if (overlay) {
          overlay.classList.remove("active");
          overlay.classList.add("hidden");
        }
        window.location.href = getDashboardUrl(result.user.role);
      }
      return { success: true, user: result.user };
    }
    return { success: false, error: "Login failed" };
  } catch (e) {
    return { success: false, error: formatConvexError(e, "Login failed") };
  }
}

async function loginWithGoogle(credential) {
  if (!client) {
    return {
      success: false,
      error: "Connection not ready. Please refresh the page and try again.",
    };
  }
  try {
    const result = await client.mutation("users:loginWithGoogle", {
      credential,
    });
    if (result.token) {
      saveUser(result.user, result.token);
      updateAuthUI(result.user);

      // Redirect to dashboard/admin panel after Google login when not already on it.
      const path = window.location.pathname;
      const shouldRedirect =
        result.user.role === "admin" ||
        (!path.includes("dashboard") &&
          !path.includes("dashboard.html") &&
          !path.includes("admin"));
      if (shouldRedirect) {
        if (result.user.role === "admin") {
          console.log(
            "Admin logged in with Google. Redirecting to admin panel...",
          );
        } else {
          console.log(
            "User logged in with Google. Redirecting to dashboard...",
          );
        }
        // Close login modal before redirecting
        const overlay = document.getElementById("authOverlay");
        if (overlay) {
          overlay.classList.remove("active");
          overlay.classList.add("hidden");
        }
        window.location.href = getDashboardUrl(result.user.role);
      }
      return { success: true, user: result.user };
    }
    return { success: false, error: "Google authentication failed" };
  } catch (e) {
    return {
      success: false,
      error: formatConvexError(e, "Google authentication failed"),
    };
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
    return "/" + loginParam; // Vercel: /  or /?auth=login
  } else {
    return "index.html" + loginParam; // Local: index.html?auth=login
  }
}

function getDashboardUrl(role) {
  const isCleanUrl = !window.location.pathname.includes(".html");
  const normalizedRole = role ? role.toString().toLowerCase() : "";
  if (normalizedRole === "admin") {
    return isCleanUrl ? "/admin" : "admin.html";
  }
  return isCleanUrl ? "/dashboard" : "dashboard.html";
}

function handleLoggedOutRedirect() {
  const path = window.location.pathname;
  if (path.includes("dashboard") || path.includes("dashboard.html")) {
    window.location.href = getLandingUrl("login");
  } else {
    // On landing page: always keep the auth modal hidden by default.
    // The login/signup overlay should only open when the user clicks a button.
    hideAuthScreen();
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
    const initials = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    const roleLabel =
      user.role === "free"
        ? "Free Plan"
        : user.role === "pro"
          ? "Pro Plan"
          : user.role === "admin"
            ? "Admin Plan"
            : "Agency Plan";

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
      dashboardSubtitle.innerHTML =
        "Welcome back, " +
        user.name.split(" ")[0] +
        ". Here's your link exchange overview.";
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
      landingAuthBtn.onclick = () => (window.location.href = getDashboardUrl());
      landingAuthBtn.style.padding = "10px 24px";
    }
    if (landingHeroCta) {
      landingHeroCta.textContent = "Go to Dashboard";
      landingHeroCta.onclick = () => (window.location.href = getDashboardUrl());
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
      dashboardSubtitle.innerHTML =
        "Welcome to LinkBuild. Please log in to see your overview.";
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
      landingAuthBtn.onclick = () => {
        showAuthScreen();
        if (window.switchAuthTab) window.switchAuthTab("login");
      };
      landingAuthBtn.style.padding = "10px 24px";
    }
    if (landingHeroCta) {
      landingHeroCta.textContent = "Get Started - Free";
      landingHeroCta.onclick = () => {
        showAuthScreen();
        if (window.switchAuthTab) window.switchAuthTab("signup");
      };
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
  el._backdropHandler = function (e) {
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
  // Check if we need to show safety notice on dashboard
  checkSafetyNotice();
}

function checkSafetyNotice() {
  const agreed = localStorage.getItem("linkbuild-safety-agreed");
  if (agreed !== "true") {
    const modal = document.getElementById("safetyNoticeModal");
    if (modal) {
      modal.classList.remove("hidden");
      modal.classList.add("active");
    }
  }
}

function agreeToSafetyNotice() {
  localStorage.setItem("linkbuild-safety-agreed", "true");
  const modal = document.getElementById("safetyNoticeModal");
  if (modal) {
    modal.classList.remove("active");
    modal.classList.add("hidden");
  }
}

window.agreeToSafetyNotice = agreeToSafetyNotice;

function isLoggedIn() {
  return !!getUserId();
}

function getCurrentUser() {
  return (
    currentUser || JSON.parse(localStorage.getItem("linkbuild-user") || "null")
  );
}

// =============================================
// DASHBOARD DATA
// =============================================
async function loadDashboardData() {
  try {
    const kpis = await client.query("analytics:dashboardKpis", {});
    if (kpis) updateKpiCards(kpis);
    const activity = await client.query("analytics:exchangeActivity", {
      months: 6,
    });
    if (activity) updateExchangeChart(activity);
    const backlinkStats = await client.query("backlinks:stats", {});
    if (backlinkStats) updateBacklinkStats(backlinkStats);
    const uid = getUserId();
    if (uid) {
      // Update all sidebar badges
      updateAllSidebarBadges();

      // Load dashboard widgets
      const convs = await client.query("messages:listConversations", {
        userId: uid,
      });
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
let cachedMyWebsites = [];

async function loadMyWebsites() {
  const uid = getUserId();
  if (!uid) return [];
  try {
    const sites = await client.query("websites:listByOwner", { userId: uid });
    cachedMyWebsites = sites || [];
    updateWebsitesTable(cachedMyWebsites);
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
    const websiteId = await client.mutation("websites:add", {
      ...data,
      userId: uid,
    });
    return { success: true, websiteId };
  } catch (e) {
    return {
      success: false,
      error: formatConvexError(e, "Failed to add website"),
    };
  }
}

// =============================================
// MARKETPLACE
// =============================================
async function loadMarketplace(filters = {}) {
  try {
    const websites = await client.query("websites:list", {
      ...filters,
      limit: 50,
    });
    updateMarketplaceTable(websites);
    // Update results count
    const label = document.getElementById("marketplaceResultsLabel");
    if (label)
      label.textContent =
        websites && websites.length
          ? `${websites.length} Results`
          : "0 Results";
    return websites;
  } catch (e) {
    console.log("🏪 Marketplace:", e.message);
    return null;
  }
}

// Build filter params from dropdowns
function getMarketplaceFilters() {
  const filters = {};

  // Niche
  const niche = document.getElementById("filterNiche")?.value;
  if (niche) filters.niche = niche;

  // Domain Authority range
  const da = document.getElementById("filterDA")?.value;
  if (da) {
    const [min, max] = da.split("-").map(Number);
    if (!isNaN(min)) filters.minDA = min;
    if (!isNaN(max)) filters.maxDA = max;
  }

  // Traffic range
  const traffic = document.getElementById("filterTraffic")?.value;
  if (traffic) {
    const [min, max] = traffic.split("-").map(Number);
    if (!isNaN(min)) filters.minTraffic = min;
    if (!isNaN(max)) filters.maxTraffic = max;
  }

  // Country
  const country = document.getElementById("filterCountry")?.value;
  if (country) filters.country = country;

  // Language
  const language = document.getElementById("filterLanguage")?.value;
  if (language) filters.language = language;

  // Link type (dofollow / nofollow)
  const linkType = document.getElementById("filterLinkType")?.value;
  if (linkType) filters.linkType = linkType;

  // Search query
  const query = document
    .getElementById("marketplaceSearchInput")
    ?.value?.trim();
  if (query) filters.search = query;

  return filters;
}

// Called when any filter dropdown changes
function filterMarketplace() {
  loadMarketplace(getMarketplaceFilters());
}
window.filterMarketplace = filterMarketplace;

// Marketplace search (called by search button or Enter key)
function searchMarketplace() {
  loadMarketplace(getMarketplaceFilters());
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
  } catch (e) {
    return null;
  }
}

// ==== EXCHANGE REQUEST DEDUP & COOLDOWN ====
const REQUEST_COOLDOWN_MS = 30000; // 30 second cooldown per website
const pendingRequests = new Map(); // toWebsiteId → timestamp (when request was sent)
const inFlightRequests = new Set(); // toWebsiteId → currently sending

async function sendExchangeRequest(data, btnEl) {
  const uid = getUserId();
  if (!uid) {
    showMsgToast("Please login first to send exchange requests.", "warning");
    return { success: false, error: "Please login first" };
  }

  const targetWebsiteId = data.toWebsiteId;

  if (data.toUserId === uid) {
    showMsgToast(
      "You cannot send an exchange request to your own website.",
      "warning",
    );
    return { success: false, error: "Cannot send request to own website" };
  }

  // === DEDUP: Prevent duplicate requests to same website ===
  if (inFlightRequests.has(targetWebsiteId)) {
    showMsgToast(
      "⏳ Request is already being sent to this website. Please wait.",
      "warning",
    );
    return { success: false, error: "Request already in flight" };
  }

  if (pendingRequests.has(targetWebsiteId)) {
    const elapsed = Date.now() - pendingRequests.get(targetWebsiteId);
    if (elapsed < REQUEST_COOLDOWN_MS) {
      const remaining = Math.ceil((REQUEST_COOLDOWN_MS - elapsed) / 1000);
      showMsgToast(
        `⏳ Request already sent to this website. Please wait ${remaining}s before retrying.`,
        "warning",
      );
      return {
        success: false,
        error: "Duplicate request blocked — cooldown active",
      };
    }
    // Cooldown expired, allow retry
    pendingRequests.delete(targetWebsiteId);
  }

  // Also check server-side for existing pending requests to same website
  try {
    const existing = await client.query("exchanges:listKanban", {
      userId: uid,
    });
    if (existing) {
      const allRequests = [
        ...(existing.new || []),
        ...(existing.negotiating || []),
        ...(existing.accepted || []),
      ];
      const alreadySent = allRequests.find(
        (r) => r.toWebsiteId === targetWebsiteId,
      );
      if (alreadySent) {
        // Mark as pending in our local cache too
        pendingRequests.set(targetWebsiteId, Date.now());
        showMsgToast(
          "You already have an active request with this website. Check your Exchange Requests panel.",
          "warning",
        );
        return {
          success: false,
          error: "Active request already exists for this website",
        };
      }
    }
  } catch (e) {
    /* proceed even if check fails */
  }

  // === BUTTON FEEDBACK: Mark as in-flight ===
  inFlightRequests.add(targetWebsiteId);
  if (btnEl) {
    btnEl.disabled = true;
    btnEl.style.opacity = "0.7";
    btnEl.style.cursor = "not-allowed";
    const origHTML = btnEl.innerHTML;
    btnEl.innerHTML =
      '<span style="display:inline-flex;align-items:center;gap:6px"><span class="spinner-mini"></span> Sending...</span>';
  }

  // Auto-detect user's website if not provided (e.g., from marketplace)
  if (!data.fromWebsiteId || data.fromWebsiteId === "") {
    try {
      const mySites = await client.query("websites:listByOwner", {
        userId: uid,
      });
      if (!mySites || mySites.length === 0) {
        showMsgToast(
          "You need to add at least one website before sending exchange requests.",
          "warning",
        );
        resetRequestButton(btnEl, targetWebsiteId);
        return { success: false, error: "No websites found" };
      }
      const verified = mySites.find((s) => s.verified);
      data.fromWebsiteId = verified ? verified._id : mySites[0]._id;
    } catch (e) {
      showMsgToast(
        "Failed to load your websites. Please try again.",
        "warning",
      );
      resetRequestButton(btnEl, targetWebsiteId);
      return { success: false, error: "Failed to load websites" };
    }
  }

  try {
    const result = await client.mutation("exchanges:send", {
      ...data,
      fromUserId: uid,
    });
    // Mark as pending with timestamp for cooldown
    pendingRequests.set(targetWebsiteId, Date.now());
    inFlightRequests.delete(targetWebsiteId);
    // Button → success state
    if (btnEl) {
      btnEl.disabled = true;
      btnEl.style.opacity = "1";
      btnEl.style.cursor = "not-allowed";
      btnEl.style.background = "linear-gradient(135deg, #10b981, #059669)";
      btnEl.style.border = "1px solid #10b981";
      btnEl.innerHTML = "✓ Sent";
      // Re-enable after cooldown
      setTimeout(
        () => resetRequestButton(btnEl, targetWebsiteId),
        REQUEST_COOLDOWN_MS,
      );
    }
    showMsgToast("Exchange request sent successfully!", "success");
    return { success: true, id: result };
  } catch (e) {
    inFlightRequests.delete(targetWebsiteId);
    resetRequestButton(btnEl, targetWebsiteId);
    showMsgToast(
      "Error: " + formatConvexError(e, "Failed to send exchange request"),
      "danger",
    );
    return {
      success: false,
      error: formatConvexError(e, "Failed to send exchange request"),
    };
  }
}

function resetRequestButton(btnEl, websiteId) {
  if (!btnEl) return;
  btnEl.disabled = false;
  btnEl.style.opacity = "";
  btnEl.style.cursor = "";
  btnEl.style.background = "";
  btnEl.style.border = "";
  btnEl.innerHTML = "Send Request";
  pendingRequests.delete(websiteId);
  inFlightRequests.delete(websiteId);
}

// =============================================
// MESSAGES — Full Real-time Chat System
// =============================================

// ========== E2E ENCRYPTION ==========
// Hybrid encryption: ECDH key exchange + AES-GCM per-message encryption
const CRYPTO_ALGORITHM = { name: "ECDH", namedCurve: "P-256" };
const AES_ALGORITHM = { name: "AES-GCM", length: 256 };

async function getOrCreateKeyPair() {
  // Try to load existing key pair from localStorage
  const stored = localStorage.getItem("linkbuild-crypto-keypair");
  if (stored) {
    try {
      const jwk = JSON.parse(stored);
      return await crypto.subtle.importKey("jwk", jwk, CRYPTO_ALGORITHM, true, [
        "deriveBits",
      ]);
    } catch (e) {
      /* ignore, regenerate */
    }
  }
  // Generate new key pair
  const keyPair = await crypto.subtle.generateKey(CRYPTO_ALGORITHM, true, [
    "deriveBits",
  ]);
  // Export and store private key
  const jwk = await crypto.subtle.exportKey("jwk", keyPair.privateKey);
  localStorage.setItem("linkbuild-crypto-keypair", JSON.stringify(jwk));
  // Upload public key to server
  await uploadPublicKey(keyPair.publicKey);
  return keyPair;
}

async function uploadPublicKey(publicKey) {
  const jwk = await crypto.subtle.exportKey("jwk", publicKey);
  const token = getSessionToken();
  if (!token || !client) return;
  try {
    await client.mutation("users:storePublicKey", {
      publicKey: JSON.stringify(jwk),
      token,
    });
  } catch (e) {
    console.warn("Failed to upload public key:", e);
  }
}

async function deriveSharedSecret(privateKey, otherPublicJwk) {
  const otherPublicKey = await crypto.subtle.importKey(
    "jwk",
    JSON.parse(otherPublicJwk),
    CRYPTO_ALGORITHM,
    true,
    [],
  );
  const sharedBits = await crypto.subtle.deriveBits(
    { name: "ECDH", public: otherPublicKey },
    privateKey,
    256,
  );
  return await crypto.subtle.importKey(
    "raw",
    sharedBits,
    AES_ALGORITHM,
    false,
    ["encrypt", "decrypt"],
  );
}

async function encryptMessage(plaintext, otherPublicJwk) {
  const keyPair = await getOrCreateKeyPair();
  const sharedKey = await deriveSharedSecret(
    keyPair.privateKey,
    otherPublicJwk,
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    sharedKey,
    encoded,
  );
  // Return as JSON with base64-encoded IV and ciphertext
  return JSON.stringify({
    iv: btoa(String.fromCharCode(...iv)),
    data: btoa(String.fromCharCode(...new Uint8Array(ciphertext))),
  });
}

async function decryptMessage(encryptedJson, senderPublicJwk) {
  try {
    const { iv, data } = JSON.parse(encryptedJson);
    const keyPair = await getOrCreateKeyPair();
    const sharedKey = await deriveSharedSecret(
      keyPair.privateKey,
      senderPublicJwk,
    );
    const ivBytes = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));
    const cipherBytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: ivBytes },
      sharedKey,
      cipherBytes,
    );
    return new TextDecoder().decode(plaintext);
  } catch (e) {
    console.warn("Decryption failed:", e);
    return "[Unable to decrypt this message]";
  }
}

// ========== FRAUD & SCAM DETECTION CONTROLS ==========
const domainVerificationCache = {};

const linkExchangeRequestRegex =
  /\b(backlink|guest\s?post|link\s?exchange|niche\s?edit|contextual\s?link|exchange\s?link|exchange\s?links|guest\s?blogging|link\s?insertion|insert\s?link|guest\s?posts|backlinks)\b/i;

function detectPhoneContact(text) {
  const phoneOrContactRegex =
    /\b(phone|whatsapp|whats\s?app|telegram|tele\s?gram|skype|discord|wechat|viber|signal|line\s?app|contact\s+details|contact\s+number|mobile\s+number|phone\s+number|external\s+contact|email|e-mail|my\s+number)\b/i;
  const emailRegex = /\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/;
  const phoneNumberPatternRegex =
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}|\b\d{7,15}\b/;

  return (
    phoneOrContactRegex.test(text) ||
    emailRegex.test(text) ||
    phoneNumberPatternRegex.test(text)
  );
}

function detectMoneyRequest(text) {
  const moneyRegex =
    /\b(payment|advance|transfer|bank\s?details|upi|paypal|pay\s?pal|crypto|cryptocurrency|bitcoin|btc|ethereum|eth|usdt|money\s+exchange|currency\s+exchange|send\s?money|send\s?payment|bank\s?transfer|wire\s+transfer|pay\s?me)\b/i;
  return moneyRegex.test(text);
}

function extractDomains(text) {
  const domainRegex =
    /\b(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]{0,62}\.[a-zA-Z]{2,10})\b/gi;
  const domains = [];
  let match;
  domainRegex.lastIndex = 0;
  const cleanText = text.replace(/[\n\r]/g, " ");
  while ((match = domainRegex.exec(cleanText)) !== null) {
    let dom = match[1].toLowerCase();
    dom = dom.split("/")[0].split("?")[0];
    if (dom && !domains.includes(dom)) {
      domains.push(dom);
    }
  }
  return domains;
}

// State
let currentConversationId = null;
let currentReceiverId = null;
let currentExchangeId = null;
let currentConversationExchange = null;
let allConversations = [];
let msgPollingTimer = null;
let lastMsgCount = 0;

const AVATAR_COLORS = [
  "#6C4DF6",
  "#10B981",
  "#3B82F6",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#0F4C81",
];
function getAvatarColor(name) {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
function getInitials(name) {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
function timeAgo(ts) {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return mins + "m";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h";
  return Math.floor(hrs / 24) + "d";
}

async function loadConversations() {
  const uid = getUserId();
  if (!uid) return null;
  try {
    const convs = await client.query("messages:listConversations", {
      userId: uid,
    });
    allConversations = convs || [];
    renderConversationsList(allConversations);
    return allConversations;
  } catch (e) {
    console.log("Conversations:", e.message);
    // Hide loading, show empty
    const loading = document.getElementById("convsLoading");
    const empty = document.getElementById("convsEmpty");
    if (loading) loading.style.display = "none";
    if (empty) empty.style.display = "";
    return null;
  }
}

function renderConversationsList(conversations) {
  const inner = document.getElementById("convsListInner");
  const loading = document.getElementById("convsLoading");
  const empty = document.getElementById("convsEmpty");
  if (!inner) return;

  if (loading) loading.style.display = "none";

  if (!conversations || conversations.length === 0) {
    inner.innerHTML = "";
    if (empty) empty.style.display = "";
    return;
  }
  if (empty) empty.style.display = "none";

  inner.innerHTML = `
    <div class="convs-toolbar" id="convsToolbar">
      <label class="convs-select-all" onclick="event.stopPropagation()">
        <input type="checkbox" id="selectAllCheckbox" onchange="toggleSelectAll(this.checked)">
        <span>Select all</span>
      </label>
      <button class="convs-delete-btn" id="convsDeleteBtn" onclick="deleteSelectedConversations()" disabled title="Delete selected">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        <span id="selectedCount">Delete</span>
      </button>
    </div>
    <div class="convs-list-scroll">
    ${conversations
      .map((conv) => {
        const name = conv.otherUser?.name || "Unknown User";
        const initials = getInitials(name);
        const color = getAvatarColor(name);
        const preview = conv.lastMessage
          ? conv.lastMessage.slice(0, 55) +
            (conv.lastMessage.length > 55 ? "..." : "")
          : "No messages yet";
        const time = timeAgo(conv.lastMessageAt);
        const isActive = conv._id === currentConversationId;
        const unread = conv.unreadCount || 0;

        return `
      <div class="conversation-item${isActive ? " active" : ""}" data-conv-id="${conv._id}">
        <label class="convs-checkbox" onclick="event.stopPropagation()">
          <input type="checkbox" class="conv-select-cb" data-conv-id="${conv._id}" onchange="updateDeleteButton()">
        </label>
        <div onclick="window.LinkBuild.openConversation('${conv._id}', '${conv.otherUser?._id || ""}', '${name.replace(/'/g, "\\'")}')" style="flex:1;display:flex;align-items:center;gap:10px;cursor:pointer;min-width:0">
          <div class="conversation-avatar" style="background:${color};position:relative">
            ${initials}
            ${unread > 0 ? `<span style="position:absolute;top:-3px;right:-3px;background:var(--danger);color:white;font-size:0.6rem;font-weight:700;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;border:2px solid var(--bg-primary)">${unread > 9 ? "9+" : unread}</span>` : ""}
          </div>
          <div class="conversation-info" style="flex:1;min-width:0">
            <div class="conversation-name">${name}</div>
            <div class="conversation-preview">${preview}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex-shrink:0">
            <div class="conversation-time">${time}</div>
            ${unread > 0 ? `<span style="background:var(--primary-purple);border-radius:10px;color:white;font-size:0.65rem;font-weight:700;padding:1px 6px">${unread}</span>` : ""}
          </div>
        </div>
      </div>`;
      })
      .join("")}
    </div>`;

  updateDeleteButton();
}

function updateDeleteButton() {
  const checked = document.querySelectorAll(".conv-select-cb:checked");
  const btn = document.getElementById("convsDeleteBtn");
  const count = document.getElementById("selectedCount");
  if (!btn || !count) return;
  const n = checked.length;
  btn.disabled = n === 0;
  count.textContent = n > 0 ? "Delete (" + n + ")" : "Delete";
}

function toggleSelectAll(checked) {
  document
    .querySelectorAll(".conv-select-cb")
    .forEach((cb) => (cb.checked = checked));
  updateDeleteButton();
}

async function deleteSelectedConversations() {
  const checked = document.querySelectorAll(".conv-select-cb:checked");
  const ids = Array.from(checked).map((cb) => cb.dataset.convId);
  if (ids.length === 0) return;
  if (
    !confirm(
      "Delete " +
        ids.length +
        " conversation(s) and all their messages? This cannot be undone.",
    )
  )
    return;

  try {
    const token = getSessionToken();
    const res = await client.mutation("messages:deleteConversations", {
      conversationIds: ids,
      token,
    });
    if (res && res.success) {
      showMsgToast("Deleted " + res.deleted + " conversation(s)", "info");
      await loadConversations();
    }
  } catch (e) {
    showMsgToast("Failed to delete: " + e.message, "danger");
  }
}

function filterConversations(query) {
  if (!query.trim()) {
    renderConversationsList(allConversations);
    return;
  }
  const q = query.toLowerCase();
  const filtered = allConversations.filter(
    (c) =>
      (c.otherUser?.name || "").toLowerCase().includes(q) ||
      (c.lastMessage || "").toLowerCase().includes(q),
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
  const avatarEl = document.getElementById("chatHeaderAvatar");
  const nameEl = document.getElementById("chatHeaderName");
  const subEl = document.getElementById("chatHeaderSub");
  if (avatarEl) {
    avatarEl.textContent = initials;
    avatarEl.style.background = color;
  }
  if (nameEl) nameEl.textContent = otherUserName;
  if (subEl) subEl.textContent = "Exchange Partner";

  // Show active chat, hide placeholder
  document.getElementById("chatPlaceholder").style.display = "none";
  const activeEl = document.getElementById("chatActive");
  if (activeEl) {
    activeEl.style.display = "flex";
  }

  // Show loading in messages
  const msgsEl = document.getElementById("chatMessages");
  if (msgsEl)
    msgsEl.innerHTML =
      '<div style="text-align:center;padding:40px;color:var(--text-tertiary);font-size:0.85rem">Loading messages...</div>';

  // Highlight active conversation in list
  document
    .querySelectorAll(".conversation-item")
    .forEach((el) => el.classList.remove("active"));
  const convItems = document.querySelectorAll(
    "#convsListInner .conversation-item",
  );
  convItems.forEach((el) => {
    if (
      el.getAttribute("onclick") &&
      el.getAttribute("onclick").includes(conversationId)
    ) {
      el.classList.add("active");
    }
  });

  // Find conversation data
  const conv = allConversations.find((c) => c._id === conversationId);
  currentExchangeId = conv?.exchangeId || null;
  currentConversationExchange = null;

  // Load exchange details in panel if linked
  if (currentExchangeId) {
    document.getElementById("chatViewExchangeBtn").style.display = "";
    loadExchangeDetails(currentExchangeId);
  } else {
    document.getElementById("chatViewExchangeBtn").style.display = "none";
    document.getElementById("panelNoExchange").style.display = "";
    document.getElementById("panelExchangeDetails").style.display = "none";
  }

  // Fetch and render messages
  await fetchAndRenderMessages();

  // Mark as read
  try {
    const token = getSessionToken();
    const uid = getUserId();
    await client.mutation("messages:markRead", {
      conversationId,
      token,
      userId: uid,
    });
    // Refresh conversation list to clear unread badge
    loadConversations();
  } catch (e) {
    /* silent */
  }

  // Start polling for new messages
  startMessagePolling();

  // Bind send handlers
  bindSendHandlers();
}

async function fetchAndRenderMessages() {
  if (!currentConversationId) return;
  try {
    const msgs = await client.query("messages:listMessages", {
      conversationId: currentConversationId,
      limit: 100,
    });
    // Mark messages as delivered to the recipient
    try {
      const token = localStorage.getItem("linkbuild-token");
      await client.mutation("messages:markAsDelivered", {
        conversationId: currentConversationId,
        token,
      });
    } catch (e) {
      /* ignore */
    }
    await renderMessages(msgs || []);
    lastMsgCount = (msgs || []).length;
  } catch (e) {
    const msgsEl = document.getElementById("chatMessages");
    if (msgsEl)
      msgsEl.innerHTML =
        '<div style="text-align:center;padding:40px;color:var(--text-tertiary);font-size:0.85rem">Could not load messages.</div>';
  }
}

async function renderMessages(messages) {
  const msgsEl = document.getElementById("chatMessages");
  if (!msgsEl) return;
  const uid = getUserId();

  if (!messages || messages.length === 0) {
    msgsEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--text-tertiary);gap:8px">
        
        <div style="font-weight:600">Start the conversation!</div>
        <div style="font-size:0.85rem">Send a message to begin negotiating your link exchange.</div>
      </div>`;
    return;
  }

  // Pre-fetch senders' public keys for decryption
  const senderIds = [
    ...new Set(messages.filter((m) => m.encrypted).map((m) => m.senderId)),
  ];
  const publicKeyMap = {};
  for (const sid of senderIds) {
    try {
      const u = await client.query("users:getPublicKey", { userId: sid });
      if (u && u.publicKey) publicKeyMap[sid] = u.publicKey;
    } catch (e) {
      /* ignore */
    }
  }

  let lastDate = null;
  const decryptedTexts = await Promise.all(
    messages.map(async (msg) => {
      let displayText = msg.text;
      if (msg.encrypted && publicKeyMap[msg.senderId]) {
        try {
          displayText = await decryptMessage(
            msg.text,
            publicKeyMap[msg.senderId],
          );
        } catch (e) {
          displayText = "[Encrypted message — cannot decrypt]";
        }
      }
      return { ...msg, displayText };
    }),
  );

  // Collect all domains mentioned in messages that look like link exchange requests
  const domainsToCheck = [];
  for (const msg of decryptedTexts) {
    if (linkExchangeRequestRegex.test(msg.displayText)) {
      const domains = extractDomains(msg.displayText);
      for (const domain of domains) {
        if (!domainsToCheck.includes(domain)) {
          domainsToCheck.push(domain);
        }
      }
    }
  }

  // Fetch domain verification status in parallel (caching results to avoid redundant calls)
  await Promise.all(
    domainsToCheck.map(async (domain) => {
      if (domainVerificationCache[domain] !== undefined) {
        return;
      }
      try {
        const website = await client.query("websites:getByDomain", { domain });
        domainVerificationCache[domain] = website ? website.verified : false;
      } catch (e) {
        console.warn(`Failed to check verification for domain ${domain}:`, e);
        domainVerificationCache[domain] = false;
      }
    }),
  );

  const html = decryptedTexts
    .map((msg) => {
      const isSent = msg.senderId === uid;
      const msgDate = new Date(msg.createdAt).toLocaleDateString();
      let dateSep = "";
      if (msgDate !== lastDate) {
        lastDate = msgDate;
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        const label =
          msgDate === today
            ? "Today"
            : msgDate === yesterday
              ? "Yesterday"
              : msgDate;
        dateSep = `<div style="text-align:center;margin:12px 0;font-size:0.75rem;color:var(--text-tertiary)"><span style="background:var(--bg-tertiary);padding:3px 10px;border-radius:10px">${label}</span></div>`;
      }
      const time = new Date(msg.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const readTick = isSent
        ? msg.read
          ? ' <span style="color:#3b82f6;font-size:0.7rem">✓✓</span>'
          : msg.delivered
            ? ' <span style="color:var(--text-secondary);font-size:0.7rem">✓✓</span>'
            : ' <span style="color:var(--text-tertiary);font-size:0.7rem">✓</span>'
        : "";
      const lockIcon =
        msg.encrypted && !isSent
          ? ' <span title="Encrypted" style="font-size:0.6rem;opacity:0.7">Encrypted</span>'
          : "";
      const sentLock =
        msg.encrypted && isSent
          ? ' <span title="Encrypted" style="font-size:0.6rem;opacity:0.5">Encrypted</span>'
          : "";

      const editedLabel = msg.edited
        ? ' <span style="font-size:0.6rem;color:var(--text-tertiary);font-style:italic">(edited)</span>'
        : "";
      const isDeleted = msg.deleted;
      const deletedLabel = isDeleted ? "" : "";

      let bubbleHtml = `${dateSep}<div class="chat-bubble ${isSent ? "sent" : "received"}" style="position:relative" data-msg-id="${msg._id}">
      ${msg.displayText}${editedLabel}${deletedLabel}
      <span style="font-size:0.65rem;opacity:0.6;margin-left:8px;white-space:nowrap">${time}${readTick}${lockIcon}${sentLock}</span>
      ${
        isSent && !isDeleted
          ? `
        <div class="msg-three-dots" onclick="event.stopPropagation();toggleMsgMenu('${msg._id}')">
          <span></span><span></span><span></span>
        </div>
        <div class="msg-dropdown" id="msg-menu-${msg._id}">
          <div class="msg-dropdown-item" onclick="event.stopPropagation();startEditMessage('${msg._id}','${escHtmlForAttr(msg.displayText)}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Edit message
          </div>
          <div class="msg-dropdown-item danger" onclick="event.stopPropagation();deleteChatMessage('${msg._id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            Delete
          </div>
        </div>
      `
          : ""
      }
    </div>
    ${buildReactionsHtml(msg, uid)}
    `;

      // Warnings detection and rendering
      if (detectPhoneContact(msg.displayText)) {
        bubbleHtml += `
        <div class="chat-warning-banner" style="background:var(--warning-light); border: 1px solid var(--warning); padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-primary); margin: 8px auto; width: calc(100% - 32px); max-width: 600px; text-align: left; box-shadow: var(--shadow-sm); line-height: 1.4;">
          Be cautious when sharing your phone number or personal contact details. To avoid spam, scams, and unwanted solicitations, we recommend keeping communication within the platform whenever possible.
        </div>
      `;
      }

      if (detectMoneyRequest(msg.displayText)) {
        bubbleHtml += `
        <div class="chat-warning-banner" style="background:var(--warning-light); border: 1px solid var(--warning); padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-primary); margin: 8px auto; width: calc(100% - 32px); max-width: 600px; text-align: left; box-shadow: var(--shadow-sm); line-height: 1.4;">
          Please avoid sending money without proper investigation and verification. Financial transactions with unknown parties may result in monetary loss. Always verify the legitimacy of the request before making any payment.
        </div>
      `;
      }

      if (linkExchangeRequestRegex.test(msg.displayText)) {
        const domains = extractDomains(msg.displayText);
        let triggerWarning = false;
        if (domains.length === 0) {
          triggerWarning = true;
        } else {
          for (const domain of domains) {
            if (domainVerificationCache[domain] === false) {
              triggerWarning = true;
              break;
            }
          }
        }
        if (triggerWarning) {
          bubbleHtml += `
          <div class="chat-warning-banner" style="background:var(--warning-light); border: 1px solid var(--warning); padding: 12px 16px; border-radius: var(--radius-md); font-size: 0.85rem; color: var(--text-primary); margin: 8px auto; width: calc(100% - 32px); max-width: 600px; text-align: left; box-shadow: var(--shadow-sm); line-height: 1.4;">
            This domain is not verified on our marketplace. Please avoid exchanging links with unverified domains, as their quality, ownership, and SEO metrics cannot be confirmed.
          </div>
        `;
        }
      }

      return bubbleHtml;
    })
    .join("");

  msgsEl.innerHTML = html;
  // Scroll to bottom
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

let sendInProgress = false;
let handlersAttached = false;
let editingMessageId = null;

function bindSendHandlers() {
  if (handlersAttached) return;
  handlersAttached = true;

  const sendBtn = document.getElementById("msgSendBtn");
  const input = document.getElementById("msgInput");

  if (sendBtn) {
    sendBtn.addEventListener("click", doSendMessage);
  }
  if (input) {
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSendMessage();
      }
    });
  }
}

function escHtmlForAttr(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Close message dropdowns and reaction pickers on outside click
document.addEventListener("click", function (e) {
  if (
    !e.target.closest(".msg-dropdown") &&
    !e.target.closest(".msg-three-dots") &&
    !e.target.closest(".reaction-picker") &&
    !e.target.closest(".reaction-add-btn")
  ) {
    document.querySelectorAll(".msg-dropdown.show").forEach((m) => {
      m.classList.remove("show");
      const parent = m.closest(".chat-bubble");
      if (parent) parent.classList.remove("dots-active");
    });
    document
      .querySelectorAll(".reaction-picker.show")
      .forEach((m) => m.classList.remove("show"));
  }
});

function toggleMsgMenu(msgId) {
  // Close all other menus
  document.querySelectorAll(".msg-dropdown.show").forEach((m) => {
    if (m.id !== "msg-menu-" + msgId) {
      m.classList.remove("show");
      // Remove active class from parent bubble
      const parent = m.closest(".chat-bubble");
      if (parent) parent.classList.remove("dots-active");
    }
  });
  const menu = document.getElementById("msg-menu-" + msgId);
  if (menu) {
    menu.classList.toggle("show");
    // Toggle active class on parent bubble to keep dots visible
    const parent = menu.closest(".chat-bubble");
    if (parent) parent.classList.toggle("dots-active");
  }
}

function startEditMessage(msgId, currentText) {
  // Close menu
  document
    .querySelectorAll(".msg-dropdown.show")
    .forEach((m) => m.classList.remove("show"));

  const input = document.getElementById("msgInput");
  if (!input) return;

  editingMessageId = msgId;
  input.value = currentText;
  input.focus();

  // Show edit banner above input
  const area = document.getElementById("msgSendArea");
  let banner = document.getElementById("editBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "editBanner";
    banner.className = "chat-edit-banner";
    area.parentNode.insertBefore(banner, area);
  }
  banner.innerHTML =
    '<span>Editing message</span><button class="cancel-edit" onclick="cancelEditMessage()">Cancel</button>';
  banner.style.display = "flex";

  // Change send button text
  const sendBtn = document.getElementById("msgSendBtn");
  if (sendBtn)
    sendBtn.innerHTML =
      '<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>';
}

function cancelEditMessage() {
  editingMessageId = null;
  const input = document.getElementById("msgInput");
  if (input) input.value = "";
  const banner = document.getElementById("editBanner");
  if (banner) banner.style.display = "none";
  const sendBtn = document.getElementById("msgSendBtn");
  if (sendBtn)
    sendBtn.innerHTML =
      '<svg style="width:16px;height:16px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polyline points="22 2 15 22 11 13 2 9 22 2"/></svg>';
}

async function doSendMessage() {
  if (sendInProgress) return;
  const input = document.getElementById("msgInput");
  if (!input) return;
  const text = input.value.trim();
  if (!text || !currentConversationId || !currentReceiverId) return;

  sendInProgress = true;
  input.value = "";

  // If editing an existing message
  if (editingMessageId) {
    try {
      const token = getSessionToken();
      await client.mutation("messages:editMessage", {
        messageId: editingMessageId,
        newText: text,
        token,
      });
      cancelEditMessage();
      await fetchAndRenderMessages();
    } catch (e) {
      showMsgToast("Failed to edit: " + e.message, "danger");
      input.value = text;
    }
    sendInProgress = false;
    input.disabled = false;
    input.focus();
    return;
  }

  input.disabled = true;

  // Optimistic UI: append bubble immediately
  const msgsEl = document.getElementById("chatMessages");
  if (msgsEl) {
    // Remove empty state if present
    if (msgsEl.querySelector('div[style*="height:100%"]'))
      msgsEl.innerHTML = "";
    const time = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const bubble = document.createElement("div");
    bubble.className = "chat-bubble sent";
    bubble.id = "optimistic-msg";
    bubble.innerHTML = `${text} <span style="font-size:0.65rem;opacity:0.6;margin-left:8px">Sending...</span>`;
    msgsEl.appendChild(bubble);
    msgsEl.scrollTop = msgsEl.scrollHeight;
  }

  try {
    const uid = getUserId();
    const token = getSessionToken();
    // Fetch receiver's public key for E2E encryption
    let encryptedText = text;
    let isEncrypted = false;
    try {
      const receiverUser = await client.query("users:getPublicKey", {
        userId: currentReceiverId,
      });
      if (receiverUser && receiverUser.publicKey) {
        encryptedText = await encryptMessage(text, receiverUser.publicKey);
        isEncrypted = true;
      }
    } catch (e) {
      console.warn("Encryption unavailable, sending plaintext:", e);
    }
    await client.mutation("messages:send", {
      conversationId: currentConversationId,
      receiverId: currentReceiverId,
      text: encryptedText,
      encrypted: isEncrypted || undefined,
      exchangeId: currentExchangeId || undefined,
      senderId: uid || undefined,
      token: token || undefined,
    });
    // Remove optimistic bubble and re-fetch to get proper state
    await fetchAndRenderMessages();
    // Refresh conversations list
    await loadConversations();
  } catch (e) {
    console.error("Send failed:", e);
    // Remove optimistic bubble
    const opt = document.getElementById("optimistic-msg");
    if (opt) opt.remove();
    // Show error toast
    showMsgToast("Failed to send. Please try again.", "danger");
  }

  input.disabled = false;
  input.focus();
  sendInProgress = false;
}

// ---- REACTIONS ----
const REACTION_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function buildReactionsHtml(msg, uid) {
  const reactions = msg.reactions || [];
  if (reactions.length === 0 && !uid) return "";

  // Group by emoji and count
  const counts = {};
  const userReacted = {};
  for (const r of reactions) {
    if (!counts[r.emoji]) counts[r.emoji] = { count: 0, users: [] };
    counts[r.emoji].count++;
    counts[r.emoji].users.push(r.userId);
    if (r.userId === uid) userReacted[r.emoji] = true;
  }

  let html = '<div class="msg-reactions-bar">';

  // Show existing reactions as pills
  const sortedEmojis = Object.keys(counts).sort(
    (a, b) => counts[b].count - counts[a].count,
  );
  for (const emoji of sortedEmojis) {
    const active = userReacted[emoji] ? " active" : "";
    html += `<span class="reaction-pill${active}" onclick="toggleReaction('${msg._id}', '${emoji}')">${emoji} ${counts[emoji].count}</span>`;
  }

  // Add reaction button (+)
  if (!msg.deleted) {
    html += `<span class="reaction-add-btn" onclick="event.stopPropagation();this.parentElement.querySelector('.reaction-picker').classList.toggle('show')">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
      <div class="reaction-picker">
        ${REACTION_EMOJIS.map((e) => `<span class="reaction-option" onclick="event.stopPropagation();toggleReaction('${msg._id}', '${e}')">${e}</span>`).join("")}
      </div>
    </span>`;
  }

  html += "</div>";
  return html;
}

async function toggleReaction(messageId, emoji) {
  try {
    const token = getSessionToken();
    await client.mutation("messages:toggleReaction", {
      messageId,
      emoji,
      token,
    });
    await fetchAndRenderMessages();
  } catch (e) {
    console.error("Reaction failed:", e);
  }
}
// ---- END REACTIONS ----

function showMsgToast(msg, type = "info") {
  const t = document.createElement("div");
  t.style.cssText = `position:fixed;bottom:80px;left:50%;transform:translateX(-50%);background:var(--bg-secondary);border:1px solid var(--border-primary);padding:10px 20px;border-radius:8px;font-size:0.85rem;z-index:9999;box-shadow:0 4px 12px rgba(0,0,0,0.2);color:var(--${type === "danger" ? "danger" : "text-primary"})`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

async function deleteChatMessage(messageId) {
  if (!confirm("Delete this message?")) return;

  try {
    const token = getSessionToken();
    await client.mutation("messages:deleteMessage", {
      messageId,
      token,
    });
    await fetchAndRenderMessages();
  } catch (e) {
    showMsgToast("❌ Failed to delete message: " + e.message, "danger");
  }
}

function startMessagePolling() {
  stopMessagePolling();
  msgPollingTimer = setInterval(async () => {
    if (!currentConversationId) return;
    try {
      const msgs = await client.query("messages:listMessages", {
        conversationId: currentConversationId,
        limit: 100,
      });
      if (msgs && msgs.length !== lastMsgCount) {
        lastMsgCount = msgs.length;
        renderMessages(msgs);
        // Also refresh unread badge on conversations
        loadConversations();
        // Mark as read
        const token = getSessionToken();
        const uid = getUserId();
        client
          .mutation("messages:markRead", {
            conversationId: currentConversationId,
            token,
            userId: uid,
          })
          .catch(() => {});
      }
    } catch (e) {
      /* silent */
    }
  }, 2500);
}

function stopMessagePolling() {
  if (msgPollingTimer) {
    clearInterval(msgPollingTimer);
    msgPollingTimer = null;
  }
}

async function loadExchangeDetails(exchangeId) {
  try {
    const ex = await client.query("exchanges:listByUser", {
      userId: getUserId(),
    });
    const found = (ex || []).find((e) => e._id === exchangeId);
    if (!found) {
      document.getElementById("panelNoExchange").style.display = "";
      document.getElementById("panelExchangeDetails").style.display = "none";
      return;
    }
    currentConversationExchange = found;
    renderExchangePanel(found);
  } catch (e) {
    document.getElementById("panelNoExchange").style.display = "";
    document.getElementById("panelExchangeDetails").style.display = "none";
  }
}

function renderExchangePanel(ex) {
  document.getElementById("panelNoExchange").style.display = "none";
  document.getElementById("panelExchangeDetails").style.display = "";

  const uid = getUserId();
  const isFromUser = ex.fromUserId === uid;

  document.getElementById("panelFromDomain").textContent = isFromUser
    ? ex.fromWebsite?.domain || "Your Website"
    : ex.toWebsite?.domain || "Partner Website";
  document.getElementById("panelFromStats").textContent = isFromUser
    ? `DA ${ex.fromWebsite?.da || "?"}`
    : `DA ${ex.toWebsite?.da || "?"}`;
  document.getElementById("panelToDomain").textContent = isFromUser
    ? ex.toWebsite?.domain || "Partner Website"
    : ex.fromWebsite?.domain || "Your Website";
  document.getElementById("panelToStats").textContent = isFromUser
    ? `DA ${ex.toWebsite?.da || "?"}`
    : `DA ${ex.fromWebsite?.da || "?"}`;

  const statusMap = {
    new: { label: "New Request", cls: "badge-neutral" },
    negotiating: { label: "Negotiating", cls: "badge-warning" },
    accepted: { label: "Accepted", cls: "badge-success" },
    completed: { label: "Completed ✓", cls: "badge-success" },
    rejected: { label: "Declined", cls: "badge-danger" },
  };
  const statusInfo = statusMap[ex.status] || {
    label: ex.status,
    cls: "badge-neutral",
  };
  const badge = document.getElementById("panelStatusBadge");
  badge.textContent = statusInfo.label;
  badge.className = `badge ${statusInfo.cls}`;

  // Show relevant deal action buttons based on status and user role
  const acceptBtn = document.getElementById("panelAcceptBtn");
  const completeBtn = document.getElementById("panelCompleteBtn");
  const negotiateBtn = document.getElementById("panelNegotiateBtn");
  const rejectBtn = document.getElementById("panelRejectBtn");

  // Hide all first
  [acceptBtn, completeBtn, negotiateBtn, rejectBtn].forEach((b) => {
    if (b) b.style.display = "none";
  });

  if (ex.status === "new") {
    // Receiver can accept/reject, sender can move to negotiating
    if (!isFromUser) {
      if (acceptBtn) acceptBtn.style.display = "";
      if (rejectBtn) rejectBtn.style.display = "";
    } else {
      if (negotiateBtn) negotiateBtn.style.display = "";
    }
  } else if (ex.status === "negotiating") {
    if (acceptBtn) acceptBtn.style.display = "";
    if (rejectBtn) rejectBtn.style.display = "";
  } else if (ex.status === "accepted") {
    if (completeBtn) completeBtn.style.display = "";
    if (rejectBtn) rejectBtn.style.display = "";
  }
  // completed and rejected show no action buttons
}

async function dealAction(newStatus) {
  if (!currentExchangeId) return;
  const confirmMap = {
    accepted: "Accept this link exchange deal?",
    completed:
      "Mark this exchange as completed? This will update both parties' reputation.",
    rejected: "Decline this exchange request? This cannot be undone.",
    negotiating: "Move this exchange to Negotiating status?",
  };
  const confirmed = await showCustomConfirm(
    confirmMap[newStatus] || "Confirm this action?",
    "Confirm Action",
    "warning",
  );
  if (!confirmed) return;

  try {
    const token = getSessionToken();
    await client.mutation("exchanges:updateStatus", {
      exchangeId: currentExchangeId,
      status: newStatus,
      token,
    });
    showMsgToast(`✅ Exchange status updated to "${newStatus}"`);
    // Send a system message in chat
    const systemMsgs = {
      accepted:
        "🎉 Deal accepted! Both parties have agreed to the link exchange.",
      completed:
        "✅ Exchange marked as complete! Please verify the backlink is live.",
      rejected: "❌ Exchange has been declined.",
      negotiating:
        "💬 Exchange moved to negotiating. Let's work out the details.",
    };
    if (systemMsgs[newStatus] && currentReceiverId) {
      const uid = getSessionToken();
      await client.mutation("messages:send", {
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
  } catch (e) {
    showMsgToast("❌ Failed to update status: " + e.message, "danger");
  }
}

function viewExchangeFromChat() {
  navigateTo("exchange-requests");
}

// Opens conversation linked to a specific exchange from kanban cards
async function openConversationForExchange(exchangeId, fromUserId, toUserId) {
  if (!isLoggedIn()) {
    showAuthScreen();
    return;
  }
  const uid = getUserId();
  const otherUserId = uid === fromUserId ? toUserId : fromUserId;
  // Initialize crypto key pair before opening conversation
  await getOrCreateKeyPair();
  await startConversationWith(otherUserId, exchangeId, "Exchange Partner");
}

async function startConversationWith(otherUserId, exchangeId, otherUserName) {
  if (!isLoggedIn()) {
    showAuthScreen();
    return;
  }
  // Initialize crypto key pair for E2E encryption
  await getOrCreateKeyPair();
  const uid = getUserId();
  const token = getSessionToken();
  try {
    const convId = await client.mutation("messages:getOrCreateConversation", {
      otherUserId,
      exchangeId: exchangeId || undefined,
      userId: uid || undefined,
      token: token || undefined,
    });
    navigateTo("messages");
    // Wait for nav, then open conversation
    setTimeout(async () => {
      await loadConversations();
      if (convId)
        openConversation(convId, otherUserId, otherUserName || "Partner");
    }, 300);
  } catch (e) {
    showCustomAlert(
      "Failed to start conversation: " + e.message,
      "Error",
      "danger",
    );
  }
}

// =============================================
// NOTIFICATIONS
// =============================================
async function loadNotifications() {
  const uid = getUserId();
  if (!uid) return null;
  try {
    return await client.query("notifications:listByUser", {
      userId: uid,
      limit: 50,
    });
  } catch (e) {
    return null;
  }
}

async function loadAndRenderNotifications() {
  const notifications = await loadNotifications();
  renderNotificationsList(notifications);
  return notifications;
}

// Toggle notification dropdown from header bell
window.toggleNotificationDropdown = async function () {
  let dropdown = document.getElementById("notificationDropdown");
  if (dropdown) {
    dropdown.remove();
    return;
  }

  const notifications = await loadNotifications();
  if (!notifications || notifications.length === 0) {
    showMsgToast("No new notifications", "info");
    return;
  }

  // Create dropdown
  dropdown = document.createElement("div");
  dropdown.id = "notificationDropdown";
  dropdown.style.cssText =
    "position:fixed;top:56px;right:120px;width:340px;max-height:400px;overflow-y:auto;background:var(--bg-secondary);border:1px solid var(--border-light);border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,0.3);z-index:9999;padding:8px";

  dropdown.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px 12px;border-bottom:1px solid var(--border-light);margin-bottom:4px">
      <strong style="font-size:0.9rem">Notifications</strong>
      <span style="font-size:0.75rem;color:var(--text-tertiary)">${notifications.length} new</span>
    </div>
    ${notifications
      .slice(0, 10)
      .map(
        (n) => `
      <div style="padding:10px 12px;border-radius:8px;cursor:pointer;display:flex;gap:10px;align-items:flex-start;${n.read ? "opacity:0.5" : ""}" 
           onclick="window.LinkBuild.markNotificationRead('${n._id}')">
        <span style="font-size:1rem;flex-shrink:0">${n.read ? "🔔" : "🔴"}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:0.85rem;font-weight:600;color:var(--text-primary)">${n.title || "Notification"}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${n.body || ""}</div>
        </div>
      </div>
    `,
      )
      .join("")}
  `;

  document.body.appendChild(dropdown);

  // Close on outside click
  setTimeout(() => {
    const handler = (e) => {
      if (
        !e.target.closest("#notificationDropdown") &&
        !e.target.closest(".topbar-icon-btn")
      ) {
        dropdown?.remove();
        document.removeEventListener("click", handler);
      }
    };
    document.addEventListener("click", handler);
  }, 100);
};

// Mark notification as read
window.markNotificationRead = async function (notificationId) {
  try {
    await client.mutation("notifications:markRead", { notificationId });
  } catch (e) {
    /* ignore */
  }
};

// =============================================
// BACKLINKS
// =============================================
async function loadBacklinks() {
  const uid = getUserId();
  if (!uid) return null;
  try {
    const websites = await client.query("websites:listByOwner", {
      userId: uid,
    });
    if (!websites || websites.length === 0) return [];
    // Get backlinks for all user websites
    const allBacklinks = [];
    for (const site of websites) {
      const bls = await client.query("backlinks:listByWebsite", {
        websiteId: site._id,
      });
      if (bls) allBacklinks.push(...bls);
    }
    renderBacklinkTable(allBacklinks);
    return allBacklinks;
  } catch (e) {
    console.log("🔗 Backlinks:", e.message);
    renderBacklinkTable([]);
    return null;
  }
}

// =============================================
// UI UPDATE FUNCTIONS
// =============================================
function updateKpiCards(kpis) {
  if (!kpis) return;
  const setVal = (id, val, change) => {
    const el = document.getElementById(id);
    if (el)
      el.textContent =
        val !== undefined && val !== null ? Number(val).toLocaleString() : "—";
    const changeEl = document.getElementById(id + "Change");
    if (changeEl) changeEl.textContent = change || "";
  };
  setVal("kpiWebsites", kpis.totalWebsites, `${kpis.totalWebsites} registered`);
  setVal(
    "kpiExchanges",
    kpis.activeExchanges,
    `${kpis.activeExchanges} in progress`,
  );
  setVal(
    "kpiPending",
    kpis.pendingRequests,
    `${kpis.pendingRequests} awaiting action`,
  );
  setVal(
    "kpiBacklinks",
    kpis.verifiedBacklinks,
    `${kpis.verifiedBacklinks} healthy`,
  );
  setVal(
    "kpiReputation",
    kpis.reputationScore,
    `${kpis.reputationScore || 0}/100`,
  );
  setVal(
    "kpiGrowth",
    kpis.monthlyGrowth,
    `${kpis.monthlyGrowth || 0}% this month`,
  );
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
    const map = {
      "Active Backlinks": stats.active,
      "Lost Links": stats.lost,
      "Dofollow Links": stats.dofollow,
      "Nofollow Links": stats.nofollow,
    };
    if (map[label] !== undefined)
      valueEl.textContent = Number(map[label]).toLocaleString();
  });
}

function updateNotificationBadge(count) {
  // Header bell badge
  const bell = document.getElementById("headerBellBadge");
  if (bell) {
    bell.textContent = count > 99 ? "99+" : count;
    bell.style.display = count > 0 ? "flex" : "none";
  }
  // Also update old sidebar badge if it still exists
  const sidebarBadge = document.getElementById("navBadgeNotifications");
  if (sidebarBadge) {
    sidebarBadge.textContent = count > 99 ? "99+" : count;
    sidebarBadge.style.display = count > 0 ? "" : "none";
  }
}

function updateExchangeBadge(count) {
  const badge = document.getElementById("navBadgeExchanges");
  if (badge) {
    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = count > 0 ? "" : "none";
  }
}

function updateMessagesBadge(count) {
  const badge = document.getElementById("navBadgeMessages");
  if (badge) {
    badge.textContent = count > 99 ? "99+" : count;
    badge.style.display = count > 0 ? "" : "none";
  }
}

function updateAllSidebarBadges() {
  const uid = getUserId();
  if (!uid) return;
  // Load notification count
  client
    .query("notifications:unreadCount", { userId: uid })
    .then((count) => {
      if (count !== undefined) updateNotificationBadge(count);
    })
    .catch(() => {});
  // Load exchange requests count (pending = new + negotiating)
  client
    .query("exchanges:listKanban", { userId: uid })
    .then((kanban) => {
      if (kanban) {
        const pending =
          (kanban.new?.length || 0) + (kanban.negotiating?.length || 0);
        updateExchangeBadge(pending);
      }
    })
    .catch(() => {});
  // Load unread messages count (use conversations unread total)
  client
    .query("messages:listConversations", { userId: uid })
    .then((convs) => {
      if (convs) {
        const totalUnread = convs.reduce(
          (sum, c) => sum + (c.unreadCount || 0),
          0,
        );
        updateMessagesBadge(totalUnread);
      }
    })
    .catch(() => {});
}

function updateKanbanBoard(kanban) {
  if (!kanban) return;

  const statusMap = {
    new: { label: "New", cls: "badge-neutral" },
    negotiating: { label: "Negotiating", cls: "badge-warning" },
    accepted: { label: "Accepted", cls: "badge-success" },
    completed: { label: "✓ Done", cls: "badge-purple" },
    rejected: { label: "Declined", cls: "badge-danger" },
  };

  const columns = ["new", "negotiating", "accepted", "completed", "rejected"];

  columns.forEach((status) => {
    const container = document.getElementById(`kanban-${status}`);
    const countEl = document
      .querySelector(`#kanban-${status}`)
      ?.closest(".kanban-column")
      ?.querySelector(".kanban-column-count");
    const items = kanban[status] || [];

    if (countEl) countEl.textContent = items.length;

    if (!container) return;

    if (items.length === 0) {
      container.innerHTML = `<div style="padding:24px 16px;text-align:center;color:var(--text-tertiary);font-size:0.8rem">No ${status} requests</div>`;
      return;
    }

    const uid = getUserId();
    container.innerHTML = items
      .map((ex) => {
        const isFromUser = ex.fromUserId === uid;
        const partnerDomain = isFromUser
          ? ex.toWebsite?.domain || "Partner Website"
          : ex.fromWebsite?.domain || "Partner Website";
        const myDomain = isFromUser
          ? ex.fromWebsite?.domain || "Your Website"
          : ex.toWebsite?.domain || "Your Website";
        const statusInfo = statusMap[ex.status] || {
          label: ex.status,
          cls: "badge-neutral",
        };
        const timeLabel = ex._creationTime
          ? timeAgo(ex._creationTime)
          : "recently";

        return `
        <div class="kanban-card" onclick="window.LinkBuild.openConversationForExchange('${ex._id}', '${ex.fromUserId}', '${ex.toUserId}')" style="cursor:pointer">
          <div class="kanban-card-domain">${myDomain}</div>
          <div class="kanban-card-partner">Partner: ${partnerDomain}</div>
          <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:8px">Anchor: "${ex.fromAnchorText || "N/A"}"</div>
          <div class="kanban-card-meta">
            <span>${timeLabel}</span>
            <span class="badge ${statusInfo.cls}">${statusInfo.label}</span>
          </div>
        </div>`;
      })
      .join("");
  });
}

function renderNotificationsList(notifications) {
  const container = document.getElementById("notificationsList");
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
    exchange_request: {
      bg: "rgba(108,77,246,0.1)",
      color: "var(--primary-purple)",
      svg: '<path d="M16 3h5v5M8 3H3v5"/><path d="M21 3l-7.5 7.5"/>',
    },
    exchange_new: {
      bg: "rgba(108,77,246,0.1)",
      color: "var(--primary-purple)",
      svg: '<path d="M16 3h5v5M8 3H3v5"/><path d="M21 3l-7.5 7.5"/>',
    },
    exchange_negotiating: {
      bg: "var(--warning-light)",
      color: "var(--warning)",
      svg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    },
    exchange_accepted: {
      bg: "var(--success-light)",
      color: "var(--success)",
      svg: '<polyline points="20 6 9 17 4 12"/>',
    },
    exchange_completed: {
      bg: "var(--success-light)",
      color: "var(--success)",
      svg: '<polyline points="20 6 9 17 4 12"/>',
    },
    exchange_rejected: {
      bg: "var(--danger-light)",
      color: "var(--danger)",
      svg: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    },
    new_message: {
      bg: "var(--info-light)",
      color: "var(--info)",
      svg: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    },
    new_exchange: {
      bg: "rgba(108,77,246,0.1)",
      color: "var(--primary-purple)",
      svg: '<path d="M16 3h5v5M8 3H3v5"/><path d="M21 3l-7.5 7.5"/>',
    },
    backlink_alert: {
      bg: "var(--warning-light)",
      color: "var(--warning)",
      svg: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',
    },
    link_removed: {
      bg: "var(--danger-light)",
      color: "var(--danger)",
      svg: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    },
    reputation: {
      bg: "var(--success-light)",
      color: "var(--success)",
      svg: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    },
  };

  container.innerHTML = notifications
    .map((n) => {
      const icon = iconMap[n.type] || iconMap.new_message;
      const isUnread = !n.read;
      const timeLabel = timeAgo(n.createdAt);
      return `
      <div class="notification-item${isUnread ? " unread" : ""}">
        <div class="notification-icon" style="background:${icon.bg}">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="${icon.color}" stroke-width="2">${icon.svg}</svg>
        </div>
        <div class="notification-content">
          <div class="notification-title">${n.title}</div>
          <div class="notification-text">${n.body}</div>
          <div class="notification-time">${timeLabel}</div>
        </div>
      </div>`;
    })
    .join("");
}

function renderBacklinkTable(backlinks) {
  const tbody = document.getElementById("backlinkTableBody");
  if (!tbody) return;

  if (!backlinks || backlinks.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="7" class="text-center py-12 text-slate-400 dark:text-slate-500"><div class="flex flex-col items-center justify-center gap-2"><i class="fa-solid fa-link-slash text-2xl text-slate-300 dark:text-slate-700"></i><span>No backlinks monitored yet. Complete an exchange to start tracking.</span></div></td></tr>';
    return;
  }

  const linkTypeMap = { dofollow: "badge-info", nofollow: "badge-neutral" };
  const statusMap = {
    healthy: "badge-success",
    needs_review: "badge-warning",
    removed: "badge-danger",
  };
  const statusLabel = {
    healthy: "Healthy",
    needs_review: "Needs Review",
    removed: "Removed",
  };
  const healthClass = {
    healthy: "good",
    needs_review: "warning",
    removed: "danger",
  };

  tbody.innerHTML = backlinks
    .map((b) => {
      const healthPct =
        b.healthScore ||
        (b.status === "healthy" ? 98 : b.status === "needs_review" ? 65 : 12);
      const lastChecked = b.lastChecked ? timeAgo(b.lastChecked) : "Never";
      
      const displaySource = b.sourceUrl ? b.sourceUrl.replace(/^(https?:\/\/)?(www\.)?/, "") : "—";
      const displayTarget = b.targetUrl ? b.targetUrl.replace(/^(https?:\/\/)?(www\.)?/, "") : "—";
      
      return `
      <tr>
        <td class="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
          <a href="${b.sourceUrl}" target="_blank" rel="noopener noreferrer" class="text-primary-500 hover:text-primary-600 hover:underline inline-flex items-center gap-1 font-semibold text-sm">
            ${displaySource}
            <i class="fa-solid fa-up-right-from-square text-[10px] opacity-75"></i>
          </a>
        </td>
        <td class="max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
          <a href="${b.targetUrl}" target="_blank" rel="noopener noreferrer" class="text-slate-700 dark:text-slate-300 hover:text-primary-500 hover:underline inline-flex items-center gap-1 font-medium text-sm">
            ${displayTarget}
            <i class="fa-solid fa-up-right-from-square text-[10px] opacity-75"></i>
          </a>
        </td>
        <td class="font-medium">${b.anchorText || "—"}</td>
        <td><span class="badge ${linkTypeMap[b.linkType] || "badge-neutral"}">${b.linkType || "Unknown"}</span></td>
        <td><span class="badge ${statusMap[b.status] || "badge-neutral"}">${statusLabel[b.status] || b.status}</span></td>
        <td class="text-xs text-slate-500 dark:text-slate-400">${lastChecked}</td>
        <td>
          <div class="health-score flex items-center gap-2 text-xs font-bold">
            <div class="health-bar w-[60px] h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div class="health-bar-fill h-full rounded-full ${healthClass[b.status] || "warning"}" style="width:${healthPct}%"></div>
            </div>
            <span>${healthPct}%</span>
          </div>
        </td>
      </tr>`;
    })
    .join("");
}

function renderDashboardWidgets(conversations) {
  const container = document.getElementById("dashboardRecentMessages");
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
  container.innerHTML = recent
    .map((conv) => {
      const name = conv.otherUser?.name || "Unknown User";
      const initials = getInitials(name);
      const color = getAvatarColor(name);
      const preview = conv.lastMessage
        ? conv.lastMessage.slice(0, 55) +
          (conv.lastMessage.length > 55 ? "..." : "")
        : "No messages yet";
      const time = timeAgo(conv.lastMessageAt);
      return `
      <div class="conversation-item" onclick="navigateTo('messages'); setTimeout(() => window.LinkBuild.openConversation('${conv._id}', '${conv.otherUser?._id || ""}', '${name.replace(/'/g, "\\'")}'), 300)" style="cursor:pointer">
        <div class="conversation-avatar" style="background:${color}">${initials}</div>
        <div class="conversation-info">
          <div class="conversation-name">${name}</div>
          <div class="conversation-preview">${preview}</div>
        </div>
        <div class="conversation-time">${time}</div>
      </div>`;
    })
    .join("");
}

function renderDashboardOpportunities(websites) {
  const container = document.getElementById("dashboardOpportunities");
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
  const badgeMap = [
    ["badge-success", "High Match"],
    ["badge-purple", "New"],
    ["badge-warning", "Trending"],
  ];
  container.innerHTML = recent
    .map((w, i) => {
      const [badgeCls, badgeLabel] = badgeMap[i] || [
        "badge-neutral",
        "Available",
      ];
      return `
      <div style="padding:14px 16px;border-bottom:1px solid var(--border-light);display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="font-weight:600;font-size:0.9rem">${w.domain}</div>
          <div style="font-size:0.8rem;color:var(--text-tertiary)">DA ${w.domainAuthority || "?"} · ${w.niche || "Unknown"} · ${w.country || "?"}</div>
        </div>
        <span class="badge ${badgeCls}">${badgeLabel}</span>
      </div>`;
    })
    .join("");
}

function updateMarketplaceTable(websites) {
  const tbody = document.getElementById("marketplaceTableBody");
  if (!tbody) return;

  // Update pagination text
  const paginationEl = document.getElementById("marketplacePaginationText");
  if (paginationEl) {
    const count = websites ? websites.length : 0;
    paginationEl.textContent =
      count > 0
        ? `Showing ${count} result${count !== 1 ? "s" : ""}`
        : "No results";
  }

  // Update stats cards dynamically
  const totalCountEl = document.getElementById("marketSitesTotalCount");
  const avgDAEl = document.getElementById("marketSitesAvgDA");
  const totalTrafficEl = document.getElementById("marketSitesTotalTraffic");

  if (websites) {
    const totalCount = websites.length;
    if (totalCountEl) totalCountEl.textContent = totalCount;

    if (avgDAEl) {
      const avgDA = totalCount > 0 
        ? Math.round(websites.reduce((sum, w) => sum + (w.domainAuthority || 0), 0) / totalCount)
        : 0;
      avgDAEl.textContent = avgDA;
    }

    if (totalTrafficEl) {
      const totalTraffic = websites.reduce((sum, w) => sum + (w.trafficEstimate || 0), 0);
      totalTrafficEl.textContent = formatTraffic(totalTraffic);
    }
  } else {
    if (totalCountEl) totalCountEl.textContent = "0";
    if (avgDAEl) avgDAEl.textContent = "0";
    if (totalTrafficEl) totalTrafficEl.textContent = "0/mo";
  }

  if (!websites || !websites.length) {
    tbody.innerHTML =
      '<tr><td colspan="10" style="text-align:center;padding:40px;color:var(--text-tertiary)"><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"><i class="fa-solid fa-magnifying-glass" style="font-size:1.5rem"></i><span>No websites found. Try adjusting your search filters or check back later.</span></div></td></tr>';
    return;
  }

  const uid = getUserId();
  tbody.innerHTML = websites
    .map((w) => {
      const isOwnWebsite = w.ownerId === uid;
      const listedByLabel = w.listedBy === "agency" 
        ? `<span class="badge" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;font-size:0.8rem;background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border-light)"><i class="fa-solid fa-building" style="color:var(--text-tertiary)"></i> Agency</span>` 
        : `<span class="badge" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;border-radius:6px;font-size:0.8rem;background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border-light)"><i class="fa-solid fa-user" style="color:var(--text-tertiary)"></i> Owner</span>`;

      const actionCell = isOwnWebsite
        ? `<span class="badge" style="font-size:0.75rem;padding:6px 12px;background:var(--bg-tertiary);color:var(--text-tertiary);border:1px solid var(--border-light);border-radius:var(--radius-sm);display:inline-flex;align-items:center;gap:4px"><i class="fa-solid fa-user-check"></i> Your Website</span>`
        : `<div style="display:flex;gap:6px">
            <button class="btn btn-secondary btn-sm" style="display:inline-flex;align-items:center;gap:4px" onclick="window.LinkBuild.startConversationWith('${w.ownerId}', undefined, '${w.domain.replace(/'/g, "\\'")}')">
              <i class="fa-solid fa-comments"></i> Message
            </button>
            <button class="btn btn-primary btn-sm" style="display:inline-flex;align-items:center;gap:4px" id="send-req-${w._id}" onclick="window.LinkBuild.sendExchangeRequest({toUserId:'${w.ownerId}',fromWebsiteId:'',toWebsiteId:'${w._id}',fromAnchorText:'guest post',fromTargetUrl:'https://example.com'}, document.getElementById('send-req-${w._id}'))">
              <i class="fa-solid fa-paper-plane"></i> Send Request
            </button>
          </div>`;

      const domainInitials = (w.domain || "").replace(/^(https?:\/\/)?(www\.)?/, "").slice(0, 2).toUpperCase();

      return `
      <tr>
        <td>
          <div style="display:flex;align-items:center;gap:10px">
            <div style="width:34px;height:34px;border-radius:8px;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:white;font-size:1rem;font-weight:700;flex-shrink:0">
              ${domainInitials}
            </div>
            <div>
              <div style="display:flex;align-items:center;gap:6px">
                <strong style="color:var(--text-primary);font-size:0.9rem">${w.domain}</strong>
                <a href="https://${w.domain}" target="_blank" rel="noopener noreferrer" class="domain-external-link" onclick="event.stopPropagation()" title="Open ${w.domain}" style="display:inline-flex;align-items:center;color:var(--text-tertiary)">
                  <i class="fa-solid fa-up-right-from-square" style="font-size:0.75rem"></i>
                </a>
              </div>
              <div style="margin-top:2px;display:flex;gap:4px">
                ${w.verified ? `<span class="badge badge-success" style="display:inline-flex;align-items:center;gap:3px;font-size:0.65rem;padding:2px 6px"><i class="fa-solid fa-circle-check"></i> Verified</span>` : ""}
              </div>
            </div>
          </div>
        </td>
        <td>
          <span class="badge badge-info" style="display:inline-flex;align-items:center;gap:4px;font-size:0.8rem;padding:4px 8px;border-radius:6px">
            <i class="fa-solid fa-award"></i>
            ${w.domainAuthority}
          </span>
        </td>
        <td>
          <span class="badge ${w.spamScore > 20 ? "badge-danger" : w.spamScore > 10 ? "badge-warning" : "badge-success"}" style="display:inline-flex;align-items:center;gap:4px;font-size:0.8rem;padding:4px 8px;border-radius:6px">
            <i class="fa-solid fa-triangle-exclamation"></i>
            ${w.spamScore || 0}%
          </span>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;font-weight:500;color:var(--text-primary)">
            <i class="fa-solid fa-chart-simple" style="color:var(--success)"></i>
            ${w.trafficEstimate ? formatTraffic(w.trafficEstimate) : "0/mo"}
          </div>
        </td>
        <td>
          <span class="badge" style="display:inline-flex;align-items:center;gap:4px;padding:4px 8px;background:rgba(108, 77, 246, 0.1);color:var(--primary-purple);border-radius:6px;font-size:0.8rem">
            <i class="fa-solid fa-tag" style="opacity:0.8"></i>
            ${w.niche}
          </span>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;color:var(--text-secondary)">
            <i class="fa-solid fa-location-dot" style="color:var(--text-tertiary)"></i>
            ${w.country || "Global"}
          </div>
        </td>
        <td>${listedByLabel}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px;font-size:0.8rem;font-weight:500;color:var(--text-secondary)">
            <div style="width:60px;height:6px;border-radius:3px;background:var(--border-light);overflow:hidden;flex-shrink:0">
              <div style="height:100%;width:${w.exchangeSuccessRate || 85}%;background:linear-gradient(90deg, var(--primary-purple), var(--info))"></div>
            </div>
            <span>${w.exchangeSuccessRate || 85}%</span>
          </div>
        </td>
        <td>
          <div style="display:flex;align-items:center;gap:6px;color:var(--text-primary);font-weight:500">
            <i class="fa-solid fa-link" style="color:var(--text-tertiary);font-size:0.75rem"></i>
            ${w.referringDomains || 0}
          </div>
        </td>
        <td>${actionCell}</td>
      </tr>`;
    })
    .join("");
}

function formatTraffic(traffic) {
  if (!traffic) return "0/mo";
  if (traffic >= 1000000) return (traffic / 1000000).toFixed(1) + "M/mo";
  if (traffic >= 1000) return (traffic / 1000).toFixed(0) + "K/mo";
  return traffic + "/mo";
}

function filterMyWebsites(query) {
  if (!query || !query.trim()) {
    updateWebsitesTable(cachedMyWebsites, true);
    return;
  }
  const q = query.toLowerCase().trim();
  const filtered = cachedMyWebsites.filter(
    (w) =>
      w.domain.toLowerCase().includes(q) ||
      w.niche.toLowerCase().includes(q) ||
      w.country.toLowerCase().includes(q)
  );
  updateWebsitesTable(filtered, true);
}

function updateWebsitesTable(mySites, isFiltering = false) {
  // Update stats if we are not filtering the view
  if (!isFiltering) {
    const totalEl = document.getElementById("mySitesTotalCount");
    const avgDAEl = document.getElementById("mySitesAvgDA");
    const trafficEl = document.getElementById("mySitesTotalTraffic");
    
    if (totalEl) totalEl.textContent = mySites ? mySites.length : 0;
    if (avgDAEl) {
      const avg = mySites && mySites.length ? Math.round(mySites.reduce((sum, s) => sum + (s.domainAuthority || 0), 0) / mySites.length) : 0;
      avgDAEl.textContent = avg;
    }
    if (trafficEl) {
      const totalTraffic = mySites ? mySites.reduce((sum, s) => sum + (s.trafficEstimate || 0), 0) : 0;
      trafficEl.textContent = formatTraffic(totalTraffic);
    }
  }

  const tbody = document.getElementById("myWebsitesTableBody");
  if (!tbody) return;
  if (!mySites || !mySites.length) {
    tbody.innerHTML = isFiltering
      ? '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-tertiary)"><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"><i class="fa-solid fa-magnifying-glass" style="font-size:1.5rem"></i><span>No matching websites found.</span></div></td></tr>'
      : '<tr><td colspan="8" style="text-align:center;padding:40px;color:var(--text-tertiary)"><div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"><i class="fa-solid fa-folder-open" style="font-size:1.5rem"></i><span>No websites yet. Click "Add Website" to get started.</span></div></td></tr>';
    return;
  }

  tbody.innerHTML = mySites
    .map(
      (w) => {
        const dateStr = w._creationTime ? timeAgo(w._creationTime) : "recently";
        const trafficStr = w.trafficEstimate ? formatTraffic(w.trafficEstimate) : "0/mo";
        return `
        <tr>
          <td>
            <div style="display:flex;align-items:center;gap:10px">
              <div style="width:34px;height:34px;border-radius:8px;background:var(--primary-gradient);display:flex;align-items:center;justify-content:center;color:white;font-size:1.1rem;flex-shrink:0">
                <i class="fa-solid fa-globe"></i>
              </div>
              <div>
                <div style="font-weight:600;color:var(--text-primary);font-size:0.9rem">${w.domain}</div>
                <div style="font-size:0.75rem;color:var(--text-tertiary)">Added ${dateStr}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge badge-info" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:0.8rem">
              <i class="fa-solid fa-award"></i>
              ${w.domainAuthority}
            </span>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;font-weight:500;color:var(--text-primary)">
              <i class="fa-solid fa-chart-simple" style="color:var(--success)"></i>
              ${trafficStr}
            </div>
          </td>
          <td>
            <span class="badge" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;background:rgba(108, 77, 246, 0.1);color:var(--primary-purple);border-radius:6px;font-size:0.8rem">
              <i class="fa-solid fa-tag" style="opacity:0.8"></i>
              ${w.niche}
            </span>
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;color:var(--text-secondary)">
              <i class="fa-solid fa-location-dot" style="color:var(--text-tertiary)"></i>
              ${w.country}
            </div>
          </td>
          <td>
            ${
              w.verified
                ? `<span class="badge badge-success" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:0.8rem">
                    <i class="fa-solid fa-circle-check"></i>
                    Verified
                  </span>`
                : `<span class="badge badge-warning" style="display:inline-flex;align-items:center;gap:5px;padding:4px 10px;border-radius:6px;font-size:0.8rem">
                    <i class="fa-solid fa-circle-exclamation"></i>
                    Pending
                  </span>`
            }
          </td>
          <td>
            <div style="display:flex;align-items:center;gap:6px;font-weight:600;color:var(--text-primary)">
              <i class="fa-solid fa-link" style="color:var(--primary-purple);opacity:0.8"></i>
              ${w.referringDomains || 0}
            </div>
          </td>
          <td style="text-align:right">
            ${
              w.verified
                ? `<div class="action-dropdown" id="action-dd-${w._id}" style="display:inline-block">
                    <button class="btn btn-secondary btn-sm" onclick="window.LinkBuild.toggleActionDropdown('${w._id}')" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px">
                      <i class="fa-solid fa-ellipsis-vertical"></i>
                      Manage
                    </button>
                    <div class="action-dropdown-menu" id="action-menu-${w._id}">
                      <button class="action-dropdown-item" onclick="window.LinkBuild.editWebsite('${w._id}')">
                        <i class="fa-solid fa-pen-to-square" style="color:var(--info);margin-right:8px"></i>Edit
                      </button>
                      <button class="action-dropdown-item warning" onclick="window.LinkBuild.deactivateWebsite('${w._id}')">
                        <i class="fa-solid fa-circle-pause" style="color:var(--warning);margin-right:8px"></i>Deactivate
                      </button>
                      <div class="action-dropdown-divider"></div>
                      <button class="action-dropdown-item danger" onclick="window.LinkBuild.deleteWebsite('${w._id}')">
                        <i class="fa-solid fa-trash-can" style="color:var(--danger);margin-right:8px"></i>Delete
                      </button>
                    </div>
                  </div>`
                : `<button class="btn btn-primary btn-sm" onclick="window.LinkBuild.openVerifyModal('${w._id}')" style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:6px">
                    <i class="fa-solid fa-shield-halved"></i>
                    Verify
                  </button>`
            }
          </td>
        </tr>`;
      }
    )
    .join("");
}

// =============================================
// VERIFICATION FUNCTIONS
// =============================================
async function getVerificationInfo(websiteId) {
  try {
    const result = await client.query("websites:getVerificationInfo", {
      websiteId,
    });
    return result;
  } catch (e) {
    console.error("Failed to get verification info:", e);
    return null;
  }
}

async function checkAndVerifyWebsite(
  websiteId,
  domain,
  verificationCode,
  method,
) {
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
    return {
      success: false,
      message: "Verification check failed. Please try again.",
    };
  }
}
// SETTINGS PAGE POPULATION
// =============================================
function populateSettingsPage(user) {
  const nameEl = document.getElementById("settingsDisplayName");
  const emailEl = document.getElementById("settingsEmail");
  const roleEl = document.getElementById("settingsRole");
  
  const roleLabels = {
    free: "Free Plan",
    pro: "Pro Plan",
    agency: "Agency Plan",
    admin: "Administrator",
  };

  if (nameEl) nameEl.value = user.name || "";
  if (emailEl) emailEl.value = user.email || "";
  if (roleEl) {
    roleEl.value = roleLabels[user.role] || user.role || "Free Plan";
  }

  // Update new modern settings banner if present
  const bannerAvatarEl = document.getElementById("settingsBannerAvatar");
  const bannerNameEl = document.getElementById("settingsBannerName");
  const bannerEmailEl = document.getElementById("settingsBannerEmail");
  const bannerRoleEl = document.getElementById("settingsBannerRoleBadge");

  if (bannerAvatarEl && user.name) {
    bannerAvatarEl.textContent = user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  if (bannerNameEl) bannerNameEl.textContent = user.name || "User";
  if (bannerEmailEl) bannerEmailEl.textContent = user.email || "";
  if (bannerRoleEl) {
    bannerRoleEl.textContent = roleLabels[user.role] || user.role || "Free Plan";
  }
}

// =============================================
// INIT
// =============================================
async function init() {
  console.log("🔌 LinkBuild: Initializing...");
  checkSafetyNotice();
  const token = getSessionToken();
  const storedUser = localStorage.getItem("linkbuild-user");
  const onDashboard = window.location.pathname.includes("dashboard");

  // On dashboard: auth overlay is shown by default and non-closeable.
  // showAuthScreen() will handle close button visibility based on page context.

  if (token) {
    try {
      // Query the me endpoint with our session token to verify validity
      if (!client) {
        console.warn("🔌 Convex client not ready yet, will retry...");
        // Retry after a short delay
        setTimeout(() => init(), 500);
        return;
      }
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
        // Redirect admin users to admin panel if on dashboard
        if (onDashboard && user.role === "admin") {
          console.log("🔌 Admin user detected, redirecting to admin panel...");
          const isCleanUrl = !window.location.pathname.includes(".html");
          window.location.replace(isCleanUrl ? "/admin" : "admin.html");
          return;
        }
        // Only load dashboard data when confirmed logged in
        if (onDashboard) {
          loadDashboardData().catch(() => {});
          updateAllSidebarBadges();
        }
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
          // Redirect admin users to admin panel
          if (onDashboard && currentUser.role === "admin") {
            console.log(
              "🔌 Admin user (offline), redirecting to admin panel...",
            );
            const isCleanUrl = !window.location.pathname.includes(".html");
            window.location.replace(isCleanUrl ? "/admin" : "admin.html");
            return;
          }
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

// Admin panel wrappers
async function getAdminStats() {
  const token = localStorage.getItem("linkbuild-token");
  if (!token) return null;
  try {
    return await client.query("users:adminStats", { token });
  } catch (e) {
    console.error("Error getting admin stats:", e);
    return null;
  }
}

async function getAdminUsers(limit = 100) {
  const token = localStorage.getItem("linkbuild-token");
  if (!token) return [];
  try {
    return await client.query("users:listAll", { token, limit });
  } catch (e) {
    console.error("Error getting admin users:", e);
    return [];
  }
}

async function updateAdminUserRole(userId, role) {
  const token = localStorage.getItem("linkbuild-token");
  if (!token) return { success: false, error: "Not logged in" };
  try {
    return await client.mutation("users:updateRole", { token, userId, role });
  } catch (e) {
    return {
      success: false,
      error: formatConvexError(e, "Failed to update role"),
    };
  }
}

async function banAdminUser(userId) {
  const token = localStorage.getItem("linkbuild-token");
  if (!token) return { success: false, error: "Not logged in" };
  try {
    return await client.mutation("users:banUser", { token, userId });
  } catch (e) {
    return {
      success: false,
      error: formatConvexError(e, "Failed to ban user"),
    };
  }
}

async function deleteAdminUser(userId) {
  const token = localStorage.getItem("linkbuild-token");
  if (!token) return { success: false, error: "Not logged in" };
  try {
    return await client.mutation("users:deleteUser", { token, userId });
  } catch (e) {
    return {
      success: false,
      error: formatConvexError(e, "Failed to delete user"),
    };
  }
}

async function getPendingWebsites() {
  const token = localStorage.getItem("linkbuild-token");
  if (!token) return [];
  try {
    return await client.query("websites:listPending", { token });
  } catch (e) {
    console.error("Error getting pending websites:", e);
    return [];
  }
}

async function moderateAdminWebsite(websiteId, status) {
  const token = localStorage.getItem("linkbuild-token");
  if (!token) return { success: false, error: "Not logged in" };
  try {
    return await client.mutation("websites:moderate", {
      token,
      websiteId,
      status,
    });
  } catch (e) {
    return {
      success: false,
      error: formatConvexError(e, "Failed to moderate website"),
    };
  }
}

// =============================================
// WEBSITE ACTION FUNCTIONS (Edit, Delete, Deactivate)
// =============================================

// Close all dropdowns and restore them to original containers (portal cleanup)
function closeAllDropdownsAndRestore() {
  document.querySelectorAll(".action-dropdown-menu.show").forEach((menu) => {
    menu.classList.remove("show");
    // Move back to original container if it was portaled to body
    const ddId = menu.id.replace("action-menu-", "action-dd-");
    const originalContainer = document.getElementById(ddId);
    if (originalContainer && menu.parentElement !== originalContainer) {
      originalContainer.appendChild(menu);
      menu.style.position = "";
      menu.style.top = "";
      menu.style.left = "";
      menu.style.zIndex = "";
    }
  });
}

// Toggle the action dropdown menu (portal-based to avoid clipping from table-container overflow)
function toggleActionDropdown(websiteId) {
  const menu = document.getElementById("action-menu-" + websiteId);
  if (!menu) return;

  const isCurrentlyOpen = menu.classList.contains("show");

  // Close ALL open dropdowns first
  document.querySelectorAll(".action-dropdown-menu.show").forEach((m) => {
    m.classList.remove("show");
  });

  if (isCurrentlyOpen) {
    // Was open, now closed — move back to original parent
    const originalContainer = document.getElementById("action-dd-" + websiteId);
    if (originalContainer && menu.parentElement !== originalContainer) {
      originalContainer.appendChild(menu);
    }
    return;
  }

  // Move menu to body (portal) to avoid clipping by table-container overflow
  const btn = document.querySelector(`#action-dd-${websiteId} button`);
  if (btn) {
    const btnRect = btn.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.top = btnRect.bottom + 4 + "px";
    menu.style.left = btnRect.right - 170 + "px"; // 170px = min-width of dropdown
    menu.style.zIndex = "9999";
    document.body.appendChild(menu);
  } else {
    // Fallback: just move to body
    document.body.appendChild(menu);
  }

  menu.classList.add("show");
}

// Close dropdowns when clicking outside (portal-aware)
document.addEventListener("click", function (e) {
  if (
    !e.target.closest(".action-dropdown") &&
    !e.target.closest(".action-dropdown-menu")
  ) {
    closeAllDropdownsAndRestore();
  }
});

// Edit website — opens a modal with editable fields
async function editWebsite(websiteId) {
  // Close dropdown and return to original container
  closeAllDropdownsAndRestore();

  const mySites = await loadMyWebsites();
  const site = mySites.find((s) => s._id === websiteId);
  if (!site) {
    alert("Website not found");
    return;
  }

  // Build edit modal HTML
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay";
  overlay.id = "editWebsiteModal";
  overlay.style.cssText = "opacity:1;visibility:visible;z-index:1001;";
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:520px;max-height:90vh;overflow-y:auto;">
      <div class="modal-header" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
        <h2 style="margin:0;">✏️ Edit Website</h2>
        <button style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--text-secondary);" onclick="this.closest('.modal-overlay').remove()">✕</button>
      </div>
      <div class="modal-body" style="display:flex;flex-direction:column;gap:16px;">
        <div>
          <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Domain</label>
          <input type="text" id="editDomain" class="input" value="${site.domain}" style="width:100%;">
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Niche</label>
            <select id="editNiche" class="input" style="width:100%;">
              ${["Automotive", "Blogging", "Construction", "E-commerce", "Education", "Energy", "Entertainment", "Fashion & Beauty", "Finance", "Food & Beverage", "Government", "Health & Wellness", "Insurance", "Legal", "Manufacturing", "Marketing", "News & Media", "Non-Profit", "Real Estate", "SaaS", "SEO Tools", "Sports", "Tech", "Telecommunications", "Travel", "Other"].map((n) => `<option value="${n}" ${site.niche === n ? "selected" : ""}>${n}</option>`).join("")}
            </select>
          </div>
          <div>
            <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Country</label>
            <input type="text" id="editCountry" class="input" value="${site.country || ""}" style="width:100%;">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Domain Authority</label>
            <input type="number" id="editDA" class="input" value="${site.domainAuthority || 0}" min="0" max="100" style="width:100%;">
          </div>
          <div>
            <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Spam Score</label>
            <input type="number" id="editSpamScore" class="input" value="${site.spamScore || 0}" min="0" max="100" style="width:100%;">
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
          <div>
            <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Traffic Estimate</label>
            <input type="number" id="editTraffic" class="input" value="${site.trafficEstimate || 0}" style="width:100%;">
          </div>
          <div>
            <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Referring Domains</label>
            <input type="number" id="editRefDomains" class="input" value="${site.referringDomains || 0}" style="width:100%;">
          </div>
        </div>
        <div>
          <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Language</label>
          <input type="text" id="editLanguage" class="input" value="${site.language || "English"}" style="width:100%;">
        </div>
        <div>
          <label style="font-size:0.85rem;font-weight:600;margin-bottom:6px;display:block;">Listed By</label>
          <select id="editListedBy" class="input" style="width:100%;">
            <option value="owner" ${site.listedBy === "owner" ? "selected" : ""}>👤 Website Owner</option>
            <option value="agency" ${site.listedBy === "agency" ? "selected" : ""}>🏢 Agency / Reseller</option>
          </select>
        </div>
        <div id="editWebsiteError" style="color:var(--danger);font-size:0.85rem;display:none;"></div>
      </div>
      <div class="modal-footer" style="margin-top:24px;display:flex;gap:12px;justify-content:flex-end;">
        <button class="btn btn-secondary" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn btn-primary" id="saveEditBtn" onclick="window.LinkBuild.saveWebsiteEdit('${websiteId}')">💾 Save Changes</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.classList.add("active");
  overlay.classList.remove("hidden");
}

// Save edited website
async function saveWebsiteEdit(websiteId) {
  const btn = document.getElementById("saveEditBtn");
  const errorEl = document.getElementById("editWebsiteError");
  btn.disabled = true;
  btn.textContent = "Saving...";
  if (errorEl) errorEl.style.display = "none";

  try {
    const domain = document.getElementById("editDomain").value.trim();
    const niche = document.getElementById("editNiche").value;
    const country = document.getElementById("editCountry").value.trim();
    const domainAuthority =
      parseInt(document.getElementById("editDA").value) || 0;
    const spamScore =
      parseInt(document.getElementById("editSpamScore").value) || 0;
    const trafficEstimate =
      parseInt(document.getElementById("editTraffic").value) || 0;
    const referringDomains =
      parseInt(document.getElementById("editRefDomains").value) || 0;
    const language = document.getElementById("editLanguage").value.trim();
    const listedBy = document.getElementById("editListedBy")?.value || "owner";
    const token = getSessionToken();

    if (!domain) {
      throw new Error("Domain is required");
    }

    await client.mutation("websites:update", {
      websiteId,
      token,
      domain,
      niche,
      country,
      language,
      listedBy,
      domainAuthority,
      spamScore,
      trafficEstimate,
      referringDomains,
    });

    // Close modal and refresh
    document.getElementById("editWebsiteModal").remove();
    await refreshMyWebsites();
  } catch (err) {
    if (errorEl) {
      errorEl.textContent = err.message || "Failed to save changes";
      errorEl.style.display = "block";
    }
  } finally {
    btn.disabled = false;
    btn.textContent = "💾 Save Changes";
  }
}

// Delete website
async function deleteWebsite(websiteId) {
  // Close dropdown and return to original container
  closeAllDropdownsAndRestore();

  const confirmed = await showCustomConfirm(
    "Are you sure you want to permanently delete this website? This will also remove all associated backlinks. This action cannot be undone.",
    "Delete Website",
    "danger",
  );

  if (!confirmed) return;

  try {
    await client.mutation("websites:remove", {
      websiteId,
      token: getSessionToken(),
    });
    await refreshMyWebsites();
  } catch (err) {
    alert("Failed to delete website: " + (err.message || "Unknown error"));
  }
}

// Deactivate website
async function deactivateWebsite(websiteId) {
  // Close dropdown and return to original container
  closeAllDropdownsAndRestore();

  const confirmed = await showCustomConfirm(
    "Deactivating this website will hide it from the marketplace and remove its verified status. You can re-add it later. Continue?",
    "Deactivate Website",
    "warning",
  );

  if (!confirmed) return;

  try {
    await client.mutation("websites:deactivate", {
      websiteId,
      token: getSessionToken(),
    });
    await refreshMyWebsites();
  } catch (err) {
    alert("Failed to deactivate website: " + (err.message || "Unknown error"));
  }
}

// Refresh the My Websites table
async function refreshMyWebsites() {
  const sites = await loadMyWebsites();
  updateWebsitesTable(sites);
}

// =============================================
// GLOBAL API
// =============================================
window.LinkBuild = {
  client: null,
  getClient: () => client,
  signup,
  login,
  loginWithGoogle,
  logout,
  isLoggedIn,
  getCurrentUser,
  getUserId,
  loadDashboardData,
  loadMyWebsites,
  addWebsite,
  loadMarketplace,
  loadExchangeRequests,
  sendExchangeRequest,
  loadNotifications,
  loadAndRenderNotifications,
  loadBacklinks,
  hideAuthScreen,
  showAuthScreen,
  populateSettingsPage,
  getVerificationInfo,
  checkAndVerifyWebsite,
  updateAllSidebarBadges,
  // Messaging
  loadConversations,
  renderConversationsList,
  filterConversations,
  openConversation,
  startConversationWith,
  openConversationForExchange,
  dealAction,
  viewExchangeFromChat,
  // Admin Panel
  getAdminStats,
  getAdminUsers,
  updateAdminUserRole,
  banAdminUser,
  deleteAdminUser,
  getPendingWebsites,
  moderateAdminWebsite,
  // Website Actions
  toggleActionDropdown,
  editWebsite,
  saveWebsiteEdit,
  deleteWebsite,
  deactivateWebsite,
  filterMyWebsites,
  // Notifications
  toggleNotificationDropdown,
  markNotificationRead,
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initClient);
} else {
  initClient();
}
