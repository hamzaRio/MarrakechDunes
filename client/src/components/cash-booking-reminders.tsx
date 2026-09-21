import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Send, 
  Banknote, 
  MessageCircle, 
  Calendar,
  User,
  Phone,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { getBookingCalendarDayDistance, getBookingCalendarDayLabel, getBookingDateOnly } from "@/lib/booking-utils";
import type { BookingType, ActivityType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

interface CashBookingRemindersProps {
  bookings: BookingWithActivity[];
}

export default function CashBookingReminders({ bookings }: CashBookingRemindersProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sendingReminders, setSendingReminders] = useState<Set<string>>(new Set());

  // Filter bookings that need reminders
  const upcomingBookings = bookings.filter(booking => {
    const daysUntil = getBookingCalendarDayDistance(booking.preferredDate);
    
    // Booking dates have no time-of-day, so use Casablanca calendar days.
    return daysUntil !== null && daysUntil >= 0 && daysUntil <= 2 &&
           (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'deposit_paid');
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ bookingId, reminderType }: { bookingId: string; reminderType: '24h' | '2h' | 'cash' }) => {
      const response = await apiFetch(`/admin/bookings/${bookingId}/reminder`, {
        method: 'POST',
        data: { reminderType, paymentReminder: true }
      });
      return response;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Reminder Sent",
        description: `Cash payment reminder sent successfully`,
      });
      setSendingReminders(prev => {
        const newSet = new Set(prev);
        newSet.delete(variables.bookingId);
        return newSet;
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Send Reminder",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendReminder = (bookingId: string, reminderType: '24h' | '2h' | 'cash') => {
    setSendingReminders(prev => new Set(prev).add(bookingId));
    sendReminderMutation.mutate({ bookingId, reminderType });
  };

  const getUrgencyLevel = (booking: BookingWithActivity) => {
    const label = getBookingCalendarDayLabel(booking.preferredDate);
    if (label === 'Today') return { level: 'urgent', text: label };
    if (label === 'Tomorrow') return { level: 'soon', text: label };
    return { level: 'upcoming', text: label };
  };

  if (upcomingBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Cash Payment Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No upcoming bookings need payment reminders</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Cash Payment Reminders
          <Badge variant="secondary">{upcomingBookings.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingBookings.map((booking) => {
            const urgency = getUrgencyLevel(booking);
            const isLoading = sendingReminders.has(booking._id);
            
            return (
              <div key={booking._id} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-500" />
                      <span className="font-medium">{booking.customerName}</span>
                      <Badge 
                        variant={urgency.level === 'urgent' ? 'destructive' : 
                                urgency.level === 'soon' ? 'secondary' : 'default'}
                      >
                        {urgency.text}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{getBookingDateOnly(booking.preferredDate)?.toLocaleDateString() || 'Date unavailable'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Phone className="w-4 h-4" />
                        <span>{booking.customerPhone}</span>
                      </div>
                    </div>
                    
                    <div className="text-sm">
                      <span className="font-medium">{booking.activity.name}</span>
                      <span className="text-gray-500"> • {booking.numberOfPeople} people</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-moroccan-red">
                      {booking.totalAmount} MAD
                    </div>
                    <div className="text-xs text-gray-500">
                      {booking.paymentStatus === 'unpaid' ? 'Full payment due' : 
                        `${Number(booking.totalAmount) - (Number(booking.paidAmount) || 0)} MAD balance`}
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="flex items-center gap-2 p-2 bg-moroccan-gold/10 rounded">
                  <Banknote className="w-4 h-4 text-moroccan-red" />
                  <span className="text-sm font-medium">
                    {booking.paymentStatus === 'unpaid' ? 'CASH PAYMENT REQUIRED ON ARRIVAL' :
                     booking.paymentStatus === 'deposit_paid' ? 'CASH BALANCE DUE ON ARRIVAL' :
                     'FULLY PAID'}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={isLoading}
                    onClick={() => handleSendReminder(booking._id, 'cash')}
                  >
                    {isLoading ? (
                      <Clock className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    Cash Reminder
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`https://wa.me/${booking.customerPhone.replace(/[^0-9]/g, '')}`, '_blank')}
                  >
                    <MessageCircle className="w-4 h-4" />
                    WhatsApp
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
