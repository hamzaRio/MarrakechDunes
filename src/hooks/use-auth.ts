import { useQuery } from "@tanstack/react-query";

interface User {
  id: string;
  username: string;
  role: string;
}


export function useAuth() {
  const { data, isLoading, error, refetch } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: (failureCount, error) => {
      // Don't retry on 401 (authentication errors)
      if (error instanceof Error && error.message.includes('401')) {
        return false;
      }
      // Retry up to 2 times for other errors
      return failureCount < 2;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    // Add error logging for debugging
    onError: (error) => {
      console.error('Auth query error:', error);
    },
    // Add success logging for debugging
    onSuccess: (data) => {
      console.log('Auth query success:', data);
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
