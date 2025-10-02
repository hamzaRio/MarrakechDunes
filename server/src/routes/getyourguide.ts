import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

interface GetYourGuideActivity {
  id: string;
  title: string;
  price: number;
  currency: string;
  url: string;
}

/**
 * Search GetYourGuide activities
 * GET /api/gyg/search?q=...
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 3) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and must be at least 3 characters long'
      });
    }

    const apiKey = process.env.GYG_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'GetYourGuide API key not configured'
      });
    }

    // Call GetYourGuide API
    const response = await axios.get('https://api.getyourguide.com/1/activities', {
      params: {
        q: q.trim(),
        limit: 10 // Limit results to 10 suggestions
      },
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 second timeout
    });

    // Transform the response to our format
    const activities: GetYourGuideActivity[] = response.data.activities?.map((activity: any) => ({
      id: activity.id || activity.activity_id,
      title: activity.title || activity.name,
      price: activity.price || activity.price_from || 0,
      currency: activity.currency || 'EUR',
      url: activity.url || `https://www.getyourguide.com/activity/${activity.id}`
    })) || [];

    res.json(activities);

  } catch (error: any) {
    console.error('GetYourGuide API Error:', error.message);
    
    // Handle different types of errors
    if (error.response) {
      // API returned an error response
      const status = error.response.status;
      const message = error.response.data?.message || 'GetYourGuide API error';
      
      if (status === 401) {
        return res.status(401).json({ error: 'Invalid GetYourGuide API key' });
      } else if (status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded for GetYourGuide API' });
      } else {
        return res.status(status).json({ error: message });
      }
    } else if (error.request) {
      // Network error
      return res.status(503).json({ error: 'Unable to connect to GetYourGuide API' });
    } else {
      // Other error
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

export default router;
