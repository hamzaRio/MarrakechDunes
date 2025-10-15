import axios, { AxiosError } from 'axios';

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
    const url = `${base}/products`;
    
    console.log(`[GYG] Searching: "${search}"`);
    
    // Log the request details for debugging (without credentials)
    console.log(`[GYG] Request URL: ${url}`);
    console.log(`[GYG] Request params:`, {
      q: search.trim()
    });

    const response = await axios.get(url, {
      params: {
        q: search.trim()
      },
      headers: {
        'Authorization': `Basic ${Buffer.from(`${user}:${pass}`).toString('base64')}`,
        'Accept': 'application/json',
        'User-Agent': 'MarrakechDunes/1.0',
        'Accept-Charset': 'utf-8',
        'Accept-Language': 'fr-FR'
      },
      timeout: 6000,
      responseType: 'json',
      responseEncoding: 'utf8',
      decompress: true,
      transitional: {
        clarifyTimeoutError: true
      }
    });

    const products = response.data?.products || response.data?.items || response.data || [];
    
    if (!Array.isArray(products)) {
      console.warn('[GYG] Unexpected response format:', typeof products);
      return [];
    }

    return products.map((product: any) => ({
      title: product.title || product.name || 'Untitled Activity',
      city: product.city || product.location?.city || product.location?.name || 'Marrakech',
      price: Number(product.price || product.fromPrice || 0),
      currency: product.currency || 'MAD',
      durationText: product.duration || product.durationText || 'N/A',
      provider: 'GetYourGuide',
      providerUrl: product.url || product.shortUrl
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
