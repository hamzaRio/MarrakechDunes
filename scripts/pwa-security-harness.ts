import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';

const publicOutput = 'client/dist';
const adminOutput = 'client/dist-admin';
const publicFiles = await readdir(publicOutput);
const adminFiles = await readdir(adminOutput);

assert.ok(publicFiles.includes('sw.js'), 'Public build must emit a service worker');
assert.ok(publicFiles.includes('manifest.webmanifest'), 'Public PWA manifest must remain');
assert.ok(publicFiles.some((file) => /^workbox-.*\.js$/.test(file)), 'Public Workbox runtime must remain');

const sw = await readFile(`${publicOutput}/sw.js`, 'utf8');
const registration = await readFile(`${publicOutput}/registerSW.js`, 'utf8');
const cleanup = await readFile(`${publicOutput}/pwa-cache-cleanup.js`, 'utf8');
const publicApp = await readFile('client/src/PublicApp.tsx', 'utf8');
const bookingForm = await readFile('client/src/pages/booking-fixed.tsx', 'utf8');

assert.match(sw, /importScripts\(["']\/pwa-cache-cleanup\.js["']\)/);
assert.ok(!/api-cache|static-files|marrakechdunes-sppy\.onrender\.com/i.test(sw), 'Generated worker must not contain a legacy API cache or API hostname');
assert.equal((sw.match(/\.registerRoute\(/g) || []).length, 2, 'Only navigation and Google Fonts runtime routes are expected');
assert.match(sw, /registerRoute\(\/\^https:\\\/\\\/fonts\\\.googleapis/);
assert.ok(!/registerRoute\([^;]*["']POST["']/i.test(sw), 'No POST runtime route may intercept bookings');
assert.doesNotMatch(registration, /reload\(|skipWaiting|messageSkipWaiting|controllerchange|controlling/i);
assert.doesNotMatch(sw, /clientsClaim\(/);

const denylistSource = sw.match(/denylist:(\[[^\]]+\])/);
assert.ok(denylistSource, 'Generated navigation route must have a denylist');
const denylist = runInNewContext(denylistSource[1]) as RegExp[];
for (const path of ['/api', '/api/session/init', '/api/bookings', '/admin', '/admin/dashboard', '/sitemap.xml', '/robots.txt']) {
  assert.ok(denylist.some((pattern) => pattern.test(path)), `${path} must not use public SPA fallback`);
}
for (const path of ['/', '/activities', '/activity/sample', '/booking', '/confirmation-and-pay', '/reviews', '/contact', '/customer']) {
  assert.ok(denylist.every((pattern) => !pattern.test(path)), `${path} must retain public SPA fallback`);
}

const precacheUrls = [...sw.matchAll(/\{url:["']([^"']+)["']/g)].map((match) => match[1]);
assert.ok(precacheUrls.length > 0, 'Generated public precache must contain static assets');
assert.ok(precacheUrls.every((url) => !url.startsWith('/api') && !url.startsWith('api/') && !/^https?:/.test(url)), 'Precache must contain only same-origin static build assets');

let activation: ((event: { waitUntil: (work: Promise<unknown>) => void }) => void) | undefined;
const deleted: string[] = [];
runInNewContext(cleanup, {
  self: { addEventListener: (type: string, handler: typeof activation) => {
    assert.equal(type, 'activate');
    activation = handler;
  } },
  caches: { delete: async (name: string) => { deleted.push(name); return true; } },
});
assert.ok(activation, 'Cleanup must run on worker activation');
let cleanupWork: Promise<unknown> | undefined;
activation({ waitUntil: (work) => { cleanupWork = work; } });
assert.ok(cleanupWork, 'Activation must wait for legacy cache deletion');
await cleanupWork;
assert.deepEqual(deleted.sort(), ['api-cache', 'static-files']);

for (const route of ['/', '/activities', '/activity/:id', '/booking', '/confirmation-and-pay', '/reviews', '/contact', '/customer']) {
  assert.ok(publicApp.includes(`path="${route}"`), `${route} must stay in PublicApp`);
}
assert.match(bookingForm, /\/api\/bookings|createBooking|submitBooking/);

for (const artifact of ['sw.js', 'registerSW.js', 'manifest.webmanifest', 'pwa-cache-cleanup.js']) {
  assert.ok(!adminFiles.includes(artifact), `Admin build must not contain ${artifact}`);
}
assert.ok(!adminFiles.some((file) => /^workbox-.*\.js(?:\.map)?$/.test(file)), 'Admin build must not contain Workbox artifacts');
const adminHtml = await readFile(`${adminOutput}/index.html`, 'utf8');
assert.doesNotMatch(adminHtml, /serviceWorker|registerSW|manifest\.webmanifest|sw\.js/i);
const adminAssets = await readdir(`${adminOutput}/assets`);
for (const asset of adminAssets.filter((file) => file.endsWith('.js'))) {
  const code = await readFile(`${adminOutput}/assets/${asset}`, 'utf8');
  assert.doesNotMatch(code, /navigator\.serviceWorker\.register|registerSW\.js|\/sw\.js/, `Admin asset ${asset} must not register a worker`);
}

console.log('PWA security harness: PASS (generated build assertions and simulated activation; no browser integration)');
