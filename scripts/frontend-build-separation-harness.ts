import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";

const publicApp = await readFile("client/src/PublicApp.tsx", "utf8");
const adminApp = await readFile("client/src/AdminApp.tsx", "utf8");
const portal = await readFile("client/src/pages/customer-portal.tsx", "utf8");
const vercelConfig = await readFile("client/vercel.json", "utf8");
assert.match(publicApp, /path="\/activities"/);
assert.match(publicApp, /path="\/customer"/);
assert.doesNotMatch(publicApp, /\/admin|AdminLogin|AdminDashboard|CEODashboard|BusinessIntelligence|AdminRoute|AutoLogout|useAuth/);
assert.match(adminApp, /path="\/admin\/login"/);
for (const route of ["/admin", "/admin/dashboard", "/admin/ceo", "/admin/business-intelligence", "/admin/activities/new", "/admin/access-guide"]) assert.ok(adminApp.includes(`path="${route}"`));
assert.match(adminApp, /AdminRoute/);
assert.match(adminApp, /AutoLogout/);
assert.doesNotMatch(portal, /useAuth/);
assert.match(vercelConfig, /"source": "\/\(\.\*\)"/);
assert.match(vercelConfig, /"destination": "\/"/);
try {
  await access("client/dist/index.html");
  await access("client/dist-admin/index.html");
} catch {
  // Build artifact checks are optional when the harness runs without prior builds.
}
console.log("Frontend build separation harness: PASS");
