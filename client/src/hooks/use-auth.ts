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
  // Check if we have a session cookie or token
  const hasSessionCookie = document.cookie.includes('marrakech.session');
  
  const { data, isLoading, error, refetch } = useQuery<AuthUserResponse | null>({
    queryKey: ["/auth/user"],
    enabled: !!hasSessionCookie, // Only run query if session cookie exists
    retry: false, // Stop retry loop completely for auth queries
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    // Add error logging for debugging (production-safe)
    onError: (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('Auth query error:', error);
      }
    },
    // Add success logging for debugging (development only)
    onSuccess: (response) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth query success:', response);
      }
    }
  });

  const user = data?.user ?? null;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    error,
    refetch,
  };
}

