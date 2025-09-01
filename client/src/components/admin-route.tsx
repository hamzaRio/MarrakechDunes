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

  // Redirect to login if not authenticated with enhanced session checking
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Clear any stale session data
      localStorage.removeItem('admin_session');
      sessionStorage.clear();
      
      toast({
        title: "Authentication Required",
        description: "Please log in to access the admin area",
        variant: "destructive",
      });
      setTimeout(() => {
        setLocation("/admin/login");
      }, 500);
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