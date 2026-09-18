import Axios from 'axios';

// Resolve API base so the app works with or without VITE_API_URL
function resolveApiBase(): string {
  // 1) Use explicit env if provided (Vercel/Render/client .env)
  const explicit = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
  if (explicit) return explicit;

  // 2) Optional global override (allows HTML injection without rebuild)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const injected = (typeof window !== 'undefined' && (window as any).__API_URL__) || '';
  if (typeof injected === 'string' && injected.trim()) return injected.trim().replace(/\/+$/, '');

  // 3) Heuristic fallbacks
  // - On Vercel preview/prod, default to Render API domain you've been using
  // - Locally, default to same-origin (dev proxy) or 10000 if running standalone
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host.endsWith('.vercel.app')) {
      return 'https://marrakechdunes-sppy.onrender.com';
    }
    // Same-origin fallback (vite dev proxy handles /api → server)
    if (host === 'localhost' || host === '127.0.0.1') {
      return window.location.origin; // e.g., http://localhost:5173
    }
    return window.location.origin;
  }

  // 4) Final fallback for non-browser contexts
  return 'http://localhost:10000';
}

let apiBaseURL = resolveApiBase();
// Always ensure baseURL ends with /api for consistency
if (!apiBaseURL.endsWith('/api')) {
  apiBaseURL = apiBaseURL + '/api';
}

// Only log in development to reduce console noise in production
if (import.meta.env.DEV) {
  console.log('[API] Final baseURL:', apiBaseURL);
}

const axios = Axios.create({
  baseURL: apiBaseURL, // Always includes /api
  withCredentials: true, // keep cookies for cross-site
});

function getCSRFTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const csrfCookie = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith('marrakech.csrf='));
  return csrfCookie ? decodeURIComponent(csrfCookie.substring('marrakech.csrf='.length)) : null;
}

axios.interceptors.request.use((config) => {
  const method = (config.method || 'get').toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrfToken = getCSRFTokenFromCookie();
    if (csrfToken) {
      config.headers = config.headers || {};
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }
  return config;
});

// Add response interceptor to handle authentication errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin') || currentPath.startsWith('/admin/');
      const isLoginPage = currentPath === '/admin/login' || currentPath === '/admin/Login';
      const isPublicRoute = currentPath === '/' || currentPath.startsWith('/activities') || currentPath.startsWith('/reviews');
      
      // Only log authentication errors if not on login page
      if (!isLoginPage) {
        console.warn('[API] Authentication error detected:', {
          status: error.response?.status,
          path: currentPath,
          isAdminRoute,
          isPublicRoute,
          error: error.response?.data
        });
      }
      
      // Only clear auth data and redirect if we're on admin routes (but not login page)
      if (isAdminRoute && !isLoginPage) {
        console.log('[API] Admin route authentication error - clearing auth data');
        
        // Clear authentication data on admin routes only
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        console.log('[API] Redirecting to login page...');
        window.location.href = '/admin/login';
      } else if (isPublicRoute) {
        console.log('[API] Public route - ignoring auth error');
        // Don't clear auth data on public routes
      } else if (isLoginPage) {
        console.log('[API] Login page - ignoring auth error (expected)');
        // Don't clear auth data or redirect on login page
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
    await axios.get('/session/init');
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
    window.location.href = '/admin/login';
  };
}

export default axios;
