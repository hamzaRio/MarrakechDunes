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
  min_participants?: number;
  max_participants?: number;
}

export interface GYGDeal {
  deal_id: string;
  title: string;
  description: string;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  min_participants?: number;
  max_participants?: number;
}

export interface GYGResponse {
  status: 'success' | 'error';
  message?: string;
  data?: any;
  error?: string;
  details?: any;
}

/**
 * Push availability updates to GetYourGuide
 */
export async function pushAvailability(
  productId: string,
  dates: GYGAvailability[]
): Promise<GYGResponse> {
  try {
    console.log('[GYG] Pushing availability for product:', productId);
    
    // Use the correct payload structure for GetYourGuide Sandbox API
    const payload = {
      data: {
        productId: productId,
        availabilities: dates.map(date => ({
          dateTime: new Date(date.date).toISOString(),
          available: true,
          price: {
            currency: date.currency || "EUR",
            value: date.price
          }
        }))
      }
    };

    console.log('[GYG] Sending availability payload:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      `${GYG_SUPPLIER_BASE}/notify-availability-update`,
      payload,
      {
        auth: {
          username: GYG_SUPPLIER_USER,
          password: GYG_SUPPLIER_PASS
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );

    console.log('[GYG] Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status >= 200 && response.status < 300) {
      console.log('[GYG] Availability sync success:', response.status);
      return {
        status: 'success',
        message: 'Availability updated successfully',
        data: response.data
      };
    } else {
      console.error('[GYG] API Error - Status:', response.status);
      console.error('[GYG] API Error - Response:', response.data);
      return {
        status: 'error',
        error: response.data?.errorMessage || response.data?.errorCode || 'API request failed',
        message: 'Failed to push availability',
        details: response.data
      };
    }
  } catch (error: any) {
    console.error('[GYG] Availability sync error:', error.message);
    
    if (error.response) {
      console.error('[GYG] API Error Status:', error.response.status);
      console.error('[GYG] API Error Data:', error.response.data);
      console.error('[GYG] API Error Headers:', error.response.headers);
      
      // Handle specific GetYourGuide API errors
      if (error.response.status >= 400) {
        const errorData = error.response.data;
        return {
          status: 'error',
          error: errorData?.errorMessage || errorData?.errorCode || 'API request failed',
          message: 'Failed to push availability',
          details: errorData
        };
      }
    }
    
    return {
      status: 'error',
      error: error.response?.data?.errorMessage || error.response?.data?.errorCode || error.message || 'Failed to push availability',
      message: 'Failed to push availability',
      details: error.response?.data
    };
  }
}

/**
 * Push deals to GetYourGuide
 */
export async function pushDeals(
  productId: string,
  dealData: GYGDeal
): Promise<GYGResponse> {
  try {
    console.log('[GYG] Pushing deal for product:', productId);
    
    const payload = {
      product_id: productId,
      deal: {
        deal_id: dealData.deal_id,
        title: dealData.title,
        description: dealData.description,
        discount_percentage: dealData.discount_percentage,
        valid_from: dealData.valid_from,
        valid_to: dealData.valid_to,
        min_participants: dealData.min_participants || 1,
        max_participants: dealData.max_participants || 20
      }
    };

    const response = await axios.post(
      `${GYG_SUPPLIER_BASE}/deals`,
      payload,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('[GYG] Deal sync success:', response.status);
    return {
      status: 'success',
      message: 'Deal created successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('[GYG] Deal sync error:', error.message);
    
    if (error.response) {
      console.error('[GYG] API Error Status:', error.response.status);
      console.error('[GYG] API Error Data:', error.response.data);
    }
    
    return {
      status: 'error',
      error: error.response?.data?.message || error.message || 'Failed to push deal'
    };
  }
}

/**
 * List deals from GetYourGuide
 */
export async function listDeals(productId: string): Promise<GYGResponse> {
  try {
    console.log('[GYG] Listing deals for product:', productId);
    
    const response = await axios.get(
      `${GYG_SUPPLIER_BASE}/deals?product_id=${productId}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('[GYG] Deals list success:', response.status);
    return {
      status: 'success',
      message: 'Deals retrieved successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('[GYG] Deals list error:', error.message);
    
    if (error.response) {
      console.error('[GYG] API Error Status:', error.response.status);
      console.error('[GYG] API Error Data:', error.response.data);
    }
    
    return {
      status: 'error',
      error: error.response?.data?.message || error.message || 'Failed to list deals'
    };
  }
}

/**
 * Delete deal from GetYourGuide
 */
export async function deleteDeal(dealId: string): Promise<GYGResponse> {
  try {
    console.log('[GYG] Deleting deal:', dealId);
    
    const response = await axios.delete(
      `${GYG_SUPPLIER_BASE}/deals/${dealId}`,
      {
        headers: {
          'Authorization': getAuthHeader(),
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('[GYG] Deal deletion success:', response.status);
    return {
      status: 'success',
      message: 'Deal deleted successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('[GYG] Deal deletion error:', error.message);
    
    if (error.response) {
      console.error('[GYG] API Error Status:', error.response.status);
      console.error('[GYG] API Error Data:', error.response.data);
    }
    
    return {
      status: 'error',
      error: error.response?.data?.message || error.message || 'Failed to delete deal'
    };
  }
}

/**
 * Test GetYourGuide API connection
 */
export async function testConnection(): Promise<{status: string; response?: any; error?: string; message?: string; details?: any}> {
  try {
    console.log('[GYG] Testing connection to GetYourGuide API...');
    
    // Validate environment variables
    if (!GYG_SUPPLIER_USER || !GYG_SUPPLIER_PASS) {
      console.error('[GYG] Missing credentials - GYG_SUPPLIER_USER or GYG_SUPPLIER_PASS not set');
      return {
        status: 'error',
        error: 'Missing credentials - GYG_SUPPLIER_USER or GYG_SUPPLIER_PASS not set',
        message: 'GetYourGuide API connection failed'
      };
    }
    
    console.log('[GYG] Using credentials:', {
      user: GYG_SUPPLIER_USER,
      base: GYG_SUPPLIER_BASE
    });
    
    // Test with the correct payload structure for GetYourGuide Sandbox API
    const payload = {
      data: {
        productId: "AGAFAY001",
        availabilities: [
          {
            dateTime: "2025-10-15T10:00:00Z",
            available: true,
            price: {
              currency: "EUR",
              value: 400
            }
          },
          {
            dateTime: "2025-10-16T10:00:00Z",
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
        auth: {
          username: GYG_SUPPLIER_USER,
          password: GYG_SUPPLIER_PASS
        },
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      }
    );
    
    console.log('[GYG] Response:', JSON.stringify(response.data, null, 2));
    
    if (response.status >= 200 && response.status < 300) {
      console.log('[GYG] Availability pushed successfully');
      return {
        status: 'ok',
        response: response.data,
        message: 'GetYourGuide API connection successful'
      };
    } else {
      console.error('[GYG] API Error - Status:', response.status);
      console.error('[GYG] API Error - Response:', response.data);
      return {
        status: 'error',
        error: response.data?.errorMessage || response.data?.errorCode || 'API request failed',
        message: 'GetYourGuide API connection failed',
        details: response.data
      };
    }
    
  } catch (error: any) {
    console.error('[GYG] Connection failed:', error.message);
    
    if (error.response) {
      console.error('[GYG] API Error Status:', error.response.status);
      console.error('[GYG] API Error Data:', error.response.data);
      console.error('[GYG] API Error Headers:', error.response.headers);
      
      // Handle specific GetYourGuide API errors
      if (error.response.status >= 400) {
        const errorData = error.response.data;
        return {
          status: 'error',
          error: errorData?.errorMessage || errorData?.errorCode || 'API request failed',
          message: 'GetYourGuide API connection failed',
          details: errorData
        };
      }
    }
    
    return {
      status: 'error',
      error: error.response?.data?.errorMessage || error.response?.data?.errorCode || error.message || 'GetYourGuide API connection failed',
      message: 'GetYourGuide API connection failed',
      details: error.response?.data
    };
  }
}
