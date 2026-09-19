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
  const { user, isLoading, isAuthenticated, error, isAuthRejected } = useAuth();
  const [, setLocation] = useLocation();

  // ENHANCED SECURITY: Multiple layers of authentication checks
  useEffect(() => {
    // Layer 1: Check if authentication is loading
    if (isLoading) {
      return; // Wait for authentication to complete
    }

    // Preserve a valid local session while the authoritative check is unavailable.
    if (error && !isAuthRejected) {
      return;
    }

    // Layer 2: Check if user is authenticated
    if (!isAuthenticated) {
      if (import.meta.env.DEV) {
        console.warn('[SECURITY] Unauthenticated access attempt blocked');
      }
      
      // Check localStorage as fallback
      const localUser = JSON.parse(localStorage.getItem('user') || 'null');
      if (!localUser) {
        // Clear ALL authentication data immediately
        localStorage.removeItem('user');
        localStorage.removeItem('auth-token');
        localStorage.removeItem('admin_session');
        sessionStorage.clear();
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear axios headers
        if (typeof window !== 'undefined' && (window as any).clearAuthData) {
          (window as any).clearAuthData();
        }
        
        toast({
          title: "🔒 Access Denied",
          description: "Authentication required to access admin area",
          variant: "destructive",
        });
        
        // Force redirect to login
        window.location.href = "/admin/login";
        return;
      }
    }

    // Layer 3: Verify user has valid role
    if (user && user.role !== 'admin' && user.role !== 'superadmin') {
      if (import.meta.env.DEV) {
        console.warn('[SECURITY] Invalid role access attempt blocked:', user?.role);
      }
      
      // Clear authentication data
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      sessionStorage.clear();
      
      toast({
        title: "🔒 Access Denied",
        description: "Insufficient privileges to access admin area",
        variant: "destructive",
      });
      
      window.location.href = "/admin/login";
      return;
    }

    // Layer 4: Log successful admin access (DEV only)
    if (import.meta.env.DEV) {
      console.log('[SECURITY] Admin access granted:', {
        user: user.username || user.id,
        role: user.role,
        timestamp: new Date().toISOString()
      });
    }

  }, [isAuthenticated, isLoading, user, error, isAuthRejected, toast, setLocation]);

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
