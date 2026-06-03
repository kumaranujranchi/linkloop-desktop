import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";
import { internal } from "./_generated/api";
import { getUserIdFromToken } from "./auth_helpers";

// ========== QUERIES ==========

// List all websites for marketplace (with filters)
export const list = query({
  args: {
    niche: v.optional(v.string()),
    minDA: v.optional(v.number()),
    maxDA: v.optional(v.number()),
    minTraffic: v.optional(v.number()),
    maxTraffic: v.optional(v.number()),
    country: v.optional(v.string()),
    language: v.optional(v.string()),
    linkType: v.optional(v.string()),
    search: v.optional(v.string()),
    verifiedOnly: v.optional(v.boolean()),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("websites")
      .withIndex("by_status", (q) => q.eq("status", "active"));

    const websites = await query.order("desc").take(args.limit || 50);

    // Apply filters in-memory
    let filtered = websites;

    // Search by domain, niche, or keyword
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      filtered = filtered.filter((w) =>
        w.domain.toLowerCase().includes(searchLower) ||
        w.niche.toLowerCase().includes(searchLower) ||
        w.country.toLowerCase().includes(searchLower) ||
        w.language.toLowerCase().includes(searchLower)
      );
    }

    if (args.niche) {
      filtered = filtered.filter((w) => w.niche === args.niche);
    }
    if (args.minDA !== undefined) {
      filtered = filtered.filter((w) => w.domainAuthority >= args.minDA!);
    }
    if (args.maxDA !== undefined) {
      filtered = filtered.filter((w) => w.domainAuthority <= args.maxDA!);
    }
    if (args.minTraffic !== undefined) {
      filtered = filtered.filter((w) => w.trafficEstimate >= args.minTraffic!);
    }
    if (args.maxTraffic !== undefined) {
      filtered = filtered.filter((w) => w.trafficEstimate <= args.maxTraffic!);
    }
    if (args.country) {
      filtered = filtered.filter((w) => w.country === args.country);
    }
    if (args.language) {
      filtered = filtered.filter((w) => w.language === args.language);
    }
    if (args.linkType) {
      if (args.linkType === "dofollow") {
        filtered = filtered.filter((w) => w.dofollowLinks > 0);
      } else if (args.linkType === "nofollow") {
        filtered = filtered.filter((w) => w.nofollowLinks > 0);
      }
    }
    if (args.verifiedOnly) {
      filtered = filtered.filter((w) => w.verified);
    }

    // Fetch owner info for each website
    const withOwners = await Promise.all(
      filtered.map(async (w) => {
        const owner = await ctx.db.get(w.ownerId);
        return {
          ...w,
          ownerName: owner?.name || "Unknown",
        };
      })
    );

    return withOwners;
  },
});

// Get single website detail
export const getById = query({
  args: { websiteId: v.id("websites") },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.websiteId);
    if (!website) return null;

    const owner = await ctx.db.get(website.ownerId);
    const reviews = await ctx.db
      .query("reviews")
      .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
      .collect();

    const backlinks = await ctx.db
      .query("backlinks")
      .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
      .collect();

    return {
      ...website,
      owner: owner ? { name: owner.name, email: owner.email, reputationScore: owner.reputationScore } : null,
      reviews,
      backlinks,
      reviewCount: reviews.length,
      avgRating: reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0,
    };
  },
});

// Get website by exact domain
export const getByDomain = query({
  args: { domain: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("websites")
      .withIndex("by_domain", (q) => q.eq("domain", args.domain.toLowerCase()))
      .first();
  },
});

// Get user's own websites
export const listByOwner = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("websites")
      .withIndex("by_owner", (q) => q.eq("ownerId", args.userId))
      .collect();
  },
});

// Search websites globally
export const search = query({
  args: { query: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("websites").collect();
    const q = args.query.toLowerCase();
    const results = all.filter(
      (w) =>
        w.domain.toLowerCase().includes(q) ||
        w.niche.toLowerCase().includes(q)
    );
    return results.slice(0, args.limit || 10);
  },
});

