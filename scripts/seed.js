/* =============================================
   LinkBuild — Seed Demo Data
   Run with: node scripts/seed.js
   
   Populates your Convex database with realistic
   demo data. Uses ConvexHttpClient for Node.js.
   ============================================= */

const CONVEX_URL = "https://vibrant-marmot-366.convex.cloud";

async function seed() {
  const { ConvexHttpClient } = await import(
    "../node_modules/convex/dist/esm/browser/index.js"
  );
  const client = new ConvexHttpClient(CONVEX_URL);

  console.log("🌱 Seeding LinkBuild demo data to:", CONVEX_URL);

  const websiteData = [
    { domain: "seomastery.com", niche: "SEO Tools", country: "US", language: "English", domainAuthority: 65, spamScore: 2, trafficEstimate: 120000, referringDomains: 3240 },
    { domain: "contentforge.io", niche: "SaaS", country: "UK", language: "English", domainAuthority: 52, spamScore: 3, trafficEstimate: 38000, referringDomains: 1890 },
    { domain: "growthhacker.blog", niche: "Marketing", country: "CA", language: "English", domainAuthority: 58, spamScore: 5, trafficEstimate: 72000, referringDomains: 2150 },
    { domain: "linkstrategist.com", niche: "SEO Agency", country: "US", language: "English", domainAuthority: 71, spamScore: 1, trafficEstimate: 210000, referringDomains: 4800 },
    { domain: "backlinkpro.net", niche: "Link Building", country: "DE", language: "English", domainAuthority: 44, spamScore: 8, trafficEstimate: 18000, referringDomains: 920 },
    { domain: "myseotools.com", niche: "SEO Tools", country: "US", language: "English", domainAuthority: 52, spamScore: 2, trafficEstimate: 45000, referringDomains: 1780 },
    { domain: "contentmarketing.ai", niche: "AI Content", country: "US", language: "English", domainAuthority: 38, spamScore: 4, trafficEstimate: 12000, referringDomains: 650 },
    { domain: "affiliatemastery.org", niche: "Affiliate", country: "US", language: "English", domainAuthority: 61, spamScore: 2, trafficEstimate: 89000, referringDomains: 2900 },
  ];

  for (const w of websiteData) {
    try {
      await client.mutation("websites:add", { ...w, skipAuth: true });
      console.log(`  ✅ ${w.domain} — added (DA: ${w.domainAuthority})`);
    } catch (e) {
      console.log(`  ⚠️  ${w.domain} — ${e.message.slice(0, 80)}`);
    }
  }

  console.log("\n✅ Seed complete! View data: npx convex dashboard");
}

seed().catch((e) => {
  console.error("\n❌ Seed failed:", e.message);
  console.log("\n💡 Tip: Deploy Convex first with 'npx convex deploy'");
  console.log("   Then try: node scripts/seed.js");
});
