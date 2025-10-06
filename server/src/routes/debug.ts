import { Router, Request, Response } from 'express';
import { testConnection, pushAvailability, validateGYGConnection, testPayloadStructures, GYGAvailability } from '../utils/gyg.js';

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
    
    // Test availability push with sample data
    const sampleAvailability: GYGAvailability[] = [
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        price: 250,
        currency: 'MAD',
        min_participants: 1,
        max_participants: 20
      },
      {
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 14 days from now
        price: 280,
        currency: 'MAD',
        min_participants: 1,
        max_participants: 20
      }
    ];
    
    const availabilityResult = await pushAvailability('AGAFAY001', sampleAvailability, sampleActivity);
    
    res.json({
      status: 'success',
      message: 'GetYourGuide API test completed',
      results: {
        connection: connectionResult,
        availability: availabilityResult
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
 * Debug route to test availability push with custom data
 * POST /api/debug/test-availability
 */
router.post('/test-availability', async (req: Request, res: Response) => {
  try {
    const { productId, dates, activity } = req.body;
    
    if (!productId) {
      return res.status(400).json({
        status: 'error',
        error: 'productId is required'
      });
    }
    
    const availabilityData: GYGAvailability[] = dates || [
      {
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 250,
        currency: 'MAD',
        min_participants: 1,
        max_participants: 20
      }
    ];
    
    console.log('[DEBUG] Testing availability push for product:', productId);
    const result = await pushAvailability(productId, availabilityData, activity);
    
    res.json({
      status: result.status,
      message: result.status === 'success' ? 'Availability test successful' : 'Availability test failed',
      result: result,
      productId: productId,
      dates: availabilityData
    });
    
  } catch (error: any) {
    console.error('[DEBUG] Availability test error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Availability test failed',
      error: error.message
    });
  }
});

/**
 * Debug route to validate GetYourGuide API connection
 * GET /api/debug/validate-gyg
 */
router.get('/validate-gyg', async (req: Request, res: Response) => {
  try {
    console.log('[DEBUG] Validating GetYourGuide API connection...');
    
    const result = await validateGYGConnection();
    
    res.json({
      status: result.status,
      message: result.message,
      details: result.details,
      environment: {
        supplier_base: process.env.GYG_SUPPLIER_BASE,
        supplier_user: process.env.GYG_SUPPLIER_USER,
        enable_live_search: process.env.GYG_ENABLE_LIVE_SEARCH
      }
    });
    
  } catch (error: any) {
    console.error('[DEBUG] GYG validation error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'GetYourGuide API validation failed',
      error: error.message
    });
  }
});

/**
 * Debug route to test different payload structures
 * GET /api/debug/test-payloads
 */
router.get('/test-payloads', async (req: Request, res: Response) => {
  try {
    console.log('[DEBUG] Testing different payload structures...');
    
    const result = await testPayloadStructures();
    
    res.json({
      status: result.status,
      message: result.message,
      results: result.results,
      summary: {
        total: result.results.length,
        successful: result.results.filter(r => r.status === 'success').length,
        failed: result.results.filter(r => r.status === 'error').length
      }
    });
    
  } catch (error: any) {
    console.error('[DEBUG] Payload testing error:', error.message);
    res.status(500).json({
      status: 'error',
      message: 'Payload structure testing failed',
      error: error.message
    });
  }
});

export default router;
