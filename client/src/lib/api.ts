import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL as string | undefined;
if (!API_URL) {
  if (import.meta.env.MODE === "production") {
    throw new Error("VITE_API_URL is not defined in production build");
  }
  console.warn("VITE_API_URL missing, defaulting to http://localhost:5000/api");
}
export const baseURL = API_URL || "http://localhost:5000/api";

const CSRF_COOKIE = "marrakech.csrf";
const CSRF_HEADER = "X-CSRF-Token";

export const api = axios.create({ baseURL, withCredentials: true });
api.defaults.xsrfCookieName = CSRF_COOKIE;
api.defaults.xsrfHeaderName = CSRF_HEADER;

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

export async function sessionInit() {
  try {
    const { data } = await api.get<{ csrfToken?: string }>('/session/init');
    if (data?.csrfToken) {
      api.defaults.headers.common[CSRF_HEADER] = data.csrfToken;
    }
  } catch (error) {
    console.warn('[API] Failed to initialize session', error);
  }
}
export async function logout() { try { await api.post('/auth/logout'); } catch (e) { console.error('Logout error:', e); } }
