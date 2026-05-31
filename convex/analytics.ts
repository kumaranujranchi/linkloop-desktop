import { v } from "convex/values";
import { query } from "./_generated/server";

// ========== QUERIES ==========

// Dashboard KPIs
export const dashboardKpis = query({
  args: {},
  handler: async (ctx) => {
    const websites = await ctx.db.query("websites").collect();
    const exchanges = await ctx.db.query("exchangeRequests").collect();
    const backlinks = await ctx.db.query("backlinks").collect();
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
      totalWebsites: websites.length,
      activeExchanges: exchanges.filter((e) =>
        ["accepted", "negotiating"].includes(e.status)
      ).length,
      pendingRequests: exchanges.filter((e) => e.status === "new").length,
      verifiedBacklinks: backlinks.filter((b) => b.status === "healthy").length,
      reputationScore: 94, // Computed per user — placeholder for aggregate
      monthlyGrowth: users.length > 0
        ? Math.round(
            (users.filter((u) => u.createdAt >= thirtyDaysAgo).length /
              users.length) *
              100
          )
        : 0,
    };
  },
});

// Exchange activity over time (for charts)
export const exchangeActivity = query({
  args: {
    months: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_type", (q) => q.eq("type", "exchange_created"))
      .collect();

    const completedEvents = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_type", (q) => q.eq("type", "exchange_completed"))
      .collect();

    // Group by month
    const months = args.months || 6;
    const result: { month: string; created: number; completed: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString("default", { month: "short" });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();

      result.push({
        month: monthKey,
        created: events.filter(
          (e) => e.createdAt >= monthStart && e.createdAt < monthEnd
        ).length,
        completed: completedEvents.filter(
          (e) => e.createdAt >= monthStart && e.createdAt < monthEnd
        ).length,
      });
    }

    return result;
  },
});

// Backlink growth over time
export const backlinkGrowth = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("analyticsEvents")
      .withIndex("by_type", (q) => q.eq("type", "backlink_verified"))
      .collect();

    const months = args.months || 6;
    const result: { month: string; verified: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString("default", { month: "short" });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();

      result.push({
        month: monthKey,
        verified: events.filter(
          (e) => e.createdAt >= monthStart && e.createdAt < monthEnd
        ).length,
      });
    }

    return result;
  },
});

// User growth
export const userGrowth = query({
  args: { months: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const users = await ctx.db.query("users").collect();
    const months = args.months || 6;
    const result: { month: string; free: number; pro: number; agency: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthKey = d.toLocaleString("default", { month: "short" });
      const monthStart = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).getTime();

      const monthUsers = users.filter(
        (u) => u.createdAt >= monthStart && u.createdAt < monthEnd
      );

      result.push({
        month: monthKey,
        free: monthUsers.filter((u) => u.role === "free").length,
        pro: monthUsers.filter((u) => u.role === "pro").length,
        agency: monthUsers.filter((u) => u.role === "agency").length,
      });
    }

    return result;
  },
});

// Admin revenue stats
export const revenue = query({
  args: {},
  handler: async (ctx) => {
    const subs = await ctx.db.query("subscriptions").collect();
    const prices = { free: 0, pro: 49, agency: 199 };

    const activeSubs = subs.filter((s) => s.status === "active");
    const mrr = activeSubs.reduce((sum, s) => sum + prices[s.plan], 0);

    return {
      mrr,
      byPlan: {
        free: activeSubs.filter((s) => s.plan === "free").length,
        pro: activeSubs.filter((s) => s.plan === "pro").length,
        agency: activeSubs.filter((s) => s.plan === "agency").length,
      },
      totalSubscribers: activeSubs.length,
    };
  },
});
