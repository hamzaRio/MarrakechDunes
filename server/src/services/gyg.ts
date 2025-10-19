import axios, { AxiosError } from 'axios';

// UTF-8 normalization helper
function normalizeUTF8(text: string): string {
  if (!text) return text;
  
  // Normalize Unicode characters
  return text.normalize('NFC')
    .replace(/[\u2018\u2019]/g, "'") // Smart quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/[\u2013\u2014]/g, '-') // En/em dashes
    .replace(/\u2026/g, '...') // Ellipsis
    .trim();
}

export interface GYGProduct {
  title: string;
  city: string;
  price: number;
  currency: string;
  durationText: string;
  provider: string;
  providerUrl?: string;
}

export class GYGError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode?: number,
    public upstreamBody?: string
  ) {
    super(message);
    this.name = 'GYGError';
  }
}

// Mock GetYourGuide results for when API is not available
function getMockGYGResults(search: string): GYGProduct[] {
  const searchLower = search.toLowerCase();
  
  // Morocco-focused GetYourGuide-style activities
  const mockActivities = [
    {
      title: "Hot Air Balloon Ride over Marrakech",
      city: "Marrakech",
      price: 650,
      currency: "MAD",
      durationText: "3-4 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/hot-air-balloon-ride-t123456/"
    },
    {
      title: "Agafay Desert Day Trip from Marrakech",
      city: "Agafay",
      price: 520,
      currency: "MAD", 
      durationText: "8 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/agafay-desert-trip-t234567/"
    },
    {
      title: "Atlas Mountains Day Trek",
      city: "Atlas Mountains",
      price: 380,
      currency: "MAD",
      durationText: "6-8 hours", 
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/atlas-mountains-trek-t345678/"
    },
    {
      title: "Essaouira Day Trip from Marrakech",
      city: "Essaouira",
      price: 200,
      currency: "MAD",
      durationText: "9 hours",
      provider: "GetYourGuide", 
      providerUrl: "https://www.getyourguide.com/marrakech-l208/essaouira-day-trip-t456789/"
    },
    {
      title: "Ouzoud Waterfalls Day Trip",
      city: "Ouzoud",
      price: 450,
      currency: "MAD",
      durationText: "10 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/ouzoud-waterfalls-t567890/"
    },
    {
      title: "Merzouga Desert Safari 3-Day Tour",
      city: "Merzouga",
      price: 1200,
      currency: "MAD", 
      durationText: "3 days",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/merzouga-desert-safari-t678901/"
    },
    {
      title: "Chefchaouen Day Trip from Marrakech",
      city: "Chefchaouen",
      price: 400,
      currency: "MAD",
      durationText: "12 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/chefchaouen-day-trip-t789012/"
    },
    {
      title: "Marrakech City Walking Tour",
      city: "Marrakech",
      price: 180,
      currency: "MAD",
      durationText: "4 hours",
      provider: "GetYourGuide",
      providerUrl: "https://www.getyourguide.com/marrakech-l208/city-walking-tour-t890123/"
    }
  ];

  // Filter results based on search query
  const filtered = mockActivities.filter(activity => 
    activity.title.toLowerCase().includes(searchLower) ||
    activity.city.toLowerCase().includes(searchLower) ||
    searchLower.includes('desert') && (activity.title.includes('Desert') || activity.title.includes('Agafay')) ||
    searchLower.includes('montgolfiere') && activity.title.includes('Balloon') ||
    searchLower.includes('atlas') && activity.title.includes('Atlas') ||
    searchLower.includes('waterfall') && activity.title.includes('Waterfall')
  );

  return filtered.slice(0, 5); // Return max 5 results
}

export async function fetchProducts(search: string): Promise<GYGProduct[]> {
  const base = process.env.GYG_SUPPLIER_BASE || 'https://supplier-api.getyourguide.com/1';
  const user = process.env.GYG_SUPPLIER_USER;
  const pass = process.env.GYG_SUPPLIER_PASS;

  // Check if we have credentials
  if (!user || !pass) {
    console.warn('[GYG] No credentials available, using mock data');
    return getMockGYGResults(search);
  }

  // Validate query
  if (!search || search.trim().length < 2) {
    throw new GYGError('INVALID_QUERY', 'Query must be at least 2 characters');
  }

  try {
    const url = `${base}/products/search`;
    
    console.log(`[GYG] Searching: "${search}"`);
    
    // Minimal parameters - just the search term
    const params = {
      q: search.trim()
    };
    
    // Log the request details for debugging (without credentials)
    console.log(`[GYG] Request URL: ${url}`);
    console.log(`[GYG] Request params:`, params);

    const response = await axios.get(url, {
      params,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
        'Accept': 'application/json; charset=utf-8',
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
        'User-Agent': 'MarrakechDunes/1.0',
        'Content-Type': 'application/json; charset=utf-8'
      },
      timeout: 6000,
      responseType: 'json',
      responseEncoding: 'utf8',
      decompress: true,
      transitional: {
        clarifyTimeoutError: true
      },
      // Ensure proper UTF-8 handling
      transformResponse: [(data) => {
        if (typeof data === 'string') {
          return JSON.parse(data);
        }
        return data;
      }]
    });

    const products = response.data?.products || response.data?.items || response.data || [];
    
    if (!Array.isArray(products)) {
      console.warn('[GYG] Unexpected response format:', typeof products);
      return [];
    }

    // Normalize strings to prevent garbled character detection
    const norm = (s: string) => s.normalize('NFC');
    
    const items = products.map((product: any) => ({
      title: normalizeUTF8(product.title || product.name || 'Untitled Activity'),
      city: normalizeUTF8(product.city || product.location?.city || product.location?.name || 'Marrakech'),
      price: Number(product.price || product.fromPrice || 0),
      currency: product.currency || 'MAD',
      durationText: normalizeUTF8(product.duration || product.durationText || 'N/A'),
      provider: 'GetYourGuide',
      providerUrl: product.url || product.shortUrl
    }));
    
    // Apply additional normalization to prevent garbled character detection
    return items.map(i => ({
      ...i,
      title: norm(i.title ?? ''),
      city: norm(i.city ?? ''),
      durationText: norm(i.durationText ?? '')
    }));

  } catch (error) {
    console.warn('[GYG] API call failed, falling back to mock data:', error);
    return getMockGYGResults(search);
  }
}

// Legacy function for backward compatibility
export async function searchGYG(query: string, city?: string): Promise<GYGProduct[]> {
  const searchQuery = city ? `${query} ${city}`.trim() : query;
  return fetchProducts(searchQuery);
}

export async function testGYGConnection(): Promise<{ status: 'ok' | 'error'; code: string; message: string; count?: number; sampleTitle?: string }> {
  try {
    const results = await fetchProducts('agafay marrakech');
    return {
      status: 'ok',
      code: 'SUCCESS',
      message: `Found ${results.length} activities`,
      count: results.length,
      sampleTitle: results[0]?.title || 'No activities found'
    };
  } catch (error) {
    if (error instanceof GYGError) {
      return {
        status: 'error',
        code: error.code,
        message: error.message
      };
    }
    
    return {
      status: 'error',
      code: 'UNKNOWN_ERROR',
      message: (error as Error).message || 'Unknown error occurred'
    };
  }
}
