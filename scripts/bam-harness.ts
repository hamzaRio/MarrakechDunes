import { bamCacheTtlMs, clearBamRateCache, getEurMadReferenceRate } from '../server/src/providers/bam.js';

const response = (payload: unknown, status = 200): Response => new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
let calls = 0;
const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(new Date());
const previous = new Date(`${today}T12:30:00Z`);
previous.setUTCDate(previous.getUTCDate() - 1);
const previousDate = previous.toISOString().slice(0, 10);
const fetchMock: typeof fetch = (async (input: RequestInfo | URL) => {
  calls += 1;
  const url = String(input);
  return response([{ date: `${today}T12:30:00`, libDevise: 'EUR', moyen: 11.0017, uniteDevise: 1 }]);
}) as typeof fetch;

clearBamRateCache();
process.env.BAM_API_KEY = 'harness-placeholder';
process.env.BAM_API_BASE = 'https://bam.test';
const rate = await getEurMadReferenceRate(fetchMock);
if (rate.rate !== 11.0017 || rate.source !== 'BANK_AL_MAGHRIB' || bamCacheTtlMs(rate.sourceDate) !== 24 * 60 * 60 * 1000) throw new Error('BAM current-day cache policy failed');
const callsAfterFirst = calls;
const cached = await getEurMadReferenceRate(fetchMock);
if (cached.rate !== rate.rate || calls !== callsAfterFirst) throw new Error('BAM cache failed');

clearBamRateCache();
let fallbackCalls = 0;
const fallbackFetch: typeof fetch = (async (input: RequestInfo | URL) => {
  fallbackCalls += 1;
  return String(input).includes(today)
    ? response([])
    : response([{ date: `${previousDate}T12:30:00`, libDevise: 'EUR', moyen: 11, uniteDevise: 1 }]);
}) as typeof fetch;
const originalNow = Date.now;
let now = originalNow();
Date.now = () => now;
try {
  const fallback = await getEurMadReferenceRate(fallbackFetch);
  if (fallback.sourceDate.slice(0, 10) !== previousDate || bamCacheTtlMs(fallback.sourceDate) !== 60 * 60 * 1000) throw new Error('BAM fallback cache policy failed');
  const fallbackCallsBeforeExpiry = fallbackCalls;
  await getEurMadReferenceRate(fallbackFetch);
  if (fallbackCalls !== fallbackCallsBeforeExpiry) throw new Error('BAM fallback cache reuse failed');
  now += 61 * 60 * 1000;
  await getEurMadReferenceRate(fallbackFetch);
  if (fallbackCalls <= fallbackCallsBeforeExpiry) throw new Error('BAM fallback cache expiry failed');
} finally {
  Date.now = originalNow;
}

const assertUnavailable = async (payload: unknown, status: number, expectedCode: string) => {
  clearBamRateCache();
  const failingFetch: typeof fetch = (async () => response(payload, status)) as typeof fetch;
  try {
    await getEurMadReferenceRate(failingFetch);
    throw new Error(`Expected ${expectedCode}`);
  } catch (error: any) {
    if (error?.code !== expectedCode) throw error;
  }
};

await assertUnavailable({ malformed: true }, 200, 'BAM_INVALID_RESPONSE');
await assertUnavailable([{ libDevise: 'EUR', date: `${previousDate}T12:30:00`, moyen: 11, uniteDevise: 0 }], 200, 'BAM_RATE_UNAVAILABLE');
await assertUnavailable({}, 401, 'BAM_ACCESS_DENIED');
await assertUnavailable({}, 429, 'BAM_RATE_LIMITED');
await assertUnavailable({}, 503, 'BAM_UPSTREAM_ERROR');
console.log(`BAM harness PASS (fallback calls: ${callsAfterFirst}, cache reused: yes, malformed/invalid/error cases: yes)`);
