import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ========== FILE UPLOAD ==========

// Generate an upload URL for case study images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// ========== QUERIES ==========

// List all published case studies (public-facing)
export const listPublished = query({
  args: {
    category: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("caseStudies")
      .withIndex("by_published", (q) => q.eq("published", true))
      .order("desc");

    let results = await q.take(args.limit || 50);

    if (args.category) {
      results = results.filter((cs) => cs.category === args.category);
    }

    return results;
  },
});

// List ALL case studies (admin only — for management panel)
export const listAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("caseStudies").order("desc").collect();
  },
});

// Get a single case study by slug (public)
export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("caseStudies")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// Get featured case studies (public)
export const listFeatured = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("caseStudies")
      .withIndex("by_published", (q) => q.eq("published", true))
      .filter((q) => q.eq(q.field("featured"), true))
      .order("desc")
      .take(args.limit || 6);
  },
});

// ========== MUTATIONS (Admin) ==========

// Add a new case study
export const add = mutation({
  args: {
    title: v.string(),
    slug: v.string(),
    description: v.string(),
    content: v.string(),
    imageUrl: v.optional(v.string()),
    category: v.string(),
    featured: v.boolean(),
    published: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("caseStudies", {
      title: args.title,
      slug: args.slug,
      description: args.description,
      content: args.content,
      imageUrl: args.imageUrl,
      category: args.category,
      featured: args.featured,
      published: args.published,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing case study
export const update = mutation({
  args: {
    id: v.id("caseStudies"),
    title: v.optional(v.string()),
    slug: v.optional(v.string()),
    description: v.optional(v.string()),
    content: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    category: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    published: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const patch: any = { ...updates, updatedAt: Date.now() };
    // Remove undefined fields
    Object.keys(patch).forEach((k) => {
      if (patch[k] === undefined) delete patch[k];
    });
    await ctx.db.patch(id, patch);
    return id;
  },
});

// Delete a case study
export const remove = mutation({
  args: { id: v.id("caseStudies") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return args.id;
  },
});