// Analytics: website stats for dashboard
export const stats = query({
  args: {},
  handler: async (ctx) => {
    const allWebsites = await ctx.db.query("websites").collect();
    const verified = allWebsites.filter((w) => w.verified).length;
    const totalDA = allWebsites.reduce((sum, w) => sum + w.domainAuthority, 0);

    return {
      total: allWebsites.length,
      verified,
      avgDA: allWebsites.length > 0 ? Math.round(totalDA / allWebsites.length) : 0,
      niches: [...new Set(allWebsites.map((w) => w.niche))].length,
    };
  },
});

// ========== HELPERS ==========

function generateVerificationCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let code = "";
  for (let i = 0; i < 20; i++) {
    if (i > 0 && i % 5 === 0) code += "-";
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `linkbuild-verify=${code}`;
}

// ========== MUTATIONS ==========

// Add a new website (with optional userId param for email-based auth)
export const add = mutation({
  args: {
    domain: v.string(),
    niche: v.string(),
    country: v.string(),
    language: v.string(),
    listedBy: v.optional(v.union(v.literal("owner"), v.literal("agency"))),
    domainAuthority: v.number(),
    spamScore: v.number(),
    trafficEstimate: v.number(),
    referringDomains: v.number(),
    userId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let userId = args.userId;

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

    const now = Date.now();
    const verificationCode = generateVerificationCode();
    const websiteId = await ctx.db.insert("websites", {
      ownerId: userId,
      domain: args.domain,
      niche: args.niche,
      country: args.country,
      language: args.language,
      listedBy: args.listedBy ?? "owner",
      domainAuthority: args.domainAuthority,
      spamScore: args.spamScore,
      trafficEstimate: args.trafficEstimate,
      referringDomains: args.referringDomains,
      dofollowLinks: Math.floor(args.referringDomains * 0.6),
      nofollowLinks: Math.floor(args.referringDomains * 0.4),
      exchangeSuccessRate: Math.floor(Math.random() * 15) + 85,
      verified: false,
      verificationCode,
      status: "pending",
      metricsUpdatedAt: now,
      lastCheckedAt: now,
      createdAt: now,
    });

    // Schedule a verification reminder after 4 hours (if still unverified)
    try {
      await ctx.scheduler.runAfter(4 * 60 * 60 * 1000, internal.email.sendWebsiteVerificationReminder, {
        websiteId,
      });
    } catch (e) {
      // scheduler might not be available in some test environments
      console.warn('Failed to schedule verification reminder', e);
    }

    // Also add some demo backlinks
    const backlinkCount = Math.floor(Math.random() * 5) + 3;
    for (let i = 0; i < backlinkCount; i++) {
      await ctx.db.insert("backlinks", {
        sourceUrl: `https://${args.domain}/article-${i + 1}`,
        targetUrl: `https://example.com/page-${i + 1}`,
        anchorText: ["best SEO tools", "link building guide", "SEO tips", "backlink strategy", "content marketing"][i % 5],
        linkType: i % 3 === 0 ? "nofollow" : "dofollow",
        websiteId,
        status: "healthy",
        healthScore: Math.floor(Math.random() * 20) + 80,
        lastCheckedAt: now,
        createdAt: now - Math.floor(Math.random() * 30) * 86400000,
      });
    }

    return websiteId;
  },
});

// Get verification code for a website (so owner can see DNS/meta-tag instructions)
export const getVerificationInfo = query({
  args: { websiteId: v.id("websites") },
  handler: async (ctx, args) => {
    const website = await ctx.db.get(args.websiteId);
    if (!website) return null;
    return {
      domain: website.domain,
      verificationCode: website.verificationCode,
      verified: website.verified,
      verificationMethod: website.verificationMethod,
    };
  },
});

