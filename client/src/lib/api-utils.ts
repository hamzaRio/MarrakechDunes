import apiClient from './api';

/**
 * Legacy API functions for backward compatibility
 * These functions provide the same interface as the old api.ts file
 */

/**
 * Legacy apiFetch function
 * @param url - API endpoint URL
 * @param options - Request options
 * @returns Promise<Response>
 */
export async function apiFetch(url: string, options?: {
  method?: string;
  body?: string;
  headers?: Record<string, string>;
}): Promise<Response> {
  const method = options?.method || 'GET';
  const body = options?.body;
  const headers = options?.headers || (body ? { "Content-Type": "application/json" } : {});
  
  const response = await apiClient.request({
    url,
    method: method as any,
    headers,
    data: body,
  });

  return response as any;
}

/**
 * Legacy logout function
 * @returns Promise<void>
 */
export async function logout(): Promise<void> {
  try {
    await apiClient.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with logout even if API call fails
  }
}

/**
 * Legacy api function (for backward compatibility)
 */
export const api = apiClient;

/**
 * Legacy baseURL export
 */
export const baseURL = apiClient.defaults.baseURL || '';
