import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, Calendar, BarChart3, Settings, Crown } from "lucide-react";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";
import SimplifiedAdminDashboard from "@/components/simplified-admin-dashboard";
import ActivityManagement from "@/components/activity-management";
import AdminManagement from "@/components/admin-management";
import CEOOperationsDashboard from "@/components/ceo-operations-dashboard";

export default function SimplifiedAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bookings");

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
      } catch (error) {
        console.error('Logout error:', error);
        toast({
          title: "Logout Error",
          description: "There was an issue logging out, but you will be redirected.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Admin Dashboard - MarrakechDunes" 
        description="Simplified admin dashboard for efficient management"
      />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-moroccan-blue rounded-full flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MarrakechDunes Admin</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Role</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">{user?.role}</div>
              <p className="text-xs text-muted-foreground">
                {user?.role === 'superadmin' ? 'Full system access' : 'Admin access'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">
                Essential management tools
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">
                All systems operational
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Simplified Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${user?.role === 'superadmin' ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <TabsTrigger value="bookings" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Bookings
            </TabsTrigger>
            <TabsTrigger value="activities" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Activities
            </TabsTrigger>
            {user?.role === 'superadmin' && (
              <TabsTrigger value="admin-management" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Admin Mgmt
              </TabsTrigger>
            )}
            {user?.role === 'superadmin' && (
              <TabsTrigger value="ceo-operations" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                CEO Ops
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <SimplifiedAdminDashboard />
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <ActivityManagement />
          </TabsContent>

          {user?.role === 'superadmin' && (
            <TabsContent value="admin-management" className="space-y-4">
              <AdminManagement />
            </TabsContent>
          )}

          {user?.role === 'superadmin' && (
            <TabsContent value="ceo-operations" className="space-y-4">
              <CEOOperationsDashboard />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
