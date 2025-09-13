import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  role: string;
}


export function useAuth() {
  // Check if we have a session cookie or token
  const hasSessionCookie = document.cookie.includes('marrakech.session');
  
  const { data, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    enabled: hasSessionCookie, // Only run query if session cookie exists
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
    onSuccess: (data) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Auth query success:', data);
      }
    }
  });

  return {
    user: data,
    isLoading,
    isAuthenticated: !!data,
    error,
    refetch,
  };
}
