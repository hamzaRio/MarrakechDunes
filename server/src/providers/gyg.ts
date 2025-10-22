export interface GYGSearchInput {
  query: string;
  city?: string;
  page?: number;
  perPage?: number;
}

export function buildGYGSearchRequest(input: GYGSearchInput) {
  const base = process.env.GYG_SUPPLIER_BASE ?? 'https://supplier-api.getyourguide.com/1';
  const user = process.env.GYG_SUPPLIER_USER ?? '';
  const pass = process.env.GYG_SUPPLIER_PASS ?? '';

  const qs = new URLSearchParams();
  if (input.query) qs.set('q', input.query);
  if (input.city) qs.set('city', input.city);
  qs.set('page', String(input.page ?? 1));
  qs.set('per_page', String(input.perPage ?? 10));

  const url = `${base.replace(/\/$/, '')}/products?${qs.toString()}`;

  return {
    method: 'GET' as const,
    url,
    headers: {
      Authorization: user || pass ? 'Basic <redacted>' : 'Basic <missing>',
      Accept: 'application/json',
    },
    notes: [
      'Dry-run only: no external call made.',
      'Replace Authorization with real Basic base64(user:pass) in live mode.',
    ],
  };
}

export type MarketItem = {
  provider: 'gyg';
  id: string;
  title: string;
  url: string;
  city?: string;
  category?: string[];
  price_from?: number;
  currency?: string;
  rating?: number;
  reviews_count?: number;
  duration_text?: string;
  last_checked_at: string;
};

export function normalizeGYGProduct(p: any): MarketItem {
  return {
    provider: 'gyg',
    id: String(p?.id ?? ''),
    title: String(p?.title ?? ''),
    url: String(p?.url ?? ''),
    city: p?.city ?? undefined,
    category: Array.isArray(p?.categories) ? p.categories : [],
    price_from: p?.price_from?.amount ?? undefined,
    currency: p?.price_from?.currency ?? undefined,
    rating: typeof p?.rating === 'number' ? p.rating : undefined,
    reviews_count: typeof p?.reviews_count === 'number' ? p.reviews_count : undefined,
    duration_text: p?.duration ?? undefined,
    last_checked_at: new Date().toISOString(),
  };
}

export async function searchGYG(input: GYGSearchInput, { dryRun = false } = {}) {
  const request = buildGYGSearchRequest(input);
  if (dryRun || process.env.GYG_SEARCH_DRYRUN === 'true') {
    const sampleNormalizedShape: MarketItem[] = [];
    return { dryRun: true, request, sampleNormalizedShape };
  }
  return { dryRun: true, request, sampleNormalizedShape: [] };
}
