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
 * Legacy logout function - FIXED to prevent redirect loop
 * @returns Promise<void>
 */
export async function logout(): Promise<void> {
  try {
    // Clear any cached credentials
    axios.defaults.headers.common['Authorization'] = '';
    
    // Call logout API
    await axios.post('/auth/logout');
    
    // Clear ALL auth-related localStorage keys
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user'); // This is the key that useAuth checks!
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with logout even if API call fails
    // Clear local storage anyway
    localStorage.removeItem('auth-token');
    localStorage.removeItem('user'); // This is the key that useAuth checks!
    sessionStorage.clear();
    
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
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

export default axios;