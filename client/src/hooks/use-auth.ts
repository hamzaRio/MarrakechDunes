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
  // Check if we have a session cookie or localStorage user data
  const hasSessionCookie = document.cookie.includes('marrakech.session');
  const hasLocalStorageUser = localStorage.getItem('user');
  
  // If localStorage is cleared, we should not make API calls
  const shouldCheckAuth = hasSessionCookie && hasLocalStorageUser;
  
  const { data, isLoading, error, refetch } = useQuery<AuthUserResponse | null>({
    queryKey: ["/auth/user"],
    enabled: shouldCheckAuth, // Only check if we have both cookie AND localStorage
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 1; // Only retry once for other errors
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnMount: true, // Allow refetch on mount for auth
    refetchOnWindowFocus: false,
    // Add error logging for debugging (production-safe)
    // Note: onError is deprecated in React Query v5, using error handling in components instead
    // Note: onSuccess is deprecated in React Query v5, using success handling in components instead
  });

  // Try to get user from localStorage as fallback if query fails
  let user = data?.user ?? null;
  if (!user && hasLocalStorageUser && !isLoading) {
    try {
      const localUser = JSON.parse(hasLocalStorageUser);
      user = localUser;
    } catch (error) {
      // Clear invalid localStorage data
      localStorage.removeItem('user');
    }
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

