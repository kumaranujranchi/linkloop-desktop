import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

// ========== QUERIES ==========

// Get current user (by auth identity)
export const me = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) return null;

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    return {
      ...user,
      subscription,
    };
  },
});

// Get user by ID
export const getById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return null;

    const websites = await ctx.db
      .query("websites")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();

    const reviews = await ctx.db
      .query("reviews")
      .collect();

    // Get reviews for user's websites
    const websiteIds = websites.map((w) => w._id);
    const userReviews = reviews.filter((r) => websiteIds.includes(r.websiteId));

    return {
      ...user,
      websiteCount: websites.length,
      avgRating:
        userReviews.length > 0
          ? userReviews.reduce((sum, r) => sum + r.rating, 0) / userReviews.length
          : 0,
    };
  },
});

// Get users for admin dashboard
export const listAll = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").take(args.limit || 50);
    return users;
  },
});

// User stats for admin
export const adminStats = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
      total: users.length,
      newThisMonth: users.filter((u) => u.createdAt >= thirtyDaysAgo).length,
      byRole: {
        free: users.filter((u) => u.role === "free").length,
        pro: users.filter((u) => u.role === "pro").length,
        agency: users.filter((u) => u.role === "agency").length,
        admin: users.filter((u) => u.role === "admin").length,
      },
    };
  },
});

// ========== MUTATIONS ==========

// ========== EMAIL AUTH (no Convex Auth required) ==========

// Sign up with email + name
export const signupWithEmail = mutation({
  args: {
    name: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      return { userId: existing._id, isNew: false };
    }

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: args.email,
      role: "free",
      reputationScore: 50,
      completedExchanges: 0,
      responseRate: 100,
      trustBadges: [],
      createdAt: now,
    });

    // Create free subscription
    await ctx.db.insert("subscriptions", {
      userId,
      plan: "free",
      status: "active",
      websitesLimit: 3,
      exchangesLimit: 10,
      currentPeriodStart: now,
      currentPeriodEnd: now + 30 * 24 * 60 * 60 * 1000,
      createdAt: now,
    });

    await ctx.db.insert("analyticsEvents", {
      type: "user_signup",
      userId,
      createdAt: now,
    });

    return { userId, isNew: true };
  },
});

// Login with email
export const loginWithEmail = mutation({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      return { error: "User not found. Please sign up first." };
    }

    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      reputationScore: user.reputationScore,
    };
  },
});

// Create or get user (upsert on login) — legacy
export const upsert = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return (await signupWithEmail.handler(ctx, args)).userId;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    company: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    const updates: any = {};
    if (args.name) updates.name = args.name;
    if (args.company) updates.company = args.company;

    await ctx.db.patch(user._id, updates);
    return user._id;
  },
});

// Upgrade subscription
export const upgradePlan = mutation({
  args: {
    plan: v.union(v.literal("free"), v.literal("pro"), v.literal("agency")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, { role: args.plan });

    const subscription = await ctx.db
      .query("subscriptions")
      .withIndex("by_user", (q) => q.eq("userId", user._id))
      .first();

    if (subscription) {
      const limits: Record<string, { websites: number; exchanges: number }> = {
        free: { websites: 3, exchanges: 10 },
        pro: { websites: 25, exchanges: 100 },
        agency: { websites: 999, exchanges: 999 },
      };

      await ctx.db.patch(subscription._id, {
        plan: args.plan,
        websitesLimit: limits[args.plan].websites,
        exchangesLimit: limits[args.plan].exchanges,
      });
    }
  },
});
