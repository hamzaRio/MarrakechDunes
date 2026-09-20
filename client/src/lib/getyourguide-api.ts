/**
 * Browser-side GetYourGuide provider access is intentionally disabled.
 * Supplier credentials must never be bundled into the client; staff comparison
 * requests use the protected server API instead.
 */
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
  suggestedPrice: number;
}

export interface GYGSearchResponse {
  activities: GYGActivity[];
  total: number;
  hasMore: boolean;
}

export function searchGetYourGuideActivities(_params: string): Promise<GYGActivity[]>;
export function searchGetYourGuideActivities(_params: GYGSearchParams): Promise<GYGSearchResponse>;
export async function searchGetYourGuideActivities(_params: string | GYGSearchParams): Promise<GYGActivity[] | GYGSearchResponse> {
  throw new Error('GetYourGuide comparisons are available only through the protected staff comparison API.');
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
