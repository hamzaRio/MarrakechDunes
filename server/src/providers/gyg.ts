export interface MarketItem {
  provider: 'GetYourGuide';
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
}

export interface GYGSearchRequest {
  method: 'GET';
  url: string;
  headers: {
    Authorization: string;
    Accept: string;
  };
  notes: string[];
}

export function buildGYGSearchRequest(input: { query: string; city?: string; page?: number; perPage?: number }): GYGSearchRequest {
  const baseUrl = process.env.GYG_SUPPLIER_BASE || 'https://supplier-api.getyourguide.com/1';
  const searchTerm = input.city ? `${input.query} ${input.city}`.trim() : input.query;
  const page = input.page || 1;
  const perPage = input.perPage || 10;
  
  const url = `${baseUrl}/products?search=${encodeURIComponent(searchTerm)}&currency=MAD&content_language=fr-FR&market=MA&page=${page}&per_page=${perPage}`;
  
  const user = process.env.GYG_SUPPLIER_USER || '';
  const pass = process.env.GYG_SUPPLIER_PASS || '';
  const auth = Buffer.from(`${user}:${pass}`).toString('base64');
  
  return {
    method: 'GET',
    url,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json'
    },
    notes: [
      'Dry-run mode: no network request',
      'Search term normalized and encoded',
      'Morocco market and MAD currency',
      'French language content'
    ]
  };
}

export function normalizeGYGProduct(p: any): MarketItem {
  return {
    provider: 'GetYourGuide',
    id: p.id || p.productId || `gyg-${Date.now()}`,
    title: p.title || p.name || 'Activity',
    url: p.url || p.link || '',
    city: p.city || p.location || 'Marrakech',
    category: p.category ? [p.category] : ['Tour'],
    price_from: Number(p.price || p.fromPrice || 0),
    currency: 'MAD',
    rating: Number(p.rating || 0),
    reviews_count: Number(p.reviewsCount || 0),
    duration_text: p.duration || 'N/A',
    last_checked_at: new Date().toISOString()
  };
}

export async function searchGYG(
  input: { query: string; city?: string; page?: number; perPage?: number }, 
  options: { dryRun?: boolean } = {}
): Promise<{ dryRun: boolean; request: GYGSearchRequest; sampleNormalizedShape: MarketItem[] }> {
  const dryRun = options.dryRun || process.env.GYG_SEARCH_DRYRUN === 'true' || process.env.GYG_ENABLE_LIVE_SEARCH !== 'true';
  
  if (dryRun) {
    const request = buildGYGSearchRequest(input);
    const sampleNormalizedShape = [
      normalizeGYGProduct({
        id: 'sample-1',
        title: `${input.query} Experience`,
        url: 'https://www.getyourguide.com/sample',
        city: input.city || 'Marrakech',
        price: 150,
        rating: 4.5,
        reviewsCount: 25,
        duration: '3 hours'
      })
    ];
    
    return {
      dryRun: true,
      request,
      sampleNormalizedShape
    };
  }
  
  throw new Error('Live search not implemented in dry-run architecture');
}
