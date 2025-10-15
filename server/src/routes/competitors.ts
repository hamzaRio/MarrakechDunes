import express from 'express';
import { z } from 'zod';
import { searchExternalActivities } from '../services/competitors.js';
import { testGYGConnection } from '../services/gyg.js';

const router = express.Router();

// Helper function to normalize boolean values from query params
function boolFromQuery(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.toLowerCase().trim();
    return normalized === 'true' || normalized === '1';
  }
  return Boolean(value);
}

// Helper function to sanitize string parameters
function sanitizeString(value: any): string | undefined {
  if (!value) return undefined;
  return String(value).replace(/["']/g, '').trim();
}

const schema = z.object({
  query: z.string().min(2).transform(val => sanitizeString(val) || val),
  city: z.string().optional().transform(val => sanitizeString(val)),
  provider: z.enum(['all', 'gyg', 'rezdy']).optional().default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  live: z.any().optional().default(false).transform(boolFromQuery)
});

router.get('/suggest', async (req, res) => {
  try {
    const { query, city, provider, limit, live } = schema.parse(req.query);
    const items = await searchExternalActivities(query, city, provider, limit, live);
    res.json({ items }); // unified shape
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        status: 'error',
        code: 'VALIDATION_FAILED',
        details: error.issues
      });
    }
    console.error('[SUGGEST ERROR]', error);
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: 'Unexpected error occurred'
    });
  }
});

// Debug route for GYG connection testing
router.get('/debug/gyg', async (req, res) => {
  try {
    const query = sanitizeString(req.query.query) || 'agafay';
    const city = sanitizeString(req.query.city) || 'Marrakech';
    const live = boolFromQuery(req.query.live);
    
    const searchQuery = city ? `${query} ${city}`.trim() : query;
    
    // Import the GYG service directly for more detailed debugging
    const { fetchProducts } = await import('../services/gyg.js');
    
    try {
      const results = await fetchProducts(searchQuery);
      res.json({
        status: 'ok',
        code: 'SUCCESS',
        upstreamStatus: 200,
        count: results.length,
        sampleTitle: results[0]?.title || 'No activities found',
        request: {
          url: `${process.env.GYG_SUPPLIER_BASE}/products`,
          params: {
            q: searchQuery
          }
        }
      });
    } catch (gygError: any) {
      res.json({
        status: 'error',
        code: gygError.code || 'GYG_ERROR',
        upstreamStatus: gygError.statusCode,
        upstreamBody: gygError.message?.substring(0, 200) || 'No details',
        request: {
          url: `${process.env.GYG_SUPPLIER_BASE}/products`,
          params: {
            q: searchQuery
          }
        }
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: (error as Error).message || 'Unknown error occurred'
    });
  }
});

export default router;
