import { Router, Request, Response } from 'express';
import { testConnection } from '../utils/gyg.js';

const router = Router();

/**
 * Debug route to manually test GetYourGuide API
 * GET /api/debug/test-gyg
 */
router.get('/test-gyg', async (req: Request, res: Response) => {
  try {
    console.log('[DEBUG] Manual GetYourGuide API test triggered...');
    
    // Create a sample activity with capacity settings for testing
    const sampleActivity = {
      maxParticipants: 15,
      capacitySettings: {
        maxParticipants: 15,
        weatherDependent: false,
        requiresGuide: true,
        requiresEquipment: false,
        overbookingAllowed: false
      }
    };
    
    // Test connection first with sample activity
    const connectionResult = await testConnection(sampleActivity);
    
    if (connectionResult.status === 'error') {
      return res.status(500).json({
        status: 'error',
        message: 'GetYourGuide API connection failed',
        error: connectionResult.error,
        details: {
          supplier_base: process.env.GYG_SUPPLIER_BASE,
          supplier_user: process.env.GYG_SUPPLIER_USER,
          enable_live_search: process.env.GYG_ENABLE_LIVE_SEARCH
        }
      });
    }
    
    // Test completed with connection only
    
    res.json({
      status: 'success',
      message: 'GetYourGuide API test completed',
      results: {
        connection: connectionResult
      },
      environment: {
        supplier_base: process.env.GYG_SUPPLIER_BASE,
        supplier_user: process.env.GYG_SUPPLIER_USER,
        enable_live_search: process.env.GYG_ENABLE_LIVE_SEARCH,
        undercut_percent: process.env.GYG_UNDERCUT_PERCENT,
        margin_fixed: process.env.GYG_MARGIN_FIXED,
        min_price: process.env.GYG_MIN_PRICE
      }
    });
    
  } catch (error: any) {
    console.error('[DEBUG] GetYourGuide test error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'GetYourGuide API test failed',
      error: error.message,
      stack: error.stack
    });
  }
});

/**
 * Debug route to test GetYourGuide live search
 * GET /api/debug/test-search?q=Marrakech
 */
router.get('/test-search', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    const query = q || 'Marrakech';
    
    console.log('[DEBUG] Testing GetYourGuide live search for:', query);
    
    // Test the live search endpoint
    const response = await fetch(`${process.env.CLIENT_URL || 'http://localhost:5173'}/api/gyg/search?q=${encodeURIComponent(query as string)}`);
    const data = await response.json();
    
    res.json({
      status: 'success',
      message: 'GetYourGuide live search test completed',
      query: query,
      results: data,
      endpoint: '/api/gyg/search'
    });
    
  } catch (error: any) {
    console.error('[DEBUG] Search test error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'GetYourGuide search test failed',
      error: error.message
    });
  }
});

export default router;
