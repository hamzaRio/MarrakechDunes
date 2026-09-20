import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Users, TrendingUp, Crown, MessageCircle, LogOut, Download, FileText, Settings, Home, Search, Trash2, X, Calendar as CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import AdminRoute from "@/components/admin-route";
import { useAuth } from "@/hooks/use-auth";
// import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { getActivityFallbackImage } from "@/lib/image-utils";
import { ensureArray } from "@/lib/ensureArray";
import { getAssetUrl } from "@/lib/utils";
import BookingManagement from "@/components/admin/booking-management";
import { WhatsAppNotificationPanel } from "@/components/whatsapp-notification-panel";
import FreeNotificationPanel from "@/components/free-notification-panel";
import SimpleActivityForm from "@/components/simple-activity-form-v2";
import GYGReferenceTool from "@/components/GYGReferenceTool";
// Removed BookingTest - was only for testing
// Removed duplicate cash analytics dashboard import
import CashBookingReminders from "@/components/cash-booking-reminders";
import { apiFetch, logout, api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";
import PerformanceMonitor from "@/components/analytics/performance-monitor";
import UserAnalytics from "@/components/analytics/user-analytics";
import BusinessMetrics from "@/components/analytics/business-metrics";
import SystemHealth from "@/components/analytics/system-health";
import AdminManagement from "@/components/admin-management";
import CEOOperationsDashboard from "@/components/ceo-operations-dashboard";
// Removed duplicate market intelligence dashboard import

import type { BookingType, ActivityType, AuditLogType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

function AdminDashboardContent() {
  const { user, isLoading: authLoading, isAuthRejected } = useAuth();
  const isSuperAdmin = user?.role === 'superadmin';
  // const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // ENHANCED SECURITY: Multiple authentication checks - NO BYPASSING
  if (!authLoading && !user && isAuthRejected) {
    if (import.meta.env.DEV) {
      console.warn('[SECURITY] Dashboard access denied - no user');
    }
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token');
    sessionStorage.clear();
    window.location.replace('/admin/login');
    return null;
  }

  // Additional role verification
  if (!authLoading && user && user.role !== 'admin' && user.role !== 'superadmin') {
    if (import.meta.env.DEV) {
      console.warn('[SECURITY] Dashboard access denied - invalid role:', user.role);
    }
    // Clear authentication data
    localStorage.removeItem('user');
    localStorage.removeItem('auth-token');
    sessionStorage.clear();
    // Force redirect
    window.location.replace('/admin/login');
    return null;
  }
  
  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-blue mx-auto mb-4"></div>
          <p className="text-moroccan-blue">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }
  
  const [deleteActivityDialogOpen, setDeleteActivityDialogOpen] = useState(false);
  const [activityToDelete, setActivityToDelete] = useState<{ id: string; name: string } | null>(null);
  
  // Reports date range state
  const [reportsDateRange, setReportsDateRange] = useState<{ from?: Date; to?: Date }>({});
  
  const { data: bookings = [] } = useQuery<BookingWithActivity[]>({
    queryKey: ["/admin/bookings"],
    enabled: !!user, // Only fetch if user is authenticated
    retry: (failureCount, error: any) => {
      // Don't retry on 401/403 errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('[DASHBOARD] Bookings fetch failed - authentication issue:', error?.response?.status);
        return false;
      }
      return failureCount < 1; // Retry only once for other errors
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  // Fetch only INTERNAL activities (not GetYourGuide activities) for management
  const { data: activities = [] } = useQuery<ActivityType[]>({
    queryKey: ["/admin/activities"],
    enabled: !!user, // Only fetch if user is authenticated
    queryFn: async () => {
      const response = await api.get("/admin/activities");
      return response.data || [];
    },
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('[DASHBOARD] Activities fetch failed - authentication issue:', error?.response?.status);
        return false;
      }
      return failureCount < 1; // Retry only once
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  const { data: auditLogs = [] } = useQuery<AuditLogType[]>({
    queryKey: ["/admin/audit-logs"],
    enabled: user?.role === 'superadmin',
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        console.warn('[DASHBOARD] Audit logs fetch failed - authentication issue:', error?.response?.status);
        return false;
      }
      return failureCount < 1; // Retry only once
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  // Fix: Calculate real revenue from all bookings (regardless of status)
  // Include all bookings that have a totalAmount > 0
  // Filter out bookings with deleted activities for revenue calculation
  // Add null check to prevent TypeError when accessing b.activity
  // Apply reports date range filter if set
  const revenueBookings = bookings.filter(b => {
    // Check if booking has valid activity and totalAmount
    if (!b.activity) return false;
    if (Number(b.totalAmount) <= 0) return false;
    
    // Apply reports date range filter
    if (reportsDateRange.from || reportsDateRange.to) {
      const bookingDate = new Date(b.preferredDate);
      if (reportsDateRange.from && bookingDate < reportsDateRange.from) return false;
      if (reportsDateRange.to) {
        const toDate = new Date(reportsDateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (bookingDate > toDate) return false;
      }
    }
    
    return true;
  });
  const totalRevenue = revenueBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);
  
  // Filter bookings for reports based on date range
  const reportsFilteredBookings = bookings.filter(b => {
    if (!b.activity) return false;
    
    // Apply reports date range filter
    if (reportsDateRange.from || reportsDateRange.to) {
      const bookingDate = new Date(b.preferredDate);
      if (reportsDateRange.from && bookingDate < reportsDateRange.from) return false;
      if (reportsDateRange.to) {
        const toDate = new Date(reportsDateRange.to);
        toDate.setHours(23, 59, 59, 999);
        if (bookingDate > toDate) return false;
      }
    }
    
    return true;
  });
  
  const reportsPendingBookings = reportsFilteredBookings.filter(b => String(b.status || '').toUpperCase() === 'PENDING').length;
  const reportsConfirmedBookings = reportsFilteredBookings.filter(b => String(b.status || '').toUpperCase() === 'CONFIRMED').length;

  // Debug logging for revenue calculation (DEV only)
  if (import.meta.env.DEV) {
    console.log('[REVENUE DEBUG]', {
      totalBookings: bookings.length,
      revenueBookings: revenueBookings.length,
      allBookingsData: bookings.map(b => ({
        id: b._id,
        status: b.status,
        totalAmount: b.totalAmount,
        paidAmount: b.paidAmount
      })),
      calculatedRevenue: totalRevenue
    });
  }

  const pendingBookings = bookings.filter(b => String(b.status || '').toUpperCase() === 'PENDING').length;
  const confirmedBookings = bookings.filter(b => String(b.status || '').toUpperCase() === 'CONFIRMED').length;

  // Delete activity mutation
  const deleteActivityMutation = useMutation({
    mutationFn: async (activityId: string) => {
      const res = await apiFetch(`/admin/activities/${activityId}`, {
        method: "DELETE"
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete activity');
      }
      return res;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/activities"] });
      toast({
        title: "Activité Supprimée",
        description: "L'activité a été supprimée avec succès.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Échec de la Suppression",
        description: error.message || "Erreur lors de la suppression de l'activité",
        variant: "destructive",
      });
    },
  });

  const handleDeleteActivity = (activityId: string, activityName: string) => {
    setActivityToDelete({ id: activityId, name: activityName });
    setDeleteActivityDialogOpen(true);
  };

  const confirmDeleteActivity = () => {
    if (activityToDelete) {
      deleteActivityMutation.mutate(activityToDelete.id);
      setDeleteActivityDialogOpen(false);
      setActivityToDelete(null);
    }
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

  // Logout handler - FIXED to prevent redirect loop
  const handleLogout = async () => {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter?')) {
      try {
        // Call logout API (this will clear all localStorage and cookies)
        await logout();
        
        // Show success message
        toast({
          title: "Déconnecté",
          description: "Vous avez été déconnecté avec succès.",
        });
        
        // Force immediate redirect without any auth checks
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
        
      } catch (error) {
        console.error('Logout error:', error);
        
        // Force redirect even on error
        setTimeout(() => {
          window.location.replace('/');
        }, 100);
      }
    }
  };

  // Export bookings handler
  const handleExportBookings = async () => {
    try {
      const response = await api.get('/admin/export/bookings', {
        responseType: 'blob',
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = response.data;
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
      const response = await api.get('/admin/export/bookings/pdf', {
        responseType: 'blob',
      });
      
      if (response.status !== 200) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = response.data;
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
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [newPrice, setNewPrice] = useState<string>('');

  const handleEditPricing = (activity: ActivityType) => {
    setEditingActivity(activity);
    setNewPrice(activity.price.toString());
  };

  const handleSavePrice = async () => {
    if (!editingActivity || !newPrice || isNaN(Number(newPrice))) return;
    
    try {
      // Update activity pricing via API - use admin endpoint
      await api.patch(`/admin/activities/${editingActivity._id || editingActivity.id}`, {
        price: Number(newPrice)
      });
      
      toast({
        title: "Prix mis à jour",
        description: `Prix mis à jour à ${newPrice} MAD pour ${editingActivity.name}`,
      });
      
      // Refresh activities data
      await queryClient.invalidateQueries({ queryKey: ["/admin/activities"] });
      
      setEditingActivity(null);
      setNewPrice('');
    } catch (error: any) {
      console.error('Error updating price:', error);
      toast({
        title: "Erreur de mise à jour",
        description: error?.response?.data?.message || "Impossible de mettre à jour le prix",
        variant: "destructive",
      });
    }
  };

  const handleUpdateGetYourGuidePrice = async (activity: ActivityType, forceScrape: boolean = false) => {
    try {
      toast({
        title: "Mise à jour du prix concurrent",
        description: forceScrape 
          ? "Scraping en temps réel du site GetYourGuide (5-10 secondes)..."
          : "Recherche du prix GetYourGuide en cours...",
      });
      
      // Fetch real price from GetYourGuide (with optional force scrape)
      const priceResponse = await api.get(`/admin/activities/${activity._id || activity.id}/getyourguide-price`, {
        params: { forceScrape: forceScrape ? 'true' : 'false' }
      });
      
      if (priceResponse.data && priceResponse.data.status === 'success') {
        const comparison = priceResponse.data.comparison;
        const gygPrice = comparison?.price ?? priceResponse.data.price;
        const sourceType = comparison?.sourceType ?? priceResponse.data.sourceType ?? 'LEGACY_UNVERIFIED';
        const activityMatch = priceResponse.data.activity;
        
        if (gygPrice && sourceType === 'LIVE_VERIFIED') {
          // The server performs the verified persistence, so the client never
          // turns a numeric reference into a GetYourGuide value on its own.
          await queryClient.invalidateQueries({ queryKey: ["/admin/activities"] });

          toast({
            title: "Prix mis à jour",
            description: activityMatch?.title
              ? `Prix GetYourGuide vérifié: ${gygPrice} ${priceResponse.data.currency || 'MAD'} - ${activityMatch.title}`
              : `Prix GetYourGuide vérifié: ${gygPrice} ${priceResponse.data.currency || 'MAD'}`,
          });

          if (activityMatch?.url) {
            console.log('[GYG] Activity found on GetYourGuide:', {
              title: activityMatch.title,
              url: activityMatch.url,
              price: gygPrice,
              ourPrice: activity.price,
              sourceType,
            });
          }
        } else if (gygPrice) {
          toast({
            title: 'Référence non enregistrée',
            description: 'Seuls les résultats GetYourGuide vérifiés en direct peuvent être enregistrés.',
          });
        } else {
          throw new Error('Prix GetYourGuide non trouvé');
        }
      } else {
        throw new Error('Impossible de récupérer le prix GetYourGuide');
      }
    } catch (error: any) {
      console.error('[DASHBOARD] Failed to update GetYourGuide price:', error);
      toast({
        title: "Erreur",
        description: error?.response?.data?.message || "Impossible de mettre à jour le prix GetYourGuide",
        variant: "destructive",
      });
    }
  };

  const handleViewActivityBookings = (activity: ActivityType) => {
    // Fix: Add null check for b.activity to prevent TypeError
    const activityBookings = bookings.filter(b => b.activity && (b.activity.id === activity.id || b.activity._id === activity._id || b.activityId === activity._id || b.activityId === activity.id));
    const totalRevenue = activityBookings.filter(b => String(b.status || '').toUpperCase() === 'CONFIRMED').reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    
    toast({
      title: `Statistiques: ${activity.name}`,
      description: `Total: ${activityBookings.length} réservations, Revenus: ${totalRevenue} MAD`,
    });
  };

  return (
    <>
      <SEOHead 
        title="Tableau de Bord Admin - MarrakechDunes"
        description="Gérez les réservations, activités et analyses pour les opérations touristiques MarrakechDunes."
        keywords="admin, tableau de bord, MarrakechDunes, gestion réservations, activités"
      />
      {/* Force redeploy - v1.3.0 - Fixed auth loop and API calls after logout */}
      
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                        <h1 className="text-3xl font-bold text-moroccan-blue">🏛️ Tableau de Bord Administrateur</h1>
                        <p className="text-gray-600">Bienvenue, {user?.username} 👋</p>
              </div>
              <div className="flex gap-3">
                <Link href="/">
                  <Button 
                    variant="outline" 
                    className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Retour à l'Accueil
                  </Button>
                </Link>
                {isSuperAdmin && (
                  <Link href="/admin/ceo">
                    <Button className="bg-gradient-to-r from-yellow-400 to-yellow-600 hover:from-yellow-500 hover:to-yellow-700 text-black font-semibold">
                      <Crown className="h-4 w-4 mr-2" />
                      Tableau de Bord Direction
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
                        <p className="text-xs text-green-600 mt-1">
                          Chiffre d'affaires ({revenueBookings.length} réservation{revenueBookings.length !== 1 ? 's' : ''})
                        </p>
                        {revenueBookings.length > 0 && (
                          <details className="mt-3 text-xs">
                            <summary className="cursor-pointer text-green-700 hover:text-green-900 font-medium">
                              Voir les détails ({revenueBookings.length})
                            </summary>
                            <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                              {revenueBookings.map((b) => (
                                <div key={b.id || b._id} className="bg-white/50 p-2 rounded border border-green-200">
                                  <div className="font-medium">{b.customerName}</div>
                                  <div className="text-green-600">{b.activity?.name || 'Activité supprimée'}</div>
                                  <div className="text-green-700 font-semibold">{b.totalAmount} MAD - {b.status}</div>
                                </div>
                              ))}
                            </div>
                          </details>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 shadow-lg hover:shadow-xl transition-shadow">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-orange-700 flex items-center gap-2">
                          ⏳ Réservations en Attente
                        </CardTitle>
                        <CalendarIcon className="h-4 w-4 text-orange-600" />
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
                          {confirmedBookings.toString()}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Clients satisfaits</p>
                      </CardContent>
                    </Card>
                  </div>

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className={`grid w-full ${isSuperAdmin ? 'grid-cols-7' : 'grid-cols-5'} bg-white border-2 border-gray-200`}>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">📋 Réservations</TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">🎯 Activités</TabsTrigger>
              <TabsTrigger value="gyg-reference" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">🔍 Référence GYG</TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">💬 WhatsApp</TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">📊 Rapports</TabsTrigger>
              {isSuperAdmin && (
                <>
                  <TabsTrigger value="admin-management" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">👥 Admins</TabsTrigger>
                  <TabsTrigger value="audit" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">🔒 Audit</TabsTrigger>
                </>
              )}
            </TabsList>

            <TabsContent value="bookings" className="space-y-4">
              <BookingManagement
                bookings={bookings}
                onExportBookings={handleExportBookings}
                onExportBookingsPDF={handleExportBookingsPDF}
                canDeleteBookings={isSuperAdmin}
              />
            </TabsContent>
            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{isSuperAdmin ? 'Activity Management & Pricing' : 'Activities'}</CardTitle>
                  {isSuperAdmin ? (
                    <div className="flex gap-2">
                      <SimpleActivityForm mode="create" />
                    </div>
                  ) : null}
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
                              <div className="text-sm font-medium text-orange-700">Market reference</div>
                              <div className="text-xl font-bold text-orange-600">{activity.getyourguidePrice ? `${activity.getyourguidePrice} MAD` : 'N/A'}</div>
                              <div className="text-xs text-gray-600">Stored source requires verification</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-sm font-medium text-blue-700">Pricing decision</div>
                              <div className="text-lg font-bold text-blue-600">Superadmin</div>
                              <div className="text-xs text-gray-600">No automatic market recommendation</div>
                            </div>
                            <div className="bg-white p-3 rounded border">
                              <div className="text-sm font-medium text-purple-700">Market position</div>
                              <div className="text-lg font-bold text-purple-600">To verify</div>
                              <div className="text-xs text-gray-600">Requires comparable verified offers</div>
                            </div>
                          </div>
                        </div>

                        {isSuperAdmin ? (
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
                        ) : null}

                        <div className="flex gap-2">
                          {isSuperAdmin ? (
                            <>
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
                                onClick={() => handleUpdateGetYourGuidePrice(activity, false)}
                                title="Mise à jour rapide depuis la base de données"
                              >
                                Update GYG Price (DB)
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleUpdateGetYourGuidePrice(activity, true)}
                                title="Scraping en temps réel du site GetYourGuide (plus lent mais plus précis)"
                                className="bg-blue-50 hover:bg-blue-100"
                              >
                                🔄 Scrape Live GYG
                              </Button>
                            </>
                          ) : null}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewActivityBookings(activity)}
                          >
                            View Bookings
                          </Button>
                          {isSuperAdmin ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteActivity(activity._id || activity.id || '', activity.name)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          ) : null}
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

            {/* GYG Reference Tab - Search GetYourGuide website */}
            <TabsContent value="gyg-reference" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-blue-600" />
                    Référence GetYourGuide
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <GYGReferenceTool />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="whatsapp" className="space-y-4">
              {/* Pending Notifications from Queue - Shows automatic booking confirmations */}
              <FreeNotificationPanel />
              
              {/* Existing WhatsApp Panel (for manual messages) */}
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

            <TabsContent value="reports" className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-moroccan-blue flex items-center gap-2">
                  📊 Rapports et Analyses
                </h2>
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                        <CalendarIcon className="h-4 w-4 mr-2" />
                        {reportsDateRange.from ? (
                          reportsDateRange.to ? (
                            <>
                              {reportsDateRange.from.toLocaleDateString()} - {reportsDateRange.to.toLocaleDateString()}
                            </>
                          ) : (
                            reportsDateRange.from.toLocaleDateString()
                          )
                        ) : (
                          <span>Période</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={reportsDateRange.from}
                        selected={{ from: reportsDateRange.from, to: reportsDateRange.to }}
                        onSelect={(range: any) => setReportsDateRange({ from: range?.from, to: range?.to })}
                        numberOfMonths={2}
                      />
                      {reportsDateRange.from && (
                        <div className="p-3 border-t flex justify-between items-center">
                          <span className="text-sm text-gray-600">
                            {reportsFilteredBookings.length} réservation(s) dans cette période
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setReportsDateRange({})}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Effacer
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
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
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-700 flex items-center gap-2">
                      📈 Revenus Totaux
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">
                      {totalRevenue.toLocaleString()} MAD
                    </div>
                    <p className="text-sm text-blue-600 mt-1">Chiffre d'affaires total</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200">
                  <CardHeader>
                    <CardTitle className="text-green-700 flex items-center gap-2">
                      ✅ Réservations Confirmées
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-900">
                      {reportsConfirmedBookings.toString()}
                    </div>
                    <p className="text-sm text-green-600 mt-1">Clients satisfaits{reportsDateRange.from ? ' (période sélectionnée)' : ''}</p>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200">
                  <CardHeader>
                    <CardTitle className="text-orange-700 flex items-center gap-2">
                      ⏳ En Attente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-orange-900">
                      {reportsPendingBookings}
                    </div>
                    <p className="text-sm text-orange-600 mt-1">En cours de traitement{reportsDateRange.from ? ' (période sélectionnée)' : ''}</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-white border-2 border-gray-200">
                <CardHeader>
                  <CardTitle className="text-moroccan-blue flex items-center gap-2">
                    📊 Activités Populaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <h4 className="font-medium">{activity.name}</h4>
                          <p className="text-sm text-gray-600">{activity.location}</p>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-moroccan-blue">
                            {Number(activity.price).toLocaleString()} MAD
                          </div>
                          <div className="text-sm text-gray-500">
                            {activity.category}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
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

            {isSuperAdmin && (
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

            {isSuperAdmin && (
              <>
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
              </>
            )}

            {/* Admin Management Tab */}
            {isSuperAdmin && (
              <TabsContent value="admin-management" className="space-y-4">
                <AdminManagement />
              </TabsContent>
            )}

            {/* System Health Tab */}
            {isSuperAdmin && (
              <TabsContent value="system" className="space-y-4">
                <SystemHealth />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>

      {/* Price Editing Modal */}
      <Dialog open={!!editingActivity} onOpenChange={() => setEditingActivity(null)}>
        <DialogContent 
          className="max-w-md bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100"
          aria-describedby="price-edit-description"
        >
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-gray-100">Modifier le prix</DialogTitle>
            <DialogDescription id="price-edit-description" className="text-gray-600 dark:text-gray-400">
              Modifier le prix pour {editingActivity?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 bg-white dark:bg-gray-800 p-4">
            <div>
              <Label htmlFor="price" className="text-gray-900 dark:text-gray-100 block mb-2">Nouveau prix (MAD)</Label>
              <Input
                id="price"
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(e.target.value)}
                placeholder="Entrez le nouveau prix"
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600 focus:border-moroccan-blue"
              />
            </div>
            <div className="flex justify-end space-x-2 pt-2">
              <Button 
                variant="outline" 
                onClick={() => setEditingActivity(null)}
                className="bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSavePrice}
                className="bg-moroccan-blue hover:bg-blue-700 text-white"
              >
                Sauvegarder
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Activity Confirmation Dialog */}
      <AlertDialog open={deleteActivityDialogOpen} onOpenChange={setDeleteActivityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression de l'activité</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer l'activité <strong>{activityToDelete?.name}</strong> ? 
              Cette action ne peut pas être annulée. Si cette activité a des réservations associées, la suppression sera bloquée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteActivityDialogOpen(false);
              setActivityToDelete(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteActivity}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
