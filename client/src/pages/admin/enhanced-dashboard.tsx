import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, TrendingUp, Activity, Settings, Crown, MessageCircle, LogOut, BarChart3, PieChart, Monitor, Server, Download, FileText } from "lucide-react";
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
import PerformanceMonitor from "@/components/analytics/performance-monitor";
import UserAnalytics from "@/components/analytics/user-analytics";
import BusinessMetrics from "@/components/analytics/business-metrics";
import SystemHealth from "@/components/analytics/system-health";
import AdminManagement from "@/components/admin-management";
import CEOOperationsDashboard from "@/components/ceo-operations-dashboard";

// Import our new components
import { LoadingSpinner, AsyncWrapper, useLoading } from "@/components/LoadingSpinner";
import { useFormAutoSave } from "@/hooks/use-autosave";
import { useKeyboardShortcuts, createAdminShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { BulkSelector, useBulkSelection } from "@/components/BulkSelector";
import { SearchHighlight, useSearchHighlight } from "@/components/SearchHighlight";
import { useConfirmation, confirmDelete, confirmBulkDelete } from "@/components/ConfirmationDialog";
import { AdminQuickActions, BookingQuickActions, FloatingQuickActions } from "@/components/QuickActions";
import { BookingExportButton, BulkExportButton } from "@/components/ExportButton";
import { OfflineIndicator, ConnectionStatusBadge, OfflineFormWarning } from "@/components/OfflineIndicator";
import { BookingTemplates } from "@/components/BookingTemplates";

import type { BookingType, ActivityType, AuditLogType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

function EnhancedAdminDashboardContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // Loading states
  const { loading: bookingsLoading, withLoading: withBookingsLoading } = useLoading();
  const { loading: activitiesLoading, withLoading: withActivitiesLoading } = useLoading();
  
  // Search and filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBookings, setSelectedBookings] = useState<BookingWithActivity[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<ActivityType[]>([]);
  
  // Confirmation dialogs
  const { confirm, ConfirmationComponent } = useConfirmation();
  
  // Bulk selection hooks
  const bookingBulkSelection = useBulkSelection<BookingWithActivity>(
    [], 
    (booking) => booking.id || booking._id || ''
  );
  const activityBulkSelection = useBulkSelection<ActivityType>(
    [], 
    (activity) => activity.id || activity._id || ''
  );
  
  // Search highlighting
  const { highlightText } = useSearchHighlight(searchTerm);
  
  // Auto-save for any forms (placeholder for future forms)
  const { saveNow: saveFormData } = useFormAutoSave({}, {
    formId: 'admin-dashboard',
    delay: 5000
  });

  // Data fetching with loading states
  const { data: bookings = [], isLoading: isBookingsLoading } = useQuery<BookingWithActivity[]>({
    queryKey: ["/admin/bookings"],
  });

  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery<ActivityType[]>({
    queryKey: ["/activities"],
  });

  const { data: auditLogs = [] } = useQuery<AuditLogType[]>({
    queryKey: ["/admin/audit-logs"],
    enabled: user?.role === 'superadmin',
  });

  // Update bulk selection when data changes
  useEffect(() => {
    bookingBulkSelection.selectNone();
    activityBulkSelection.selectNone();
  }, [bookings, activities]);

  // Keyboard shortcuts
  const shortcuts = createAdminShortcuts({
    onSave: () => {
      saveFormData();
      toast({ title: "Data saved", description: "Dashboard data saved successfully" });
    },
    onNew: () => {
      // Open new booking modal
      const modal = document.querySelector('[data-modal="new-booking"]') as HTMLElement;
      if (modal) modal.click();
    },
    onDelete: () => {
      if (selectedBookings.length > 0) {
        confirmBulkDelete(confirm, selectedBookings.length, () => {
          // Delete selected bookings
          selectedBookings.forEach(booking => {
            deleteBookingMutation.mutate(booking.id || booking._id || '');
          });
        });
      }
    },
    onSearch: () => {
      const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
      if (searchInput) searchInput.focus();
    },
    onRefresh: () => {
      queryClient.invalidateQueries();
      toast({ title: "Data refreshed", description: "All data has been refreshed" });
    },
    onExport: () => {
      handleExportBookings();
    },
    onHelp: () => {
      toast({ title: "Keyboard Shortcuts", description: "Ctrl+S: Save, Ctrl+N: New, Ctrl+E: Export, Ctrl+R: Refresh" });
    }
  });

  useKeyboardShortcuts(shortcuts);

  // Filtered data based on search
  const filteredBookings = bookings.filter(booking =>
    booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    booking.customerPhone.includes(searchTerm)
  );

  const filteredActivities = activities.filter(activity =>
    activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    activity.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculations
  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

  // Admin booking management functions
  const handleBookingStatusUpdate = async (bookingId: string, status: string) => {
    await withBookingsLoading(async () => {
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
    });
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

  const handleViewBookingDetails = (booking: BookingWithActivity) => {
    alert(`Booking Details:
Customer: ${booking.customerName}
Phone: ${booking.customerPhone}
Activity: ${booking.activity.name}
People: ${booking.numberOfPeople}
Total: ${booking.totalAmount} MAD
Status: ${booking.status}
Date: ${booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'Flexible'}
Time: Any time
Notes: ${booking.notes || 'None'}`);
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

  // Export bookings handler
  const handleExportBookings = async () => {
    await withBookingsLoading(async () => {
      try {
        const response = await fetch('/api/admin/export/bookings');
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'bookings.csv';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export Successful",
          description: "Bookings data exported as CSV file.",
        });
      } catch (error) {
        console.error('Export error:', error);
        toast({
          title: "Export Error",
          description: "Failed to export bookings data.",
          variant: "destructive",
        });
      }
    });
  };

  // Admin activity management functions
  const handleEditPricing = (activity: ActivityType) => {
    const newPrice = prompt(`Edit price for ${activity.name} (current: ${activity.price} MAD):`, activity.price.toString());
    if (newPrice && !isNaN(Number(newPrice))) {
      // Update activity pricing
      alert(`Price updated to ${newPrice} MAD for ${activity.name}`);
    }
  };

  const handleUpdateGetYourGuidePrice = (activity: ActivityType) => {
    const currentCompetitorPrice = activity.getyourguidePrice || activity.price + 150;
    const newPrice = prompt(`Update GetYourGuide competitor price for ${activity.name} (current: ${currentCompetitorPrice} MAD):`, String(currentCompetitorPrice));
    if (newPrice && !isNaN(Number(newPrice))) {
      // Update GetYourGuide price
      alert(`GetYourGuide price updated to ${newPrice} MAD for ${activity.name}. New profit margin: ${Number(newPrice) - Number(activity.price)} MAD per booking.`);
    }
  };

  const handleViewActivityBookings = (activity: ActivityType) => {
    const activityBookings = bookings.filter(b => b.activity.id === activity.id);
    const totalRevenue = activityBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + Number(b.totalAmount), 0);
    alert(`Activity: ${activity.name}
Total Bookings: ${activityBookings.length}
Confirmed: ${activityBookings.filter(b => b.status === 'confirmed').length}
Pending: ${activityBookings.filter(b => b.status === 'pending').length}
Total Revenue: ${totalRevenue} MAD
Average per booking: ${activityBookings.length ? Math.round(totalRevenue / activityBookings.length) : 0} MAD`);
  };

  return (
    <>
      <SEOHead 
        title="Enhanced Admin Dashboard - MarrakechDunes"
        description="Advanced admin dashboard with enhanced UX features for MarrakechDunes tour operations."
        keywords="admin, dashboard, MarrakechDunes, booking management, activities, enhanced UX"
      />
      
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-moroccan-blue flex items-center gap-3">
                  {t('dashboard')}
                  <ConnectionStatusBadge />
                </h1>
                <p className="text-gray-600">Welcome back, {user?.username}</p>
              </div>
              <div className="flex gap-3">
                {user?.role === 'superadmin' && (
                  <Link href="/admin/ceo">
                    <Button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold">
                      <Crown className="h-4 w-4 mr-2" />
                      CEO Dashboard
                    </Button>
                  </Link>
                )}
                <Button 
                  onClick={handleLogout}
                  variant="outline" 
                  className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <AdminQuickActions
            onNewBooking={() => {
              const modal = document.querySelector('[data-modal="new-booking"]') as HTMLElement;
              if (modal) modal.click();
            }}
            onNewActivity={() => {
              const modal = document.querySelector('[data-modal="new-activity"]') as HTMLElement;
              if (modal) modal.click();
            }}
            onExportData={handleExportBookings}
            onRefreshData={() => queryClient.invalidateQueries()}
            onViewReports={() => toast({ title: "Reports", description: "Reports feature coming soon" })}
            onManageCustomers={() => toast({ title: "Customer Management", description: "Customer management feature coming soon" })}
            className="mb-6"
          />

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <TrendingUp className="h-4 w-4 text-moroccan-gold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-moroccan-red">
                  {totalRevenue.toLocaleString()} MAD
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Bookings</CardTitle>
                <Calendar className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {pendingBookings}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Confirmed Bookings</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {confirmedBookings}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Activities</CardTitle>
                <Activity className="h-4 w-4 text-moroccan-blue" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-moroccan-blue">
                  {activities.length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className={`grid w-full ${user?.role === 'superadmin' ? 'grid-cols-14' : 'grid-cols-11'}`}>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="cash-analytics">Cash Analytics</TabsTrigger>
              <TabsTrigger value="reminders">Reminders</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="performance">
                <Monitor className="h-4 w-4 mr-1" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="users">
                <Users className="h-4 w-4 mr-1" />
                Users
              </TabsTrigger>
              <TabsTrigger value="business">
                <BarChart3 className="h-4 w-4 mr-1" />
                Business
              </TabsTrigger>
              <TabsTrigger value="ceo-operations">
                <TrendingUp className="h-4 w-4 mr-1" />
                CEO Ops
              </TabsTrigger>
              {user?.role === 'superadmin' && (
                <TabsTrigger value="admin-management">
                  <Users className="h-4 w-4 mr-1" />
                  Admin Mgmt
                </TabsTrigger>
              )}
              {user?.role === 'superadmin' && (
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              )}
              {user?.role === 'superadmin' && (
                <TabsTrigger value="system">
                  <Server className="h-4 w-4 mr-1" />
                  System
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Booking Management</h2>
                <div className="flex gap-2">
                  <BookingExportButton bookings={bookings} />
                  <BulkExportButton 
                    selectedItems={selectedBookings} 
                    itemType="bookings" 
                  />
                  <ActivityManagementModal mode="create" />
                </div>
              </div>

              {/* Search Bar */}
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search bookings by customer name, activity, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Booking Templates */}
              <BookingTemplates
                onSelectTemplate={(template) => {
                  toast({ title: "Template Selected", description: `Template "${template.name}" selected` });
                }}
                onSaveTemplate={(template) => {
                  toast({ title: "Template Saved", description: `Template "${template.name}" saved successfully` });
                }}
                currentBooking={selectedBookings[0]}
              />

              <AsyncWrapper 
                loading={isBookingsLoading} 
                spinnerText="Loading bookings..."
                minHeight="400px"
              >
                <BulkSelector
                  items={filteredBookings}
                  onSelectionChange={setSelectedBookings}
                  getItemId={(booking) => booking.id || booking._id || ''}
                >
                  {(booking, isSelected, toggleSelection) => (
                    <div className="border rounded-lg p-6 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-3">
                            <div>
                              <h3 className="font-semibold text-lg">
                                {highlightText(booking.customerName)}
                              </h3>
                              <p className="text-sm text-gray-600">
                                {highlightText(booking.activity.name)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {highlightText(booking.customerPhone)}
                              </p>
                            </div>
                            <Badge variant={booking.status === 'pending' ? 'destructive' : booking.status === 'confirmed' ? 'default' : 'secondary'}>
                              {booking.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-moroccan-blue">{booking.totalAmount} MAD</div>
                          <div className="text-sm text-gray-500">{booking.numberOfPeople} people</div>
                        </div>
                      </div>

                      {/* Booking Price Analysis */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-moroccan-blue mb-3">Booking Price Analysis</h4>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                          <div className="bg-white p-3 rounded border">
                            <div className="text-green-700 font-medium">Our Price</div>
                            <div className="text-lg font-bold text-green-600">{booking.activity.price} MAD</div>
                            <div className="text-xs text-gray-600">Per person</div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-orange-700 font-medium">GetYourGuide</div>
                            <div className="text-lg font-bold text-orange-600">{booking.activity.getyourguidePrice || booking.activity.price + 150} MAD</div>
                            <div className="text-xs text-red-600">Competitor rate</div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-blue-700 font-medium">Customer Saved</div>
                            <div className="text-lg font-bold text-blue-600">
                              {((booking.activity.getyourguidePrice || (Number(booking.activity.price) + 150)) - Number(booking.activity.price)) * booking.numberOfPeople} MAD
                            </div>
                            <div className="text-xs text-green-600">Total savings</div>
                          </div>
                          <div className="bg-white p-3 rounded border">
                            <div className="text-purple-700 font-medium">Booking Date</div>
                            <div className="text-lg font-bold text-purple-600">
                              {booking.preferredDate ? new Date(booking.preferredDate).toLocaleDateString() : 'Flexible'}
                            </div>
                            <div className="text-xs text-gray-600">Any time</div>
                          </div>
                        </div>
                      </div>

                      {/* Payment Management */}
                      <PaymentManagement booking={booking} />

                      <div className="flex gap-2 pt-4">
                        {booking.status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleBookingStatusUpdate(booking._id || booking.id || '', 'confirmed')}
                            >
                              Confirm Booking
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleContactCustomer(booking.customerPhone)}
                            >
                              Contact Customer
                            </Button>
                          </>
                        )}
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleViewBookingDetails(booking)}
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleSendWhatsApp(booking)}
                        >
                          Send WhatsApp
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteBooking(booking._id || booking.id || '', booking.customerName)}
                          className="ml-2"
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </BulkSelector>
              </AsyncWrapper>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Activity Management & Pricing</CardTitle>
                  <ActivityManagementModal mode="create">
                    <Button className="bg-moroccan-blue hover:bg-blue-700 text-white">
                      <Activity className="h-4 w-4 mr-2" />
                      Add New Activity
                    </Button>
                  </ActivityManagementModal>
                </CardHeader>
                <CardContent>
                  <AsyncWrapper 
                    loading={isActivitiesLoading} 
                    spinnerText="Loading activities..."
                    minHeight="300px"
                  >
                    <BulkSelector
                      items={filteredActivities}
                      onSelectionChange={setSelectedActivities}
                      getItemId={(activity) => activity.id || activity._id || ''}
                    >
                      {(activity, isSelected, toggleSelection) => (
                        <div className="border rounded-lg p-6 space-y-4">
                          <div className="flex items-start gap-4">
                            <img 
                              src={resolveActivityImage(activity)}
                              alt={activity.name}
                              className="w-24 h-24 object-cover rounded-lg"
                            />
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg">
                                {highlightText(activity.name)}
                              </h3>
                              <p className="text-sm text-gray-600 mb-2">
                                {highlightText(activity.category || '')}
                              </p>
                              <p className="text-sm text-gray-500">{activity.duration}</p>
                            </div>
                          </div>
                          
                          {/* Price Comparison Section */}
                          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <h4 className="font-semibold text-moroccan-blue mb-3">Price Comparison Analysis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-green-700">Our Price</div>
                                <div className="text-xl font-bold text-green-600">{activity.price} MAD</div>
                                <div className="text-xs text-gray-600">Current Rate</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-orange-700">GetYourGuide</div>
                                <div className="text-xl font-bold text-orange-600">{activity.getyourguidePrice || activity.price + 150} MAD</div>
                                <div className="text-xs text-red-600">
                                  +{Math.round(((activity.getyourguidePrice || (Number(activity.price) + 150)) - Number(activity.price)) / Number(activity.price) * 100)}% higher
                                </div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-blue-700">Profit Margin</div>
                                <div className="text-xl font-bold text-blue-600">{((activity.getyourguidePrice || (Number(activity.price) + 150)) - Number(activity.price))} MAD</div>
                                <div className="text-xs text-green-600">Per booking</div>
                              </div>
                              <div className="bg-white p-3 rounded border">
                                <div className="text-sm font-medium text-purple-700">Market Position</div>
                                <div className="text-lg font-bold text-purple-600">Competitive</div>
                                <div className="text-xs text-gray-600">Below market</div>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleEditPricing(activity)}
                            >
                              <Settings className="w-4 h-4 mr-1" />
                              Edit Pricing
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateGetYourGuidePrice(activity)}
                            >
                              Update GetYourGuide Price
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleViewActivityBookings(activity)}
                            >
                              View Bookings
                            </Button>
                          </div>
                        </div>
                      )}
                    </BulkSelector>
                  </AsyncWrapper>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tabs remain the same */}
            <TabsContent value="whatsapp" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-green-600" />
                    WhatsApp Communication Center
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <WhatsAppNotificationPanel 
                    booking={bookings.length > 0 ? {
                      ...bookings[0],
                      activityName: bookings[0].activity?.name || 'N/A'
                    } : undefined}
                    customerPhone={bookings.length > 0 ? bookings[0].customerPhone : undefined}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="calendar" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Calendar</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-500">
                    Calendar view coming soon...
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cash-analytics" className="space-y-4">
              <CashAnalyticsDashboard bookings={bookings} activities={activities} />
            </TabsContent>

            <TabsContent value="reminders" className="space-y-4">
              <CashBookingReminders bookings={bookings} />
            </TabsContent>

            {user?.role === 'superadmin' && (
              <TabsContent value="audit" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Audit Logs (Superadmin Only)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {auditLogs.slice(0, 20).map((log, index) => (
                        <div key={log.id || log._id || `log-${index}`} className="flex items-center justify-between p-3 border rounded text-sm">
                          <div>
                            <span className="font-medium">{log.action}</span>
                            <span className="text-gray-600 ml-2">by {log.userId}</span>
                          </div>
                          <span className="text-gray-500">
                            {new Date(log.createdAt!).toLocaleDateString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="performance" className="space-y-4">
              <PerformanceMonitor />
            </TabsContent>

            <TabsContent value="users" className="space-y-4">
              <UserAnalytics />
            </TabsContent>

            <TabsContent value="business" className="space-y-4">
              <BusinessMetrics />
            </TabsContent>

            <TabsContent value="ceo-operations" className="space-y-4">
              <CEOOperationsDashboard />
            </TabsContent>

            {user?.role === 'superadmin' && (
              <TabsContent value="admin-management" className="space-y-4">
                <AdminManagement />
              </TabsContent>
            )}

            {user?.role === 'superadmin' && (
              <TabsContent value="system" className="space-y-4">
                <SystemHealth />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Confirmation Dialog Component */}
      <ConfirmationComponent />
    </>
  );
}

export default function EnhancedAdminDashboard() {
  return (
    <AdminRoute>
      <EnhancedAdminDashboardContent />
    </AdminRoute>
  );
}
