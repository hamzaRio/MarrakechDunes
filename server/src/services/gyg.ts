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

export async function fetchProducts(search: string): Promise<GYGProduct[]> {
  const base = process.env.GYG_SUPPLIER_BASE || 'https://supplier-api.getyourguide.com/1';
  const user = process.env.GYG_SUPPLIER_USER;
  const pass = process.env.GYG_SUPPLIER_PASS;

  // Validate configuration
  if (!user || !pass) {
    throw new GYGError('CONFIG_MISSING', 'GYG credentials missing');
  }

  // Validate query
  if (!search || search.trim().length < 2) {
    throw new GYGError('INVALID_QUERY', 'Query must be at least 2 characters');
  }

  try {
    const url = `${base}/search`;
    
    console.log(`[GYG] Searching: "${search}"`);
    
    // Use absolute minimal parameters to avoid 400 errors
    const params = {
      q: search.trim()
      // Only use the search query - let GYG handle defaults
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
    if (error instanceof AxiosError) {
      const status = error.response?.status;
      const message = error.response?.data?.errorMessage || error.message;
      const upstreamBody = JSON.stringify(error.response?.data || {}).substring(0, 200);
      
      console.error(`[GYG] API Error - Status: ${status}, Message: ${message}`);
      console.error(`[GYG] Upstream Body: ${upstreamBody}`);
      
      if (status === 401) {
        throw new GYGError('AUTH_FAILED', 'Invalid GYG credentials', 401, upstreamBody);
      } else if (status === 400) {
        throw new GYGError('BAD_REQUEST', `Invalid request parameters: ${message}`, 400, upstreamBody);
      } else if (status === 403) {
        throw new GYGError('FORBIDDEN', 'Access denied to GYG API', 403, upstreamBody);
      } else if (status === 429) {
        throw new GYGError('RATE_LIMITED', 'GYG API rate limit exceeded', 429, upstreamBody);
      } else if (status && status >= 500) {
        throw new GYGError('SERVER_ERROR', 'GYG API server error', status, upstreamBody);
      } else {
        throw new GYGError('NETWORK_ERROR', `GYG API error: ${message}`, status, upstreamBody);
      }
    }
    
    throw new GYGError('UNKNOWN_ERROR', `Unexpected error: ${(error as Error).message}`);
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
