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
    console.log('[GYG] Using credentials:', {
      user: GYG_SUPPLIER_USER,
      base: GYG_SUPPLIER_BASE
    });

    // Get capacity from activity or use default with defensive fallback
    const activityCapacity = activity?.maxParticipants || activity?.capacitySettings?.maxParticipants || activity?.capacity || 10;
    const vacancy = typeof activityCapacity === "number" && activityCapacity > 0 ? activityCapacity : 10;
    console.log("[GYG] Using vacancy:", typeof vacancy, vacancy);

    // Use the correct payload structure for GetYourGuide Sandbox API
    const payload = {
      data: {
        productId: "AGAFAY001",
        vacancy: vacancy,
        availabilities: [
          {
            dateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
            available: true,
            price: {
              currency: "EUR",
              value: 400
            }
          },
          {
            dateTime: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
            available: true,
            price: {
              currency: "EUR",
              value: 420
            }
          }
        ]
      }
    };

    console.log('[GYG] Sending test payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${GYG_SUPPLIER_BASE}/notify-availability-update`,
      payload,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('[GYG] Connection API Response Status:', response.status);
    console.log('[GYG] Connection API Response Data:', response.data);

    return {
      status: 'ok',
      response: response.data,
      message: 'GetYourGuide API connection successful'
    };
  } catch (error: any) {
    console.error('[GYG] Connection failed:', error.message);
    
    if (error.response) {
      console.error('[GYG] API Error Status:', error.response.status);
      console.error('[GYG] API Error Data:', error.response.data);
      console.error('[GYG] API Error Headers:', error.response.headers);
      
      return {
        status: 'error',
        error: error.response.data?.errorMessage || error.response.data?.errorCode || 'API request failed',
        message: 'GetYourGuide API connection failed',
        details: error.response.data
      };
    }
    
    return {
      status: 'error',
      error: error.message,
      message: 'Network or connection error'
    };
  }
}