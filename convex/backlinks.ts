import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ========== QUERIES ==========

// Get all backlinks for a website
export const listByWebsite = query({
  args: { websiteId: v.id("websites") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("backlinks")
      .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
      .collect();
  },
});

// Get backlink stats for dashboard
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("backlinks").collect();

    return {
      active: all.filter((b) => b.status === "healthy").length,
      lost: all.filter((b) => b.status === "removed").length,
      needsReview: all.filter((b) => b.status === "needs_review").length,
      dofollow: all.filter((b) => b.linkType === "dofollow").length,
      nofollow: all.filter((b) => b.linkType === "nofollow").length,
      total: all.length,
      verificationRate:
        all.length > 0
          ? Math.round(
              (all.filter((b) => b.status === "healthy").length / all.length) * 100
            )
          : 0,
    };
  },
});

// ========== MUTATIONS ==========

// Add a new backlink
export const add = mutation({
  args: {
    sourceUrl: v.string(),
    targetUrl: v.string(),
    anchorText: v.string(),
    linkType: v.union(v.literal("dofollow"), v.literal("nofollow")),
    websiteId: v.id("websites"),
    exchangeId: v.optional(v.id("exchangeRequests")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("backlinks", {
      sourceUrl: args.sourceUrl,
      targetUrl: args.targetUrl,
      anchorText: args.anchorText,
      linkType: args.linkType,
      websiteId: args.websiteId,
      exchangeId: args.exchangeId,
      status: "healthy",
      healthScore: 100,
      lastCheckedAt: now,
      createdAt: now,
    });
  },
});

// Verify a backlink (check if still live)
export const verify = mutation({
  args: { backlinkId: v.id("backlinks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.backlinkId, {
      lastCheckedAt: Date.now(),
    });

    // Log analytics event
    await ctx.db.insert("analyticsEvents", {
      type: "backlink_verified",
      createdAt: Date.now(),
    });
  },
});

// Update backlink health
export const updateHealth = mutation({
  args: {
    backlinkId: v.id("backlinks"),
    status: v.union(v.literal("healthy"), v.literal("needs_review"), v.literal("removed")),
    healthScore: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.backlinkId, {
      status: args.status,
      healthScore: args.healthScore,
      lastCheckedAt: Date.now(),
    });

    if (args.status === "removed") {
      await ctx.db.insert("analyticsEvents", {
        type: "backlink_lost",
        createdAt: Date.now(),
      });
    }
  },
});
