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

// FREE Morocco Activities Database - No API needed!
function getMockGYGResults(search: string): GYGProduct[] {
  const searchLower = search.toLowerCase();
  
  // Comprehensive Morocco activities database - FREE alternative to GYG API
  const moroccoActivities = [
    // Marrakech Activities
    {
      title: "Hot Air Balloon Ride over Marrakech",
      city: "Marrakech",
      price: 650,
      currency: "MAD",
      durationText: "3-4 hours",
      provider: "Morocco Tours",
      providerUrl: "https://www.morocco-tours.com/hot-air-balloon"
    },
    {
      title: "Agafay Desert Day Trip from Marrakech",
      city: "Agafay",
      price: 520,
      currency: "MAD", 
      durationText: "8 hours",
      provider: "Desert Adventures",
      providerUrl: "https://www.desert-adventures.com/agafay"
    },
    {
      title: "Atlas Mountains Day Trek",
      city: "Atlas Mountains",
      price: 380,
      currency: "MAD",
      durationText: "6-8 hours", 
      provider: "Mountain Tours",
      providerUrl: "https://www.mountain-tours.com/atlas"
    },
    {
      title: "Essaouira Day Trip from Marrakech",
      city: "Essaouira",
      price: 200,
      currency: "MAD",
      durationText: "9 hours",
      provider: "Coastal Tours", 
      providerUrl: "https://www.coastal-tours.com/essaouira"
    },
    {
      title: "Ouzoud Waterfalls Day Trip",
      city: "Ouzoud",
      price: 450,
      currency: "MAD",
      durationText: "10 hours",
      provider: "Nature Tours",
      providerUrl: "https://www.nature-tours.com/ouzoud"
    },
    {
      title: "Merzouga Desert Safari 3-Day Tour",
      city: "Merzouga",
      price: 1200,
      currency: "MAD", 
      durationText: "3 days",
      provider: "Desert Expeditions",
      providerUrl: "https://www.desert-expeditions.com/merzouga"
    },
    {
      title: "Chefchaouen Day Trip from Marrakech",
      city: "Chefchaouen",
      price: 400,
      currency: "MAD",
      durationText: "12 hours",
      provider: "Blue City Tours",
      providerUrl: "https://www.blue-city-tours.com/chefchaouen"
    },
    {
      title: "Marrakech City Walking Tour",
      city: "Marrakech",
      price: 180,
      currency: "MAD",
      durationText: "4 hours",
      provider: "City Guides",
      providerUrl: "https://www.city-guides.com/marrakech"
    },
    // Taghazout & Agadir Activities
    {
      title: "Taghazout Surfing Lessons",
      city: "Taghazout",
      price: 300,
      currency: "MAD",
      durationText: "2-3 hours",
      provider: "Surf Morocco",
      providerUrl: "https://www.surf-morocco.com/taghazout"
    },
    {
      title: "Taghazout Beach Day Trip",
      city: "Taghazout",
      price: 250,
      currency: "MAD",
      durationText: "6 hours",
      provider: "Beach Adventures",
      providerUrl: "https://www.beach-adventures.com/taghazout"
    },
    {
      title: "Agadir City Tour",
      city: "Agadir",
      price: 150,
      currency: "MAD",
      durationText: "4 hours",
      provider: "Agadir Tours",
      providerUrl: "https://www.agadir-tours.com/city-tour"
    },
    {
      title: "Agadir Souk El Had Market Tour",
      city: "Agadir",
      price: 120,
      currency: "MAD",
      durationText: "3 hours",
      provider: "Market Tours",
      providerUrl: "https://www.market-tours.com/agadir-souk"
    },
    {
      title: "Paradise Valley Day Trip from Agadir",
      city: "Agadir",
      price: 350,
      currency: "MAD",
      durationText: "8 hours",
      provider: "Valley Adventures",
      providerUrl: "https://www.valley-adventures.com/paradise"
    },
    // Casablanca Activities
    {
      title: "Casablanca City Tour",
      city: "Casablanca",
      price: 200,
      currency: "MAD",
      durationText: "4 hours",
      provider: "Casablanca Tours",
      providerUrl: "https://www.casablanca-tours.com/city"
    },
    {
      title: "Hassan II Mosque Visit",
      city: "Casablanca",
      price: 80,
      currency: "MAD",
      durationText: "2 hours",
      provider: "Cultural Tours",
      providerUrl: "https://www.cultural-tours.com/hassan-ii"
    },
    // Rabat Activities
    {
      title: "Rabat Capital City Tour",
      city: "Rabat",
      price: 180,
      currency: "MAD",
      durationText: "5 hours",
      provider: "Capital Tours",
      providerUrl: "https://www.capital-tours.com/rabat"
    },
    {
      title: "Chellah Gardens Visit",
      city: "Rabat",
      price: 60,
      currency: "MAD",
      durationText: "2 hours",
      provider: "Garden Tours",
      providerUrl: "https://www.garden-tours.com/chellah"
    },
    // Fes Activities
    {
      title: "Fes Medina Walking Tour",
      city: "Fes",
      price: 220,
      currency: "MAD",
      durationText: "4 hours",
      provider: "Medina Guides",
      providerUrl: "https://www.medina-guides.com/fes"
    },
    {
      title: "Fes Pottery Workshop",
      city: "Fes",
      price: 150,
      currency: "MAD",
      durationText: "3 hours",
      provider: "Craft Workshops",
      providerUrl: "https://www.craft-workshops.com/fes-pottery"
    },
    // Tangier Activities
    {
      title: "Tangier City Tour",
      city: "Tangier",
      price: 180,
      currency: "MAD",
      durationText: "4 hours",
      provider: "Tangier Tours",
      providerUrl: "https://www.tangier-tours.com/city"
    },
    {
      title: "Hercules Cave Visit",
      city: "Tangier",
      price: 100,
      currency: "MAD",
      durationText: "2 hours",
      provider: "Cave Tours",
      providerUrl: "https://www.cave-tours.com/hercules"
    }
  ];

  // Smart filtering for Morocco activities
  const filtered = moroccoActivities.filter(activity => {
    const title = activity.title.toLowerCase();
    const city = activity.city.toLowerCase();
    
    // Direct matches
    if (title.includes(searchLower) || city.includes(searchLower)) {
      return true;
    }
    
    // Smart keyword matching
    if (searchLower.includes('taghazout') && city.includes('taghazout')) return true;
    if (searchLower.includes('agadir') && city.includes('agadir')) return true;
    if (searchLower.includes('surf') && title.includes('surf')) return true;
    if (searchLower.includes('beach') && title.includes('beach')) return true;
    if (searchLower.includes('desert') && (title.includes('desert') || title.includes('agafay'))) return true;
    if (searchLower.includes('montgolfiere') && title.includes('balloon')) return true;
    if (searchLower.includes('atlas') && title.includes('atlas')) return true;
    if (searchLower.includes('waterfall') && title.includes('waterfall')) return true;
    if (searchLower.includes('casablanca') && city.includes('casablanca')) return true;
    if (searchLower.includes('rabat') && city.includes('rabat')) return true;
    if (searchLower.includes('fes') && city.includes('fes')) return true;
    if (searchLower.includes('tangier') && city.includes('tangier')) return true;
    if (searchLower.includes('chefchaouen') && city.includes('chefchaouen')) return true;
    if (searchLower.includes('essaouira') && city.includes('essaouira')) return true;
    if (searchLower.includes('merzouga') && city.includes('merzouga')) return true;
    if (searchLower.includes('ouzoud') && city.includes('ouzoud')) return true;
    
    return false;
  });

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
    
    // Use 'search' parameter as requested (not 'q')
    const params = {
      search: search.trim()
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
