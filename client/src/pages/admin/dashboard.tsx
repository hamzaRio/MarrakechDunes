import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, TrendingUp, Activity, Settings, Crown, MessageCircle } from "lucide-react";
import AdminRoute from "@/components/admin-route";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import { Link } from "wouter";
import PaymentManagement from "@/components/payment-management";
import { WhatsAppNotificationPanel } from "@/components/whatsapp-notification-panel";
import ActivityManagementModal from "@/components/activity-management-modal";

// Removed useState import as no longer needed
import type { BookingType, ActivityType, AuditLogType } from "@shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  
  const { data: bookings = [] } = useQuery<BookingWithActivity[]>({
    queryKey: ["/api/admin/bookings"],
  });

  const { data: activities = [] } = useQuery<ActivityType[]>({
    queryKey: ["/api/activities"],
  });

  const { data: auditLogs = [] } = useQuery<AuditLogType[]>({
    queryKey: ["/api/admin/audit-logs"],
    enabled: user?.role === 'superadmin',
  });

  const totalRevenue = bookings
    .filter(b => b.status === 'confirmed')
    .reduce((sum, b) => sum + Number(b.totalAmount), 0);

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;

  // Admin booking management functions
  const handleBookingStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await fetch(`/api/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
        credentials: 'include'
      });
      // Refresh bookings data using React Query
      queryClient.invalidateQueries({ queryKey: ["/api/admin/bookings"] });
    } catch (error) {
      console.error('Failed to update booking status:', error);
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
    <AdminRoute>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-moroccan-blue">{t('dashboard')}</h1>
                <p className="text-gray-600">Welcome back, {user?.username}</p>
              </div>
              {user?.role === 'superadmin' && (
                <Link href="/admin/ceo">
                  <Button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold">
                    <Crown className="h-4 w-4 mr-2" />
                    CEO Dashboard
                  </Button>
                </Link>
              )}
            </div>
          </div>

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
            <TabsList className={`grid w-full ${user?.role === 'superadmin' ? 'grid-cols-7' : 'grid-cols-5'}`}>
              <TabsTrigger value="bookings">Bookings</TabsTrigger>
              <TabsTrigger value="activities">Activities</TabsTrigger>
              <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              <TabsTrigger value="performance">
                <Link href="/admin/performance" className="flex items-center">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  Performance
                </Link>
              </TabsTrigger>
              {user?.role === 'superadmin' && (
                <TabsTrigger value="audit">Audit Logs</TabsTrigger>
              )}
              {user?.role === 'superadmin' && (
                <TabsTrigger value="system">System Health</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">Booking Management</h2>
                <ActivityManagementModal mode="create" />
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
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Management & Pricing</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {activities.map((activity, index) => (
                      <div key={activity.id || activity._id || `activity-${index}`} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-start gap-4">
                          <img 
                            src={activity.image} 
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

            {/* System Health Tab */}
            {user?.role === 'superadmin' && (
              <TabsContent value="system" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>System Health Monitor</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      System monitoring coming soon...
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

    </AdminRoute>
  );
}