// Verify a website (marks verified + records method used)
export const verify = mutation({
  args: {
    websiteId: v.id("websites"),
    verificationMethod: v.union(v.literal("dns"), v.literal("metatag")),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.websiteId, {
      verified: true,
      status: "active",
      verificationMethod: args.verificationMethod,
      lastCheckedAt: now,
    });

    // Send email notification to owner
    const website = await ctx.db.get(args.websiteId);
    if (website) {
      const owner = await ctx.db.get(website.ownerId);
      if (owner && owner.email) {
        await ctx.scheduler.runAfter(0, internal.email.sendWebsiteVerifiedEmail, {
          email: owner.email,
          name: owner.name,
          domain: website.domain,
        });
      }
    }
  },
});

// Update SEO metrics
export const updateMetrics = mutation({
  args: {
    websiteId: v.id("websites"),
    domainAuthority: v.number(),
    spamScore: v.number(),
    trafficEstimate: v.number(),
    referringDomains: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.websiteId, {
      domainAuthority: args.domainAuthority,
      spamScore: args.spamScore,
      trafficEstimate: args.trafficEstimate,
      referringDomains: args.referringDomains,
      metricsUpdatedAt: now, // "Updated" timestamp
    });
  },
});

// Mark as checked (backlink verification)
export const markChecked = mutation({
  args: { websiteId: v.id("websites") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.websiteId, {
      lastCheckedAt: Date.now(), // "Checked" timestamp
    });
  },
});

// Clear demo/seed websites by known domains
export const clearSeedData = mutation({
  args: {},
  handler: async (ctx) => {
    const seedDomains = [
      "seomastery.com",
      "contentforge.io",
      "growthhacker.blog",
      "linkstrategist.com",
      "backlinkpro.net",
      "myseotools.com",
      "contentmarketing.ai",
      "affiliatemastery.org",
    ];
    let deleted = 0;
    for (const domain of seedDomains) {
      const existing = await ctx.db
        .query("websites")
        .withIndex("by_domain", (q) => q.eq("domain", domain))
        .first();
      if (existing) {
        await ctx.db.delete(existing._id);
        deleted++;
      }
    }
    return { deleted };
  },
});

async function verifyAdminToken(db: any, token: string) {
  const userId = await getUserIdFromToken(db, token);
  if (!userId) throw new ConvexError("Not authenticated");
  const user = await db.get(userId);
  if (!user || user.role !== "admin") {
    throw new ConvexError("Unauthorized access to admin APIs");
  }
  return user;
}

// Admin: list all pending websites
export const listPending = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    await verifyAdminToken(ctx.db, args.token);
    const pending = await ctx.db
      .query("websites")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();

    // Fetch owner (user who added) info for each pending website
    const withOwners = await Promise.all(
      pending.map(async (site) => {
        const owner = await ctx.db.get(site.ownerId);
        return {
          ...site,
          addedByName: owner?.name || "Unknown",
          addedByEmail: owner?.email || "",
        };
      })
    );

    return withOwners;
  },
});

// Admin: moderate a website (approve or ban)
export const moderate = mutation({
  args: {
    token: v.string(),
    websiteId: v.id("websites"),
    status: v.union(v.literal("active"), v.literal("rejected"), v.literal("suspended")),
  },
  handler: async (ctx, args) => {
    await verifyAdminToken(ctx.db, args.token);
    const verified = args.status === "active";

    // Get website domain BEFORE patching (for Moz fetch)
    const website = await ctx.db.get(args.websiteId);

    await ctx.db.patch(args.websiteId, {
      status: args.status,
      verified,
    });

    // When approving, auto-fetch real metrics from Moz API
    if (verified && website) {
      await ctx.scheduler.runAfter(0, internal.moz.fetchAndUpdateMetrics, {
        websiteId: args.websiteId,
        domain: website.domain,
      });

      // Send email notification to owner
      const owner = await ctx.db.get(website.ownerId);
      if (owner && owner.email) {
        await ctx.scheduler.runAfter(0, internal.email.sendWebsiteVerifiedEmail, {
          email: owner.email,
          name: owner.name,
          domain: website.domain,
        });
      }
    }

    return { success: true };
  },
});

