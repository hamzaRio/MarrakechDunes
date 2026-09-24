/**
 * Browser-side GetYourGuide provider access is intentionally disabled.
 * Supplier credentials must never be bundled into the client; staff searches
 * use the protected server API instead.
 */
import { api } from './api';

export interface GYGSearchParams {
  q: string;
  limit?: number;
  offset?: number;
  location?: string;
  category?: string;
}

export interface GYGActivity {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: {
    amount: number;
    currency: string;
    originalAmount?: number;
  };
  rating: number;
  reviewCount: number;
  imageUrl: string;
  url: string;
  description: string;
  highlights: string[];
  image?: string | null;
  link: string;
  gygPrice: number;
  currency: string;
  suggestedPrice?: number;
}

export interface GYGSearchResponse {
  activities: GYGActivity[];
  total: number;
  hasMore: boolean;
}

/** Normalized shape shared by the market workspace and Add Activity flow. */
export interface NormalizedGYGActivity {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: { amount: number; currency: string; originalAmount?: number };
  rating: number;
  reviewCount: number;
  imageUrl: string;
  url: string;
  description: string;
  highlights: string[];
  sourceType: 'LIVE_VERIFIED' | 'CACHED_VERIFIED' | 'MANUAL_VERIFIED' | 'UNAVAILABLE';
  verified: boolean;
  currency: string;
  gygPrice: number;
  suggestedPrice?: number;
  link: string;
}

export function searchGetYourGuideActivities(_params: string): Promise<GYGActivity[]>;
export function searchGetYourGuideActivities(_params: GYGSearchParams): Promise<GYGSearchResponse>;
export async function searchGetYourGuideActivities(_params: string | GYGSearchParams): Promise<GYGActivity[] | GYGSearchResponse> {
  const params = typeof _params === 'string' ? { q: _params } : _params;
  const response = await api.get('/gyg/official-search', { params });
  const activities = ((response.data?.activities ?? []) as any[]).map((activity) => {
    const suggestedPrice = activity.suggestedPrice == null ? undefined : Number(activity.suggestedPrice);
    return {
    ...activity,
    currency: activity.currency ?? activity.price?.currency ?? 'MAD',
    gygPrice: Number(activity.gygPrice ?? activity.price?.amount ?? 0),
    link: activity.link ?? activity.url ?? '',
    ...(suggestedPrice != null && Number.isFinite(suggestedPrice) ? { suggestedPrice } : {}),
  };
  });
  if (typeof _params === 'string') return activities as GYGActivity[];
  return { ...response.data, activities } as GYGSearchResponse;
}

export async function searchActivityWithMorocco(_query: string): Promise<GYGActivity[]> {
  throw new Error('GetYourGuide comparisons are available only through the protected staff comparison API.');
}

export async function searchMoroccoActivities(_query = 'morocco'): Promise<GYGActivity[]> {
  throw new Error('GetYourGuide comparisons are available only through the protected staff comparison API.');
}

export function formatGYGPrice(price: number, currency = 'MAD'): string {
  return `${Number(price).toLocaleString()} ${currency}`;
}

export function isGetYourGuideAPIAvailable(): boolean {
  return false;
}

export function getGetYourGuideAPIStatus(): { available: boolean; usingMock: boolean } {
  return { available: false, usingMock: false };
}
