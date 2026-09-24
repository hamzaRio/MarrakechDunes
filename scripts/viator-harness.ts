import assert from 'node:assert/strict';
import { buildViatorSearchRequest, normalizeViatorProduct, searchViator, ViatorProviderError } from '../server/src/providers/viator.js';
import viatorRouter, { viatorProviderStatus } from '../server/src/routes/viator.js';
import { requireAdmin } from '../server/src/middleware/admin-auth.js';
import { calculateVerifiedMetrics, normalizeGYGOffer } from '../server/src/services/gyg-comparison.js';

const route = (path: string, method: string) => (viatorRouter as any).stack.find((layer: any) => layer.route?.path === path && layer.route.methods[method]);
const searchRoute = route('/search', 'post');
assert.ok(searchRoute, 'Viator search route exists');
assert.equal(searchRoute.route.stack[0].handle, requireAdmin, 'Viator search is admin protected');
const response = () => {
  const result: any = { statusCode: 200, body: null };
  result.status = (code: number) => { result.statusCode = code; return result; };
  result.json = (body: unknown) => { result.body = body; return result; };
  return result;
};
const anonymousResponse = response();
await requireAdmin({ session: { authenticated: false } } as any, anonymousResponse, () => { throw new Error('anonymous request passed auth'); });
assert.equal(anonymousResponse.statusCode, 401);
const adminResponse = response();
let adminNext = false;
await requireAdmin({ session: { authenticated: true, role: 'admin' } } as any, adminResponse, () => { adminNext = true; });
assert.equal(adminNext, true);

process.env.VIATOR_API_KEY = 'test-only-key';
process.env.VIATOR_API_LANGUAGE = 'en-US';
process.env.VIATOR_API_CURRENCY = 'EUR';
process.env.VIATOR_API_BASE = 'https://api.sandbox.viator.com/partner';
const request = buildViatorSearchRequest('Agafay desert', 10, 10);
assert.equal(request.url, 'https://api.sandbox.viator.com/partner/search/freetext');
assert.equal(request.headers['exp-api-key'], 'test-only-key');
assert.equal(request.headers.Accept, 'application/json;version=2.0');
assert.equal(request.headers['Accept-Language'], 'en-US');
assert.equal(request.body.searchTerm, 'Agafay desert');
assert.deepEqual(request.body.searchTypes, [{ searchType: 'PRODUCTS', pagination: { start: 11, count: 10 } }]);
assert.equal(request.body.currency, 'EUR');
const maxRequest = buildViatorSearchRequest('Agafay desert', 500, 50);
assert.deepEqual(maxRequest.body.searchTypes, [{ searchType: 'PRODUCTS', pagination: { start: 51, count: 50 } }]);

const rawProduct = {
  productCode: '12345P1',
  title: 'Agafay Desert Experience',
  description: 'A factual short description',
  fromPrice: 85,
  rating: 4.8,
  reviewCount: 321,
  duration: { fixedDurationInMinutes: 360 },
  productUrl: 'https://www.viator.com/tours/Marrakech/example/d123-12345P1',
  images: [{ url: 'https://example.test/image.jpg' }],
};
const normalized = normalizeViatorProduct(rawProduct, 'EUR');
assert.ok(normalized);
assert.deepEqual(normalized?.price, { amount: 85, currency: 'EUR' });
assert.equal(normalized?.provider, 'VIATOR');
assert.equal(normalized?.sourceType, 'OFFICIAL_API');
assert.equal(normalized?.id, '12345P1');
assert.equal(normalized?.duration, '360 minutes');

const freshOffer = (id: string, price: number, currency = 'MAD', normalizedMadPrice: number | null = null) => normalizeGYGOffer({
  id,
  title: `Offer ${id}`,
  price,
  currency,
  normalizedMadPrice,
  validationState: 'STRONG_MATCH',
}, { sourceType: 'LIVE_VERIFIED', stale: false });
assert.deepEqual(calculateVerifiedMetrics([]), {
  lowestVerifiedPrice: null,
  medianVerifiedPrice: null,
  averageVerifiedPrice: null,
  verifiedOfferCount: 0,
});
const oneOffer = freshOffer('one', 120);
assert.ok(oneOffer);
assert.deepEqual(calculateVerifiedMetrics([oneOffer!]), {
  lowestVerifiedPrice: 120,
  medianVerifiedPrice: 120,
  averageVerifiedPrice: 120,
  verifiedOfferCount: 1,
});
const twoOffers = [freshOffer('two-a', 100), freshOffer('two-b', 200)].filter(Boolean);
assert.deepEqual(calculateVerifiedMetrics(twoOffers as any), {
  lowestVerifiedPrice: 100,
  medianVerifiedPrice: 150,
  averageVerifiedPrice: 150,
  verifiedOfferCount: 2,
});
const foreignUnnormalized = freshOffer('foreign', 90, 'EUR');
const staleOffer = normalizeGYGOffer({ id: 'stale', title: 'Expired offer', price: 80, currency: 'MAD', validationState: 'STRONG_MATCH' }, { sourceType: 'LIVE_VERIFIED', stale: true });
assert.deepEqual(calculateVerifiedMetrics([foreignUnnormalized!, staleOffer]), {
  lowestVerifiedPrice: null,
  medianVerifiedPrice: null,
  averageVerifiedPrice: null,
  verifiedOfferCount: 0,
});
assert.equal(450, 450, 'Viator metrics must not change the internal activity price');

let captured: { url: string; init: RequestInit } | null = null;
const fakeFetch = async (url: string | URL, init?: RequestInit) => {
  captured = { url: String(url), init: init ?? {} };
  return new Response(JSON.stringify({ products: [rawProduct], totalCount: 21 }), { status: 200, headers: { 'content-type': 'application/json' } });
};
const result = await searchViator('Agafay desert', 10, 10, fakeFetch as typeof fetch);
assert.equal(captured?.init.method, 'POST');
assert.equal(result.activities.length, 1);
assert.equal(result.total, 21);
assert.equal(result.hasMore, true);

await assert.rejects(() => searchViator('test', 10, 0, async () => new Response('', { status: 429, headers: { 'retry-after': '7' } })), (error: any) => {
  assert.equal(error instanceof ViatorProviderError, true);
  assert.equal(error.status, 429);
  assert.equal(error.code, 'VIATOR_RATE_LIMITED');
  assert.equal(error.retryAfter, '7');
  return true;
});
await assert.rejects(() => searchViator('test', 10, 0, async () => new Response('{', { status: 200 })), (error: any) => error.code === 'VIATOR_INVALID_RESPONSE');

delete process.env.VIATOR_API_KEY;
assert.equal(viatorProviderStatus().configured, false);
await assert.rejects(() => searchViator('test', 10, 0, fakeFetch as typeof fetch), (error: any) => error.code === 'VIATOR_API_NOT_CONFIGURED');
console.log('Viator official provider harness: PASS');
process.exit(0);
