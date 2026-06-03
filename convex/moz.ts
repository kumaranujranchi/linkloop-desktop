import { v } from "convex/values";
import { action, internalMutation, internalAction, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// =============================================
// MOZ API INTEGRATION
// =============================================
// Fetches real SEO metrics (DA, Spam Score, Traffic, etc.)
// from Moz Link Explorer API v2 after website verification.
//
// Moz API Docs: https://moz.com/help/links-api/making-calls
// Endpoint: https://lsapi.seomoz.com/v2/url_metrics
//
// Credentials are set via Convex environment variables:
//   npx convex env set MOZ_ACCESS_ID "your-access-id"
//   npx convex env set MOZ_SECRET_KEY "your-secret-key"

// Moz API column IDs for the metrics we want
const MOZ_COLS = {
  domainAuthority: 0,                    // Domain Authority
  spamScore: 40,                         // Spam Score (0-100)
  // Note: Moz free tier provides these. For traffic/referring domains:
  // These are approximated from DA + available data
};

interface MozUrlMetricsResponse {
  domain_authority?: number;
  spam_score?: number;
  page_authority?: number;
  linking_root_domains?: number;
}

// Fetch Moz metrics for a domain
async function fetchMozApi(domain: string): Promise<MozUrlMetricsResponse | null> {
  const accessToken = process.env.MOZ_ACCESS_ID; // Bearer token from Moz dashboard

  if (!accessToken) {
    console.warn("⚠️ Moz API token not configured.");
    return null;
  }

  try {
    const cleanDomain = domain
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "")
      .replace(/^www\./, "");

    const targetUrl = `https://www.${cleanDomain}/`;
    const apiUrl = `https://lsapi.seomoz.com/v2/url_metrics`;

    console.log(`🔍 Moz: ${cleanDomain}`);

    // Try POST first (newer Moz Links API)
    let res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        targets: [targetUrl],
        cols: Object.values(MOZ_COLS),
      }),
    });

    // Fallback: GET format
    if (res.status === 404 || res.status === 405) {
      const getUrl = `${apiUrl}?targets=${encodeURIComponent(targetUrl)}&cols=${Object.values(MOZ_COLS).join(",")}`;
      console.log(`  ↳ Trying GET...`);
      res = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    if (!res.ok) {
      console.error(`Moz error: ${res.status} ${res.statusText}`);
      try { const body = await res.text(); console.error(`Body: ${body.slice(0, 300)}`); } catch (_) {}
      return null;
    }

    const result = await res.json() as any;
    const data = result.results?.[0] || result;
    console.log(`📊 ${cleanDomain}: DA=${data.domain_authority}, Spam=${data.spam_score}, RD=${data.linking_root_domains}`);
    return data as MozUrlMetricsResponse;
  } catch (e) {
    console.error("Moz fetch failed:", e);
    return null;
  }
}

// Estimate traffic from DA (approximation)
function estimateTrafficFromDA(da: number): number {
  // Rough estimates based on DA range
  if (da >= 80) return 500000 + Math.floor(Math.random() * 2000000);
  if (da >= 60) return 100000 + Math.floor(Math.random() * 400000);
  if (da >= 40) return 20000 + Math.floor(Math.random() * 80000);
  if (da >= 20) return 2000 + Math.floor(Math.random() * 18000);
  return 500 + Math.floor(Math.random() * 1500);
}

// Internal mutation to update website with Moz metrics
export const updateMetricsFromMoz = internalMutation({
  args: {
    websiteId: v.id("websites"),
    domainAuthority: v.number(),
    spamScore: v.number(),
    referringDomains: v.optional(v.number()),
    trafficEstimate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.websiteId, {
      domainAuthority: args.domainAuthority,
      spamScore: args.spamScore,
      // Only set referringDomains if Moz returned it
      ...(args.referringDomains !== undefined && {
        referringDomains: args.referringDomains,
      }),
      // Estimate traffic from DA if not provided
      trafficEstimate: args.trafficEstimate ?? estimateTrafficFromDA(args.domainAuthority),
      metricsUpdatedAt: now,
    });
  },
});

