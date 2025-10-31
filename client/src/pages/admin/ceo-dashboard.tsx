import AdminRoute from "@/components/admin-route";
import CEOOperationsDashboard from "@/components/ceo-operations-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, LogOut } from "lucide-react";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export default function CEODashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Only superadmin can access
  if (user && user.role !== 'superadmin') {
    setLocation('/admin/dashboard');
    return null;
  }

  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
      try {
        await logout();
        toast({
          title: "Déconnecté",
          description: "Vous avez été déconnecté avec succès.",
        });
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      } catch (error) {
        console.error('Logout error:', error);
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      }
    }
  };

  return (
    <AdminRoute requireSuperAdmin={true}>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white border-b shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-moroccan-blue">👑 Tableau de Bord CEO</h1>
                <p className="text-gray-600">Bienvenue, {user?.username} 👋</p>
                <p className="text-sm text-gray-500 mt-1">
                  Tableau de bord opérationnel pour la direction - Analyse approfondie des performances et de la stratégie
                </p>
              </div>
              <div className="flex gap-3">
                <Link href="/">
                  <Button variant="outline" className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white">
                    <Home className="h-4 w-4 mr-2" />
                    Retour à l'Accueil
                  </Button>
                </Link>
                <Link href="/admin/dashboard">
                  <Button variant="outline" className="border-gray-500 text-gray-500 hover:bg-gray-500 hover:text-white">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Retour au Dashboard
                  </Button>
                </Link>
                <Button onClick={handleLogout} variant="outline" className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white">
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto p-6">
          <CEOOperationsDashboard />
        </div>
      </div>
    </AdminRoute>
  );
}