// Update website details (owner only)
export const update = mutation({
  args: {
    websiteId: v.id("websites"),
    token: v.optional(v.string()),
    domain: v.optional(v.string()),
    niche: v.optional(v.string()),
    country: v.optional(v.string()),
    language: v.optional(v.string()),
    listedBy: v.optional(v.union(v.literal("owner"), v.literal("agency"))),
    domainAuthority: v.optional(v.number()),
    spamScore: v.optional(v.number()),
    trafficEstimate: v.optional(v.number()),
    referringDomains: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Try token-based auth first, then fall back to Convex Auth
    let currentUser = null;
    if (args.token) {
      const userId = await getUserIdFromToken(ctx.db, args.token);
      if (userId) {
        currentUser = await ctx.db.get(userId);
      }
    }
    if (!currentUser) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Not authenticated");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!currentUser) throw new Error("User not found");
    }

    const website = await ctx.db.get(args.websiteId);
    if (!website) throw new Error("Website not found");

    if (website.ownerId !== currentUser._id) {
      throw new Error("You can only edit your own websites");
    }

    const updates: any = {};
    if (args.domain !== undefined) updates.domain = args.domain;
    if (args.niche !== undefined) updates.niche = args.niche;
    if (args.country !== undefined) updates.country = args.country;
    if (args.language !== undefined) updates.language = args.language;
    if (args.listedBy !== undefined) updates.listedBy = args.listedBy;
    if (args.domainAuthority !== undefined) updates.domainAuthority = args.domainAuthority;
    if (args.spamScore !== undefined) updates.spamScore = args.spamScore;
    if (args.trafficEstimate !== undefined) updates.trafficEstimate = args.trafficEstimate;
    if (args.referringDomains !== undefined) updates.referringDomains = args.referringDomains;

    if (Object.keys(updates).length > 0) {
      updates.metricsUpdatedAt = Date.now();
      await ctx.db.patch(args.websiteId, updates);
    }

    return { success: true };
  },
});

// Delete a website (owner only)
export const remove = mutation({
  args: {
    websiteId: v.id("websites"),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try token-based auth first, then fall back to Convex Auth
    let currentUser = null;
    if (args.token) {
      const userId = await getUserIdFromToken(ctx.db, args.token);
      if (userId) {
        currentUser = await ctx.db.get(userId);
      }
    }
    if (!currentUser) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Not authenticated");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!currentUser) throw new Error("User not found");
    }

    const website = await ctx.db.get(args.websiteId);
    if (!website) throw new Error("Website not found");

    if (website.ownerId !== currentUser._id) {
      throw new Error("You can only delete your own websites");
    }

    // Delete associated backlinks first
    const backlinks = await ctx.db
      .query("backlinks")
      .withIndex("by_website", (q) => q.eq("websiteId", args.websiteId))
      .collect();

    for (const bl of backlinks) {
      await ctx.db.delete(bl._id);
    }

    await ctx.db.delete(args.websiteId);
    return { success: true };
  },
});

// Deactivate a website (owner only — marks as inactive/hidden)
export const deactivate = mutation({
  args: {
    websiteId: v.id("websites"),
    token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try token-based auth first, then fall back to Convex Auth
    let currentUser = null;
    if (args.token) {
      const userId = await getUserIdFromToken(ctx.db, args.token);
      if (userId) {
        currentUser = await ctx.db.get(userId);
      }
    }
    if (!currentUser) {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new Error("Not authenticated");
      currentUser = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", identity.email!))
        .first();
      if (!currentUser) throw new Error("User not found");
    }

    const website = await ctx.db.get(args.websiteId);
    if (!website) throw new Error("Website not found");

    if (website.ownerId !== currentUser._id) {
      throw new Error("You can only deactivate your own websites");
    }

    await ctx.db.patch(args.websiteId, {
      status: "suspended",
      verified: false,
    });

    return { success: true };
  },
});
