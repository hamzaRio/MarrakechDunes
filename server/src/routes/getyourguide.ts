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

// Mock data removed - using only real GetYourGuide Partner API

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

      const query = q.trim();
      console.log('[GYG] Live GetYourGuide search request:', { query });

      // Check cache first
      const cacheKey = `search_${query}`;
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        console.log('[GYG] Returning cached results for:', query);
        return res.json(cached.data);
      }
      
      // Validate API key
      const apiKey = process.env.GYG_API_KEY;
      if (!apiKey || apiKey === 'your_getyourguide_api_key' || apiKey === 'changeme') {
        console.log('[ERROR] GetYourGuide API key not configured');
        return res.status(400).json({ 
          error: 'GetYourGuide API key not configured. Please set GYG_API_KEY in environment variables.' 
        });
      }
      
      let activities: any[] = [];
      
      try {
        console.log('[GYG] Calling real GetYourGuide Partner API...');
        
        const response = await axios.get('https://api.getyourguide.com/1/tours', {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json; charset=utf-8',
            'Accept': 'application/json'
          },
          params: {
            query: query,
            currency: 'MAD',
            limit: 10
          },
          timeout: 15000
        });
        
        console.log('[GYG] API Response Status:', response.status);
        console.log('[GYG] API Response Data Keys:', Object.keys(response.data || {}));
        
        if (response.data && response.data.tours && Array.isArray(response.data.tours)) {
          activities = response.data.tours.map((tour: any) => {
            const gygPrice = tour.price?.amount || tour.price || 0;
            const currency = tour.price?.currency || 'MAD';
            const suggestedPrice = calculateSuggestedPrice(gygPrice, currency);
            
            return {
              id: tour.id || `gyg-${Date.now()}`,
              title: tour.title || 'Untitled Activity',
              gygPrice: gygPrice,
              suggestedPrice: suggestedPrice,
              currency: currency,
              image: tour.picture?.url || tour.image || null,
              link: tour.links?.activity_link || tour.url || `https://www.getyourguide.com/activity-${tour.id}`,
              description: tour.description || null,
              duration: tour.duration || null,
              rating: tour.rating || null,
              reviewCount: tour.review_count || tour.reviewCount || null
            };
          });
          
          console.log('[SUCCESS] Real GetYourGuide API returned:', activities.length, 'activities');
        } else {
          console.log('[WARNING] No tours found in API response');
          activities = [];
        }
      } catch (apiError: any) {
        console.error('[ERROR] GetYourGuide API call failed:', {
          message: apiError.message,
          status: apiError.response?.status,
          statusText: apiError.response?.statusText,
          data: apiError.response?.data
        });
        
        // Return specific error messages
        if (apiError.response?.status === 401) {
          return res.status(401).json({ 
            error: 'Invalid GetYourGuide API key. Please check your GYG_API_KEY configuration.' 
          });
        } else if (apiError.response?.status === 429) {
          return res.status(429).json({ 
            error: 'Rate limit exceeded for GetYourGuide API. Please try again later.' 
          });
        } else if (apiError.response?.status === 403) {
          return res.status(403).json({ 
            error: 'Access forbidden. Please verify your GetYourGuide API permissions.' 
          });
        } else if (apiError.code === 'ECONNABORTED') {
          return res.status(504).json({ 
            error: 'GetYourGuide API timeout. Please try again.' 
          });
        } else {
          return res.status(500).json({ 
            error: `GetYourGuide API error: ${apiError.message}` 
          });
        }
      }

      // Cache the results
      cache.set(cacheKey, { data: activities, timestamp: Date.now() });

      console.log('[SUCCESS] Returning GetYourGuide suggestions:', activities.length, 'activities');
      res.json(activities);

    } catch (error: any) {
      console.error('[ERROR] GetYourGuide search error:', error.message);
      return res.status(500).json({ 
        error: 'Internal server error during GetYourGuide search' 
      });
    }
  });

export default router;
