import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

/**
 * Calculate suggested price based on GetYourGuide price and competitive pricing rules
 */
function calculateSuggestedPrice(gygPrice: number, currency: string): number {
  // Get configuration from environment variables
  const undercutPercent = parseFloat(process.env.GYG_UNDERCUT_PERCENT || '0.1'); // Default 10%
  const marginFixed = parseFloat(process.env.GYG_MARGIN_FIXED || '0'); // Default 0
  const minPrice = parseFloat(process.env.GYG_MIN_PRICE || '15'); // Default 15 EUR
  
  // Calculate undercut price (percentage cheaper than GYG)
  const undercut = gygPrice * (1 - undercutPercent);
  
  // Apply fixed margin adjustment
  const marginAdjusted = undercut + marginFixed;
  
  // Ensure minimum price is respected
  const suggestedPrice = Math.max(marginAdjusted, minPrice);
  
  // Round to 2 decimal places
  return Math.round(suggestedPrice * 100) / 100;
}

interface GetYourGuideActivity {
  id: string;
  title: string;
  gygPrice: number;
  suggestedPrice: number;
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

    // Transform the response to our format with suggested pricing
    const activities: GetYourGuideActivity[] = response.data.activities?.map((activity: any) => {
      const gygPrice = activity.price || activity.price_from || 0;
      const currency = activity.currency || 'EUR';
      
      // Calculate suggested price using competitive pricing rules
      const suggestedPrice = calculateSuggestedPrice(gygPrice, currency);
      
      return {
        id: activity.id || activity.activity_id,
        title: activity.title || activity.name,
        gygPrice: gygPrice,
        suggestedPrice: suggestedPrice,
        currency: currency,
        url: activity.url || `https://www.getyourguide.com/activity/${activity.id}`
      };
    }) || [];

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
