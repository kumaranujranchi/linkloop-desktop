/* =============================================
   LinkLoop — Convex Integration Layer
   Bridges Convex backend with the HTML UI
   ============================================= */

import { ConvexClient } from "convex";

// =============================================
// CONFIGURATION
// =============================================
// After running `npx convex deploy`, replace this URL:
const CONVEX_URL = "https://vibrant-marmot-366.convex.cloud";

const client = new ConvexClient(CONVEX_URL);

// Track current user (replace with real auth later)
let currentUserId = null;

// =============================================
// INITIALIZATION
// =============================================
async function initConvex() {
  console.log("🔌 Convex: Initializing...");

  try {
    // Try to load existing user or create demo user
    const stored = localStorage.getItem("linkloop-user-id");
    if (stored) {
      currentUserId = stored;
      console.log("🔌 Convex: User session restored:", currentUserId);
    } else {
      // Create demo user for testing
      const email = "demo@linkloop.io";
      const name = "Anuj Kumar";
      try {
        // This needs auth — for demo, we use a placeholder
        // In production, use Convex Auth
        console.log("🔌 Convex: Using demo mode (no auth)");
      } catch (e) {
        console.warn("Convex auth not configured:", e.message);
      }
    }

    // Load dashboard data
    await loadDashboardData();

    // Set up real-time subscriptions
    setupSubscriptions();

    console.log("🔌 Convex: Ready!");
  } catch (e) {
    console.warn("🔌 Convex: Backend not connected — using demo data:", e.message);
    // UI already has static demo data, so no action needed
  }
}

// =============================================
// DASHBOARD DATA LOADING
// =============================================
async function loadDashboardData() {
  try {
    // Fetch KPIs
    const kpis = await client.query("analytics:dashboardKpis", {});
    if (kpis) {
      updateKpiCards(kpis);
    }

    // Fetch exchange activity for chart
    const activity = await client.query("analytics:exchangeActivity", { months: 6 });
    if (activity) {
      updateExchangeChart(activity);
    }

    // Fetch backlink stats
    const backlinkStats = await client.query("backlinks:stats", {});
    if (backlinkStats) {
      updateBacklinkStats(backlinkStats);
    }

    // Fetch conversations
    if (currentUserId) {
      const conversations = await client.query("messages:listConversations", {
        userId: currentUserId,
      });
      if (conversations && conversations.length > 0) {
        updateConversationsList(conversations);
      }
    }

    // Fetch notifications count
    if (currentUserId) {
      const unreadCount = await client.query("notifications:unreadCount", {
        userId: currentUserId,
      });
      if (unreadCount !== undefined) {
        updateNotificationBadge(unreadCount);
      }
    }

  } catch (e) {
    console.log("📊 Using demo data (Convex not connected):", e.message);
  }
}

// =============================================
// REAL-TIME SUBSCRIPTIONS
// =============================================
function setupSubscriptions() {
  if (!currentUserId) return;

  // Only subscribe to notifications (lightweight)
  try {
    client.subscribe("notifications:unreadCount", { userId: currentUserId }, (count) => {
      if (count !== undefined) updateNotificationBadge(count);
    });
  } catch (e) { /* subscription not critical */ }

  // NOTE: Dashboard KPI subscription removed to prevent chart flicker.
  // Dashboard data is loaded once on page load via loadDashboardData().
  // Other subscriptions (Kanban, Conversations) activate only on their pages.
}

// Track which page subscriptions are active
let activePageSubscriptions = {};

function setupPageSubscriptions(pageName) {
  if (!currentUserId) return;

  // Clean up previous page subscriptions
  // (Convex client handles this — we just track state)
  
  if (pageName === "exchange-requests" && !activePageSubscriptions.exchanges) {
    activePageSubscriptions.exchanges = true;
    try {
      client.subscribe("exchanges:listKanban", { userId: currentUserId }, (kanban) => {
        if (kanban) updateKanbanBoard(kanban);
      });
    } catch (e) { /* silent */ }
  }

  if (pageName === "messages" && !activePageSubscriptions.conversations) {
    activePageSubscriptions.conversations = true;
    try {
      client.subscribe("messages:listConversations", { userId: currentUserId }, (convs) => {
        if (convs) updateConversationsList(convs);
      });
    } catch (e) { /* silent */ }
  }
}

