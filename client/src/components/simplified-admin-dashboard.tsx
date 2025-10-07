import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  Users, 
  Calendar, 
  DollarSign, 
  CheckCircle, 
  MessageCircle, 
  Download, 
  FileText, 
  Trash2,
  Search,
  Filter,
  Phone,
  Clock,
  Mail,
  X
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/use-language";
import EmailModal from "@/components/EmailModal";
import type { BookingType, ActivityType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity?: ActivityType;
}

export default function SimplifiedAdminDashboard() {
  const { toast } = useToast();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch bookings
  const { data: bookings, isLoading } = useQuery<BookingWithActivity[]>({
    queryKey: ["/admin/bookings"],
  });

  // Fetch activities
  // const { data: activities } = useQuery<ActivityType[]>({
  //   queryKey: ["/activities"],
  // });

  // Confirm booking mutation
  const confirmBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiFetch(`/bookings/${bookingId}/confirm`, {
        method: "POST"
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      toast({
        title: "Booking Confirmed",
        description: `Booking confirmed successfully. Customer notification sent via ${data.notification.method}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Confirmation Failed",
        description: error?.message || "Failed to confirm booking",
        variant: "destructive",
      });
    }
  });

  // Reject booking mutation
  const rejectBookingMutation = useMutation({
    mutationFn: async ({ bookingId, reason }: { bookingId: string; reason?: string }) => {
      return apiFetch(`/bookings/${bookingId}/reject`, {
        method: "POST",
        data: { reason }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      toast({
        title: "Booking Rejected",
        description: `Booking rejected successfully. Customer notification sent via ${data.notification.method}.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error?.message || "Failed to reject booking",
        variant: "destructive",
      });
    }
  });

  // Update booking status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      return apiFetch(`/bookings/${bookingId}/status`, {
        method: "PATCH",
        data: { status }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      toast({
        title: "Status Updated",
        description: "Booking status updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update booking status",
        variant: "destructive",
      });
    }
  });

  // Delete booking mutation
  const deleteBookingMutation = useMutation({
    mutationFn: async (bookingId: string) => {
      return apiFetch(`/admin/bookings/${bookingId}`, {
        method: "DELETE"
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/admin/bookings"] });
      toast({
        title: "Booking Deleted",
        description: "Booking deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete Failed",
        description: error?.message || "Failed to delete booking",
        variant: "destructive",
      });
    }
  });

  // Export handlers
  const handleExportCSV = async () => {
    try {
      // Check if there are any bookings first
      if (!bookings || bookings.length === 0) {
        toast({
          title: t('admin.noDataToExport'),
          description: t('admin.noBookingsToExport'),
          variant: "destructive",
        });
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://marrakechdunes-sppy.onrender.com/api';
      const response = await fetch(`${apiBaseUrl}/admin/export/bookings`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
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
        title: t('admin.exportSuccessful'),
        description: t('admin.bookingsExportedAsCSV'),
      });
    } catch (error) {
      console.error('CSV Export Error:', error);
      toast({
        title: t('admin.exportFailed'),
        description: t('admin.failedToExportBookings'),
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    try {
      // Check if there are any bookings first
      if (!bookings || bookings.length === 0) {
        toast({
          title: t('admin.noDataToExport'),
          description: t('admin.noBookingsToExport'),
          variant: "destructive",
        });
        return;
      }

      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://marrakechdunes-sppy.onrender.com/api';
      const response = await fetch(`${apiBaseUrl}/admin/export/bookings/pdf`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bookings-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: t('admin.exportSuccessful'),
        description: t('admin.bookingsReportExportedAsPDF'),
      });
    } catch (error) {
      console.error('PDF Export Error:', error);
      toast({
        title: t('admin.exportFailed'),
        description: t('admin.failedToExportBookingsPDF'),
        variant: "destructive",
      });
    }
  };

  // Filter bookings
  const filteredBookings = (bookings || []).filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         booking.customerPhone.includes(searchTerm) ||
                         booking.activity?.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || booking.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const stats = {
    total: bookings?.length || 0,
    pending: bookings?.filter(b => b.status === 'pending').length || 0,
    confirmed: bookings?.filter(b => b.status === 'confirmed').length || 0,
    totalRevenue: bookings?.reduce((sum, b) => sum + parseInt(b.totalAmount), 0) || 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">{t('admin.adminDashboard')}</h2>
          <p className="text-gray-600">{t('admin.manageBookings')}</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportCSV} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            {t('admin.exportCSV')}
          </Button>
          <Button onClick={handleExportPDF} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            {t('admin.exportPDF')}
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalBookings')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.pendingBookings')}</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.confirmedBookings')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.totalRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue} MAD</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('admin.searchBookings')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin.allStatus')}</SelectItem>
                <SelectItem value="pending">{t('admin.pending')}</SelectItem>
                <SelectItem value="confirmed">{t('admin.confirmed')}</SelectItem>
                <SelectItem value="cancelled">{t('admin.cancelled')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.bookings')} ({filteredBookings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking._id} className="border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Header with status badges */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{booking.customerName}</h3>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : booking.status === 'pending' ? 'secondary' : 'destructive'}>
                        {booking.status}
                      </Badge>
                      <Badge 
                        variant={
                          booking.paymentStatus === 'fully_paid' ? 'default' : 
                          booking.paymentStatus === 'deposit_paid' ? 'secondary' : 
                          'destructive'
                        }
                        className={
                          booking.paymentStatus === 'fully_paid' ? 'bg-green-100 text-green-800 border-green-200' :
                          booking.paymentStatus === 'deposit_paid' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                          'bg-red-100 text-red-800 border-red-200'
                        }
                      >
                        {booking.paymentStatus === 'fully_paid' ? '✅ Paid' :
                         booking.paymentStatus === 'deposit_paid' ? '💰 Deposit' :
                         '❌ Unpaid'}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(booking.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Booking Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Activity</h4>
                      <p className="text-sm">{booking.activity?.name}</p>
                      <p className="text-lg font-semibold text-moroccan-blue">{booking.totalAmount} MAD</p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Date & Time</h4>
                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-4 w-4" />
                        {new Date(booking.preferredDate).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Users className="h-4 w-4" />
                        {booking.numberOfPeople} {booking.numberOfPeople === 1 ? 'person' : 'people'}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-gray-700">Customer Info</h4>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-4 w-4" />
                        {booking.customerPhone}
                      </div>
                      {booking.customerEmail && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-4 w-4" />
                          {booking.customerEmail}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {booking.notes && (
                    <div className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-1">Notes</h4>
                      <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">{booking.notes}</p>
                    </div>
                  )}

                  {/* Contact and Action Buttons */}
                  <div className="flex flex-wrap items-center gap-2 pt-4 border-t">
                    {/* Contact Buttons */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`https://wa.me/${booking.customerPhone.replace(/\D/g, '')}`, '_blank')}
                      className="flex items-center gap-1"
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </Button>
                    
                    {booking.customerEmail && (
                      <EmailModal
                        customerEmail={booking.customerEmail}
                        customerName={booking.customerName}
                        bookingId={booking._id}
                        trigger={
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center gap-1"
                          >
                            <Mail className="h-4 w-4" />
                            Email
                          </Button>
                        }
                      />
                    )}

                    {/* Action Buttons */}
                    {booking.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => confirmBookingMutation.mutate(booking._id)}
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={confirmBookingMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          {confirmBookingMutation.isPending ? 'Confirming...' : 'Confirm Booking'}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => rejectBookingMutation.mutate({ bookingId: booking._id, reason: 'Rejected by admin' })}
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={rejectBookingMutation.isPending}
                        >
                          <X className="h-4 w-4 mr-1" />
                          {rejectBookingMutation.isPending ? 'Rejecting...' : 'Reject'}
                        </Button>
                      </div>
                    )}
                    
                    {booking.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStatusMutation.mutate({ bookingId: booking._id, status: 'pending' })}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Mark Pending
                      </Button>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Booking</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this booking? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteBookingMutation.mutate(booking._id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

