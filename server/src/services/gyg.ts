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
    public statusCode?: number
  ) {
    super(message);
    this.name = 'GYGError';
  }
}

export async function searchGYG(query: string, city?: string): Promise<GYGProduct[]> {
  const base = process.env.GYG_SUPPLIER_BASE;
  const user = process.env.GYG_SUPPLIER_USER;
  const pass = process.env.GYG_SUPPLIER_PASS;
  const enabled = process.env.GYG_ENABLE_LIVE_SEARCH === 'true';

  // Validate configuration
  if (!enabled || !base || !user || !pass) {
    throw new GYGError('CONFIG_MISSING', 'GYG live search not enabled or credentials missing');
  }

  // Validate query
  if (!query || query.trim().length < 2) {
    throw new GYGError('INVALID_QUERY', 'Query must be at least 2 characters');
  }

  try {
    const searchQuery = city ? `${query} ${city}`.trim() : query;
    const url = `${base}/products`;
    
    console.log(`[GYG] Searching: "${searchQuery}"`);
    
    const response = await axios.get(url, {
      params: {
        search: searchQuery,
        limit: 10
      },
      auth: {
        username: user,
        password: pass
      },
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'MarrakechDunes/1.0'
      },
      timeout: 6000
    });

    const products = response.data?.products || response.data?.items || response.data || [];
    
    if (!Array.isArray(products)) {
      console.warn('[GYG] Unexpected response format:', typeof products);
      return [];
    }

    return products.map((product: any) => ({
      title: product.title || product.name || 'Untitled Activity',
      city: product.city || product.location?.city || city || 'Marrakech',
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
      
      if (status === 401) {
        throw new GYGError('AUTH_FAILED', 'Invalid GYG credentials', 401);
      } else if (status === 400) {
        throw new GYGError('BAD_REQUEST', 'Invalid request parameters', 400);
      } else if (status === 403) {
        throw new GYGError('FORBIDDEN', 'Access denied to GYG API', 403);
      } else if (status === 429) {
        throw new GYGError('RATE_LIMITED', 'GYG API rate limit exceeded', 429);
      } else if (status >= 500) {
        throw new GYGError('SERVER_ERROR', 'GYG API server error', status);
      } else {
        throw new GYGError('NETWORK_ERROR', `GYG API error: ${message}`, status);
      }
    }
    
    throw new GYGError('UNKNOWN_ERROR', `Unexpected error: ${error.message}`);
  }
}

export async function testGYGConnection(): Promise<{ status: 'ok' | 'error'; code: string; message: string }> {
  try {
    const results = await searchGYG('agafay');
    return {
      status: 'ok',
      code: 'SUCCESS',
      message: `Found ${results.length} activities`
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
      message: error.message || 'Unknown error occurred'
    };
  }
}
