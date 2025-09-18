import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { api } from "./api";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage = res.statusText;
    let errorCode = 'UNKNOWN_ERROR';
    
    try {
      const errorData = await res.json();
      // Handle standardized error format from backend
      if (errorData.status === 'error') {
        errorMessage = errorData.message || res.statusText;
        errorCode = errorData.code || 'UNKNOWN_ERROR';
      } else {
        // Fallback for non-standardized errors
        errorMessage = errorData.message || errorData.error || res.statusText;
      }
    } catch {
      // If JSON parsing fails, use status text
      errorMessage = res.statusText;
    }
    
    // Enhanced error handling for specific status codes
    switch (res.status) {
      case 401:
        throw new Error('Authentication required. Please log in again.');
      case 403:
        throw new Error('Access denied. You do not have permission for this action.');
      case 404:
        throw new Error('Resource not found.');
      case 429:
        throw new Error('Too many requests. Please try again later.');
      case 500:
        throw new Error('Server error. Please try again later.');
      default:
        throw new Error(`${res.status}: ${errorMessage}`);
    }
  }
}

export async function apiRequest(
  url: string,
  options?: { method?: string; body?: string; headers?: Record<string, string> }
): Promise<Response> {
  // If URL already starts with /api, use it as-is (for Vercel rewrites)
  // If URL doesn't start with /api, prepend it
  const fullUrl = url.startsWith('http') ? url : 
                  url.startsWith('/api') ? url : 
                  `/api${url}`;
  const method = options?.method || 'GET';
  const body = options?.body;
  const headers = options?.headers || (body ? { "Content-Type": "application/json" } : {});
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey[0] as string;
    
    try {
      // Use the unified API client instead of fetch to prevent duplication
      const response = await api.get(path);
      return response.data;
    } catch (error: any) {
      if (unauthorizedBehavior === "returnNull" && error?.response?.status === 401) {
        return null;
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
