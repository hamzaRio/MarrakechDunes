import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// Set UTF-8 encoding for all responses
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

/**
 * Live GetYourGuide Partner API Search
 * GET /api/getyourguide/search?q=<query>
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 3) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and must be at least 3 characters long'
      });
    }

    const query = q.trim();
    console.log('[GYG-LIVE] GetYourGuide live search request:', { query });

    // Check for API key
    const apiKey = process.env.GYG_API_KEY;
    if (!apiKey || apiKey === 'changeme' || apiKey === 'your_getyourguide_api_key') {
      console.log('[GYG-LIVE] No valid API key provided, returning error');
      return res.status(400).json({
        error: 'GetYourGuide API key not configured. Please set GYG_API_KEY in environment variables.'
      });
    }

    try {
      console.log('[GYG-LIVE] Calling GetYourGuide Partner API...');
      
      const response = await axios.get('https://api.getyourguide.com/1/tours', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json; charset=utf-8'
        },
        params: {
          query: query,
          currency: 'MAD',
          limit: 10
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log('[GYG-LIVE] GetYourGuide API response status:', response.status);
      
      if (response.data && response.data.tours) {
        const activities = response.data.tours.map((tour: any) => {
          return {
            id: tour.id || `gyg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: tour.title || 'Untitled Activity',
            price: tour.price?.amount || 0,
            currency: tour.price?.currency || 'MAD',
            image: tour.picture?.url || null,
            link: tour.links?.activity_link || `https://www.getyourguide.com/activity-${tour.id}`
          };
        });
        
        console.log('[SUCCESS] GetYourGuide live API returned:', activities.length, 'activities');
        return res.json(activities);
      } else {
        console.log('[GYG-LIVE] No tours found in API response');
        return res.json([]);
      }
      
    } catch (apiError: any) {
      console.error('[ERROR] GetYourGuide API call failed:', apiError.message);
      
      if (apiError.response) {
        const status = apiError.response.status;
        const message = apiError.response.data?.message || 'GetYourGuide API error';
        
        console.log('[GYG-LIVE] API Error Status:', status);
        console.log('[GYG-LIVE] API Error Data:', apiError.response.data);
        
        if (status === 401) {
          return res.status(401).json({ 
            error: 'Invalid GetYourGuide API key. Please check your GYG_API_KEY configuration.' 
          });
        } else if (status === 429) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded for GetYourGuide API. Please try again later.' 
          });
        } else if (status === 403) {
          return res.status(403).json({ 
            error: 'Access forbidden. Please verify your GetYourGuide API permissions.' 
          });
        } else {
          return res.status(status).json({ error: message });
        }
      } else if (apiError.request) {
        console.log('[GYG-LIVE] Network error - no response received');
        return res.status(503).json({ 
          error: 'Unable to connect to GetYourGuide API. Please check your internet connection.' 
        });
      } else {
        console.log('[GYG-LIVE] Request setup error:', apiError.message);
        return res.status(500).json({ 
          error: 'Internal server error while calling GetYourGuide API.' 
        });
      }
    }

  } catch (error: any) {
    console.error('[ERROR] GetYourGuide search endpoint error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

export default router;
