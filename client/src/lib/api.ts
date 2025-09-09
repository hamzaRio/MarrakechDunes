import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || '/api';

export const api = axios.create({
  baseURL,
  withCredentials: true,
});

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