import axios from 'axios';

// Get API URL from environment
const API_URL = import.meta.env.VITE_API_URL as string | undefined;

// Validate and clean API URL
function getApiBaseUrl(): string {
  if (!API_URL) {
    if (import.meta.env.MODE === "production") {
      throw new Error("VITE_API_URL is not defined in production build");
    }
    console.warn("VITE_API_URL missing, defaulting to http://localhost:10000/api");
    return "http://localhost:10000/api";
  }

  // Remove trailing slash if present
  let cleanUrl = API_URL.replace(/\/$/, '');
  
  // Ensure URL ends with /api
  if (!cleanUrl.endsWith('/api')) {
    cleanUrl = `${cleanUrl}/api`;
  }

  return cleanUrl;
}

export const baseURL = getApiBaseUrl();

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
  try {
    const method = (opts?.method || 'GET').toLowerCase() as any;
    const res = await api.request<T>({ url: path, method, data: opts?.data, params: opts?.params });
    return res.data;
  } catch (error) {
    console.error(`API Error (${path}):`, error);
    // Show user-friendly error message
    const errorMessage = document.createElement('div');
    errorMessage.className = 'api-error-toast';
    errorMessage.textContent = 'Server error – please try again later';
    errorMessage.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #f44336;
      color: white;
      padding: 16px 24px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      z-index: 9999;
    `;
    document.body.appendChild(errorMessage);
    
    // Remove after 5 seconds
    setTimeout(() => {
      if (errorMessage.parentNode) {
        errorMessage.parentNode.removeChild(errorMessage);
      }
    }, 5000);
    
    throw error; // Re-throw to allow component-specific error handling
  }
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
export async function logout() {
  try {
    await api.post('/auth/logout');
    
    // Enhanced session cleanup
    localStorage.clear();
    sessionStorage.clear();
    
    // Clear all cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Force redirect to login page
    window.location.href = '/admin/login';
  } catch (e) {
    console.error('Logout error:', e);
    // Force logout even if server request fails
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/admin/login';
  }
}
