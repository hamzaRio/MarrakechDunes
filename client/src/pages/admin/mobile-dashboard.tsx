import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, TrendingUp, Activity, Settings, Crown, MessageCircle, LogOut, BarChart3, Menu, Search, Download, RefreshCw } from "lucide-react";
import AdminRoute from "@/components/admin-route";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { getActivityFallbackImage } from "@/lib/image-utils";
import { ensureArray, getAssetUrl } from "@/lib/utils";
import PaymentManagement from "@/components/payment-management";
import { WhatsAppNotificationPanel } from "@/components/whatsapp-notification-panel";
import ActivityManagementModal from "@/components/activity-management-modal";
import CashAnalyticsDashboard from "@/components/cash-analytics-dashboard";
import CashBookingReminders from "@/components/cash-booking-reminders";
import { apiFetch, logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";

// Import our enhanced components
import { LoadingSpinner, AsyncWrapper, useLoading } from "@/components/LoadingSpinner";
import { useKeyboardShortcuts, createAdminShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { AdminQuickActions, FloatingQuickActions } from "@/components/QuickActions";
import { OfflineIndicator, ConnectionStatusBadge, OfflineFormWarning } from "@/components/OfflineIndicator";
import { useConfirmation, confirmDelete } from "@/components/ConfirmationDialog";
import { BookingExportButton, BulkExportButton } from "@/components/ExportButton";
import { SearchHighlight, useSearchHighlight } from "@/components/SearchHighlight";
import { BulkSelector, useBulkSelection } from "@/components/BulkSelector";

import type { BookingType, ActivityType, AuditLogType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

function MobileAdminDashboardContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Mobile-specific state
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookings, setSelectedBookings] = useState<BookingWithActivity[]>([]);
  
  // Loading states
  const { loading: isRefreshing, withLoading: withRefresh } = useLoading();
  
  // Confirmation dialogs
  const { confirm, ConfirmationComponent } = useConfirmation();
  
  // Bulk selection
  const bookingBulkSelection = useBulkSelection<BookingWithActivity>(
    [], 
    (booking) => booking.id || booking._id || ''
  );
  
  // Search highlighting
  const { highlightText } = useSearchHighlight(searchTerm);

  // Data fetching
  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery<BookingWithActivity[]>({
    queryKey: ["/admin/bookings"],
  });

  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery<ActivityType[]>({
    queryKey: ["/activities"],
  });

  // Mobile-optimized keyboard shortcuts
  const shortcuts = createAdminShortcuts({
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    onRefresh: () => {
      withRefresh(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        queryClient.invalidateQueries();
        toast({ title: "Data refreshed", description: "All data has been refreshed" });
      });
    },
    onHelp: () => {
      toast({ 
        title: "Mobile Shortcuts", 
        description: "Swipe left/right to navigate, tap and hold for options" 
      });
    }
  });

  useKeyboardShortcuts(shortcuts);

  // Filtered data
  const filteredBookings = bookings.filter(booking =>
    booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customerPhone.includes(searchTerm)
  );

  // Calculations
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

  // Admin booking management functions
  const handleBookingStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await apiFetch(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      toast({ title: "Status Updated", description: `Booking status updated to ${status}` });
    } catch (error) {
      console.error('Failed to update booking status:', error);
      toast({ title: "Update Failed", description: "Failed to update booking status", variant: "destructive" });
    }
  };

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      const res = await apiFetch(`/admin/bookings/${bookingId}`, {
        method: "DELETE"
      });
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      toast({
        title: "Booking Deleted",
        description: "Booking has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Deletion Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteBooking = (bookingId: string, customerName: string) => {
    confirmDelete(confirm, customerName, () => {
      deleteBookingMutation.mutate(bookingId);
    });
  };

  const handleContactCustomer = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  const handleSendWhatsApp = (booking: BookingWithActivity) => {
    const message = `Hello ${booking.customerName}, regarding your booking for ${booking.activity.name} for ${booking.numberOfPeople} people. Status: ${booking.status}. Total: ${booking.totalAmount} MAD.`;
    const phone = booking.customerPhone.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const resolveActivityImage = (activity: ActivityType) => {
    const sources = ensureArray(activity.imageUrls);
    const legacyPhotos = ensureArray((activity as any).photos);
    if (sources.length === 0 && legacyPhotos.length > 0) {
      sources.push(...legacyPhotos);
    }
    const legacyImage = (activity as any).image;
    if (sources.length === 0 && typeof legacyImage === 'string' && legacyImage) {
      sources.push(legacyImage);
    }
    const primary = sources[0];
    return primary ? getAssetUrl(primary) : getActivityFallbackImage(activity.name);
  };

  // Logout handler
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

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="Mobile Admin Dashboard - MarrakechDunes"
        description="Mobile-optimized admin dashboard for MarrakechDunes tour operations."
        keywords="admin, dashboard, mobile, MarrakechDunes, booking management"
      />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Mobile Header */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2"
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-moroccan-blue flex items-center gap-2">
                  Admin
                  <ConnectionStatusBadge />
                </h1>
                <p className="text-xs text-gray-600">{user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => withRefresh(async () => {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  queryClient.invalidateQueries();
                })}
                disabled={isRefreshing}
                variant="ghost"
                size="sm"
                className="p-2"
              >
                {isRefreshing ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button onClick={handleLogout} variant="ghost" size="sm" className="p-2">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Mobile Stats Cards */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Revenue</p>
                <p className="text-lg font-bold text-moroccan-red">
                  {totalRevenue.toLocaleString()} MAD
                </p>
              </div>
              <TrendingUp className="h-4 w-4 text-moroccan-gold" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Pending</p>
                <p className="text-lg font-bold text-orange-600">
                  {pendingBookings}
                </p>
              </div>
              <Calendar className="h-4 w-4 text-orange-500" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Confirmed</p>
                <p className="text-lg font-bold text-green-600">
                  {confirmedBookings}
                </p>
              </div>
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </Card>

          <Card className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Activities</p>
                <p className="text-lg font-bold text-moroccan-blue">
                  {activities.length}
                </p>
              </div>
              <Activity className="h-4 w-4 text-moroccan-blue" />
            </div>
          </Card>
        </div>

        {/* Mobile Quick Actions */}
        <div className="flex gap-2 mb-4 overflow-x-auto">
          <Button size="sm" className="bg-blue-600 text-white whitespace-nowrap">
            <Calendar className="h-4 w-4 mr-1" />
            New Booking
          </Button>
          <Button size="sm" variant="outline" className="whitespace-nowrap">
            <Activity className="h-4 w-4 mr-1" />
            New Activity
          </Button>
          <Button size="sm" variant="outline" className="whitespace-nowrap">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {/* Mobile Bookings List */}
      <div className="px-4">
        <h2 className="text-lg font-semibold mb-3">Recent Bookings</h2>
        
        <AsyncWrapper 
          loading={isBookingsLoading} 
          spinnerText="Loading bookings..."
          minHeight="200px"
        >
          <div className="space-y-3">
            {filteredBookings.slice(0, 10).map((booking, index) => (
              <Card key={booking.id || booking._id || `booking-${index}`} className="p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-sm">
                        {highlightText(booking.customerName)}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {highlightText(booking.activity.name)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {highlightText(booking.customerPhone)}
                      </p>
                    </div>
                    <Badge 
                      variant={booking.status === 'pending' ? 'destructive' : booking.status === 'confirmed' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-moroccan-blue">
                        {booking.totalAmount} MAD
                      </p>
                      <p className="text-xs text-gray-500">
                        {booking.numberOfPeople} people
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {booking.status === 'pending' && (
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-xs px-2 py-1"
                          onClick={() => handleBookingStatusUpdate(booking._id || booking.id || '', 'confirmed')}
                        >
                          Confirm
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        onClick={() => handleContactCustomer(booking.customerPhone)}
                      >
                        Contact
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs px-2 py-1"
                        onClick={() => handleSendWhatsApp(booking)}
                      >
                        WhatsApp
                      </Button>
                    </div>
                  </div>

                  {/* Mobile Payment Management */}
                  <div className="border-t pt-2">
                    <PaymentManagement booking={booking} />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </AsyncWrapper>
      </div>

      {/* Mobile Floating Actions */}
      <FloatingQuickActions
        actions={[
          {
            id: 'new-booking',
            label: 'New Booking',
            icon: '📝',
            action: () => toast({ title: "New Booking", description: "New booking feature coming soon" }),
            variant: 'primary'
          },
          {
            id: 'new-activity',
            label: 'New Activity',
            icon: '🎯',
            action: () => toast({ title: "New Activity", description: "New activity feature coming soon" }),
            variant: 'success'
          },
          {
            id: 'export-data',
            label: 'Export Data',
            icon: '📊',
            action: () => toast({ title: "Export", description: "Export feature coming soon" }),
            variant: 'secondary'
          },
          {
            id: 'refresh-data',
            label: 'Refresh',
            icon: '🔄',
            action: () => {
              withRefresh(async () => {
                await new Promise(resolve => setTimeout(resolve, 1000));
                queryClient.invalidateQueries();
              });
            },
            variant: 'secondary'
          }
        ]}
        position="bottom-right"
        isOpen={false}
        onToggle={() => {}}
      />

      {/* Confirmation Dialog Component */}
      <ConfirmationComponent />
    </div>
  );
}

export default function MobileAdminDashboard() {
  return (
    <AdminRoute>
      <MobileAdminDashboardContent />
    </AdminRoute>
  );
}
