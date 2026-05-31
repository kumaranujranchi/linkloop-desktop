/**
 * LinkLoop — Vercel Build Script
 * Copies all static assets and the Convex client bundle
 * to the dist/ directory for Vercel deployment.
 */

import { cpSync, mkdirSync, existsSync, readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";

const ROOT = resolve(import.meta.dirname, "..");
const DIST = resolve(ROOT, "dist");

console.log("🔨 Building LinkLoop for Vercel...");

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
cpIfExists(resolve(ROOT, "css"), resolve(DIST, "css"), { recursive: true });
cpIfExists(resolve(ROOT, "js"), resolve(DIST, "js"), { recursive: true });
cpIfExists(resolve(ROOT, "assets"), resolve(DIST, "assets"), { recursive: true });

// Copy the Convex browser bundle so node_modules isn't needed
console.log("  📦 Bundling Convex client...");
const convexSrc = resolve(ROOT, "node_modules/convex/dist/browser.bundle.js");
const convexDestDir = resolve(DIST, "js/vendor");
if (!existsSync(convexDestDir)) mkdirSync(convexDestDir, { recursive: true });

cpSync(convexSrc, resolve(convexDestDir, "convex.js"));

// Update the import map in index.html to use the bundled Convex
console.log("  🔧 Updating import map for production...");
let html = readFileSync(resolve(DIST, "index.html"), "utf-8");

// Replace the Convex import map path
html = html.replace(
  /"convex":\s*"\.\/node_modules\/convex\/dist\/esm\/browser\/index\.js"/,
  '"convex": "./js/vendor/convex.js"'
);
writeFileSync(resolve(DIST, "index.html"), html);

// Inject Convex URL from Vercel environment if provided
const convexUrl = process.env.CONVEX_URL;
if (convexUrl) {
  console.log("  🌐 Injecting Convex URL from Vercel environment...");
  const convexIntegrationPath = resolve(DIST, "js/convex-integration.js");
  let convexIntegration = readFileSync(convexIntegrationPath, "utf-8");
  convexIntegration = convexIntegration.replace(
    'const CONVEX_URL = "__CONVEX_URL__";',
    `const CONVEX_URL = "${convexUrl.replace(/"/g, '\\"')}";`
  );
  writeFileSync(convexIntegrationPath, convexIntegration);
}

console.log("✅ Build complete! dist/ is ready for Vercel deployment.");
console.log(`   Run: vercel --prod`);
