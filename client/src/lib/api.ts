import axios from 'axios';

const envApiUrl = (import.meta.env.VITE_API_URL || '').trim();
if (!envApiUrl) {
  throw new Error('VITE_API_URL must be defined');
}

const normalizedApiUrl = envApiUrl.endsWith('/api')
  ? envApiUrl
  : `${envApiUrl.replace(/\/$/, '')}/api`;

const baseURL = normalizedApiUrl;

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Test function to verify API base URL resolution
export function __testApiBase() {
  const testUrl = `${baseURL}/activities`;
  console.log(`[API Test] api.get("/activities") resolves to: ${testUrl}`);
  return testUrl;
}

// Make test function available in browser console
if (typeof window !== 'undefined') {
  (window as any).__testApiBase = __testApiBase;
}

// Used by hooks, including use-security.tsx
export async function apiFetch<T = any>(
  path: string,
  opts?: { method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'; data?: any; params?: any }
): Promise<T> {
  const method = (opts?.method || 'GET').toLowerCase() as 'get' | 'post' | 'put' | 'patch' | 'delete';
  const res = await api.request<T>({ url: path, method, data: opts?.data, params: opts?.params });
  return res.data;
}

export async function sessionInit(): Promise<void> {
  try { await api.post('/session/init'); } catch {}
}

export async function logout(): Promise<void> {
  try { 
    await api.post('/auth/logout');
  } catch (error) {
    console.error('Logout error:', error);
    // Even if logout fails, we should clear local state
  }
}