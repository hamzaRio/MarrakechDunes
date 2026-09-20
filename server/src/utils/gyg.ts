import axios from 'axios';

// GetYourGuide API configuration
const GYG_SUPPLIER_BASE = process.env.GYG_SUPPLIER_BASE || 'https://supplier-api.getyourguide.com/sandbox/1';
const GYG_SUPPLIER_USER = process.env.GYG_SUPPLIER_USER || '';
const GYG_SUPPLIER_PASS = process.env.GYG_SUPPLIER_PASS || '';

// Create Basic Auth header
const getAuthHeader = () => {
  const credentials = Buffer.from(`${GYG_SUPPLIER_USER}:${GYG_SUPPLIER_PASS}`).toString('base64');
  return `Basic ${credentials}`;
};

// Types for GetYourGuide API
export interface GYGAvailability {
  date: string;
  price: number;
  currency: string;
  vacancy?: number;
  min_participants?: number;
  max_participants?: number;
}

export interface GYGResponse {
  status: 'success' | 'error' | 'ok';
  message?: string;
  data?: any;
  error?: string;
  details?: any;
  response?: any;
}

/**
 * Test GetYourGuide API connection (health check)
 */
export async function testConnection(activity?: any): Promise<GYGResponse> {
  try {
    console.log('[GYG] Testing connection to GetYourGuide API...');
    console.log('[GYG] Supplier connection is configured:', {
      hasUser: Boolean(GYG_SUPPLIER_USER),
      hasPassword: Boolean(GYG_SUPPLIER_PASS)
    });

    // Simple GET request to test basic connectivity and authentication
    // This avoids the product ID validation issue
    const response = await axios.get(
      `${GYG_SUPPLIER_BASE}/products`,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('[GYG] Connection API Response Status:', response.status);
    console.log('[GYG] Connection API Response Data Keys:', Object.keys(response.data || {}));

    return {
      status: 'ok',
      message: 'GetYourGuide API connection successful'
    };
  } catch (error: any) {
    console.error('[GYG] Connection failed:', error.message);
    
    if (error.response) {
      console.error('[GYG] API Error Status:', error.response.status);
      console.error('[GYG] API error response received');
      
      return {
        status: 'error',
        error: error.response.data?.errorMessage || error.response.data?.errorCode || 'API request failed',
        message: 'GetYourGuide API connection failed',
        details: { status: error.response.status },
      };
    }
    
    return {
      status: 'error',
      error: error.message,
      message: 'Network or connection error'
    };
  }
}
