/**
 * LinkBuild — Vercel Build Script
 * Copies all static assets and the Convex client bundle
 * to the dist/ directory for Vercel deployment.
 */

import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");

console.log("🔨 Building LinkBuild for Vercel...");

// Create dist directory
if (!existsSync(DIST)) mkdirSync(DIST, { recursive: true });

// Helper: copy only if source exists
function cpIfExists(src, dest, opts) {
  if (existsSync(src)) {
    cpSync(src, dest, opts);
  } else {
    console.log(`  ⚠️  Skipping missing: ${src}`);
  }
}

// Copy static assets
console.log("  📁 Copying static files...");
cpIfExists(resolve(ROOT, "index.html"), resolve(DIST, "index.html"));
cpIfExists(resolve(ROOT, "dashboard.html"), resolve(DIST, "dashboard.html"));
cpIfExists(resolve(ROOT, "admin.html"), resolve(DIST, "admin.html"));
cpIfExists(resolve(ROOT, "terms.html"), resolve(DIST, "terms.html"));
cpIfExists(resolve(ROOT, "billing-policy.html"), resolve(DIST, "billing-policy.html"));
cpIfExists(resolve(ROOT, "privacy-policy.html"), resolve(DIST, "privacy-policy.html"));
cpIfExists(resolve(ROOT, "acceptable-use-policy.html"), resolve(DIST, "acceptable-use-policy.html"));
cpIfExists(resolve(ROOT, "css"), resolve(DIST, "css"), { recursive: true });
cpIfExists(resolve(ROOT, "js"), resolve(DIST, "js"), { recursive: true });
cpIfExists(resolve(ROOT, "assets"), resolve(DIST, "assets"), { recursive: true });

// Copy the Convex browser bundle so node_modules isn't needed
console.log("  📦 Bundling Convex client...");
const convexSrc = resolve(ROOT, "node_modules/convex/dist/browser.bundle.js");
const convexDestDir = resolve(DIST, "js/vendor");
if (!existsSync(convexDestDir)) mkdirSync(convexDestDir, { recursive: true });

cpSync(convexSrc, resolve(convexDestDir, "convex.js"));

// Update production Convex references
console.log("  🔧 Updating production Convex references...");

function updateConvexPaths(filePath) {
  if (existsSync(filePath)) {
    let content = readFileSync(filePath, "utf-8");
    // Match both absolute (/node_modules/...) and relative (./node_modules/...) paths
    content = content.replace(
      /["']\/node_modules\/convex\/dist\/browser\.bundle\.js["']|["']\.\/node_modules\/convex\/dist\/browser\.bundle\.js["']/g,
      '"./js/vendor/convex.js"'
    );
    writeFileSync(filePath, content);
  }
}

updateConvexPaths(resolve(DIST, "index.html"));
updateConvexPaths(resolve(DIST, "dashboard.html"));
updateConvexPaths(resolve(DIST, "admin.html"));

// Inject Convex URL from Vercel environment if provided
const convexUrl = process.env.CONVEX_URL;
if (convexUrl) {
  console.log("  🌐 Injecting Convex URL from Vercel environment...");
  const convexIntegrationPath = resolve(DIST, "js/convex-integration-v2.js");
  let convexIntegration = readFileSync(convexIntegrationPath, "utf-8");
  convexIntegration = convexIntegration.replace(
    'const CONVEX_URL = "__CONVEX_URL__";',
    `const CONVEX_URL = "${convexUrl.replace(/"/g, '\\"')}";`
  );
  writeFileSync(convexIntegrationPath, convexIntegration);
}

console.log("✅ Build complete! dist/ is ready for Vercel deployment.");
console.log(`   Run: vercel --prod`);
