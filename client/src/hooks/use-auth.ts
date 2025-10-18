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
  
  // SECURITY FIX: Check server authentication, but be less aggressive on non-admin routes
  const { data, isLoading, error, refetch } = useQuery<AuthUserResponse | null>({
    queryKey: ["/auth/user"],
    enabled: true, // Always check server authentication
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 1; // Only retry once for other errors
    },
    staleTime: isAdminRoute ? 2 * 60 * 1000 : 5 * 60 * 1000, // Longer cache for non-admin routes
    gcTime: isAdminRoute ? 5 * 60 * 1000 : 10 * 60 * 1000, // Longer cache for non-admin routes
    refetchOnMount: isAdminRoute, // Only refetch on mount for admin routes
    refetchOnWindowFocus: isAdminRoute, // Only refetch on focus for admin routes
  });

  // SECURITY FIX: Only use server response, never localStorage fallback
  const user = (data as any)?.user ?? null;
  
  // Clear localStorage if server says we're not authenticated - but only on admin routes
  if (!isLoading && !user && localStorage.getItem('user') && isAdminRoute) {
    console.warn('[AUTH] Server says not authenticated on admin route, clearing localStorage');
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token');
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

