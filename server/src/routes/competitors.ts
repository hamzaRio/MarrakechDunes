import express from 'express';
import { z } from 'zod';
import { searchExternalActivities } from '../services/competitors.js';
import { testGYGConnection } from '../services/gyg.js';

const router = express.Router();

// Sanitize query parameters middleware
router.use((req, res, next) => {
  // Sanitize query parameters
  if (req.query.query) {
    req.query.query = sanitizeString(req.query.query);
  }
  
  if (req.query.city) {
    req.query.city = sanitizeString(req.query.city);
  }
  
  if (req.query.provider) {
    req.query.provider = normalizeProvider(req.query.provider);
  }
  
  if (req.query.live !== undefined) {
    req.query.live = boolFromQuery(req.query.live);
  }
  
  next();
});

// Helper function to normalize boolean values from query params
function boolFromQuery(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return Boolean(value);
}

// Helper function to sanitize string parameters - handles URL encoding and quotes
function sanitizeString(value: any): string | undefined {
  if (!value) return undefined;
  
  // Decode URL encoding first
  let decoded = String(value);
  try {
    decoded = decodeURIComponent(decoded);
  } catch (e) {
    // If decoding fails, use original value
  }
  
  // Strip surrounding quotes and trim
  const sanitized = decoded.replace(/^["']|["']$/g, '').trim();
  
  return sanitized || undefined;
}

// Helper function to normalize provider parameter
function normalizeProvider(value: any): 'all' | 'gyg' | 'rezdy' {
  if (!value) return 'all';
  
  const sanitized = sanitizeString(value)?.toLowerCase();
  if (sanitized === 'gyg' || sanitized === 'getyourguide') return 'gyg';
  if (sanitized === 'rezdy') return 'rezdy';
  return 'all';
}

const schema = z.object({
  query: z.string().min(2),
  city: z.string().optional(),
  provider: z.enum(['all', 'gyg', 'rezdy']).default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  live: z.boolean().optional()
});

router.get('/suggest', async (req, res) => {
  try {
    // Use safeParse to avoid throwing
    const validationResult = schema.safeParse(req.query);
    
    if (!validationResult.success) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_FAILED',
        details: validationResult.error.issues
      });
    }
    
    const { query, city, provider, limit, live } = validationResult.data;
    const items = await searchExternalActivities(query, city, provider, limit, live);
    res.json({ items }); // unified shape
  } catch (error) {
    console.error('[SUGGEST ERROR]', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred'
    });
  }
});

// UTF-8 test endpoint
router.get('/debug/utf8', (req, res) => {
  const testData = {
    french: 'montgolfière',
    arabic: 'مراكش',
    emoji: '🎈',
    special: 'café, naïve, résumé',
    mixed: 'Montgolfière à Marrakech 🎈',
    timestamp: new Date().toISOString()
  };
  
  res.json({
    status: 'ok',
    encoding: 'utf-8',
    test: testData,
    message: 'UTF-8 encoding test successful'
  });
});

// Debug route for GYG connection testing
router.get('/debug/gyg', async (req, res) => {
  try {
    const query = sanitizeString(req.query.query) || 'agafay';
    const city = sanitizeString(req.query.city) || 'Marrakech';
    const live = boolFromQuery(req.query.live);
    
    const searchQuery = city ? `${query} ${city}`.trim() : query;
    const baseURL = process.env.GYG_SUPPLIER_BASE || 'https://supplier-api.getyourguide.com/1';
    
    // Import the GYG service directly for more detailed debugging
    const { fetchProducts } = await import('../services/gyg.js');
    
    const requestDetails = {
      url: `${baseURL}/search`,
      params: {
        search: searchQuery,
        currency: 'MAD'
      },
      headers: {
        'Accept': 'application/json; charset=utf-8',
        'Accept-Charset': 'utf-8',
        'User-Agent': 'MarrakechDunes/1.0'
      }
    };
    
    try {
      const results = await fetchProducts(searchQuery);
      res.json({
        status: 'ok',
        code: 'SUCCESS',
        upstreamStatus: 200,
        count: results.length,
        sampleTitle: results[0]?.title || 'No activities found',
        request: requestDetails,
        timestamp: new Date().toISOString()
      });
    } catch (gygError: any) {
      res.json({
        status: 'error',
        code: gygError.code || 'GYG_ERROR',
        upstreamStatus: gygError.statusCode,
        upstreamBody: gygError.upstreamBody?.substring(0, 200) || gygError.message?.substring(0, 200) || 'No details',
        request: requestDetails,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: (error as Error).message || 'Unknown error occurred',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
