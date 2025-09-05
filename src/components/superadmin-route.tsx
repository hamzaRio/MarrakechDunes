import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Loader2, Crown, Shield } from "lucide-react";

interface SuperAdminRouteProps {
  children: React.ReactNode;
}

export default function SuperAdminRoute({ children }: SuperAdminRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && (!user || user.role !== 'superadmin')) {
      setLocation('/admin/login');
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-moroccan-blue mx-auto mb-4" />
          <p className="text-gray-600">Verifying superadmin access...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'superadmin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            This area requires superadmin privileges. Only CEO-level access is permitted.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <Crown className="h-4 w-4" />
            <span>Superadmin Only</span>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}