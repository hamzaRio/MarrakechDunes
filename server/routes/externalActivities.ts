import express from 'express';
import { z } from 'zod';
import { searchExternalActivities } from '../services/tourSearchService';

const router = express.Router();

const schema = z.object({
  query: z.string().optional(),
  city: z.string().optional(),
});

router.get('/', async (req, res) => {
  const { query, city } = schema.parse(req.query);
  const items = await searchExternalActivities(query || '', city || '');
  res.json(items);
});

export default router;
