/**
 * Viator Partner API v2 search provider.
 *
 * This module is deliberately server-only: the Partner API key never crosses
 * the HTTP boundary to the browser. Search is used for staff market research,
 * not for catalog ingestion or automatic price changes.
 *
 * Viator documents this API primarily for merchandising and promoting Viator
 * inventory. Before using it chiefly for internal competitive pricing or
 * market-intelligence purposes in production, the operator should confirm
 * that use case with Viator at affiliateapi@tripadvisor.com.
 */

export const VIATOR_DEFAULT_BASE = 'https://api.viator.com/partner';
export const VIATOR_DEFAULT_LANGUAGE = 'en-US';
// MAD is not in the Partner API currency list documented by Viator. EUR is a
// supported display currency and keeps foreign offers clearly separate from
// MarrakechDunes' internally-controlled MAD prices.
export const VIATOR_DEFAULT_CURRENCY = 'EUR';

export const VIATOR_SUPPORTED_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'DKK', 'FJD', 'HKD', 'JPY',
  'NOK', 'NZD', 'SEK', 'SGD', 'THB', 'ZAR', 'INR', 'BRL', 'TWD', 'MXN',
  'CLP', 'IDR', 'ILS', 'KRW', 'PHP', 'PLN', 'TRY', 'AED', 'ARS', 'CNY',
  'COP', 'ISK', 'MYR', 'PEN', 'RUB', 'VND',
]);

export interface NormalizedViatorActivity {
  id: string;
  title: string;
  description: string | null;
  price: { amount: number; currency: string };
  rating: number | null;
  reviewCount: number | null;
  duration: string | null;
  location: string | null;
  imageUrl: string | null;
  url: string | null;
  provider: 'VIATOR';
  sourceType: 'OFFICIAL_API';
  verified: true;
  checkedAt: string;
}

export interface ViatorSearchResult {
  activities: NormalizedViatorActivity[];
  total: number | null;
  hasMore: boolean;
  offset: number;
  limit: number;
  currency: string;
}

export class ViatorProviderError extends Error {
  status: number;
  code: string;
  retryAfter?: string;

  constructor(message: string, status: number, code: string, retryAfter?: string) {
    super(message);
    this.name = 'ViatorProviderError';
    this.status = status;
    this.code = code;
    this.retryAfter = retryAfter;
  }
}

export const viatorCurrency = () => {
  const configured = String(process.env.VIATOR_API_CURRENCY ?? '').trim().toUpperCase();
  return VIATOR_SUPPORTED_CURRENCIES.has(configured) ? configured : VIATOR_DEFAULT_CURRENCY;
};

export const isViatorConfigured = () => Boolean(String(process.env.VIATOR_API_KEY ?? '').trim());

export interface ViatorSearchRequest {
  url: string;
  headers: Record<string, string>;
  body: {
    searchTerm: string;
    searchTypes: Array<{ searchType: 'PRODUCTS'; pagination: { start: number; count: number } }>;
    currency: string;
  };
}

export function buildViatorSearchRequest(query: string, limit = 12, offset = 0): ViatorSearchRequest {
  const safeLimit = Math.min(Math.max(Math.floor(limit), 1), 50);
  const safeOffset = Math.max(Math.floor(offset), 0);
  const base = String(process.env.VIATOR_API_BASE || VIATOR_DEFAULT_BASE).replace(/\/$/, '');
  const language = String(process.env.VIATOR_API_LANGUAGE || VIATOR_DEFAULT_LANGUAGE);
  return {
    url: `${base}/search/freetext`,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json;version=2.0',
      'Accept-Language': language,
      'exp-api-key': String(process.env.VIATOR_API_KEY || ''),
    },
    body: {
      searchTerm: query.trim(),
      searchTypes: [{ searchType: 'PRODUCTS', pagination: { start: safeOffset + 1, count: safeLimit } }],
      currency: viatorCurrency(),
    },
  };
}

const asFiniteNumber = (value: unknown): number | null => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const durationLabel = (duration: any): string | null => {
  if (typeof duration === 'string' && duration.trim()) return duration.trim();
  if (!duration || typeof duration !== 'object') return null;
  const fixed = asFiniteNumber(duration.fixedDurationInMinutes ?? duration.fixedValueInMinutes);
  if (fixed != null) return `${fixed} minutes`;
  const from = asFiniteNumber(duration.variableDurationFromMinutes ?? duration.variableValueFromMinutes);
  const to = asFiniteNumber(duration.variableDurationToMinutes ?? duration.variableValueToMinutes);
  if (from != null && to != null) return `${from}-${to} minutes`;
  if (from != null) return `${from}+ minutes`;
  return null;
};

