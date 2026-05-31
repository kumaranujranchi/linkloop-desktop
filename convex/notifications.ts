import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ========== QUERIES ==========

// Get user's notifications
export const listByUser = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));

    const notifications = await query.order("desc").collect();

    let filtered = notifications;
    if (args.unreadOnly) {
      filtered = filtered.filter((n) => !n.read);
    }

    return filtered.slice(0, args.limit || 50);
  },
});

// Get unread count
export const unreadCount = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    return notifications.filter((n) => !n.read).length;
  },
});

// ========== MUTATIONS ==========

// Mark notification as read
export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.notificationId, { read: true });
  },
});

// Mark all notifications as read
export const markAllRead = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const notifications = await ctx.db
      .query("notifications")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("read"), false))
      .collect();

    for (const n of notifications) {
      await ctx.db.patch(n._id, { read: true });
    }
  },
});
