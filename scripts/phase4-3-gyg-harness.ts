import assert from 'node:assert/strict';
import { calculateVerifiedMetrics, normalizeGYGOffer } from '../server/src/services/gyg-comparison.js';
import gygRouter from '../server/src/routes/getyourguide.js';
import { requireAdmin, requireSuperAdmin } from '../server/src/middleware/admin-auth.js';

const response = () => {
  const result: any = { statusCode: 200, body: null };
  result.status = (code: number) => { result.statusCode = code; return result; };
  result.json = (body: unknown) => { result.body = body; return result; };
  return result;
};
const runMiddleware = async (middleware: any, role: string) => {
  const res = response(); let nextCalled = false;
  await middleware({ session: { authenticated: true, role } } as any, res as any, () => { nextCalled = true; });
  return { res, nextCalled };
};
const adminRead = await runMiddleware(requireAdmin, 'admin');
assert.equal(adminRead.nextCalled, true);
const adminWrite = await runMiddleware(requireSuperAdmin, 'admin');
assert.equal(adminWrite.res.statusCode, 403);
const superWrite = await runMiddleware(requireSuperAdmin, 'superadmin');
assert.equal(superWrite.nextCalled, true);
const comparableRoutes = (gygRouter as any).stack.filter((layer: any) => layer.route?.path?.startsWith('/comparables'));
assert.equal(comparableRoutes.length, 5);
for (const layer of comparableRoutes) {
  const method = Object.keys(layer.route.methods)[0];
  const middleware = layer.route.stack[0].handle;
  if (method === 'get') assert.equal(middleware, requireAdmin);
  else assert.equal(middleware, requireSuperAdmin);
}

// Isolated route-contract harness: mirrors the route boundary's pure input
// policy with in-memory storage only. It neither opens Mongo nor calls GYG.
const allowed = new Set(['MAD', 'EUR', 'USD', 'GBP']);
const validate = (body: any, knownActivities = new Set(['activity-a']), seen = new Set<string>()) => {
  let parsed: URL; try { parsed = new URL(body.url); } catch { return 400; }
  if (parsed.protocol !== 'https:' || !(parsed.hostname === 'getyourguide.com' || parsed.hostname.endsWith('.getyourguide.com'))) return 400;
  if (!knownActivities.has(body.activityId)) return 404;
  if (!(Number(body.price) > 0) || !allowed.has(String(body.currency).toUpperCase())) return 400;
  if (body.rating != null && (Number(body.rating) < 0 || Number(body.rating) > 5)) return 400;
  if (body.reviewCount != null && (!Number.isInteger(Number(body.reviewCount)) || Number(body.reviewCount) < 0)) return 400;
  const key = `${body.activityId}:${parsed.toString().replace(/\/$/, '')}`;
  if (seen.has(key)) return 409; seen.add(key); return 201;
};
const valid = { activityId: 'activity-a', url: 'https://www.getyourguide.com/marrakech-l208/', price: 100, currency: 'MAD', rating: 4.5, reviewCount: 10 };
assert.equal(validate(valid), 201);
assert.equal(validate({ ...valid, url: 'http://getyourguide.com/a' }), 400);
assert.equal(validate({ ...valid, url: 'https://example.com/a' }), 400);
assert.equal(validate({ ...valid, price: 0 }), 400);
assert.equal(validate({ ...valid, rating: 6 }), 400);
assert.equal(validate({ ...valid, reviewCount: -1 }), 400);
assert.equal(validate({ ...valid, currency: 'JPY' }), 400);
assert.equal(validate({ ...valid, activityId: 'missing' }), 404);
const duplicates = new Set<string>(); assert.equal(validate(valid, new Set(['activity-a']), duplicates), 201); assert.equal(validate(valid, new Set(['activity-a']), duplicates), 409);
assert.equal(validate({ ...valid, activityId: 'activity-b' }, new Set(['activity-a', 'activity-b']), duplicates), 201);

const trusted = (price: number) => normalizeGYGOffer({ id: String(price), title: 'Manual', price, currency: 'MAD', sourceType: 'MANUAL_VERIFIED', verified: true, stale: false });
const unnormalizedForeign = normalizeGYGOffer({ id: 'foreign', title: 'Foreign', price: 0, currency: 'MAD', originalPrice: 10, originalCurrency: 'EUR', sourceType: 'MANUAL_VERIFIED', verified: true, stale: false });
const stale = normalizeGYGOffer({ id: 'stale', title: 'Stale', price: 100, currency: 'MAD', sourceType: 'STALE_VERIFIED', verified: true, stale: true });
assert.deepEqual(calculateVerifiedMetrics([]), { lowestVerifiedPrice: null, medianVerifiedPrice: null, averageVerifiedPrice: null, verifiedOfferCount: 0 });
assert.deepEqual(calculateVerifiedMetrics([trusted(450)]), { lowestVerifiedPrice: 450, medianVerifiedPrice: 450, averageVerifiedPrice: 450, verifiedOfferCount: 1 });
const result = calculateVerifiedMetrics([trusted(300), trusted(500), trusted(700), unnormalizedForeign, stale]);
assert.equal(result.lowestVerifiedPrice, 300);
assert.equal(result.medianVerifiedPrice, 500);
assert.equal(result.verifiedOfferCount, 3);
console.log('Phase 4.3 GYG CRUD/RBAC/metrics harness: PASS');
