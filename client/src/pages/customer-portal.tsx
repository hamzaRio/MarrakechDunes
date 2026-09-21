import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getBookingDateOnly, isBookingDateTodayOrLater } from "@/lib/booking-utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { getStatusDisplayName, getStatusColor } from "@/lib/booking-utils";
import { Calendar, Users, DollarSign, Clock, CalendarDays, X } from "lucide-react";
import { BookingType } from "marrakechdunes-shared/schema";

export default function CustomerPortal() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const { toast } = useToast();

  const requestOTPMutation = useMutation({
    mutationFn: async (phone: string) => {
      const response = await api.post('/portal/request-otp', { phone });
      return response.data;
    },
    onSuccess: () => {
      setOtpSent(true);
      toast({
        title: "OTP Sent",
        description: "Please check your phone for the verification code",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to send OTP",
        variant: "destructive",
      });
    },
  });

  const loginMutation = useMutation({
    mutationFn: async ({ phone, otp }: { phone: string; otp: string }) => {
      const response = await api.post('/portal/login', { phone, otp });
      return response.data;
    },
    onSuccess: () => {
      setIsLoggedIn(true);
      toast({
        title: "Login Successful",
        description: "Welcome to your customer portal",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid OTP",
        variant: "destructive",
      });
    },
  });

  const queryClient = useQueryClient();
  
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['/portal/me/bookings'],
    queryFn: async () => {
      const response = await api.get('/portal/me/bookings');
      return response.data as BookingType[];
    },
    enabled: isLoggedIn,
  });

  const handleLogoutClick = async () => {
    try {
      await api.post('/portal/logout');
    } catch (error) {
      // Ignore logout errors
    }
    handleLogout();
  };

  const handleRequestOTP = () => {
    if (!phone) {
      toast({
        title: "Phone Required",
        description: "Please enter your phone number",
        variant: "destructive",
      });
      return;
    }
    requestOTPMutation.mutate(phone);
  };

  const handleLogin = () => {
    if (!phone || !otp) {
      toast({
        title: "Missing Information",
        description: "Please enter both phone number and OTP",
        variant: "destructive",
      });
      return;
    }
    loginMutation.mutate({ phone, otp });
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setOtpSent(false);
    setPhone("");
    setOtp("");
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Customer Portal</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={otpSent}
              />
            </div>
            
            {otpSent && (
              <div className="space-y-2">
                <Label htmlFor="otp">Verification Code</Label>
                <Input
                  id="otp"
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                />
              </div>
            )}
            
            <div className="space-y-2">
              {!otpSent ? (
                <Button 
                  onClick={handleRequestOTP} 
                  className="w-full"
                  disabled={requestOTPMutation.isPending}
                >
                  {requestOTPMutation.isPending ? "Sending..." : "Send Verification Code"}
                </Button>
              ) : (
                <Button 
                  onClick={handleLogin} 
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? "Verifying..." : "Login"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Portal</h1>
            <p className="text-gray-600">Manage your bookings and account</p>
          </div>
          <Button variant="outline" onClick={handleLogoutClick}>
            Logout
          </Button>
        </div>

        <Tabs defaultValue="bookings" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bookings">My Bookings</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings" className="space-y-4">
            <div className="grid gap-4">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading your bookings...</p>
                </div>
              ) : bookings && bookings.length > 0 ? (
                bookings.map((booking) => (
                  <BookingCard key={booking._id} booking={booking} />
                ))
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <p className="text-gray-600">No bookings found</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            <div className="grid gap-4">
              {bookings.filter(b => 
                isBookingDateTodayOrLater(b.preferredDate) &&
                !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(String(b.status || '').toUpperCase())
              ).map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <div className="grid gap-4">
              {bookings.filter(b => 
                ['COMPLETED', 'CANCELLED', 'NO_SHOW'].includes(String(b.status || '').toUpperCase())
              ).map((booking) => (
                <BookingCard key={booking._id} booking={booking} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function BookingCard({ booking }: { booking: BookingType }) {
  const statusColor = getStatusColor(booking.status as any);
  const bookingDate = getBookingDateOnly(booking.preferredDate);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showReschedule, setShowReschedule] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [reason, setReason] = useState('');

  const isUpcoming = isBookingDateTodayOrLater(booking.preferredDate);
  const normalizedStatus = String(booking.status || '').toUpperCase();
  const canModify = isUpcoming && normalizedStatus !== 'CANCELLED' && normalizedStatus !== 'COMPLETED';

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, newDate, reason }: { id: string; newDate: string; reason: string }) => {
      const response = await api.post(`/portal/me/bookings/${id}/reschedule`, { newDate, reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/portal/me/bookings'] });
      setShowReschedule(false);
      toast({
        title: "Reschedule Request Sent",
        description: "We'll contact you shortly to confirm the new date.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reschedule Failed",
        description: error.response?.data?.message || "Failed to reschedule booking",
        variant: "destructive",
      });
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      const response = await api.post(`/portal/me/bookings/${id}/cancel`, { reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/portal/me/bookings'] });
      setShowCancel(false);
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Cancellation Failed",
        description: error.response?.data?.message || "Failed to cancel booking",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-semibold text-lg">{(booking as any).activity?.name || 'Unknown Activity'}</h3>
            <p className="text-gray-600">Booking #{booking._id.slice(-8)}</p>
          </div>
          <Badge 
            variant="outline" 
            className={`${
              statusColor === 'red' ? 'border-red-500 text-red-700' :
              statusColor === 'green' ? 'border-green-500 text-green-700' :
              statusColor === 'blue' ? 'border-blue-500 text-blue-700' :
              statusColor === 'yellow' ? 'border-yellow-500 text-yellow-700' :
              statusColor === 'purple' ? 'border-purple-500 text-purple-700' :
              'border-gray-500 text-gray-700'
            }`}
          >
            {getStatusDisplayName(booking.status as any)}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{bookingDate?.toLocaleDateString() || 'Date unavailable'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{booking.preferredTime || 'Time to be confirmed'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{booking.numberOfPeople} people</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium">{booking.totalAmount} MAD</span>
          </div>
        </div>

        {booking.paymentStatus && (
          <div className="mb-4">
            <Badge variant={booking.paymentStatus === 'fully_paid' ? 'default' : 'secondary'}>
              Payment: {booking.paymentStatus === 'fully_paid' ? '✅ Paid' : 
                       booking.paymentStatus === 'deposit_paid' ? '💰 Deposit Paid' : 
                       '⏳ Unpaid'}
            </Badge>
            {booking.depositAmount && booking.paymentStatus === 'unpaid' && (
              <p className="text-xs text-gray-500 mt-1">
                Deposit Required: {booking.depositAmount} MAD
              </p>
            )}
          </div>
        )}

        {booking.notes && (
          <div className="bg-gray-50 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-700">{booking.notes}</p>
          </div>
        )}

        {canModify && (
          <div className="flex gap-2 mt-4">
            <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1">
                  <CalendarDays className="h-4 w-4 mr-2" />
                  Reschedule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reschedule Booking</DialogTitle>
                  <DialogDescription>
                    Request to change the date of your booking. We'll confirm the new date shortly.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="newDate">New Date</Label>
                    <Input
                      id="newDate"
                      type="datetime-local"
                      value={newDate}
                      onChange={(e) => setNewDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason (Optional)</Label>
                    <Textarea
                      id="reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why do you need to reschedule?"
                      rows={3}
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (!newDate) {
                        toast({
                          title: "Date Required",
                          description: "Please select a new date",
                          variant: "destructive",
                        });
                        return;
                      }
                      rescheduleMutation.mutate({ id: booking._id, newDate, reason });
                    }}
                    disabled={rescheduleMutation.isPending}
                    className="w-full"
                  >
                    {rescheduleMutation.isPending ? "Submitting..." : "Request Reschedule"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showCancel} onOpenChange={setShowCancel}>
              <DialogTrigger asChild>
                <Button variant="destructive" size="sm" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Cancel Booking</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to cancel this booking? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="cancelReason">Reason (Optional)</Label>
                    <Textarea
                      id="cancelReason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Why are you cancelling?"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setShowCancel(false)}
                      className="flex-1"
                    >
                      Keep Booking
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        cancelMutation.mutate({ id: booking._id, reason });
                      }}
                      disabled={cancelMutation.isPending}
                      className="flex-1"
                    >
                      {cancelMutation.isPending ? "Cancelling..." : "Cancel Booking"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
