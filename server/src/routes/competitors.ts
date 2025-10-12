import express from 'express';
import { z } from 'zod';
import { searchExternalActivities } from '../services/competitors.js';

const router = express.Router();

const schema = z.object({
  query: z.string().min(1),
  city: z.string().optional()
});

router.get('/suggest', async (req, res) => {
  const { query, city } = schema.parse(req.query);
  const items = await searchExternalActivities(query, city);
  res.json({ items }); // unified shape
});

export default router;
