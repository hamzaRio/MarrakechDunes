import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, TrendingUp, Crown, MessageCircle, LogOut, Download, FileText, Mail, Settings } from "lucide-react";
import AdminRoute from "@/components/admin-route";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { getActivityFallbackImage } from "@/lib/image-utils";
import { ensureArray, getAssetUrl } from "@/lib/utils";
import PaymentManagement from "@/components/payment-management";
import { WhatsAppNotificationPanel } from "@/components/whatsapp-notification-panel";
import ActivityManagementModal from "@/components/activity-management-modal";
// Removed duplicate cash analytics dashboard import
import CashBookingReminders from "@/components/cash-booking-reminders";
import EmailModal from "@/components/EmailModal";
import { apiFetch, logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";
import PerformanceMonitor from "@/components/analytics/performance-monitor";
import UserAnalytics from "@/components/analytics/user-analytics";
import BusinessMetrics from "@/components/analytics/business-metrics";
import SystemHealth from "@/components/analytics/system-health";
import AdminManagement from "@/components/admin-management";
import CEOOperationsDashboard from "@/components/ceo-operations-dashboard";
// Removed duplicate market intelligence dashboard import

// Removed useState import as no longer needed
import type { BookingType, ActivityType, AuditLogType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

function AdminDashboardContent() {
  const { user } = useAuth();
  // const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const { data: bookings = [] } = useQuery<BookingWithActivity[]>({
    queryKey: ["/admin/bookings"],
  });

  const { data: activities = [] } = useQuery<ActivityType[]>({
    queryKey: ["/activities"],
  });

  const { data: auditLogs = [] } = useQuery<AuditLogType[]>({
    queryKey: ["/admin/audit-logs"],
    enabled: user?.role === 'superadmin',
  });

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed' as any)
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const pendingBookings = bookings.filter(b => b.status === 'pending' as any).length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' as any).length;

  // Admin booking management functions
  const handleBookingStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await apiFetch(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        // headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      // Refresh bookings data using React Query
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
    } catch (error) {
      console.error('Failed to update booking status:', error);
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
    if (confirm(`Are you sure you want to delete the booking for ${customerName}? This action cannot be undone.`)) {
      deleteBookingMutation.mutate(bookingId);
    }
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
      sources.push(...(legacyPhotos as string[]));
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

  // Export bookings handler
  const handleExportBookings = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://marrakechdunes-sppy.onrender.com/api';
      const response = await fetch(`${apiBaseUrl}/admin/export/bookings`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Bookings exported as CSV with improved structure.",
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export bookings data.",
        variant: "destructive",
      });
    }
  };

  // Export bookings PDF handler
  const handleExportBookingsPDF = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://marrakechdunes-sppy.onrender.com/api';
      const response = await fetch(`${apiBaseUrl}/admin/export/bookings/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bookings-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Bookings report exported as PDF with professional layout.",
      });
    } catch (error) {
      console.error('Export PDF error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export bookings PDF.",
        variant: "destructive",
      });
    }
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
    const totalRevenue = activityBookings.filter(b => b.status === 'confirmed' as any).reduce((sum, b) => sum + Number(b.totalAmount), 0);
    alert(`Activity: ${activity.name}
Total Bookings: ${activityBookings.length}
Confirmed: ${activityBookings.filter(b => b.status === 'confirmed' as any).length}
Pending: ${activityBookings.filter(b => b.status === 'pending' as any).length}
Total Revenue: ${totalRevenue} MAD
Average per booking: ${activityBookings.length ? Math.round(totalRevenue / activityBookings.length) : 0} MAD`);
  };

  return (
    <>
      <SEOHead 
        title="Tableau de Bord Admin - MarrakechDunes"
        description="Gérez les réservations, activités et analyses pour les opérations touristiques MarrakechDunes."
        keywords="admin, tableau de bord, MarrakechDunes, gestion réservations, activités"
      />
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                        <h1 className="text-3xl font-bold text-moroccan-blue">🏛️ Tableau de Bord Administrateur</h1>
                        <p className="text-gray-600">Bienvenue, {user?.username} 👋</p>
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

                  {/* Cartes de Statistiques - Simplifiées */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-green-700 flex items-center gap-2">
                          💰 Revenus Totaux
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-green-900">
                          {totalRevenue.toLocaleString()} MAD
                        </div>
                        <p className="text-xs text-green-600 mt-1">Chiffre d'affaires</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                          ⏳ Réservations en Attente
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-orange-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-orange-900">
                          {pendingBookings}
                        </div>
                        <p className="text-xs text-orange-600 mt-1">En cours de traitement</p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-blue-700 flex items-center gap-2">
                          ✅ Réservations Confirmées
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-600" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold text-blue-900">
                          {confirmedBookings}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Clients satisfaits</p>
                      </CardContent>
                    </Card>
                  </div>

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white border-2 border-gray-200">
              <TabsTrigger value="bookings" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">📋 Réservations</TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">🎯 Activités</TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">💬 WhatsApp</TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">📊 Rapports</TabsTrigger>
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-moroccan-blue flex items-center gap-2">
                  📋 Gestion des Réservations
                </h2>
                <div className="flex gap-2">
                  <Button 
                    onClick={handleExportBookings} 
                    variant="outline" 
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    📊 Exporter CSV
                  </Button>
                  <Button 
                    onClick={handleExportBookingsPDF} 
                    variant="outline" 
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    📄 Exporter PDF
                  </Button>
                  <ActivityManagementModal mode="create" />
                </div>
              </div>



              <Card>
                <CardHeader>
                  <CardTitle>All Bookings with Price Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {bookings.slice(0, 10).map((booking, index) => (
                      <div key={booking.id || booking._id || `booking-${index}`} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{booking.customerName}</h3>
                                <p className="text-sm text-gray-600">{booking.activity.name}</p>
                                <p className="text-sm text-gray-500">{booking.customerPhone}</p>
                              </div>
                              <Badge variant={booking.status === 'pending' as any ? 'destructive' : booking.status === 'confirmed' as any ? 'default' : 'secondary'}>
                                {booking.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-moroccan-blue">{booking.totalAmount} MAD</div>
                            <div className="text-sm text-gray-500">{booking.numberOfPeople} people</div>
                          </div>
                        </div>

                        {/* Analyse des Prix de Réservation */}
                        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-moroccan-blue mb-3">📊 Analyse des Prix de Réservation</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="bg-white p-4 rounded-lg border-2 border-green-200 shadow-sm">
                              <div className="text-green-700 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                                Notre Prix
                              </div>
                              <div className="text-xl font-bold text-green-600 mt-1">
                                {Number(booking.activity.price).toLocaleString()} MAD
                              </div>
                              <div className="text-xs text-gray-600">Par personne</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                              <div className="text-orange-700 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                GetYourGuide
                              </div>
                              <div className="text-xl font-bold text-orange-600 mt-1">
                                {booking.activity.getyourguidePrice ? 
                                  Number(booking.activity.getyourguidePrice).toLocaleString() : 
                                  (Number(booking.activity.price) + 200).toLocaleString()
                                } MAD
                              </div>
                              <div className="text-xs text-red-600">Prix concurrent</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-blue-200 shadow-sm">
                              <div className="text-blue-700 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                Économies Client
                              </div>
                              <div className="text-xl font-bold text-blue-600 mt-1">
                                {(() => {
                                  const ourPrice = Number(booking.activity.price);
                                  const competitorPrice = booking.activity.getyourguidePrice ? 
                                    Number(booking.activity.getyourguidePrice) : 
                                    ourPrice + 200;
                                  const savings = (competitorPrice - ourPrice) * booking.numberOfPeople;
                                  return savings > 0 ? savings.toLocaleString() : '0';
                                })()} MAD
                              </div>
                              <div className="text-xs text-green-600">Économies totales</div>
                            </div>
                          </div>
                        </div>

                        {/* Payment Management */}
                        <PaymentManagement booking={booking} />

                        <div className="flex gap-2 pt-4">
                          {booking.status === 'pending' as any && (
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
                          {booking.customerEmail && (
                            <EmailModal
                              customerEmail={booking.customerEmail}
                              customerName={booking.customerName}
                              bookingId={booking._id || booking.id || ''}
                              trigger={
                                <Button size="sm" variant="outline" className="flex items-center gap-1">
                                  <Mail className="h-4 w-4" />
                                  Email
                                </Button>
                              }
                            />
                          )}
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteBooking(booking._id, booking.customerName)}
                            className="ml-2"
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Activity Management & Pricing</CardTitle>
                  <ActivityManagementModal mode="create" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activities.map((activity, index) => (
                      <div key={activity.id || activity._id || `activity-${index}`} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <img 
                            src={resolveActivityImage(activity)}
                            alt={activity.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg">{activity.name}</h3>
                            <p className="text-sm text-gray-600 mb-2">{activity.category}</p>
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
                              <div className="text-xl font-bold text-orange-600">{activity.getyourguidePrice || (Number(activity.price) + 150)} MAD</div>
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

                        {/* Seasonal Pricing */}
                        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                          <h4 className="font-semibold text-moroccan-blue mb-3">Seasonal Pricing Strategy</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="bg-white p-3 rounded border">
                              <div className="text-sm font-medium text-blue-700">Low Season</div>
                              <div className="text-lg font-bold text-blue-600">{Math.round(Number(activity.price) * 0.85)} MAD</div>
                              <div className="text-xs text-gray-600">Nov-Feb (-15%)</div>
                            </div>
                            <div className="bg-white p-3 rounded border border-green-300">
                              <div className="text-sm font-medium text-green-700">Regular Season</div>
                              <div className="text-lg font-bold text-green-600">{activity.price} MAD</div>
                              <div className="text-xs text-gray-600">Mar-May, Sep-Oct</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-sm font-medium text-red-700">High Season</div>
                              <div className="text-lg font-bold text-red-600">{Math.round(Number(activity.price) * 1.25)} MAD</div>
                              <div className="text-xs text-gray-600">Jun-Aug (+25%)</div>
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
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Market Intelligence Tab */}
            <TabsContent value="market-intelligence" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Market Intelligence</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Market intelligence features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

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

            {/* Cash Analytics Tab */}
            <TabsContent value="cash-analytics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cash Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">Cash analytics features coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Cash Reminders Tab */}
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

            {/* Performance Analytics Tab */}
            <TabsContent value="performance" className="space-y-4">
              <PerformanceMonitor />
            </TabsContent>

            {/* User Analytics Tab */}
            <TabsContent value="users" className="space-y-4">
              <UserAnalytics />
            </TabsContent>

            {/* Business Metrics Tab */}
            <TabsContent value="business" className="space-y-4">
              <BusinessMetrics />
            </TabsContent>

            {/* CEO Operations Tab */}
            <TabsContent value="ceo-operations" className="space-y-4">
              <CEOOperationsDashboard />
            </TabsContent>

            {/* Admin Management Tab */}
            {user?.role === 'superadmin' && (
              <TabsContent value="admin-management" className="space-y-4">
                <AdminManagement />
              </TabsContent>
            )}

            {/* System Health Tab */}
            {user?.role === 'superadmin' && (
              <TabsContent value="system" className="space-y-4">
                <SystemHealth />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <AdminRoute>
      <AdminDashboardContent />
    </AdminRoute>
  );
}