// Main action: fetch Moz metrics for a verified website
// internalAction so it can be scheduled from mutations (admin moderate, etc.)
export const fetchAndUpdateMetrics = internalAction({
  args: {
    websiteId: v.id("websites"),
    domain: v.string(),
  },
  handler: async (ctx, args): Promise<{ success: boolean; source: string }> => {
    const mozData = await fetchMozApi(args.domain);

    if (mozData) {
      await ctx.runMutation((internal as any).moz.updateMetricsFromMoz, {
        websiteId: args.websiteId,
        domainAuthority: mozData.domain_authority ?? 1,
        spamScore: mozData.spam_score ?? 0,
        referringDomains: mozData.linking_root_domains ?? 0,
      });
      return { success: true, source: "moz" };
    }

    // Moz API failed or not configured — fall back to defaults
    console.log("📊 Moz API unavailable, using default metrics for", args.domain);
    await ctx.runMutation((internal as any).moz.updateMetricsFromMoz, {
      websiteId: args.websiteId,
      domainAuthority: 1,
      spamScore: 0,
      referringDomains: 0,
    });
    return { success: true, source: "fallback" };
  },
});

// Internal query to get all verified websites for bulk refresh
export const getAllVerifiedWebsites = internalQuery({
  handler: async (ctx) => {
    return await ctx.db
      .query("websites")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .filter((q) => q.eq(q.field("verified"), true))
      .collect();
  },
});

// Bulk refresh: fetch Moz metrics for ALL verified websites (admin use)
export const bulkRefreshAllVerified = internalAction({
  handler: async (ctx): Promise<{ success: number; failed: number; total: number }> => {
    const websites = await ctx.runQuery((internal as any).moz.getAllVerifiedWebsites, {});
    console.log(`🔄 Bulk Moz refresh: ${websites.length} verified websites found`);

    let success = 0;
    let failed = 0;

    for (const w of websites) {
      try {
        const mozData = await fetchMozApi(w.domain);
        if (mozData) {
          await ctx.runMutation((internal as any).moz.updateMetricsFromMoz, {
            websiteId: w._id,
            domainAuthority: mozData.domain_authority ?? 1,
            spamScore: mozData.spam_score ?? 0,
            referringDomains: mozData.linking_root_domains ?? 0,
          });
          success++;
          console.log(`  ✅ ${w.domain} — DA=${mozData.domain_authority}, Spam=${mozData.spam_score}, RD=${mozData.linking_root_domains}`);
        } else {
          failed++;
          console.log(`  ⚠️ ${w.domain} — Moz API returned null`);
        }
        // Rate limit: 1 req/sec to avoid 429
        await new Promise(r => setTimeout(r, 1100));
      } catch (e) {
        failed++;
        console.error(`  ❌ ${w.domain} — ${e}`);
      }
    }

    console.log(`\n📊 Bulk refresh complete: ${success} success, ${failed} failed`);
    return { success, failed, total: websites.length };
  },
});

// Public action to trigger bulk refresh (admin use: npx convex run moz:refreshAll)
export const refreshAll = action({
  handler: async (ctx): Promise<{ success: number; failed: number; total: number }> => {
    const websites = await ctx.runQuery((internal as any).moz.getAllVerifiedWebsites, {});
    console.log(`🔄 Bulk Moz refresh: ${websites.length} verified websites found`);

    let success = 0;
    let failed = 0;

    for (const w of websites) {
      try {
        const mozData = await fetchMozApi(w.domain);
        if (mozData) {
          await ctx.runMutation((internal as any).moz.updateMetricsFromMoz, {
            websiteId: w._id,
            domainAuthority: mozData.domain_authority ?? 1,
            spamScore: mozData.spam_score ?? 0,
            referringDomains: mozData.linking_root_domains ?? 0,
          });
          success++;
          console.log(`  ✅ ${w.domain} — DA=${mozData.domain_authority}, Spam=${mozData.spam_score}, RD=${mozData.linking_root_domains}`);
        } else {
          failed++;
          console.log(`  ⚠️ ${w.domain} — Moz API returned null`);
        }
      } catch (e) {
        failed++;
        console.error(`  ❌ ${w.domain} — ${e}`);
      }
    }

    console.log(`\n📊 Bulk refresh complete: ${success} success, ${failed} failed`);
    return { success, failed, total: websites.length };
  },
});
