import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AdminRouteProps {
  children: React.ReactNode;
  requireSuperAdmin?: boolean;
}

export default function AdminRoute({ children, requireSuperAdmin = false }: AdminRouteProps) {
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  // SECURITY FIX: Immediate redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Clear all authentication data immediately
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      localStorage.removeItem('admin_session');
      sessionStorage.clear();
      
      // Clear all cookies
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      });
      
      console.warn('[AUTH] Unauthenticated access blocked, redirecting to login');
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin area",
        variant: "destructive",
      });
      // Immediate redirect without delay
      setLocation("/admin/login");
      return;
    }
  }, [isAuthenticated, isLoading, toast, setLocation]);

  // Check for superadmin requirement
  useEffect(() => {
    if (!isLoading && isAuthenticated && requireSuperAdmin && user?.role !== 'superadmin') {
      toast({
        title: "Access Denied",
        description: "This area requires superadmin privileges",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/admin");
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, requireSuperAdmin, toast, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (requireSuperAdmin && user?.role !== 'superadmin') {
    return null;
  }

  return <>{children}</>;
}