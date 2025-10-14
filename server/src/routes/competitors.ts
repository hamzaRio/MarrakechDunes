import express from 'express';
import { z } from 'zod';
import { searchExternalActivities } from '../services/competitors.js';

const router = express.Router();

const schema = z.object({
  query: z.string().min(1),
  city: z.string().optional(),
  provider: z.enum(['all', 'gyg', 'rezdy']).optional().default('all'),
  limit: z.coerce.number().min(1).max(50).optional().default(20)
});

router.get('/suggest', async (req, res) => {
  const { query, city, provider, limit } = schema.parse(req.query);
  const items = await searchExternalActivities(query, city, provider, limit);
  res.json({ items }); // unified shape
});

export default router;
