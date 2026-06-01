import { v, ConvexError } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserIdFromToken, generateSalt, hashPassword, createSession } from "./auth_helpers";

// ========== QUERIES ==========

// Get current user (by auth identity or token)
export const me = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let userId = null;

    if (args.token) {
      userId = await getUserIdFromToken(ctx.db, args.token);
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (user) userId = user._id;
      }
    }

    if (!userId) return null;

    const user = await ctx.db.get(userId);
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
async function verifyAdminToken(db: any, token: string) {
  const userId = await getUserIdFromToken(db, token);
  if (!userId) throw new ConvexError("Not authenticated");
  const user = await db.get(userId);
  if (!user || user.role !== "admin") {
    throw new ConvexError("Unauthorized access to admin APIs");
  }
  return user;
}

// Get users for admin dashboard
export const listAll = query({
  args: { token: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await verifyAdminToken(ctx.db, args.token);
    const users = await ctx.db.query("users").take(args.limit || 100);
    return users;
  },
});

// User stats for admin
export const adminStats = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await verifyAdminToken(ctx.db, args.token);

    const users = await ctx.db.query("users").collect();
    const websites = await ctx.db.query("websites").collect();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    const freeCount = users.filter((u) => u.role === "free").length;
    const proCount = users.filter((u) => u.role === "pro").length;
    const agencyCount = users.filter((u) => u.role === "agency").length;
    const adminCount = users.filter((u) => u.role === "admin").length;

    const mrr = proCount * 49 + agencyCount * 99;
    const activeWebsites = websites.filter((w) => w.status === "active").length;
    const spamReports = websites.filter((w) => w.status === "suspended" || w.status === "rejected").length;

    return {
      total: users.length,
      newThisMonth: users.filter((u) => u.createdAt >= thirtyDaysAgo).length,
      byRole: {
        free: freeCount,
        pro: proCount,
        agency: agencyCount,
        admin: adminCount,
      },
      totalWebsites: activeWebsites,
      mrr,
      spamReports,
    };
  },
});

// ========== MUTATIONS ==========

// ========== PASSWORD AUTH ==========

// Repair old user accounts that are missing schema fields
export const repairUser = mutation({
  args: { email: v.string(), password: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.trim().toLowerCase()))
      .first();
    if (!user) throw new ConvexError("User not found");
    
    const now = Date.now();
    const patch: any = {};
    if (!user.reputationScore && user.reputationScore !== 0) patch.reputationScore = 50;
    if (!user.completedExchanges && user.completedExchanges !== 0) patch.completedExchanges = 0;
    if (!user.responseRate && user.responseRate !== 0) patch.responseRate = 100;
    if (!user.trustBadges) patch.trustBadges = [];
    if (!user.createdAt) patch.createdAt = now;
    
    // Also set password if provided
    if (args.password) {
      patch.passwordSalt = generateSalt();
      patch.passwordHash = await hashPassword(args.password, patch.passwordSalt);
    }
    
    await ctx.db.patch(user._id, patch);
    return { success: true, userId: user._id };
  },
});

// Sign up with email + name + password
export const signupWithPassword = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
    const emailNormalized = args.email.trim().toLowerCase();
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailNormalized))
      .first();

    if (existing) {
      if (!existing.passwordHash || !existing.passwordSalt) {
        throw new ConvexError("Social login already active on this mail id - so use social login");
      }
      throw new ConvexError("Email already registered");
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(args.password, salt);

    const now = Date.now();
    const userId = await ctx.db.insert("users", {
      name: args.name,
      email: emailNormalized,
      role: "free",
      reputationScore: 50,
      completedExchanges: 0,
      responseRate: 100,
      trustBadges: [],
      createdAt: now,
      passwordHash,
      passwordSalt: salt,
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

    const session = await createSession(ctx.db, userId);

    return {
      token: session.token,
      user: {
        userId,
        name: args.name,
        email: emailNormalized,
        role: "free",
      }
    };
    } catch (e: any) {
      if (e instanceof ConvexError) throw e;
      throw new ConvexError(e.message || "Signup failed. Please try again.");
    }
  },
});

// Login with email + password
export const loginWithPassword = mutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const emailNormalized = args.email.trim().toLowerCase();
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", emailNormalized))
        .first();

      if (!user) {
        throw new ConvexError("Invalid email or password");
      }

      if (!user.passwordHash || !user.passwordSalt) {
        throw new ConvexError("Social login already active on this mail id - so use social login");
      }

      const computedHash = await hashPassword(args.password, user.passwordSalt);
      if (computedHash !== user.passwordHash) {
        throw new ConvexError("Invalid email or password");
      }

      const session = await createSession(ctx.db, user._id);

      return {
        token: session.token,
        user: {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      };
    } catch (e: any) {
      if (e instanceof ConvexError) throw e;
      throw new ConvexError(e.message || "Login failed. Please try again.");
    }
  },
});

