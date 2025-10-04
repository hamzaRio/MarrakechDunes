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
    
    const payload = {
      product_id: productId,
      availability: dates.map(date => ({
        date: date.date,
        price: date.price,
        currency: date.currency,
        min_participants: date.min_participants || 1,
        max_participants: date.max_participants || 20
      }))
    };

    const response = await axios.post(
      `${GYG_SUPPLIER_BASE}/notify-availability-update`,
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

    console.log('[GYG] Availability sync success:', response.status);
    return {
      status: 'success',
      message: 'Availability updated successfully',
      data: response.data
    };
  } catch (error: any) {
    console.error('[GYG] Availability sync error:', error.message);
    
    if (error.response) {
      console.error('[GYG] API Error Status:', error.response.status);
      console.error('[GYG] API Error Data:', error.response.data);
    }
    
    return {
      status: 'error',
      error: error.response?.data?.message || error.message || 'Failed to push availability'
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
export async function testConnection(): Promise<GYGResponse> {
  try {
    console.log('[GYG] Testing connection to GetYourGuide API...');
    
    // Test with sample availability data
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

    const result = await pushAvailability('AGAFAY001', sampleAvailability);
    
    if (result.status === 'success') {
      console.log('[GYG] Connection test successful');
      return {
        status: 'success',
        message: 'GetYourGuide API connection successful',
        data: result.data
      };
    } else {
      console.error('[GYG] Connection test failed:', result.error);
      return {
        status: 'error',
        error: result.error || 'Connection test failed'
      };
    }
  } catch (error: any) {
    console.error('[GYG] Connection test error:', error.message);
    return {
      status: 'error',
      error: error.message || 'Connection test failed'
    };
  }
}
