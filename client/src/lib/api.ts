import Axios from 'axios';

// Normalize VITE_API_URL to prevent /api/api duplication
let base = (import.meta.env.VITE_API_URL || "").trim();

// normalize trailing slashes
base = base.replace(/\/+$/, "");

// Always ensure baseURL ends with /api for consistency
let apiBaseURL = base;
if (!apiBaseURL.endsWith('/api')) {
  apiBaseURL = apiBaseURL + '/api';
}

console.log('[API] Final baseURL:', apiBaseURL);

const axios = Axios.create({
  baseURL: apiBaseURL, // Always includes /api
  withCredentials: true, // keep cookies for cross-site
});

// Add response interceptor to handle authentication errors - ONLY for admin routes
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Only redirect to admin login if we're on an admin route
      const currentPath = window.location.pathname;
      const isAdminRoute = currentPath.startsWith('/admin') || currentPath.startsWith('/admin/');
      
      console.warn('[API] Authentication error detected:', {
        status: error.response?.status,
        path: currentPath,
        isAdminRoute,
        error: error.response?.data
      });
      
      if (isAdminRoute) {
        console.warn('[API] Authentication error detected on admin route, clearing storage...');
        // Clear all authentication data
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Only redirect if not already on login page
        if (!currentPath.includes('/login')) {
          console.log('[API] Redirecting to login page...');
          window.location.href = '/admin/login';
        }
      } else {
        // For non-admin routes, just clear storage but don't redirect
        console.warn('[API] Authentication error on non-admin route, clearing storage only...');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('user');
        sessionStorage.clear();
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
 * Legacy apiFetch function
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

  const response = await axios.request({
    url,
    method: method as any,
    headers,
    data: data || body,
  });

  return response as any;
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