import { useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Users, TrendingUp, Crown, MessageCircle, LogOut, Download, FileText, Mail, Settings, Home, Plus, Search } from "lucide-react";
import AdminRoute from "@/components/admin-route";
import { useAuth } from "@/hooks/use-auth";
// import { useLanguage } from "@/hooks/use-language";
import { Link } from "wouter";
import { getActivityFallbackImage } from "@/lib/image-utils";
import { ensureArray } from "@/lib/ensureArray";
import { getAssetUrl } from "@/lib/utils";
import PaymentManagement from "@/components/payment-management";
import { WhatsAppNotificationPanel } from "@/components/whatsapp-notification-panel";
import SimpleActivityForm from "@/components/simple-activity-form-v2";
import GYGReferenceTool from "@/components/GYGReferenceTool";
// Removed BookingTest - was only for testing
// Removed duplicate cash analytics dashboard import
import CashBookingReminders from "@/components/cash-booking-reminders";
import EmailModal from "@/components/EmailModal";
import { apiFetch, logout, api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";
import PerformanceMonitor from "@/components/analytics/performance-monitor";
import UserAnalytics from "@/components/analytics/user-analytics";
import BusinessMetrics from "@/components/analytics/business-metrics";
import SystemHealth from "@/components/analytics/system-health";
import AdminManagement from "@/components/admin-management";
import CEOOperationsDashboard from "@/components/ceo-operations-dashboard";
import BookingDetailsModal from "@/components/booking-details-modal";
// Removed duplicate market intelligence dashboard import

import type { BookingType, ActivityType, AuditLogType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

function AdminDashboardContent() {
  const { user, isLoading: authLoading } = useAuth();
  // const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  // ENHANCED SECURITY: Multiple authentication checks - NO BYPASSING
  if (!authLoading && !user) {
    if (import.meta.env.DEV) {
      console.warn('[SECURITY] Dashboard access denied - no user');
    }
    // Check localStorage as fallback
    const localUser = JSON.parse(localStorage.getItem('user') || 'null');
    if (!localUser) {
      // Clear all authentication data
      localStorage.removeItem('user');
      localStorage.removeItem('auth-token');
      sessionStorage.clear();
      // Force redirect
      window.location.replace('/admin/login');
      return null;
    }
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
  
  // Modal state for booking details
  const [selectedBooking, setSelectedBooking] = useState<BookingWithActivity | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  
  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookingToDelete, setBookingToDelete] = useState<{ id: string; name: string } | null>(null);
  
  const { data: bookings = [], error: bookingsError } = useQuery<BookingWithActivity[]>({
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
  const revenueBookings = bookings.filter(b => {
    // Check if booking has valid activity and totalAmount
    if (!b.activity) return false;
    if (Number(b.totalAmount) <= 0) return false;
    return true;
  });
  const totalRevenue = revenueBookings.reduce((sum, b) => sum + (Number(b.totalAmount) || 0), 0);

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

  const pendingBookings = bookings.filter(b => b.status === 'pending' as any).length;
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed' as any).length;

  // Handle authentication errors
  if (bookingsError && 'response' in bookingsError && ((bookingsError.response as any)?.status === 401 || (bookingsError.response as any)?.status === 403)) {
    console.error('[DASHBOARD] Authentication error detected, redirecting to login');
    window.location.href = '/admin/login';
    return null;
  }

  // Admin booking management functions
  const handleBookingStatusUpdate = async (bookingId: string, status: string) => {
    try {
      await apiFetch(`/admin/bookings/${bookingId}/status`, {
        method: 'PATCH',
        // headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
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
        title: "Réservation Supprimée",
        description: "La réservation a été supprimée avec succès.",
      });
    },
    onError: (error) => {
      toast({
        title: "Échec de la Suppression",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteBooking = (bookingId: string, customerName: string) => {
    setBookingToDelete({ id: bookingId, name: customerName });
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (bookingToDelete) {
      deleteBookingMutation.mutate(bookingToDelete.id);
      setDeleteDialogOpen(false);
      setBookingToDelete(null);
    }
  };

  const handleContactCustomer = (phone: string) => {
    window.open(`https://wa.me/${phone.replace(/[^0-9]/g, '')}`, '_blank');
  };

  const handleViewBookingDetails = (booking: BookingWithActivity) => {
    setSelectedBooking(booking);
    setIsBookingModalOpen(true);
  };

  const handleSendWhatsApp = (booking: BookingWithActivity) => {
    if (!booking.activity) {
      toast({
        title: "Error",
        description: "Activity information not available for this booking",
        variant: "destructive",
      });
      return;
    }
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
        const gygPrice = priceResponse.data.price;
        const source = priceResponse.data.source || 'api';
        const activityMatch = priceResponse.data.activity;
        
        if (gygPrice) {
          // Update the activity with the real GetYourGuide price
          const updateResponse = await api.patch(`/admin/activities/${activity._id || activity.id}`, {
            getyourguidePrice: gygPrice
          });
          
          if (updateResponse.data) {
            // Invalidate and refetch activities
            await queryClient.invalidateQueries({ queryKey: ["/admin/activities"] });
            
            const sourceMessage = source === 'estimated' 
              ? 'Prix estimé'
              : source === 'curated-database'
                ? 'Prix vérifié GetYourGuide (base de données)'
                : source === 'getyourguide-scraped'
                  ? 'Prix GetYourGuide (scraping en temps réel)'
                  : 'Prix GetYourGuide';
            
            toast({
              title: "Prix mis à jour",
              description: activityMatch?.title
                ? `${sourceMessage}: ${gygPrice} ${priceResponse.data.currency || 'MAD'} - ${activityMatch.title}`
                : `${sourceMessage}: ${gygPrice} ${priceResponse.data.currency || 'MAD'}`,
            });
            
            // Log link to GYG activity if found for verification
            if (activityMatch?.url) {
              console.log('[GYG] Activity found on GetYourGuide:', {
                title: activityMatch.title,
                url: activityMatch.url,
                price: gygPrice,
                ourPrice: activity.price,
                source: source
              });
            }
          }
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
    const totalRevenue = activityBookings.filter(b => b.status === 'confirmed' as any).reduce((sum, b) => sum + Number(b.totalAmount || 0), 0);
    
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
      
      {/* Booking Details Modal */}
      {selectedBooking && (
        <BookingDetailsModal
          booking={selectedBooking}
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedBooking(null);
          }}
        />
      )}
      
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
                          {confirmedBookings.toString()}
                        </div>
                        <p className="text-xs text-blue-600 mt-1">Clients satisfaits</p>
                      </CardContent>
                    </Card>
                  </div>

          <Tabs defaultValue="bookings" className="space-y-6">
            <TabsList className={`grid w-full ${user?.role === 'superadmin' ? 'grid-cols-7' : 'grid-cols-5'} bg-white border-2 border-gray-200`}>
              <TabsTrigger value="bookings" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">📋 Réservations</TabsTrigger>
              <TabsTrigger value="activities" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">🎯 Activités</TabsTrigger>
              <TabsTrigger value="gyg-reference" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">🔍 Référence GYG</TabsTrigger>
              <TabsTrigger value="whatsapp" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">💬 WhatsApp</TabsTrigger>
              <TabsTrigger value="reports" className="data-[state=active]:bg-moroccan-blue data-[state=active]:text-white">📊 Rapports</TabsTrigger>
              {user?.role === 'superadmin' && (
                <>
                  <TabsTrigger value="admin-management" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">👥 Admins</TabsTrigger>
                  <TabsTrigger value="audit" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">🔒 Audit</TabsTrigger>
                </>
              )}
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
                </div>
              </div>


              <Card>
                <CardHeader>
                  <CardTitle>📋 Toutes les Réservations avec Analyse des Prix</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {bookings
                      .filter((booking) => booking.activity) // Filter out bookings with deleted activities
                      .slice(0, 10)
                      .map((booking, index) => {
                      return (
                        <div key={booking.id || booking._id || `booking-${index}`} className="border rounded-lg p-6 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-3">
                              <div>
                                <h3 className="font-semibold text-lg">{booking.customerName}</h3>
                                <p className="text-sm text-gray-600">{booking.activity?.name || 'Activity not found'}</p>
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
                                {booking.activity?.price ? Number(booking.activity.price).toLocaleString() : 'N/A'} MAD
                              </div>
                              <div className="text-xs text-gray-600">Par personne</div>
                            </div>
                            <div className="bg-white p-4 rounded-lg border-2 border-orange-200 shadow-sm">
                              <div className="text-orange-700 font-medium flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                GetYourGuide
                              </div>
                              <div className="text-xl font-bold text-orange-600 mt-1">
                                {booking.activity?.getyourguidePrice ? 
                                  Number(booking.activity.getyourguidePrice).toLocaleString() : 
                                  booking.activity?.price ? (Number(booking.activity.price) + 200).toLocaleString() : 'N/A'
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
                                  if (!booking.activity?.price) return 'N/A';
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
                          {(() => {
                            // Detect test bookings for special deletion button
                            const isTestBooking = 
                              booking.customerName?.toLowerCase().includes('test') ||
                              booking.customerName?.toLowerCase().includes('notification') ||
                              booking.customerPhone === '+212600123456' ||
                              booking.customerPhone === '212600123456';
                            
                            return (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteBooking(booking._id || booking.id || '', booking.customerName)}
                                title={isTestBooking ? "Supprimer cette réservation de test" : "Supprimer la réservation"}
                                className={isTestBooking ? "bg-red-600 hover:bg-red-700" : ""}
                              >
                                {isTestBooking ? "🗑️ Supprimer Test" : "Delete"}
                              </Button>
                            );
                          })()}
                        </div>
                      </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>Activity Management & Pricing</CardTitle>
                  <div className="flex gap-2">
                    <SimpleActivityForm mode="create" />
                  </div>
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
                      {confirmedBookings.toString()}
                    </div>
                    <p className="text-sm text-green-600 mt-1">Clients satisfaits</p>
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
                      {pendingBookings}
                    </div>
                    <p className="text-sm text-orange-600 mt-1">En cours de traitement</p>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer la réservation de <strong>{bookingToDelete?.name}</strong> ? 
              Cette action ne peut pas être annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setBookingToDelete(null);
            }}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
