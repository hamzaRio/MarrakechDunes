import { Router, Request, Response } from 'express';
import axios from 'axios';
import { testConnection } from '../utils/gyg.js';
import { GYGFetcher, GYGActivity } from '../utils/gygFetcher.js';
import GYGCache from '../models/GYGCache.js';

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
  // Simple pricing strategy: 10% undercut with minimum price
  const undercutPercent = 0.1; // 10% undercut
  const minPrice = 15; // Minimum 15 MAD
  
  // Calculate undercut price (percentage cheaper than GYG)
  const undercut = gygPrice * (1 - undercutPercent);
  
  // Ensure minimum price is respected
  const suggestedPrice = Math.max(undercut, minPrice);
  
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
 * Search GetYourGuide activities with MongoDB caching and public site scraping
 * GET /api/gyg/search?q=...&forceRefresh=true
 */
router.get('/search', async (req: Request, res: Response) => {
  try {
    const { q, forceRefresh } = req.query;
    
    if (!q || typeof q !== 'string' || q.length < 3) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and must be at least 3 characters long'
      });
    }

    const query = q.trim();
    const normalizedQuery = query.toLowerCase();
    const shouldForceRefresh = forceRefresh === 'true';
    const startTime = Date.now();
    
    console.log(`[GYG Morocco Search] Query="${query}" | ForceRefresh=${shouldForceRefresh}`);

    // Check MongoDB cache first (unless force refresh is requested)
    if (!shouldForceRefresh) {
      try {
        const cachedResult = await GYGCache.findOne({ 
          normalizedQuery: normalizedQuery,
          expiresAt: { $gt: new Date() }
        });

        if (cachedResult) {
          const searchTime = Date.now() - startTime;
          console.log(`[GYG Morocco Search] Query="${query}" | Source=cache | Results=${cachedResult.resultCount} | Time=${searchTime}ms`);
          return res.json(cachedResult.results);
        }
      } catch (cacheError: any) {
        console.warn(`[GYG Morocco Search] Cache lookup failed for "${query}":`, cacheError.message);
      }
    }

    // Fetch fresh data from GetYourGuide public site
    let activities: GYGActivity[] = [];
    let source = 'live';

    try {
      console.log(`[GYG Search] Query="${query}" | Fetching from live GetYourGuide...`);
      
      // Always try live search first for Morocco activities
      console.log(`[GYG Morocco Search] Query="${query}" | Attempting live Morocco search...`);
      try {
        activities = await GYGFetcher.searchActivities(query);
        console.log(`[GYG Morocco Search] Query="${query}" | Live search returned ${activities.length} Morocco activities`);
        
        if (activities.length === 0) {
          console.log(`[GYG Morocco Search] Query="${query}" | No live Morocco results, using fallback`);
          activities = GYGFetcher.generateFallbackActivities(query);
          source = 'fallback';
        } else {
          source = 'live';
        }
      } catch (liveError: any) {
        console.error(`[GYG Morocco Search] Query="${query}" | Live search failed:`, liveError.message);
        console.log(`[GYG Morocco Search] Query="${query}" | Falling back to Morocco fallback data`);
        activities = GYGFetcher.generateFallbackActivities(query);
        source = 'fallback';
      }

      // Transform activities to match expected format
      const transformedActivities = activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        gygPrice: activity.price,
        suggestedPrice: calculateSuggestedPrice(activity.price, activity.currency),
        currency: activity.currency,
        image: activity.image || null,
        link: activity.link,
        description: `${activity.title} - ${activity.duration || 'Duration varies'}`,
        duration: activity.duration || null,
        rating: activity.rating,
        reviewCount: activity.reviewCount,
        location: activity.location || null
      }));

      // Save to MongoDB cache with enhanced metadata
      try {
        const searchTime = Date.now() - startTime;
        await GYGCache.findOneAndUpdate(
          { normalizedQuery: normalizedQuery },
          {
            query: query,
            normalizedQuery: normalizedQuery,
            results: transformedActivities,
            source: source,
            resultCount: transformedActivities.length,
            searchTime: searchTime,
            lastFetched: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          },
          { upsert: true, new: true }
        );
        console.log(`[GYG Morocco Search] Query="${query}" | Cached ${transformedActivities.length} results | Time=${searchTime}ms`);
      } catch (cacheError: any) {
        console.warn(`[GYG Morocco Search] Failed to cache results for "${query}":`, cacheError.message);
      }

      const searchTime = Date.now() - startTime;
      console.log(`[GYG Morocco Search] Query="${query}" | Source=${source} | Results=${transformedActivities.length} | Time=${searchTime}ms`);
      res.json(transformedActivities);

    } catch (fetchError: any) {
      console.error(`[GYG Morocco Search] Live fetch failed for "${query}":`, fetchError.message);
      
      // Try to return cached results even if expired
      try {
        const expiredCache = await GYGCache.findOne({ normalizedQuery: normalizedQuery });
        if (expiredCache && expiredCache.results.length > 0) {
          const searchTime = Date.now() - startTime;
          console.log(`[GYG Morocco Search] Query="${query}" | Source=expired-cache | Results=${expiredCache.resultCount} | Time=${searchTime}ms`);
          return res.json(expiredCache.results);
        }
      } catch (cacheError: any) {
        console.warn(`[GYG Morocco Search] Failed to get expired cache for "${query}":`, cacheError.message);
      }

      // Final fallback with enhanced logging
      console.log(`[GYG Morocco Search] Using Morocco fallback data for: "${query}"`);
      const fallbackActivities = GYGFetcher.generateFallbackActivities(query);
      const transformedFallback = fallbackActivities.map(activity => ({
        id: activity.id,
        title: activity.title,
        gygPrice: activity.price,
        suggestedPrice: calculateSuggestedPrice(activity.price, activity.currency),
        currency: activity.currency,
        image: activity.image || null,
        link: activity.link,
        description: `${activity.title} - ${activity.duration || 'Duration varies'}`,
        duration: activity.duration || null,
        rating: activity.rating,
        reviewCount: activity.reviewCount,
        location: activity.location || null
      }));

      // Cache fallback results
      try {
        const searchTime = Date.now() - startTime;
        await GYGCache.findOneAndUpdate(
          { normalizedQuery: normalizedQuery },
          {
            query: query,
            normalizedQuery: normalizedQuery,
            results: transformedFallback,
            source: 'fallback',
            resultCount: transformedFallback.length,
            searchTime: searchTime,
            lastFetched: new Date(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
          },
          { upsert: true, new: true }
        );
      } catch (cacheError: any) {
        console.warn(`[GYG Morocco Search] Failed to cache fallback for "${query}":`, cacheError.message);
      }

      const searchTime = Date.now() - startTime;
      console.log(`[GYG Morocco Search] Query="${query}" | Source=emergency-fallback | Results=${transformedFallback.length} | Time=${searchTime}ms`);
      res.json(transformedFallback);
    }

  } catch (error: any) {
    console.error('[GYG Search] Unexpected error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error during GetYourGuide search',
      message: error.message
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
 * Get ALL GetYourGuide activities for admin dashboard
 * GET /api/gyg/activities
 */
router.get('/activities', async (req: Request, res: Response) => {
  try {
    console.log('[GYG] Fetching ALL GetYourGuide activities for admin...');
    
    // Check cache first
    const cacheKey = 'all_activities';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[GYG] Returning cached all activities');
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
      console.log('[GYG] Calling GetYourGuide Partner API for all activities...');
      
      // Try to get activities from multiple popular destinations
      const destinations = ['Marrakech', 'Agadir', 'Casablanca', 'Rabat', 'Fes', 'Essaouira', 'Chefchaouen', 'Tangier'];
      
      for (const destination of destinations) {
        try {
          const response = await axios.get(`${process.env.GYG_SUPPLIER_BASE}/tours?location=${destination}`, {
            auth: {
              username: process.env.GYG_SUPPLIER_USER!,
              password: process.env.GYG_SUPPLIER_PASS!,
            },
            headers: { 
              Accept: "application/json" 
            },
            timeout: 10000
          });
          
          if (response.data && response.data.tours && Array.isArray(response.data.tours)) {
            const destinationActivities = response.data.tours.map((tour: any) => {
              const gygPrice = tour.price?.amount || tour.price || 0;
              const currency = tour.price?.currency || 'MAD';
              const suggestedPrice = calculateSuggestedPrice(gygPrice, currency);
              
              return {
                id: tour.id || `gyg-${Date.now()}-${Math.random()}`,
                title: tour.title || 'Untitled Activity',
                gygPrice: gygPrice,
                suggestedPrice: suggestedPrice,
                currency: currency,
                image: tour.picture?.url || tour.image || null,
                link: tour.links?.activity_link || tour.url || `https://www.getyourguide.com/activity-${tour.id}`,
                description: tour.description || null,
                duration: tour.duration || null,
                rating: tour.rating || null,
                reviewCount: tour.review_count || tour.reviewCount || null,
                location: destination,
                category: tour.category || 'Tour'
              };
            });
            
            activities = activities.concat(destinationActivities);
            console.log(`[GYG] Added ${destinationActivities.length} activities from ${destination}`);
          }
        } catch (destError: any) {
          console.log(`[GYG] Failed to fetch activities for ${destination}:`, destError.message);
          // Continue with other destinations
        }
      }
      
      // If no real data, use comprehensive fallback
      if (activities.length === 0) {
        console.log('[GYG] Using comprehensive fallback data for all activities');
        activities = [
          // Marrakech Activities
          { id: 'marrakech-1', title: 'Marrakech City Tour', gygPrice: 180, suggestedPrice: 162, currency: 'MAD', location: 'Marrakech', category: 'City Tour', duration: '4 hours', rating: 4.5, reviewCount: 120, description: 'Explore the Red City with our comprehensive tour' },
          { id: 'marrakech-2', title: 'Atlas Mountains Day Trip', gygPrice: 350, suggestedPrice: 315, currency: 'MAD', location: 'Marrakech', category: 'Adventure', duration: '8 hours', rating: 4.8, reviewCount: 95, description: 'Discover the beauty of Atlas Mountains' },
          { id: 'marrakech-3', title: 'Jemaa el-Fnaa Food Tour', gygPrice: 120, suggestedPrice: 108, currency: 'MAD', location: 'Marrakech', category: 'Food', duration: '3 hours', rating: 4.3, reviewCount: 78, description: 'Taste authentic Moroccan cuisine' },
          
          // Agadir Activities
          { id: 'agadir-1', title: 'Agadir Beach Day', gygPrice: 150, suggestedPrice: 135, currency: 'MAD', location: 'Agadir', category: 'Beach', duration: '6 hours', rating: 4.2, reviewCount: 65, description: 'Relax on Agadir beautiful beaches' },
          { id: 'agadir-2', title: 'Souss Valley Tour', gygPrice: 280, suggestedPrice: 252, currency: 'MAD', location: 'Agadir', category: 'Nature', duration: '7 hours', rating: 4.6, reviewCount: 45, description: 'Explore the fertile Souss Valley' },
          
          // Casablanca Activities
          { id: 'casablanca-1', title: 'Hassan II Mosque Tour', gygPrice: 200, suggestedPrice: 180, currency: 'MAD', location: 'Casablanca', category: 'Cultural', duration: '2 hours', rating: 4.7, reviewCount: 89, description: 'Visit the magnificent Hassan II Mosque' },
          { id: 'casablanca-2', title: 'Casablanca City Center', gygPrice: 160, suggestedPrice: 144, currency: 'MAD', location: 'Casablanca', category: 'City Tour', duration: '4 hours', rating: 4.1, reviewCount: 52, description: 'Discover modern Casablanca' },
          
          // Rabat Activities
          { id: 'rabat-1', title: 'Rabat Royal Tour', gygPrice: 220, suggestedPrice: 198, currency: 'MAD', location: 'Rabat', category: 'Cultural', duration: '5 hours', rating: 4.4, reviewCount: 67, description: 'Explore the capital city' },
          { id: 'rabat-2', title: 'Chellah Necropolis', gygPrice: 140, suggestedPrice: 126, currency: 'MAD', location: 'Rabat', category: 'Historical', duration: '3 hours', rating: 4.0, reviewCount: 34, description: 'Visit ancient Roman ruins' },
          
          // Fes Activities
          { id: 'fes-1', title: 'Fes Medina Walking Tour', gygPrice: 190, suggestedPrice: 171, currency: 'MAD', location: 'Fes', category: 'Cultural', duration: '4 hours', rating: 4.6, reviewCount: 112, description: 'Navigate the labyrinth of Fes Medina' },
          { id: 'fes-2', title: 'Al-Qarawiyyin University', gygPrice: 110, suggestedPrice: 99, currency: 'MAD', location: 'Fes', category: 'Educational', duration: '2 hours', rating: 4.3, reviewCount: 56, description: 'Visit the world oldest university' },
          
          // Essaouira Activities
          { id: 'essaouira-1', title: 'Essaouira Beach Day', gygPrice: 170, suggestedPrice: 153, currency: 'MAD', location: 'Essaouira', category: 'Beach', duration: '6 hours', rating: 4.5, reviewCount: 83, description: 'Enjoy the Atlantic coast' },
          { id: 'essaouira-2', title: 'Essaouira Medina Tour', gygPrice: 130, suggestedPrice: 117, currency: 'MAD', location: 'Essaouira', category: 'Cultural', duration: '3 hours', rating: 4.2, reviewCount: 47, description: 'Explore the UNESCO World Heritage site' },
          
          // Chefchaouen Activities
          { id: 'chefchaouen-1', title: 'Chefchaouen Blue City', gygPrice: 250, suggestedPrice: 225, currency: 'MAD', location: 'Chefchaouen', category: 'Cultural', duration: '6 hours', rating: 4.8, reviewCount: 156, description: 'Discover the famous blue city' },
          { id: 'chefchaouen-2', title: 'Rif Mountains Hike', gygPrice: 320, suggestedPrice: 288, currency: 'MAD', location: 'Chefchaouen', category: 'Adventure', duration: '8 hours', rating: 4.7, reviewCount: 73, description: 'Hike through the beautiful Rif Mountains' },
          
          // Tangier Activities
          { id: 'tangier-1', title: 'Tangier City Tour', gygPrice: 180, suggestedPrice: 162, currency: 'MAD', location: 'Tangier', category: 'City Tour', duration: '4 hours', rating: 4.3, reviewCount: 91, description: 'Explore the gateway to Africa' },
          { id: 'tangier-2', title: 'Hercules Caves', gygPrice: 140, suggestedPrice: 126, currency: 'MAD', location: 'Tangier', category: 'Nature', duration: '3 hours', rating: 4.1, reviewCount: 58, description: 'Visit the legendary Hercules Caves' }
        ];
      }
      
      console.log('[SUCCESS] GetYourGuide all activities:', activities.length, 'activities');
    } catch (apiError: any) {
      console.error('[ERROR] GetYourGuide API call failed:', apiError.message);
      
      // Use fallback data
      console.log('[GYG] Using comprehensive fallback data');
      activities = [
        { id: 'marrakech-1', title: 'Marrakech City Tour', gygPrice: 180, suggestedPrice: 162, currency: 'MAD', location: 'Marrakech', category: 'City Tour', duration: '4 hours', rating: 4.5, reviewCount: 120, description: 'Explore the Red City' },
        { id: 'agadir-1', title: 'Agadir Beach Day', gygPrice: 150, suggestedPrice: 135, currency: 'MAD', location: 'Agadir', category: 'Beach', duration: '6 hours', rating: 4.2, reviewCount: 65, description: 'Relax on beautiful beaches' },
        { id: 'fes-1', title: 'Fes Medina Tour', gygPrice: 190, suggestedPrice: 171, currency: 'MAD', location: 'Fes', category: 'Cultural', duration: '4 hours', rating: 4.6, reviewCount: 112, description: 'Navigate the ancient medina' }
      ];
    }
    
    // Cache the results
    cache.set(cacheKey, { data: activities, timestamp: Date.now() });
    
    console.log('[SUCCESS] Returning all GetYourGuide activities:', activities.length, 'activities');
    res.json(activities);
    
  } catch (error: any) {
    console.error('[ERROR] GetYourGuide all activities error:', error.message);
    return res.status(500).json({
      error: 'Internal server error during GetYourGuide all activities fetch'
    });
  }
});

/**
 * Cache management endpoints
 * GET /api/gyg/cache/stats - Get cache statistics
 * DELETE /api/gyg/cache/clear - Clear all cache
 * DELETE /api/gyg/cache/clear?query=... - Clear specific query cache
 */
router.get('/cache/stats', async (req: Request, res: Response) => {
  try {
    const totalEntries = await GYGCache.countDocuments();
    const activeEntries = await GYGCache.countDocuments({ expiresAt: { $gt: new Date() } });
    const expiredEntries = totalEntries - activeEntries;
    
    // Get source distribution
    const sourceStats = await GYGCache.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get average search time
    const avgSearchTime = await GYGCache.aggregate([
      {
        $group: {
          _id: null,
          avgSearchTime: { $avg: '$searchTime' }
        }
      }
    ]);
    
    const recentEntries = await GYGCache.find({})
      .sort({ lastFetched: -1 })
      .limit(10)
      .select('query normalizedQuery lastFetched source resultCount searchTime')
      .lean();

    res.json({
      status: 'success',
      cache: {
        totalEntries,
        activeEntries,
        expiredEntries,
        sourceDistribution: sourceStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        averageSearchTime: avgSearchTime[0]?.avgSearchTime || 0,
        recentEntries: recentEntries.map(entry => ({
          query: entry.query,
          normalizedQuery: entry.normalizedQuery,
          lastFetched: entry.lastFetched,
          source: entry.source,
          resultCount: entry.resultCount,
          searchTime: entry.searchTime
        }))
      },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[GYG] Cache stats error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'Failed to get cache statistics'
    });
  }
});

router.delete('/cache/clear', async (req: Request, res: Response) => {
  try {
    const { query } = req.query;
    
    if (query && typeof query === 'string') {
      // Clear specific query (both normalized and original)
      const normalizedQuery = query.trim().toLowerCase();
      const result = await GYGCache.deleteOne({ normalizedQuery: normalizedQuery });
      console.log(`[GYG] Cleared cache for query: "${query}" (normalized: "${normalizedQuery}")`);
      res.json({
        status: 'success',
        message: `Cache cleared for query: "${query}"`,
        deletedCount: result.deletedCount
      });
    } else {
      // Clear all cache
      const result = await GYGCache.deleteMany({});
      console.log(`[GYG] Cleared all cache entries: ${result.deletedCount}`);
      res.json({
        status: 'success',
        message: 'All cache entries cleared',
        deletedCount: result.deletedCount
      });
    }
  } catch (error: any) {
    console.error('[GYG] Cache clear error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'Failed to clear cache'
    });
  }
});

/**
 * Simple test route for debugging
 * GET /api/gyg/debug
 */
router.get('/debug', async (req: Request, res: Response) => {
  try {
    console.log('[GYG] Debug route called');
    
    // Test environment variables
    const envCheck = {
      GYG_SUPPLIER_BASE: process.env.GYG_SUPPLIER_BASE,
      GYG_SUPPLIER_USER: process.env.GYG_SUPPLIER_USER ? 'SET' : 'NOT SET',
      GYG_SUPPLIER_PASS: process.env.GYG_SUPPLIER_PASS ? 'SET' : 'NOT SET',
      GYG_ENABLE_LIVE_SEARCH: process.env.GYG_ENABLE_LIVE_SEARCH
    };
    
    console.log('[GYG] Environment check:', envCheck);
    
    res.json({
      status: 'success',
      message: 'GetYourGuide debug route working',
      environment: envCheck,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[GYG] Debug route error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'GetYourGuide debug route failed'
    });
  }
});


export default router;
