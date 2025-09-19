import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:5000/api';
const DEFAULT_ASSETS_BASE = 'http://localhost:5000/attached_assets';

function normalizeApiUrl(url: string): string {
  const trimmed = url.replace(/\/+$/, '');
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}

// Environment variable validation for production
const isProduction = import.meta.env.MODE === 'production';

// Validate VITE_API_URL
const envApiUrl = (import.meta.env.VITE_API_URL || '').trim();
if (!envApiUrl) {
  if (isProduction) {
    throw new Error('VITE_API_URL is required in production. Please set it to https://marrakechdunes.onrender.com/api');
  } else {
    console.warn('[API Config] VITE_API_URL is missing, falling back to http://localhost:5000/api');
  }
}

// Validate VITE_ASSETS_BASE
const envAssetsBase = (import.meta.env.VITE_ASSETS_BASE || '').trim();
if (!envAssetsBase) {
  if (isProduction) {
    console.warn('[API Config] VITE_ASSETS_BASE is missing, using default path');
  } else {
    console.warn('[API Config] VITE_ASSETS_BASE is missing, falling back to http://localhost:5000/attached_assets');
  }
}

// Handle both absolute and relative paths for assets
export const ASSETS_BASE = envAssetsBase || DEFAULT_ASSETS_BASE;
const baseURL = envApiUrl ? normalizeApiUrl(envApiUrl) : DEFAULT_API_URL;

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
