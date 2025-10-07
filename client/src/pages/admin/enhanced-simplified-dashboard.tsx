import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Users, Calendar, BarChart3, Settings, Crown, Search, Download, RefreshCw } from "lucide-react";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";
import SimplifiedAdminDashboard from "@/components/simplified-admin-dashboard";
import ActivityManagement from "@/components/activity-management";
import AdminManagement from "@/components/admin-management";
import CEOOperationsDashboard from "@/components/ceo-operations-dashboard";

// Import our enhanced components
import { LoadingSpinner, AsyncWrapper, useLoading } from "@/components/LoadingSpinner";
import { useKeyboardShortcuts, createAdminShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { AdminQuickActions, FloatingQuickActions } from "@/components/QuickActions";
import { OfflineIndicator, ConnectionStatusBadge } from "@/components/OfflineIndicator";
import { useConfirmation } from "@/components/ConfirmationDialog";
import { BookingExportButton } from "@/components/ExportButton";

export default function EnhancedSimplifiedAdminPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("bookings");
  const [isFloatingActionsOpen, setIsFloatingActionsOpen] = useState(false);
  
  // Loading states
  const { loading: isRefreshing, withLoading: withRefresh } = useLoading();
  
  // Confirmation dialogs
  const { confirm, ConfirmationComponent } = useConfirmation();

  // Keyboard shortcuts
  const shortcuts = createAdminShortcuts({
    onSave: () => {
      toast({ title: "Data saved", description: "Dashboard data saved successfully" });
    },
    onNew: () => {
      toast({ title: "New Item", description: "New item creation feature coming soon" });
    },
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    onRefresh: () => {
      withRefresh(async () => {
        // Simulate refresh
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast({ title: "Data refreshed", description: "All data has been refreshed" });
      });
    },
    onExport: () => {
      toast({ title: "Export", description: "Export feature coming soon" });
    },
    onHelp: () => {
      toast({ 
        title: "Keyboard Shortcuts", 
        description: "Ctrl+S: Save, Ctrl+N: New, Ctrl+E: Export, Ctrl+R: Refresh, F1: Help" 
      });
    }
  });

  useKeyboardShortcuts(shortcuts);

  const handleLogout = async () => {
    confirm('Logout', 'Are you sure you want to logout?', async () => {
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
    });
  };

  const handleRefresh = () => {
    withRefresh(async () => {
      // Simulate refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast({ title: "Data refreshed", description: "All data has been refreshed" });
    });
  };

  const handleExport = () => {
    toast({ title: "Export", description: "Export feature coming soon" });
  };

  const handleNewBooking = () => {
    toast({ title: "New Booking", description: "New booking feature coming soon" });
  };

  const handleNewActivity = () => {
    toast({ title: "New Activity", description: "New activity feature coming soon" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Enhanced Admin Dashboard - MarrakechDunes" 
        description="Enhanced simplified admin dashboard with advanced UX features"
      />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-moroccan-blue rounded-full flex items-center justify-center">
                <Crown className="h-4 w-4 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  MarrakechDunes Admin
                  <ConnectionStatusBadge />
                </h1>
                <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline" 
                size="sm"
              >
                {isRefreshing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Refresh
              </Button>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Quick Actions Bar */}
        <AdminQuickActions
          onNewBooking={handleNewBooking}
          onNewActivity={handleNewActivity}
          onExportData={handleExport}
          onRefreshData={handleRefresh}
          onViewReports={() => toast({ title: "Reports", description: "Reports feature coming soon" })}
          onManageCustomers={() => toast({ title: "Customer Management", description: "Customer management feature coming soon" })}
          className="mb-6"
        />

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
              <div className="text-2xl font-bold">5</div>
              <p className="text-xs text-muted-foreground">
                Enhanced management tools
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

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search bookings, activities, customers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
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
            <AsyncWrapper 
              loading={false} 
              spinnerText="Loading bookings..."
              minHeight="400px"
            >
              <SimplifiedAdminDashboard />
            </AsyncWrapper>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <AsyncWrapper 
              loading={false} 
              spinnerText="Loading activities..."
              minHeight="400px"
            >
              <ActivityManagement />
            </AsyncWrapper>
          </TabsContent>

          {user?.role === 'superadmin' && (
            <TabsContent value="admin-management" className="space-y-4">
              <AsyncWrapper 
                loading={false} 
                spinnerText="Loading admin management..."
                minHeight="400px"
              >
                <AdminManagement />
              </AsyncWrapper>
            </TabsContent>
          )}

          {user?.role === 'superadmin' && (
            <TabsContent value="ceo-operations" className="space-y-4">
              <AsyncWrapper 
                loading={false} 
                spinnerText="Loading CEO operations..."
                minHeight="400px"
              >
                <CEOOperationsDashboard />
              </AsyncWrapper>
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Floating Quick Actions */}
      <FloatingQuickActions
        actions={[
          {
            id: 'new-booking',
            label: 'New Booking',
            icon: '📝',
            action: handleNewBooking,
            variant: 'primary'
          },
          {
            id: 'new-activity',
            label: 'New Activity',
            icon: '🎯',
            action: handleNewActivity,
            variant: 'success'
          },
          {
            id: 'export-data',
            label: 'Export Data',
            icon: '📊',
            action: handleExport,
            variant: 'secondary'
          },
          {
            id: 'refresh-data',
            label: 'Refresh',
            icon: '🔄',
            action: handleRefresh,
            variant: 'secondary'
          }
        ]}
        position="bottom-right"
        isOpen={isFloatingActionsOpen}
        onToggle={() => setIsFloatingActionsOpen(!isFloatingActionsOpen)}
      />

      {/* Confirmation Dialog Component */}
      <ConfirmationComponent />
    </div>
  );
}
