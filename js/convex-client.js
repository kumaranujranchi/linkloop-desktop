/* =============================================
   LinkLoop — Convex Backend Client
   ============================================= */

// Convex deployment URL — replace with your actual deployment after `npx convex deploy`
const CONVEX_URL = "https://vibrant-marmot-366.convex.cloud";

import { ConvexClient } from "../node_modules/convex/dist/esm/browser/index.js";

const client = new ConvexClient(CONVEX_URL);

// =============================================
// Auth helper (simplified for demo)
// =============================================
let currentUser = null;

async function authenticate(userData) {
  const userId = await client.mutation("users:upsert", {
    name: userData.name,
    email: userData.email,
    company: userData.company || "",
  });
  currentUser = { ...userData, _id: userId };
  localStorage.setItem("linkloop-user", JSON.stringify(currentUser));
  return currentUser;
}

function getCurrentUser() {
  if (currentUser) return currentUser;
  const stored = localStorage.getItem("linkloop-user");
  if (stored) {
    currentUser = JSON.parse(stored);
    return currentUser;
  }
  return null;
}

// =============================================
// WEBSITES API
// =============================================
const Websites = {
  list(filters = {}) {
    return client.query("websites:list", filters);
  },

  getById(websiteId) {
    return client.query("websites:getById", { websiteId });
  },

  listByOwner(userId) {
    return client.query("websites:listByOwner", { userId });
  },

  search(query, limit = 10) {
    return client.query("websites:search", { query, limit });
  },

  stats() {
    return client.query("websites:stats", {});
  },

  add(data) {
    return client.mutation("websites:add", data);
  },

  verify(websiteId) {
    return client.mutation("websites:verify", { websiteId });
  },

  markChecked(websiteId) {
    return client.mutation("websites:markChecked", { websiteId });
  },

  updateMetrics(websiteId, metrics) {
    return client.mutation("websites:updateMetrics", {
      websiteId,
      ...metrics,
    });
  },

  // Reactive subscription
  subscribe(filters, onChange) {
    return client.subscribe("websites:list", filters, onChange);
  },
};

// =============================================
// EXCHANGE REQUESTS API
// =============================================
const Exchanges = {
  listByUser(userId) {
    return client.query("exchanges:listByUser", { userId });
  },

  listKanban(userId) {
    return client.query("exchanges:listKanban", { userId });
  },

  stats() {
    return client.query("exchanges:stats", {});
  },

  send(data) {
    return client.mutation("exchanges:send", data);
  },

  updateStatus(exchangeId, status) {
    return client.mutation("exchanges:updateStatus", { exchangeId, status });
  },

  // Reactive subscription for Kanban updates
  subscribeKanban(userId, onChange) {
    return client.subscribe("exchanges:listKanban", { userId }, onChange);
  },
};

// =============================================
// MESSAGES API
// =============================================
const Messages = {
  listConversations(userId) {
    return client.query("messages:listConversations", { userId });
  },

  listByExchange(exchangeId) {
    return client.query("messages:listByExchange", { exchangeId });
  },

  listMessages(conversationId, limit = 50) {
    return client.query("messages:listMessages", { conversationId, limit });
  },

  send(data) {
    return client.mutation("messages:send", data);
  },

  getOrCreateConversation(otherUserId, exchangeId) {
    return client.mutation("messages:getOrCreateConversation", {
      otherUserId,
      exchangeId,
    });
  },

  markRead(conversationId) {
    return client.mutation("messages:markRead", { conversationId });
  },

  // Real-time messages subscription
  subscribeMessages(conversationId, onChange) {
    return client.subscribe(
      "messages:listMessages",
      { conversationId },
      onChange
    );
  },

  // Real-time conversation list
  subscribeConversations(userId, onChange) {
    return client.subscribe(
      "messages:listConversations",
      { userId },
      onChange
    );
  },
};

// =============================================
// BACKLINKS API
// =============================================
const Backlinks = {
  listByWebsite(websiteId) {
    return client.query("backlinks:listByWebsite", { websiteId });
  },

  stats() {
    return client.query("backlinks:stats", {});
  },

  add(data) {
    return client.mutation("backlinks:add", data);
  },

  verify(backlinkId) {
    return client.mutation("backlinks:verify", { backlinkId });
  },

  updateHealth(backlinkId, status, healthScore) {
    return client.mutation("backlinks:updateHealth", {
      backlinkId,
      status,
      healthScore,
    });
  },
};

// =============================================
// NOTIFICATIONS API
// =============================================
const Notifications = {
  listByUser(userId, limit = 50, unreadOnly = false) {
    return client.query("notifications:listByUser", { userId, limit, unreadOnly });
  },

  unreadCount(userId) {
    return client.query("notifications:unreadCount", { userId });
  },

  markRead(notificationId) {
    return client.mutation("notifications:markRead", { notificationId });
  },

  markAllRead(userId) {
    return client.mutation("notifications:markAllRead", { userId });
  },

  // Reactive notifications
  subscribe(userId, onChange) {
    return client.subscribe("notifications:listByUser", { userId }, onChange);
  },

  // Reactive unread count
  subscribeUnreadCount(userId, onChange) {
    return client.subscribe("notifications:unreadCount", { userId }, onChange);
  },
};

// =============================================
// USERS API
// =============================================
const Users = {
  me() {
    return client.query("users:me", {});
  },

  getById(userId) {
    return client.query("users:getById", { userId });
  },

  listAll(limit = 50) {
    return client.query("users:listAll", { limit });
  },

  adminStats() {
    return client.query("users:adminStats", {});
  },

  upsert(data) {
    return client.mutation("users:upsert", data);
  },

  updateProfile(data) {
    return client.mutation("users:updateProfile", data);
  },

  upgradePlan(plan) {
    return client.mutation("users:upgradePlan", { plan });
  },
};

// =============================================
// ANALYTICS API
// =============================================
const Analytics = {
  dashboardKpis() {
    return client.query("analytics:dashboardKpis", {});
  },

  exchangeActivity(months = 6) {
    return client.query("analytics:exchangeActivity", { months });
  },

  backlinkGrowth(months = 6) {
    return client.query("analytics:backlinkGrowth", { months });
  },

  userGrowth(months = 6) {
    return client.query("analytics:userGrowth", { months });
  },

  revenue() {
    return client.query("analytics:revenue", {});
  },

  // Reactive KPI subscription (refreshes on any change)
  subscribeDashboardKpis(onChange) {
    return client.subscribe("analytics:dashboardKpis", {}, onChange);
  },
};

// =============================================
// EXPORT ALL
// =============================================
export {
  client,
  authenticate,
  getCurrentUser,
  Websites,
  Exchanges,
  Messages,
  Backlinks,
  Notifications,
  Users,
  Analytics,
};

// Global window access for non-module scripts
window.LinkLoop = {
  client,
  authenticate,
  getCurrentUser,
  Websites,
  Exchanges,
  Messages,
  Backlinks,
  Notifications,
  Users,
  Analytics,
};
