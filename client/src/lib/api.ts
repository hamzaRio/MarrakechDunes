import Axios from 'axios';
import { browserApiBaseUrl } from './api-url';

const apiBaseURL = browserApiBaseUrl();
const redirectToAdminLogin = import.meta.env.MODE === 'admin'
  ? () => import('./admin-auth-redirect').then(({ redirectToAdminLogin }) => redirectToAdminLogin())
  : null;

// Only log in development to reduce console noise in production
if (import.meta.env.DEV) {
  console.log('[API] Final baseURL:', apiBaseURL);
}

const axios = Axios.create({
  baseURL: apiBaseURL, // Always includes /api
  withCredentials: true, // keep cookies for cross-site
});

let csrfToken: string | null = null;
let csrfInitialization: Promise<string> | null = null;

export async function initializeCSRFToken(): Promise<string> {
  if (csrfToken) return csrfToken;

  if (!csrfInitialization) {
    csrfInitialization = axios.get<{ csrfToken?: string }>('/session/init', {
      withCredentials: true,
    }).then((response) => {
      const token = response.data?.csrfToken;
      if (!token) {
        throw new Error('CSRF token unavailable');
      }
      csrfToken = token;
      return token;
    }).finally(() => {
      csrfInitialization = null;
    });
  }

  return csrfInitialization;
}

axios.interceptors.request.use(async (config) => {
  const method = (config.method || 'get').toUpperCase();
  const isPublicBookingCreation = method === 'POST' &&
    (config.url === '/bookings' || config.url === '/api/bookings');

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method) && !isPublicBookingCreation) {
    const token = await initializeCSRFToken();
    config.headers = config.headers || {};
    config.headers['X-CSRF-Token'] = token;
  }

  return config;
});

// Add response interceptor to handle authentication errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if (status === 401 || status === 403) {
      const requestMethod = (error.config?.method || 'get').toUpperCase();
      const requestUrl = String(error.config?.url || '').split('?')[0].replace(/\/$/, '');
      const isAuthCheck = requestMethod === 'GET' &&
        (requestUrl === '/auth/user' || requestUrl.endsWith('/api/auth/user') || requestUrl.endsWith('/auth/user'));
      const currentPath = window.location.pathname;
      const isAdminBuild = import.meta.env.MODE === 'admin';
      const isAdminRoute = isAdminBuild && (currentPath.startsWith('/admin') || currentPath.startsWith('/admin/'));
      const isLoginPage = isAdminBuild && (currentPath === '/admin/login' || currentPath === '/admin/Login');
      
      // Only log authentication errors if not on login page
      if (!isLoginPage) {
        console.warn('[API] Authentication error detected:', {
          status: error.response?.status,
          path: currentPath,
          isAdminRoute,
          error: error.response?.data
        });
      }
      
      // Only the authoritative GET /auth/user check can invalidate an admin session.
      if (import.meta.env.MODE === 'admin' && status === 401 && isAuthCheck && isAdminRoute && !isLoginPage) {
        console.log('[API] Admin route authentication error - clearing auth data');
        csrfToken = null;
        
        // Clear authentication data on admin routes only
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('[API] Redirecting to login page...');
        void redirectToAdminLogin?.();
      } else if (status === 403) {
        console.warn('[API] Authorization or CSRF error - keeping authentication state');
      } else if (status === 401) {
        console.warn('[API] Non-authentication request returned 401; preserving authentication state');
      }
    }
    return Promise.reject(error);
  }
);

// Legacy exports for backward compatibility
export const api = axios;
export const baseURL = axios.defaults.baseURL || '';

/**
 * Legacy sessionInit function
 * @returns Promise<void>
 */
export async function sessionInit(): Promise<void> {
  try {
    await initializeCSRFToken();
  } catch (error) {
    console.error('Session init error:', error);
  }
}

/**
 * Clear all authentication data and storage
 * @returns void
 */
