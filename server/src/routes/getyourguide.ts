import { Router, Request, Response } from 'express';
import axios from 'axios';

const router = Router();

// In-memory cache for GetYourGuide API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

// Set UTF-8 encoding for all responses
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

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

/**
 * Search GetYourGuide activities using the real Partner API
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

    const query = q.trim();
    console.log('[GYG] GetYourGuide live search request:', { query });

    // Check cache first
    const cacheKey = `search_${query}`;
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[GYG] Returning cached results for:', query);
      return res.json(cached.data);
    }
    
    // Get API key from environment
    const apiKey = process.env.GYG_API_KEY;
    
    if (!apiKey || apiKey === 'your_getyourguide_api_key' || apiKey === 'changeme') {
      console.log('[GYG] No valid API key provided, returning empty results');
      return res.json([]);
    }
    
    let activities: any[] = [];
    
    try {
      console.log('[GYG] Calling GetYourGuide Partner API...');
      
      // Call the real GetYourGuide Partner API
      const response = await axios.get('https://api.getyourguide.com/1/tours', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json; charset=utf-8',
          'Accept': 'application/json'
        },
        params: {
          query: query,
          currency: 'MAD',
          limit: 10,
          offset: 0
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log('[GYG] API Response Status:', response.status);
      console.log('[GYG] API Response Data:', response.data);
      
      if (response.data && response.data.tours && Array.isArray(response.data.tours)) {
        activities = response.data.tours.map((tour: any) => {
          const gygPrice = tour.price?.amount || tour.price || 0;
          const currency = tour.price?.currency || 'MAD';
          const suggestedPrice = calculateSuggestedPrice(gygPrice, currency);
          
          return {
            id: tour.id || `gyg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: tour.title || 'Untitled Activity',
            gygPrice: gygPrice,
            suggestedPrice: suggestedPrice,
            currency: currency,
            image: tour.picture?.url || tour.image || null,
            link: tour.links?.activity_link || tour.url || `https://www.getyourguide.com/activity-${tour.id}`,
            description: tour.description || null,
            duration: tour.duration || null,
            rating: tour.rating || null,
            reviewCount: tour.review_count || tour.reviews || null,
            location: tour.location || null,
            category: tour.category || null
          };
        });
        
        console.log('[SUCCESS] GetYourGuide API returned:', activities.length, 'activities');
      } else {
        console.log('[GYG] No tours found in API response');
        activities = [];
      }
      
    } catch (apiError: any) {
      console.error('[ERROR] GetYourGuide API call failed:', {
        message: apiError.message,
        status: apiError.response?.status,
        statusText: apiError.response?.statusText,
        data: apiError.response?.data
      });
      
      // Handle specific API errors
      if (apiError.response?.status === 401) {
        console.error('[GYG] Invalid API key - check GYG_API_KEY environment variable');
        return res.status(401).json({ 
          error: 'Invalid GetYourGuide API key. Please check your GYG_API_KEY environment variable.' 
        });
      } else if (apiError.response?.status === 429) {
        console.error('[GYG] Rate limit exceeded');
        return res.status(429).json({ 
          error: 'Rate limit exceeded for GetYourGuide API. Please try again later.' 
        });
      } else if (apiError.response?.status === 403) {
        console.error('[GYG] Access forbidden - check API permissions');
        return res.status(403).json({ 
          error: 'Access forbidden. Please check your GetYourGuide API permissions.' 
        });
      } else if (apiError.code === 'ECONNABORTED') {
        console.error('[GYG] Request timeout');
        return res.status(504).json({ 
          error: 'Request timeout. GetYourGuide API is not responding.' 
        });
      } else {
        console.error('[GYG] Unknown API error:', apiError.message);
        return res.status(500).json({ 
          error: 'Failed to fetch data from GetYourGuide API. Please try again later.' 
        });
      }
    }

    // Cache the results
    cache.set(cacheKey, { data: activities, timestamp: Date.now() });

    console.log('[SUCCESS] Returning GetYourGuide live results:', activities.length, 'activities');
    res.json(activities);

  } catch (error: any) {
    console.error('[ERROR] GetYourGuide search error:', error.message);
    
    // Handle different types of errors
    if (error.response) {
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
      return res.status(503).json({ error: 'Unable to connect to GetYourGuide API' });
    } else {
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
});

/**
 * Health check endpoint for GetYourGuide API
 * GET /api/gyg/health
 */
router.get('/health', async (req: Request, res: Response) => {
  try {
    const apiKey = process.env.GYG_API_KEY;
    
    if (!apiKey || apiKey === 'your_getyourguide_api_key' || apiKey === 'changeme') {
      return res.json({
        status: 'error',
        message: 'GetYourGuide API key not configured',
        configured: false
      });
    }
    
    // Test API connection with a simple query
    const response = await axios.get('https://api.getyourguide.com/1/tours', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json; charset=utf-8'
      },
      params: {
        query: 'test',
        currency: 'MAD',
        limit: 1
      },
      timeout: 10000
    });
    
    return res.json({
      status: 'success',
      message: 'GetYourGuide API is accessible',
      configured: true,
      apiStatus: response.status
    });
    
  } catch (error: any) {
    console.error('[GYG] Health check failed:', error.message);
    
    return res.json({
      status: 'error',
      message: 'GetYourGuide API is not accessible',
      configured: true,
      error: error.message
    });
  }
});

export default router;