// =============================================
// MARKETPLACE DATA
// =============================================
async function loadMarketplace(filters = {}) {
  try {
    const websites = await client.query("websites:list", {
      ...filters,
      limit: 20,
    });
    updateMarketplaceTable(websites);
    return websites;
  } catch (e) {
    console.log("🏪 Marketplace: Using demo data");
    return null;
  }
}

async function searchMarketplace(query) {
  try {
    return await client.query("websites:search", { query, limit: 10 });
  } catch (e) {
    return null;
  }
}

// =============================================
// WEBSITE DETAIL
// =============================================
async function loadWebsiteDetail(websiteId) {
  try {
    const website = await client.query("websites:getById", { websiteId });
    if (website) updateWebsiteDetail(website);
    return website;
  } catch (e) {
    return null;
  }
}

// =============================================
// EXCHANGE REQUESTS
// =============================================
async function loadExchangeRequests() {
  if (!currentUserId) return null;
  try {
    const kanban = await client.query("exchanges:listKanban", {
      userId: currentUserId,
    });
    if (kanban) updateKanbanBoard(kanban);
    return kanban;
  } catch (e) {
    return null;
  }
}

async function sendExchangeRequest(data) {
  try {
    return await client.mutation("exchanges:send", data);
  } catch (e) {
    console.error("Failed to send exchange request:", e);
    return null;
  }
}

async function updateExchangeStatus(exchangeId, status) {
  try {
    return await client.mutation("exchanges:updateStatus", {
      exchangeId,
      status,
    });
  } catch (e) {
    console.error("Failed to update exchange status:", e);
    return null;
  }
}

// =============================================
// MESSAGES
// =============================================
async function loadConversations() {
  if (!currentUserId) return null;
  try {
    return await client.query("messages:listConversations", {
      userId: currentUserId,
    });
  } catch (e) {
    return null;
  }
}

async function loadMessages(conversationId) {
  try {
    return await client.query("messages:listMessages", {
      conversationId,
      limit: 50,
    });
  } catch (e) {
    return null;
  }
}

async function sendMessage(data) {
  try {
    return await client.mutation("messages:send", data);
  } catch (e) {
    console.error("Failed to send message:", e);
    return null;
  }
}

async function createConversation(otherUserId, exchangeId) {
  try {
    return await client.mutation("messages:getOrCreateConversation", {
      otherUserId,
      exchangeId,
    });
  } catch (e) {
    return null;
  }
}

// =============================================
// NOTIFICATIONS
// =============================================
async function loadNotifications() {
  if (!currentUserId) return null;
  try {
    return await client.query("notifications:listByUser", {
      userId: currentUserId,
      limit: 50,
    });
  } catch (e) {
    return null;
  }
}

async function markNotificationRead(notificationId) {
  try {
    await client.mutation("notifications:markRead", { notificationId });
  } catch (e) { /* silent */ }
}

async function markAllNotificationsRead() {
  if (!currentUserId) return;
  try {
    await client.mutation("notifications:markAllRead", { userId: currentUserId });
  } catch (e) { /* silent */ }
}

// =============================================
// BACKLINK MONITOR
// =============================================
async function loadBacklinks(websiteId) {
  try {
    return await client.query("backlinks:listByWebsite", { websiteId });
  } catch (e) {
    return null;
  }
}

async function loadBacklinkStats() {
  try {
    return await client.query("backlinks:stats", {});
  } catch (e) {
    return null;
  }
}

// =============================================
// WEBSITE MANAGEMENT
// =============================================
async function addWebsite(data) {
  try {
    return await client.mutation("websites:add", data);
  } catch (e) {
    console.error("Failed to add website:", e);
    return null;
  }
}

// =============================================
// UI UPDATE FUNCTIONS
// =============================================
function updateKpiCards(kpis) {
  if (!kpis) return;

  // Only update values that are > 0 (avoid overwriting demo data with zeros)
  document.querySelectorAll(".kpi-card").forEach((card) => {
    const label = card.querySelector(".kpi-card-label")?.textContent?.trim();
    const valueEl = card.querySelector(".kpi-card-value");
    if (!valueEl) return;

    const labelMap = {
      "Total Websites": kpis.totalWebsites,
      "Active Exchanges": kpis.activeExchanges,
      "Pending Requests": kpis.pendingRequests,
      "Verified Backlinks": kpis.verifiedBacklinks,
    };

    const newValue = labelMap[label];
    if (newValue !== undefined && newValue !== null && newValue > 0) {
      valueEl.textContent = newValue.toLocaleString();
    }
  });
}

