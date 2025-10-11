import axios from 'axios';

/**
 * Centralized API client for MarrakechDunes
 * Single axios instance with proper configuration
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080',
  withCredentials: true,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Request interceptor for logging and CSRF token handling
 */
apiClient.interceptors.request.use(
  (config) => {
    // Add CSRF token to headers if available
    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
    
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('[API] Request error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for error handling
 */
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API] ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('[API] Response error:', error.response?.status, error.response?.data);
    
    // Handle specific error cases
    if (error.response?.status === 403) {
      console.error('[API] 403 Forbidden - Check authentication and CSRF token');
    } else if (error.response?.status === 401) {
      console.error('[API] 401 Unauthorized - Session expired');
    } else if (error.code === 'ECONNABORTED') {
      console.error('[API] Request timeout');
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;

// Legacy exports for backward compatibility
export const api = apiClient;
export const baseURL = apiClient.defaults.baseURL || '';

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
 * Legacy sessionInit function
 * @returns Promise<void>
 */
export async function sessionInit(): Promise<void> {
  try {
    await apiClient.get('/session/init');
  } catch (error) {
    console.error('Session init error:', error);
  }
}