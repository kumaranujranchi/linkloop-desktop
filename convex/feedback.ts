import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const submit = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    note: v.string(),
  },
  handler: async (ctx, args) => {
    const feedbackId = await ctx.db.insert("feedbacks", {
      name: args.name,
      email: args.email,
      note: args.note,
      status: "new",
      createdAt: Date.now(),
    });
    return feedbackId;
  },
});

export const list = query({
  args: {},
  handler: async (ctx) => {
    // Basic auth check for admin could go here, but for now we just return all
    const feedbacks = await ctx.db.query("feedbacks").order("desc").collect();
    return feedbacks;
  },
});

export const markReviewed = mutation({
  args: { feedbackId: v.id("feedbacks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.feedbackId, { status: "reviewed" });
    return { success: true };
  },
});
