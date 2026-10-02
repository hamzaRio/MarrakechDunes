export const BAM_DEFAULT_BASE = 'https://api.centralbankofmorocco.ma/cours/Version1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const FALLBACK_CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_LOOKBACK_DAYS = 7;

export interface BamEurMadRate {
  sourceCurrency: 'EUR';
  targetCurrency: 'MAD';
  rate: number;
  sourceDate: string;
  source: 'BANK_AL_MAGHRIB';
}

export class BamProviderError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 503, code = 'BAM_RATE_UNAVAILABLE') {
    super(message);
    this.name = 'BamProviderError';
    this.status = status;
    this.code = code;
  }
}

let cachedRate: { value: BamEurMadRate; expiresAt: number } | null = null;

const moroccoDate = (date: Date) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Casablanca' }).format(date);

export const bamCacheTtlMs = (sourceDate: string, now = new Date()) =>
  sourceDate.slice(0, 10) === moroccoDate(now) ? CACHE_TTL_MS : FALLBACK_CACHE_TTL_MS;

const dateOnly = (date: Date) => date.toISOString().slice(0, 10);

const fetchRateForDate = async (date: string | null, fetchImpl: typeof fetch): Promise<BamEurMadRate | null> => {
  const base = String(process.env.BAM_API_BASE || BAM_DEFAULT_BASE).replace(/\/$/, '');
  const url = new URL(`${base}/api/CoursVirement`);
  url.searchParams.set('libDevise', 'EUR');
  if (date) url.searchParams.set('date', date);
  const key = String(process.env.BAM_API_KEY || '').trim();
  if (!key) throw new BamProviderError('Bank Al-Maghrib access is not configured.', 503, 'BAM_NOT_CONFIGURED');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response: Response;
  try {
    response = await fetchImpl(url.toString(), {
      method: 'GET',
      headers: { 'Ocp-Apim-Subscription-Key': key, 'Cache-Control': 'no-cache', Accept: 'application/json' },
      signal: controller.signal,
    });
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new BamProviderError('Bank Al-Maghrib request timed out.', 503, 'BAM_TIMEOUT');
    throw new BamProviderError('Bank Al-Maghrib is temporarily unavailable.', 503, 'BAM_UPSTREAM_UNAVAILABLE');
  } finally {
    clearTimeout(timeout);
  }
  if (response.status === 401 || response.status === 403) throw new BamProviderError('Bank Al-Maghrib access was denied.', 503, 'BAM_ACCESS_DENIED');
  if (response.status === 429) throw new BamProviderError('Bank Al-Maghrib rate limit reached.', 503, 'BAM_RATE_LIMITED');
  if (!response.ok) throw new BamProviderError('Bank Al-Maghrib request failed.', 503, 'BAM_UPSTREAM_ERROR');
  let payload: unknown;
  try { payload = await response.json(); } catch { throw new BamProviderError('Bank Al-Maghrib returned malformed data.', 503, 'BAM_INVALID_RESPONSE'); }
  if (!Array.isArray(payload)) throw new BamProviderError('Bank Al-Maghrib returned malformed data.', 503, 'BAM_INVALID_RESPONSE');
  const record = payload.find((entry: any) => String(entry?.libDevise ?? '').toUpperCase() === 'EUR');
  if (!record) return null;
  const moyen = Number(record.moyen);
  const uniteDevise = Number(record.uniteDevise);
  const sourceDate = typeof record.date === 'string' ? record.date : '';
  if (!sourceDate || !Number.isFinite(moyen) || moyen <= 0 || !Number.isFinite(uniteDevise) || uniteDevise <= 0) return null;
  return { sourceCurrency: 'EUR', targetCurrency: 'MAD', rate: moyen / uniteDevise, sourceDate, source: 'BANK_AL_MAGHRIB' };
};

export const clearBamRateCache = () => { cachedRate = null; };

export async function getEurMadReferenceRate(fetchImpl: typeof fetch = fetch): Promise<BamEurMadRate> {
  if (cachedRate && cachedRate.expiresAt > Date.now()) return cachedRate.value;
  const today = new Date();
  for (let offset = 0; offset <= MAX_LOOKBACK_DAYS; offset += 1) {
    const candidate = new Date(today);
    candidate.setUTCDate(candidate.getUTCDate() - offset);
    const value = await fetchRateForDate(dateOnly(candidate), fetchImpl);
    if (value) {
      cachedRate = { value, expiresAt: Date.now() + bamCacheTtlMs(value.sourceDate) };
      return value;
    }
  }
  throw new BamProviderError('No EUR reference rate is available.', 503, 'BAM_RATE_UNAVAILABLE');
}
