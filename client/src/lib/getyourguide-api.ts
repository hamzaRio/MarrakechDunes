import { apiFetch } from './api';

export interface GYGActivity {
  id: string;
  title: string;
  gygPrice: number;
  suggestedPrice: number;
  currency: string;
  image?: string;
  link: string;
  description?: string;
  duration?: string;
  rating?: number;
  reviewCount?: number;
  location?: string;
}

export interface GYGSearchResult {
  activities: GYGActivity[];
  totalResults: number;
  query: string;
}

/**
 * Centralized GetYourGuide API search function
 * Eliminates duplication across components
 */
export const searchGetYourGuideActivities = async (query: string): Promise<GYGActivity[]> => {
  try {
    console.log('[GYG] Centralized search for:', query);
    const response = await apiFetch(`/gyg/search?q=${encodeURIComponent(query)}`);
    
    if (Array.isArray(response)) {
      console.log('[GYG] Found activities:', response.length);
      return response;
    } else {
      console.log('[GYG] No activities found');
      return [];
    }
  } catch (error: any) {
    console.error('[GYG] Search error:', error);
    throw new Error(error.response?.data?.error || error.message || 'Failed to search GetYourGuide');
  }
};

/**
 * Search for Morocco activities specifically
 */
export const searchMoroccoActivities = async (): Promise<GYGActivity[]> => {
  return searchGetYourGuideActivities('morocco');
};

/**
 * Search for specific activity with Morocco context
 */
export const searchActivityWithMorocco = async (activityName: string): Promise<GYGActivity[]> => {
  const moroccoQuery = `${activityName} morocco`;
  return searchGetYourGuideActivities(moroccoQuery);
};

/**
 * Format price for display
 */
export const formatGYGPrice = (price: number, currency: string): string => {
  return `${price} ${currency}`;
};

/**
 * Get suggested price (usually 10-20% lower than GYG price)
 */
export const calculateSuggestedPrice = (gygPrice: number): number => {
  return Math.round(gygPrice * 0.85); // 15% discount
};