import { Router, Request, Response } from 'express';
import axios from 'axios';
import { testConnection, pushAvailability, pushDeals, listDeals, deleteDeal, GYGAvailability, GYGDeal } from '../utils/gyg.js';

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
      
      // Validate credentials
      if (!process.env.GYG_SUPPLIER_USER || !process.env.GYG_SUPPLIER_PASS) {
        console.log('[ERROR] GetYourGuide credentials not configured');
        return res.status(400).json({ 
          error: 'GetYourGuide credentials not configured. Please set GYG_SUPPLIER_USER and GYG_SUPPLIER_PASS in environment variables.' 
        });
      }
      
      let activities: any[] = [];
      
      try {
        console.log('[GYG] Calling real GetYourGuide Partner API...');
        
        const response = await axios.get(`https://partner-api.getyourguide.com/1/tours?location=${query}`, {
          auth: {
            username: process.env.GYG_SUPPLIER_USER!,
            password: process.env.GYG_SUPPLIER_PASS!,
          },
          headers: { 
            Accept: "application/json" 
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
            error: 'Invalid GetYourGuide credentials. Please check your GYG_SUPPLIER_USER and GYG_SUPPLIER_PASS configuration.' 
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

/**
 * Test GetYourGuide API connection
 * GET /api/gyg/test
 */
router.get('/test', async (req: Request, res: Response) => {
  try {
    console.log('[GYG] Testing GetYourGuide API connection...');
    
    const result = await testConnection();
    
    if (result.status === 'ok') {
      res.json({
        status: 'ok',
        response: result.response,
        message: result.message || 'GetYourGuide API connection successful'
      });
    } else {
      res.status(500).json({
        status: 'error',
        error: result.error,
        message: result.message || 'GetYourGuide API connection failed'
      });
    }
  } catch (error: any) {
    console.error('[GYG] Test route error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'GetYourGuide API test failed'
    });
  }
});

/**
 * Push availability updates
 * POST /api/gyg/availability
 */
router.post('/availability', async (req: Request, res: Response) => {
  try {
    const { productId, dates } = req.body;
    
    if (!productId || !dates || !Array.isArray(dates)) {
      return res.status(400).json({
        status: 'error',
        error: 'productId and dates array are required'
      });
    }
    
    console.log('[GYG] Pushing availability for product:', productId);
    const result = await pushAvailability(productId, dates);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('[GYG] Availability push error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Create deal
 * POST /api/gyg/deals
 */
router.post('/deals', async (req: Request, res: Response) => {
  try {
    const { productId, deal } = req.body;
    
    if (!productId || !deal) {
      return res.status(400).json({
        status: 'error',
        error: 'productId and deal are required'
      });
    }
    
    console.log('[GYG] Creating deal for product:', productId);
    const result = await pushDeals(productId, deal);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('[GYG] Deal creation error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * List deals
 * GET /api/gyg/deals?productId=<id>
 */
router.get('/deals', async (req: Request, res: Response) => {
  try {
    const { productId } = req.query;
    
    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({
        status: 'error',
        error: 'productId query parameter is required'
      });
    }
    
    console.log('[GYG] Listing deals for product:', productId);
    const result = await listDeals(productId);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('[GYG] Deals list error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

/**
 * Delete deal
 * DELETE /api/gyg/deals/:dealId
 */
router.delete('/deals/:dealId', async (req: Request, res: Response) => {
  try {
    const { dealId } = req.params;
    
    if (!dealId) {
      return res.status(400).json({
        status: 'error',
        error: 'dealId parameter is required'
      });
    }
    
    console.log('[GYG] Deleting deal:', dealId);
    const result = await deleteDeal(dealId);
    
    if (result.status === 'success') {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('[GYG] Deal deletion error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

export default router;
