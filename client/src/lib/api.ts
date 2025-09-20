import axios from 'axios';

function normalizeApiUrl(raw: string | undefined) {
  let base = (raw ?? '').trim();

  // If missing, try window origin (works on Render where client+server share host)
  if (!base && typeof window !== 'undefined') {
    console.warn('[API Config] VITE_API_URL is missing, falling back to window.origin');
    base = window.location.origin;
  }

  // Final safety net: throw only in production when still empty
  if (!base && import.meta.env.PROD) {
    throw new Error('VITE_API_URL is required in production. Set it to https://marrakechdunes.onrender.com/api');
  }

  // Normalize URL - ensure /api is appended once (no apihttps://...)
  base = (base || '').replace(/\/$/, '');
  if (!base.endsWith('/api')) base += '/api';
  
  // Log final resolved URL once for debugging
  console.log('[API Config] Final resolved API URL:', base);
  
  return base;
}

export const baseURL = normalizeApiUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({ baseURL, withCredentials: true });

// test helper
export function __testApiBase() {
  const testUrl = `${baseURL}/activities`;
  console.log(`[API Test] api.get("/activities") resolves to: ${testUrl}`);
  return testUrl;
}

export async function apiFetch<T = any>(
  path: string,
  opts?: { method?: 'GET'|'POST'|'PUT'|'PATCH'|'DELETE'; data?: any; params?: any }
): Promise<T> {
  const method = (opts?.method || 'GET').toLowerCase() as any;
  const res = await api.request<T>({ url: path, method, data: opts?.data, params: opts?.params });
  return res.data;
}

export async function sessionInit() { try { await api.post('/session/init'); } catch {} }
export async function logout() { try { await api.post('/auth/logout'); } catch (e) { console.error('Logout error:', e); } }
