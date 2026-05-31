import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

// ========== QUERIES ==========

// Get all exchanges for a user (both sent and received)
export const listByUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sent = await ctx.db
      .query("exchangeRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", args.userId))
      .collect();

    const received = await ctx.db
      .query("exchangeRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .collect();

    const all = [...sent, ...received];

    // Fetch related website and user data
    const enriched = await Promise.all(
      all.map(async (ex) => {
        const fromWebsite = await ctx.db.get(ex.fromWebsiteId);
        const toWebsite = await ctx.db.get(ex.toWebsiteId);
        const fromUser = await ctx.db.get(ex.fromUserId);
        const toUser = await ctx.db.get(ex.toUserId);
        return {
          ...ex,
          fromWebsite: fromWebsite ? { domain: fromWebsite.domain, da: fromWebsite.domainAuthority } : null,
          toWebsite: toWebsite ? { domain: toWebsite.domain, da: toWebsite.domainAuthority } : null,
          fromUser: fromUser ? { name: fromUser.name } : null,
          toUser: toUser ? { name: toUser.name } : null,
        };
      })
    );

    return enriched;
  },
});

// Get exchanges grouped by status (for Kanban)
export const listKanban = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sent = await ctx.db
      .query("exchangeRequests")
      .withIndex("by_from_user", (q) => q.eq("fromUserId", args.userId))
      .collect();

    const received = await ctx.db
      .query("exchangeRequests")
      .withIndex("by_to_user", (q) => q.eq("toUserId", args.userId))
      .collect();

    const all = [...sent, ...received];

    const enriched = await Promise.all(
      all.map(async (ex) => {
        const fromWebsite = await ctx.db.get(ex.fromWebsiteId);
        const toWebsite = await ctx.db.get(ex.toWebsiteId);
        const fromUser = await ctx.db.get(ex.fromUserId);
        const toUser = await ctx.db.get(ex.toUserId);
        return {
          ...ex,
          fromWebsite: fromWebsite ? { domain: fromWebsite.domain, da: fromWebsite.domainAuthority } : null,
          toWebsite: toWebsite ? { domain: toWebsite.domain, da: toWebsite.domainAuthority } : null,
          fromUser: fromUser ? { name: fromUser.name } : null,
          toUser: toUser ? { name: toUser.name } : null,
        };
      })
    );

    return {
      new: enriched.filter((e: any) => e.status === "new"),
      negotiating: enriched.filter((e: any) => e.status === "negotiating"),
      accepted: enriched.filter((e: any) => e.status === "accepted"),
      completed: enriched.filter((e: any) => e.status === "completed"),
      rejected: enriched.filter((e: any) => e.status === "rejected"),
    };
  },
});

// Analytics: exchange stats for dashboard
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("exchangeRequests").collect();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
      total: all.length,
      active: all.filter((e) => e.status === "accepted" || e.status === "negotiating").length,
      pending: all.filter((e) => e.status === "new").length,
      completed: all.filter((e) => e.status === "completed").length,
      rejected: all.filter((e) => e.status === "rejected").length,
      thisMonth: all.filter((e) => e.createdAt >= thirtyDaysAgo).length,
      completionRate:
        all.length > 0
          ? Math.round((all.filter((e) => e.status === "completed").length / all.length) * 100)
          : 0,
    };
  },
});

// ========== MUTATIONS ==========

// Send a new exchange request
export const send = mutation({
  args: {
    toUserId: v.id("users"),
    fromWebsiteId: v.id("websites"),
    toWebsiteId: v.id("websites"),
    fromAnchorText: v.string(),
    fromTargetUrl: v.string(),
    notes: v.optional(v.string()),
    fromUserId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = args.fromUserId;

    if (!userId) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Not authenticated — please login first");

      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();

      if (!user) throw new Error("User not found");
      userId = user._id;
    }

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("User not found");

    const now = Date.now();
    const exchangeId = await ctx.db.insert("exchangeRequests", {
      fromUserId: userId,
      toUserId: args.toUserId,
      fromWebsiteId: args.fromWebsiteId,
      toWebsiteId: args.toWebsiteId,
      fromAnchorText: args.fromAnchorText,
      fromTargetUrl: args.fromTargetUrl,
      status: "new",
      notes: args.notes,
      createdAt: now,
      updatedAt: now,
    });

    // Create notification for recipient
    await ctx.db.insert("notifications", {
      userId: args.toUserId,
      type: "exchange_request",
      title: "New Exchange Request",
      body: `${user.name} sent you an exchange request.`,
      read: false,
      linkId: exchangeId,
      createdAt: now,
    });

    // Log analytics event
    await ctx.db.insert("analyticsEvents", {
      type: "exchange_created",
      userId: userId,
      metadata: { exchangeId },
      createdAt: now,
    });

    return exchangeId;
  },
});

// Update exchange status (move in Kanban)
export const updateStatus = mutation({
  args: {
    exchangeId: v.id("exchangeRequests"),
    status: v.union(
      v.literal("new"),
      v.literal("negotiating"),
      v.literal("accepted"),
      v.literal("completed"),
      v.literal("rejected")
    ),
  },
  handler: async (ctx, args) => {
    const exchange = await ctx.db.get(args.exchangeId);
    if (!exchange) throw new Error("Exchange not found");

    const now = Date.now();
    await ctx.db.patch(args.exchangeId, {
      status: args.status,
      updatedAt: now,
    });

    // Notify the other party
    const identity = await ctx.auth.getUserIdentity();
    const currentUser = identity
      ? await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first()
      : null;

    const notifyUserId =
      currentUser?._id === exchange.fromUserId
        ? exchange.toUserId
        : exchange.fromUserId;

    const statusLabels: Record<string, string> = {
      accepted: "Exchange Accepted",
      completed: "Exchange Completed",
      rejected: "Exchange Rejected",
      negotiating: "Exchange Status Updated",
      new: "Exchange Reopened",
    };

    await ctx.db.insert("notifications", {
      userId: notifyUserId,
      type: `exchange_${args.status}` as any,
      title: statusLabels[args.status] || "Exchange Updated",
      body: `Exchange request status changed to ${args.status}.`,
      read: false,
      linkId: args.exchangeId,
      createdAt: now,
    });

    // Log analytics
    if (args.status === "completed") {
      await ctx.db.insert("analyticsEvents", {
        type: "exchange_completed",
        userId: notifyUserId,
        metadata: { exchangeId: args.exchangeId },
        createdAt: now,
      });

      // Update user reputation
      const fromUser = await ctx.db.get(exchange.fromUserId);
      const toUser = await ctx.db.get(exchange.toUserId);
      if (fromUser) {
        await ctx.db.patch(fromUser._id, {
          completedExchanges: fromUser.completedExchanges + 1,
          reputationScore: Math.min(100, fromUser.reputationScore + 1),
        });
      }
      if (toUser) {
        await ctx.db.patch(toUser._id, {
          completedExchanges: toUser.completedExchanges + 1,
          reputationScore: Math.min(100, toUser.reputationScore + 1),
        });
      }
    }
  },
});