export function normalizeViatorProduct(product: any, requestedCurrency = viatorCurrency()): NormalizedViatorActivity | null {
  if (!product || typeof product !== 'object') return null;
  const id = String(product.productCode ?? product.product_code ?? product.code ?? product.id ?? '').trim();
  const title = String(product.title ?? product.name ?? '').trim();
  const amount = asFiniteNumber(
    product.fromPrice ?? product.price?.fromPrice ?? product.pricing?.fromPrice ?? product.pricing?.summary?.fromPrice ?? product.price?.values?.amount ?? product.price?.amount,
  );
  if (!id || !title || amount == null || amount <= 0) return null;

  const reviewSummary = product.reviews?.reviewCountTotals ?? product.reviewCountTotals ?? product.reviews;
  const rating = asFiniteNumber(
    product.rating ?? product.reviews?.combinedAverageRating ?? reviewSummary?.combinedAverageRating,
  );
  const reviewCount = asFiniteNumber(
    product.reviewCount ?? product.reviews?.combinedTotalCount ?? reviewSummary?.combinedTotalCount ?? reviewSummary?.combinedReviewCount ?? reviewSummary?.reviewCount,
  );
  const image = product.imageUrl ?? product.images?.[0]?.url ?? product.images?.[0]?.sslUrl ?? product.images?.[0]?.ssl_url ?? product.thumbnail ?? null;
  const rawUrl = product.productUrl ?? product.clickOffToPDP ?? product.url ?? product.tourUrl ?? null;
  const url = typeof rawUrl === 'string' && /^https:\/\/([\w-]+\.)?viator\.com\//i.test(rawUrl) ? rawUrl : null;
  const location = product.location?.name ?? product.location?.address ?? product.destinations?.[0]?.name ?? product.destinationName ?? null;
  const description = typeof product.shortDescription === 'string'
    ? product.shortDescription.trim()
    : typeof product.description === 'string' ? product.description.trim().slice(0, 500) : null;

  return {
    id,
    title,
    description: description || null,
    price: { amount, currency: requestedCurrency },
    rating: rating != null && rating >= 0 && rating <= 5 ? rating : null,
    reviewCount: reviewCount != null && reviewCount >= 0 ? Math.floor(reviewCount) : null,
    duration: durationLabel(product.duration),
    location: typeof location === 'string' && location.trim() ? location.trim() : null,
    imageUrl: typeof image === 'string' && image.startsWith('https://') ? image : null,
    url,
    provider: 'VIATOR',
    sourceType: 'OFFICIAL_API',
    verified: true,
    checkedAt: new Date().toISOString(),
  };
}

const responseProducts = (payload: any): any[] => {
  if (Array.isArray(payload?.products)) return payload.products;
  if (Array.isArray(payload?.data?.products)) return payload.data.products;
  const productSearch = Array.isArray(payload?.searchTypes) ? payload.searchTypes.find((entry: any) => entry?.searchType === 'PRODUCTS') : null;
  if (Array.isArray(productSearch?.products)) return productSearch.products;
  if (Array.isArray(productSearch?.results)) return productSearch.results;
  return [];
};

export async function searchViator(query: string, limit = 12, offset = 0, fetchImpl: typeof fetch = fetch): Promise<ViatorSearchResult> {
  if (!isViatorConfigured()) throw new ViatorProviderError('Viator Partner API access is not configured.', 503, 'VIATOR_API_NOT_CONFIGURED');
  const request = buildViatorSearchRequest(query, limit, offset);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let response: Response;
  try {
    response = await fetchImpl(request.url, { method: 'POST', headers: request.headers, body: JSON.stringify(request.body), signal: controller.signal });
  } catch (error: any) {
    if (error?.name === 'AbortError') throw new ViatorProviderError('Viator search timed out.', 503, 'VIATOR_TIMEOUT');
    throw new ViatorProviderError('Viator search is temporarily unavailable.', 503, 'VIATOR_UPSTREAM_UNAVAILABLE');
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) {
    const retryAfter = response.headers.get('retry-after') ?? undefined;
    const status = response.status === 429 ? 429 : response.status >= 500 ? 503 : response.status;
    const code = response.status === 429 ? 'VIATOR_RATE_LIMITED' : 'VIATOR_UPSTREAM_ERROR';
    throw new ViatorProviderError('Viator search request failed.', status, code, retryAfter);
  }
  let payload: any;
  try { payload = await response.json(); } catch { throw new ViatorProviderError('Viator returned malformed data.', 503, 'VIATOR_INVALID_RESPONSE'); }
  const currency = viatorCurrency();
  const products = responseProducts(payload);
  const activities = products.map((product) => normalizeViatorProduct(product, currency)).filter((value): value is NormalizedViatorActivity => value !== null);
  const total = asFiniteNumber(payload?.totalCount ?? payload?.data?.totalCount ?? payload?.total) ?? null;
  return { activities, total, hasMore: total != null ? offset + activities.length < total : activities.length >= Math.min(Math.max(limit, 1), 50), offset: Math.max(offset, 0), limit: Math.min(Math.max(limit, 1), 50), currency };
}