function updateExchangeChart(activity) {
  const chart = window.__charts?.exchangeActivity;
  if (!chart || !activity) return;

  // Only update if there's actual data (non-empty arrays)
  const hasData = activity.some((a) => a.created > 0 || a.completed > 0);
  if (!hasData) return; // Keep existing demo data

  chart.data.labels = activity.map((a) => a.month);
  chart.data.datasets[0].data = activity.map((a) => a.completed);
  chart.data.datasets[1].data = activity.map((a) => a.created);
  chart.update("none"); // Use 'none' for silent update without animation
}

function updateBacklinkStats(stats) {
  if (!stats) return;
  document.querySelectorAll(".kpi-card").forEach((card) => {
    const label = card.querySelector(".kpi-card-label")?.textContent?.trim();
    const valueEl = card.querySelector(".kpi-card-value");
    if (!valueEl) return;

    const labelMap = {
      "Active Backlinks": stats.active,
      "Lost Links": stats.lost,
      "Dofollow Links": stats.dofollow,
      "Nofollow Links": stats.nofollow,
    };

    if (labelMap[label] !== undefined) {
      valueEl.textContent = labelMap[label].toLocaleString();
    }
  });
}

function updateConversationsList(conversations) {
  // Update conversation list in messages page
  const container = document.querySelector(".conversations-list");
  if (!container) return;

  // Only update if on messages page
  if (!document.getElementById("page-messages")?.classList.contains("active")) return;

  // Keep existing demo items if no real data
  if (!conversations || conversations.length === 0) return;

  // Build new conversation items
  const existingItems = container.querySelectorAll(".conversation-item");
  // Don't replace if already has demo data and no new data
  if (existingItems.length > 0 && conversations.length <= existingItems.length) return;
}

function updateKanbanBoard(kanban) {
  if (!kanban) return;
  // Update Kanban column counts
  const columns = {
    new: kanban.new?.length || 0,
    negotiating: kanban.negotiating?.length || 0,
    accepted: kanban.accepted?.length || 0,
    completed: kanban.completed?.length || 0,
    rejected: kanban.rejected?.length || 0,
  };

  document.querySelectorAll(".kanban-column-count").forEach((countEl) => {
    const column = countEl.closest(".kanban-column");
    const title = column?.querySelector(".kanban-column-title")?.textContent?.trim().toLowerCase();
    const statusMap = {
      "new requests": "new",
      "negotiating": "negotiating",
      "accepted": "accepted",
      "completed": "completed",
      "rejected": "rejected",
    };
    const key = Object.entries(statusMap).find(([k]) => title?.includes(k))?.[1];
    if (key && columns[key] !== undefined) {
      countEl.textContent = columns[key];
    }
  });
}

function updateNotificationBadge(count) {
  // Update notification badge in topbar
  const badge = document.querySelector(".nav-item[data-page='notifications'] .nav-badge");
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? "inline" : "none";
  }

  // Update topbar notification dot
  const dot = document.querySelector(".topbar-icon-btn .dot");
  if (dot) {
    dot.style.display = count > 0 ? "block" : "none";
  }
}

function updateWebsiteDetail(website) {
  // This would update the website detail page
  console.log("Website detail loaded:", website.domain);
}

function updateMarketplaceTable(websites) {
  if (!websites || websites.length === 0) return;

  // This would dynamically rebuild the marketplace table
  // For now, we use static demo data in HTML
  console.log(`Marketplace: ${websites.length} websites loaded from Convex`);
}

// =============================================
// EXPORT FOR GLOBAL ACCESS
// =============================================
window.ConvexAPI = {
  client,
  init: initConvex,
  loadDashboardData,
  loadMarketplace,
  searchMarketplace,
  loadWebsiteDetail,
  loadExchangeRequests,
  sendExchangeRequest,
  updateExchangeStatus,
  loadConversations,
  loadMessages,
  sendMessage,
  createConversation,
  loadNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  loadBacklinks,
  loadBacklinkStats,
  addWebsite,
};

// Auto-initialize when loaded
initConvex();