// Change password (requires current password)
export const changePassword = mutation({
  args: {
    email: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
  },
  handler: async (ctx, args) => {
    try {
    const emailNormalized = args.email.trim().toLowerCase();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailNormalized))
      .first();

    if (!user) throw new ConvexError("User not found");
    if (!user.passwordHash || !user.passwordSalt) {
      throw new ConvexError("No password set on this account. Please sign up again to set a password.");
    }

    // Verify current password
    const currentHash = await hashPassword(args.currentPassword, user.passwordSalt);
    if (currentHash !== user.passwordHash) {
      throw new ConvexError("Current password is incorrect");
    }

    // Set new password
    const newSalt = generateSalt();
    const newHash = await hashPassword(args.newPassword, newSalt);
    await ctx.db.patch(user._id, {
      passwordHash: newHash,
      passwordSalt: newSalt,
    });

    return { success: true };
    } catch (e: any) {
      if (e instanceof ConvexError) throw e;
      throw new ConvexError(e.message || "Failed to change password");
    }
  },
});

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
    return (await (signupWithEmail as any).handler(ctx, args)).userId;
  },
});

// Update user profile
export const updateProfile = mutation({
  args: {
    name: v.optional(v.string()),
    company: v.optional(v.string()),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = null;

    if (args.token) {
      userId = await getUserIdFromToken(ctx.db, args.token);
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (user) userId = user._id;
      }
    }

    if (!userId) throw new ConvexError("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("User not found");

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
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let userId = null;

    if (args.token) {
      userId = await getUserIdFromToken(ctx.db, args.token);
    } else {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        const user = await ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", identity.email!))
          .first();
        if (user) userId = user._id;
      }
    }

    if (!userId) throw new ConvexError("Not authenticated");
    const user = await ctx.db.get(userId);
    if (!user) throw new ConvexError("User not found");

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

// Helper to decode JWT token in Convex environment
function decodeJwt(token: string) {
  const parts = token.split(".");
  if (parts.length !== 3) {
    throw new ConvexError("Invalid JWT token");
  }
  const payload = parts[1];
  const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
  const decoded = atob(base64);
  return JSON.parse(decoded);
}

// Login/signup using Google ID token
export const loginWithGoogle = mutation({
  args: {
    credential: v.string(),
  },
  handler: async (ctx, args) => {
    let email = "";
    let name = "";
    let avatarUrl: string | undefined = undefined;

    if (args.credential.startsWith("mock-google-credential-")) {
      // Mock user for testing
      email = "anuj.esprit@gmail.com";
      name = "Anuj Kumar";
      avatarUrl = "https://lh3.googleusercontent.com/a/default-user-google=s96-c";
    } else {
      // Decode real Google ID Token
      try {
        const payload = decodeJwt(args.credential);
        email = payload.email;
        name = payload.name || email.split("@")[0];
        avatarUrl = payload.picture;
      } catch (e) {
        throw new ConvexError("Invalid Google credential format");
      }
    }

    if (!email) {
      throw new ConvexError("Google credential does not contain email");
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if user already exists
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", emailNormalized))
      .first();

    if (!user) {
      // Create user
      const userId = await ctx.db.insert("users", {
        name,
        email: emailNormalized,
        avatarUrl,
        role: "free",
        reputationScore: 95,
        completedExchanges: 0,
        responseRate: 100,
        trustBadges: ["New Member"],
        createdAt: Date.now(),
      });
      user = await ctx.db.get(userId);
      
      // Initialize free subscription
      await ctx.db.insert("subscriptions", {
        userId,
        plan: "free",
        status: "active",
        websitesLimit: 3,
        exchangesLimit: 10,
        currentPeriodStart: Date.now(),
        currentPeriodEnd: Date.now() + 30 * 24 * 60 * 60 * 1000,
        createdAt: Date.now(),
      });
    } else if (avatarUrl && user.avatarUrl !== avatarUrl) {
      // Update avatar if changed
      await ctx.db.patch(user._id, { avatarUrl });
      user.avatarUrl = avatarUrl;
    }

    if (!user) {
      throw new ConvexError("Authentication failed");
    }

    // Create session
    const session = await createSession(ctx.db, user._id);

    return {
      token: session.token,
      user: {
        userId: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    };
  },
});

// Admin: update user role
export const updateRole = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
    role: v.union(v.literal("free"), v.literal("pro"), v.literal("agency"), v.literal("admin")),
  },
  handler: async (ctx, args) => {
    await verifyAdminToken(ctx.db, args.token);
    await ctx.db.patch(args.userId, { role: args.role });
    return { success: true };
  },
});

// Admin: ban/suspend user (lower reputation to 0, revoke sessions)
export const banUser = mutation({
  args: {
    token: v.string(),
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await verifyAdminToken(ctx.db, args.token);

    // Lower reputation, set role to free (safest suspension state)
    await ctx.db.patch(args.userId, {
      reputationScore: 0,
      role: "free",
    });

    // Delete user sessions to force logout
    const sessions = await ctx.db
      .query("sessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    return { success: true };
  },
});

