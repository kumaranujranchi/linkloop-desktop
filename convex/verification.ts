import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";

// =============================================
// VERIFICATION CHECKER — DNS TXT & Meta Tag
// =============================================

// Check DNS TXT record via Google DNS-over-HTTPS
async function checkDnsVerification(domain: string, expectedCode: string): Promise<boolean> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "").replace(/^www\./, "");
    const url = `https://dns.google/resolve?name=${encodeURIComponent(cleanDomain)}&type=TXT`;
    const res = await fetch(url);
    const data = await res.json() as { Answer?: { data: string }[] };

    if (data.Answer) {
      for (const record of data.Answer) {
        // TXT records come quoted, strip quotes
        const value = record.data.replace(/^"|"$/g, "");
        if (value === expectedCode) return true;
      }
    }
    return false;
  } catch (e) {
    console.error("DNS verification check failed:", e);
    return false;
  }
}

// Check meta tag on the website's homepage
async function checkMetaTagVerification(domain: string, expectedCode: string): Promise<boolean> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
    const url = `https://${cleanDomain}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "LinkBuild-Verification/1.0" },
      redirect: "follow",
    });
    const html = await res.text();

    // Check for <meta name="linkbuild-verify" content="CODE">
    const metaRegex = /<meta\s+name=["']linkbuild-verify["']\s+content=["']([^"']+)["']/i;
    const match = html.match(metaRegex);
    if (match && match[1] === expectedCode) return true;

    return false;
  } catch (e) {
    console.error("Meta tag verification check failed:", e);
    return false;
  }
}

// Main action: check verification by either DNS or meta tag
export const checkAndVerify = action({
  args: {
    websiteId: v.id("websites"),
    domain: v.string(),
    verificationCode: v.string(),
    method: v.union(v.literal("dns"), v.literal("metatag")),
  },
  handler: async (ctx, args) => {
    let isVerified = false;

    if (args.method === "dns") {
      isVerified = await checkDnsVerification(args.domain, args.verificationCode);
    } else if (args.method === "metatag") {
      isVerified = await checkMetaTagVerification(args.domain, args.verificationCode);
    }

    if (isVerified) {
      // Call the internal mutation to mark as verified
      await ctx.runMutation(internal.verification.verify, {
        websiteId: args.websiteId,
        verificationMethod: args.method,
      });

      // 🔥 After verification, fetch real metrics from Moz API
      try {
        await ctx.runAction(internal.moz.fetchAndUpdateMetrics, {
          websiteId: args.websiteId,
          domain: args.domain,
        });
      } catch (e) {
        console.error("Moz metrics fetch failed (non-blocking):", e);
        // Don't fail verification if Moz is down — website stays verified with defaults
      }

      return { success: true, message: "✅ Website verified successfully! Metrics updated from Moz." };
    }

    // Give helpful error message
    const instructions = args.method === "dns"
      ? `DNS TXT record not found. Add this TXT record to your domain ${args.domain}:\nName: @ (or leave blank for root)\nValue: ${args.verificationCode}\n\nThen wait 1-2 minutes for DNS propagation and try again.`
      : `Meta tag not found. Add this tag inside the <head> of ${args.domain}:\n<meta name="linkbuild-verify" content="${args.verificationCode}">\n\nThen try again.`;

    return { success: false, message: instructions };
  },
});

// Expose verify as internal mutation so the action can call it
export const verify = internalMutation({
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
  },
});
