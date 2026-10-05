import assert from "node:assert/strict";
import { readFile, access, readdir } from "node:fs/promises";
import { runInNewContext } from "node:vm";

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
const navbar = await readFile("client/src/components/navbar.tsx", "utf8");
assert.doesNotMatch(navbar, /staffSpace|\/admin|ADMIN_URL|admin-url/);
await assert.rejects(access("client/src/lib/admin-url.ts"), { code: "ENOENT" });
for (const language of ["en", "fr"]) {
  const locale = JSON.parse(await readFile(`client/src/locales/${language}.json`, "utf8"));
  assert.equal(locale.nav.staffSpace, undefined);
}
assert.doesNotMatch(await readFile("client/public/robots.txt", "utf8"), /Disallow:\s*\/admin/);
for (const file of ["client/public/config.js", "client/dist/config.js", "client/dist-admin/config.js"]) {
  const context = { window: {} as Record<string, unknown> };
  runInNewContext(await readFile(file, "utf8"), context, { timeout: 1000 });
  assert.deepEqual(Object.keys(context.window), ["__API_URL__"]);
  assert.equal(typeof context.window.__API_URL__, "string");
}
// Inspect actual build source graphs rather than confusing shared guards/PWA deny rules with AdminApp.
for (const [directory, admin] of [["client/dist", false], ["client/dist-admin", true]] as const) {
  await access(`${directory}/index.html`);
  const assets = await readdir(`${directory}/assets`);
  const maps = assets.filter(name => name.endsWith(".js.map"));
  assert.ok(maps.length > 0, `Build ${directory} first; source maps are required`);
  const sources = (await Promise.all(maps.map(async name =>
    JSON.parse(await readFile(`${directory}/assets/${name}`, "utf8")).sources as string[]
  ))).flat();
  assert.equal(sources.some(source => /\/AdminApp\.tsx$/.test(source)), admin);
assert.equal(sources.some(source => /\/PublicApp\.tsx$/.test(source)), !admin);
  if (admin) {
    const index = await readFile(`${directory}/index.html`, "utf8");
    assert.match(index, /name="robots" content="noindex,nofollow,noarchive"/);
    assert.doesNotMatch(index, /robots\.txt|sitemap\.xml/);
    for (const forbidden of ["robots.txt", "sitemap.xml", "sw.js", "manifest.webmanifest"]) {
      await assert.rejects(access(`${directory}/${forbidden}`), { code: "ENOENT" });
    }
  } else {
    for (const name of assets.filter(name => name.endsWith(".js"))) {
      const source = await readFile(`${directory}/assets/${name}`, "utf8");
      assert.doesNotMatch(source, /ADMIN_URL|__ADMIN_URL__|\/admin\/login|AdminApp|staffSpace|Staff area/);
    }
  }
}
console.log("Frontend build separation harness: PASS");
