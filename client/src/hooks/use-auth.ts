import { useQuery } from "@tanstack/react-query";

interface SessionUser {
  id: string;
  role: string;
  username?: string;
}

interface AuthUserResponse {
  success: boolean;
  user: SessionUser;
}

export function useAuth() {
  // Check if we're on an admin route to determine authentication strategy
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const isAdminRoute = currentPath.startsWith('/admin') || currentPath.startsWith('/admin/');
  const isLoginPage = currentPath === '/admin/login' || currentPath === '/admin/Login';
  
  // Enhanced authentication with better error handling
  const { data, isLoading, error, refetch } = useQuery<AuthUserResponse | null>({
    queryKey: ["/auth/user"],
    enabled: isAdminRoute && !isLoginPage, // Only check authentication on admin routes, not on login page
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('[AUTH] Authentication failed, not retrying:', error.response?.status);
        return false;
      }
      return failureCount < 1; // Only retry once for other errors
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache - longer to prevent loops
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnMount: isAdminRoute && !isLoginPage, // Only refetch on mount for admin routes, not login
    refetchOnWindowFocus: isAdminRoute && !isLoginPage, // Only refetch on focus for admin routes, not login
    refetchInterval: false, // Disable automatic refetch to prevent loops
  });

  // Enhanced user state management with proper typing
  const user = (data && 'user' in data && data.user) ? data.user : null;
  
  // For admin routes, also check localStorage as fallback
  let localUser: SessionUser | null = null;
  if (isAdminRoute && !user && !isLoading) {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        localUser = JSON.parse(stored) as SessionUser;
      }
    } catch (error) {
      console.warn('[AUTH] Failed to parse stored user:', error);
      localStorage.removeItem('user');
    }
  }
  const finalUser = user || localUser;
  
  // Clear localStorage if server says we're not authenticated (only on admin routes)
  if (!isLoading && !user && localStorage.getItem('user') && isAdminRoute) {
    console.warn('[AUTH] Server says not authenticated on admin route, clearing localStorage');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token');
    sessionStorage.clear();
  }

  // Function to force clear auth state (useful for logout)
  const clearAuthState = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token');
    sessionStorage.clear();
    // Clear all cookies by setting them to expire
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    // Invalidate the query to force refetch
    refetch();
  };

  return {
    user: finalUser,
    isLoading,
    isAuthenticated: !!finalUser,
    error,
    refetch,
    clearAuthState,
  };
}

