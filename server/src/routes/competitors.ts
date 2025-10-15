import express from 'express';
import { z } from 'zod';
import { searchExternalActivities } from '../services/competitors.js';
import { testGYGConnection } from '../services/gyg.js';

const router = express.Router();

const schema = z.object({
  query: z.string().min(1),
  city: z.string().optional(),
  provider: z.enum(['all', 'gyg', 'rezdy']).optional().default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(20),
  live: z.coerce.boolean().optional().default(false)
});

router.get('/suggest', async (req, res) => {
  const { query, city, provider, limit, live } = schema.parse(req.query);
  const items = await searchExternalActivities(query, city, provider, limit, live);
  res.json({ items }); // unified shape
});

// Debug route for GYG connection testing
router.get('/debug/gyg', async (req, res) => {
  try {
    const query = req.query.query as string || 'agafay marrakech';
    const result = await testGYGConnection();
    res.json(result);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      code: 'INTERNAL_ERROR',
      message: error.message || 'Unknown error occurred'
    });
  }
});

export default router;
