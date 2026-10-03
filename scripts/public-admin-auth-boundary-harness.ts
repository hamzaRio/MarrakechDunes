import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const routing = await readFile("client/src/lib/admin-routing.ts", "utf8");
const auth = await readFile("client/src/hooks/use-auth.ts", "utf8");
const app = await readFile("client/src/App.tsx", "utf8");
const portal = await readFile("client/src/pages/customer-portal.tsx", "utf8");

const isAdminPath = (pathname: string) => pathname === "/admin" || pathname.startsWith("/admin/");
const publicPaths = ["/", "/activities", "/activities-simple", "/activity/123", "/booking", "/confirmation-and-pay", "/reviews", "/contact", "/customer", "/administrator", "/administer", "/foo/admin"];
const adminPaths = ["/admin", "/admin/", "/admin/login", "/admin/dashboard", "/admin/ceo", "/admin/business-intelligence", "/admin/activities/new", "/admin/access-guide"];
for (const path of publicPaths) assert.equal(isAdminPath(path), false, `public path misclassified: ${path}`);
for (const path of adminPaths) assert.equal(isAdminPath(path), true, `admin path misclassified: ${path}`);
assert.match(routing, /pathname === "\/admin" \|\| pathname\.startsWith\("\/admin\/"\)/);
assert.match(auth, /enabled:\s*isAdminRoute/);
assert.match(auth, /isAdminRoute && !isAuthRejected/);
assert.match(app, /function StaffSessionRuntime/);
assert.match(app, /if \(!isAdminPath\(location\)\) return null/);
assert.equal((app.match(/<AutoLogout timeoutMinutes=\{5\} warningMinutes=\{1\} \/>/g) || []).length, 1);
assert.match(app, /path="\/admin\/access-guide"/);
assert.match(app, /<AdminRoute>/);
assert.match(app, /path="\/admin\/login"/);
assert.doesNotMatch(app, /AdminAccessGuide, PUBLIC_ROUTE/);
assert.doesNotMatch(portal, /useAuth/);
console.log("Public/admin auth boundary harness: PASS");
