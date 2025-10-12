import Axios from 'axios';

// Normalize VITE_API_URL to prevent /api/api duplication
let base = (import.meta.env.VITE_API_URL || "").trim();

// normalize trailing slashes
base = base.replace(/\/+$/, "");

// strip a single trailing '/api' if present, so baseURL is the origin only
const origin = base.replace(/\/api$/i, "");

if (origin !== base) {
  console.warn("[API] Stripped trailing '/api' from VITE_API_URL:", base, "→", origin);
}

const axios = Axios.create({
  baseURL: origin, // origin only
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
    await axios.get('/api/session/init');
  } catch (error) {
    console.error('Session init error:', error);
  }
}

/**
 * Legacy logout function
 * @returns Promise<void>
 */
export async function logout(): Promise<void> {
  try {
    await axios.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
    // Continue with logout even if API call fails
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
  headers?: Record<string, string>;
}): Promise<Response> {
  const method = options?.method || 'GET';
  const body = options?.body;
  const headers = options?.headers || (body ? { "Content-Type": "application/json" } : {});
  
  const response = await axios.request({
    url,
    method: method as any,
    headers,
    data: body,
  });

  return response as any;
}

export default axios;