export function clearAuthData(): void {
  console.log('[API] Clearing all authentication data...');
  csrfToken = null;
  
  // Clear localStorage
  localStorage.removeItem('auth-token');
  localStorage.removeItem('user');
  localStorage.clear();
  
  // Clear sessionStorage
  sessionStorage.clear();
  
  // Clear all cookies
  document.cookie.split(";").forEach(function(c) { 
    document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
  });
  
  // Clear axios headers
  axios.defaults.headers.common['Authorization'] = '';
  
  console.log('[API] All authentication data cleared');
}

/**
 * Legacy logout function - FIXED to prevent redirect loop
 * @returns Promise<void>
 */
export async function logout(): Promise<void> {
  try {
    // Clear any cached credentials
    axios.defaults.headers.common['Authorization'] = '';
    
    // Call logout API
    await axios.post('/auth/logout');
    
    // Clear all auth data
    clearAuthData();
    
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with logout even if API call fails
    clearAuthData();
  }
}

/**
 * Legacy apiFetch function - Fixed to properly handle CORS and errors
 * @param url - API endpoint URL
 * @param options - Request options
 * @returns Promise<Response>
 */
export async function apiFetch(url: string, options?: {
  method?: string;
  body?: string;
  data?: any;
  headers?: Record<string, string>;
}): Promise<Response> {
  const method = options?.method || 'GET';
  const body = options?.body;
  const data = options?.data;
  const headers = options?.headers || (body || data ? { "Content-Type": "application/json" } : {});

  try {
    const response = await axios.request({
      url,
      method: method as any,
      headers,
      data: data || body,
    });

    // Convert axios response to Fetch-like Response object
    return {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as any,
      json: async () => response.data,
      text: async () => JSON.stringify(response.data),
      blob: async () => new Blob([JSON.stringify(response.data)]),
      arrayBuffer: async () => new ArrayBuffer(0),
      formData: async () => {
        throw new Error('Response.formData() not implemented');
      },
      clone: () => {
        throw new Error('Response.clone() not implemented');
      },
      redirected: false,
      type: 'default' as ResponseType,
      url: response.config.url || url,
      body: null,
      bodyUsed: false,
    } as Response;
  } catch (error: any) {
    // Handle CORS and network errors
    if (error.code === 'ERR_NETWORK' || error.message?.includes('CORS') || error.message?.includes('Network Error')) {
      if (import.meta.env.DEV) {
        console.error('[API] CORS/Network error:', {
          url,
          method,
          baseURL: apiBaseURL,
          error: error.message,
          code: error.code
        });
      }
      
      // Return a Response-like object that indicates failure
      return {
        ok: false,
        status: 0,
        statusText: 'Network Error',
        headers: {} as any,
        json: async () => ({ error: 'Network error - CORS or connection failed', message: error.message }),
        text: async () => JSON.stringify({ error: 'Network error - CORS or connection failed', message: error.message }),
        blob: async () => new Blob([JSON.stringify({ error: 'Network error', message: error.message })]),
        arrayBuffer: async () => new ArrayBuffer(0),
        formData: async () => {
          throw new Error('Response.formData() not implemented');
        },
        clone: () => {
          throw new Error('Response.clone() not implemented');
        },
        redirected: false,
        type: 'error' as ResponseType,
        url: url,
        body: null,
        bodyUsed: false,
      } as Response;
    }

    // Handle axios errors with response
    if (error.response) {
      return {
        ok: error.response.status >= 200 && error.response.status < 300,
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers as any,
        json: async () => error.response.data,
        text: async () => JSON.stringify(error.response.data),
        blob: async () => new Blob([JSON.stringify(error.response.data)]),
        arrayBuffer: async () => new ArrayBuffer(0),
        formData: async () => {
          throw new Error('Response.formData() not implemented');
        },
        clone: () => {
          throw new Error('Response.clone() not implemented');
        },
        redirected: false,
        type: 'default' as ResponseType,
        url: error.config?.url || url,
        body: null,
        bodyUsed: false,
      } as Response;
    }

    // Re-throw other errors
    throw error;
  }
}

// Make clearAuthData available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearAuthData = clearAuthData;
  (window as any).forceLogout = () => {
    clearAuthData();
    void redirectToAdminLogin?.();
  };
}

export default axios;
