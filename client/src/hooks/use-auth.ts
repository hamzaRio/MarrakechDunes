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
  // SECURITY FIX: Always check server authentication, never rely on localStorage alone
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
    staleTime: 2 * 60 * 1000, // 2 minutes (reduced for security)
    gcTime: 5 * 60 * 1000, // 5 minutes (reduced for security)
    refetchOnMount: true, // Always refetch on mount for security
    refetchOnWindowFocus: true, // Refetch on window focus for security
  });

  // SECURITY FIX: Only use server response, never localStorage fallback
  const user = (data as any)?.user ?? null;
  
  // Clear localStorage if server says we're not authenticated
  if (!isLoading && !user && localStorage.getItem('user')) {
    console.warn('[AUTH] Server says not authenticated, clearing localStorage');
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

