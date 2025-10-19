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
  
  // Enhanced authentication with better error handling
  const { data, isLoading, error, refetch } = useQuery<AuthUserResponse | null>({
    queryKey: ["/auth/user"],
    enabled: true, // Always check server authentication
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.log('[AUTH] Authentication failed, not retrying:', error.response?.status);
        return false;
      }
      return failureCount < 1; // Only retry once for other errors
    },
    staleTime: 2 * 60 * 1000, // 2 minutes cache
    gcTime: 5 * 60 * 1000, // 5 minutes garbage collection
    refetchOnMount: true, // Always refetch on mount
    refetchOnWindowFocus: isAdminRoute, // Only refetch on focus for admin routes
  });

  // Enhanced user state management
  const user = (data as any)?.user ?? null;
  
  // Clear localStorage if server says we're not authenticated
  if (!isLoading && !user && localStorage.getItem('user')) {
    console.warn('[AUTH] Server says not authenticated, clearing localStorage');
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
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
    clearAuthState,
  };
}

