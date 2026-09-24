import { api } from './api';

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

export interface ViatorSearchResponse {
  activities: NormalizedViatorActivity[];
  total: number | null;
  hasMore: boolean;
  offset: number;
  limit: number;
  currency: string;
}

export async function searchViatorActivities(query: string, limit = 12, offset = 0): Promise<ViatorSearchResponse> {
  const response = await api.post('/viator/search', { q: query, limit, offset });
  return response.data as ViatorSearchResponse;
}
