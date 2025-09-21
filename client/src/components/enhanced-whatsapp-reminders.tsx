import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MessageCircle, 
  Send, 
  Clock, 
  MapPin, 
  Banknote,
  Calendar,
  User,
  Phone,
  AlertTriangle,
  CheckCircle,
  Zap
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import type { BookingType, ActivityType } from "marrakechdunes-shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

interface EnhancedWhatsAppRemindersProps {
  bookings: BookingWithActivity[];
}

export default function EnhancedWhatsAppReminders({ bookings }: EnhancedWhatsAppRemindersProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [sendingReminders, setSendingReminders] = useState<Set<string>>(new Set());
  const [customMessage, setCustomMessage] = useState<string>("");

  // Filter bookings that need reminders
  const upcomingBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.preferredDate);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    return hoursUntil > 0 && hoursUntil <= 48 && 
           (booking.paymentStatus === 'unpaid' || booking.paymentStatus === 'deposit_paid');
  });

  const sendReminderMutation = useMutation({
    mutationFn: async ({ 
      bookingId, 
      reminderType, 
      customMessage 
    }: { 
      bookingId: string; 
      reminderType: '24h' | '2h' | 'cash' | 'custom';
      customMessage?: string;
    }) => {
      const response = await apiFetch(`/admin/bookings/${bookingId}/reminder`, {
        method: 'POST',
        data: { 
          reminderType, 
          paymentReminder: true,
          customMessage: customMessage || undefined
        }
      });
      return response;
    },
    onSuccess: (_, variables) => {
      toast({
        title: "Reminder Sent",
        description: `WhatsApp reminder sent successfully to ${variables.bookingId}`,
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

  const handleSendReminder = (bookingId: string, reminderType: '24h' | '2h' | 'cash' | 'custom') => {
    setSendingReminders(prev => new Set(prev).add(bookingId));
    sendReminderMutation.mutate({ 
      bookingId, 
      reminderType,
      customMessage: reminderType === 'custom' ? customMessage : undefined
    });
  };

  const getUrgencyLevel = (booking: BookingWithActivity) => {
    const bookingDate = new Date(booking.preferredDate);
    const now = new Date();
    const hoursUntil = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (hoursUntil <= 2) return { level: 'urgent', color: 'red', text: 'URGENT - Within 2 hours' };
    if (hoursUntil <= 24) return { level: 'soon', color: 'yellow', text: 'Soon - Within 24 hours' };
    return { level: 'upcoming', color: 'blue', text: 'Upcoming - Within 48 hours' };
  };

  const getReminderTemplates = (booking: BookingWithActivity) => {
    const activity = booking.activity;
    const totalAmount = parseInt(booking.totalAmount);
    const paidAmount = booking.paidAmount || 0;
    const remainingAmount = totalAmount - paidAmount;
    const bookingDate = new Date(booking.preferredDate).toLocaleDateString();
    
    return {
      '24h': `🏜️ *MarrakechDunes Reminder* 🏜️

Hello ${booking.customerName}! 

Your ${activity.name} is scheduled for *${bookingDate}*.

💰 *Payment Details:*
${booking.paymentStatus === 'unpaid' 
  ? `Total: ${totalAmount} MAD (Cash payment on arrival)`
  : `Balance due: ${remainingAmount} MAD (Cash payment on arrival)`
}

📍 *Meeting Point:*
54 Riad Zitoun Lakdim, Marrakech 40000

⏰ *Arrival Time:* 15 minutes before scheduled time

📱 Questions? Reply to this message!

Looking forward to your adventure! 🐪`,

      '2h': `🚨 *URGENT - MarrakechDunes* 🚨

${booking.customerName}, your ${activity.name} is in 2 hours!

💰 *Cash Payment Required:*
${booking.paymentStatus === 'unpaid' 
  ? `${totalAmount} MAD on arrival`
  : `${remainingAmount} MAD balance on arrival`
}

📍 *Meeting Point:*
54 Riad Zitoun Lakdim, Marrakech 40000

⏰ *Please arrive 15 minutes early*

See you soon! 🏜️`,

      'cash': `💵 *Cash Payment Reminder* 💵

Hello ${booking.customerName}!

Just a friendly reminder about your upcoming ${activity.name} on ${bookingDate}.

💰 *Payment Information:*
${booking.paymentStatus === 'unpaid' 
  ? `Total: ${totalAmount} MAD (Cash only)`
  : `Balance: ${remainingAmount} MAD (Cash only)`
}

📍 *Meeting Point:* 54 Riad Zitoun Lakdim, Marrakech 40000

💡 *Tip:* Bring exact change in MAD for faster processing

Questions? Just reply! 😊`
    };
  };

  if (upcomingBookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            WhatsApp Cash Payment Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>All upcoming bookings are up to date!</p>
            <p className="text-sm">No payment reminders needed at this time.</p>
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
          WhatsApp Cash Payment Reminders
          <Badge variant="secondary">{upcomingBookings.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Custom Message Input */}
          <div className="space-y-2">
            <Label htmlFor="customMessage">Custom Message Template (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder="Enter a custom message template for reminders..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
            <p className="text-xs text-gray-500">
              Use {`{customerName}`, `{activityName}`, `{totalAmount}`, `{remainingAmount}`, `{bookingDate}`} as placeholders
            </p>
          </div>

          {/* Bookings List */}
          <div className="space-y-4">
            {upcomingBookings.map((booking) => {
              const urgency = getUrgencyLevel(booking);
              const isLoading = sendingReminders.has(booking._id);
              const templates = getReminderTemplates(booking);
              
              return (
                <div key={booking._id} className="border rounded-lg p-4 space-y-4">
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
                          <span>{new Date(booking.preferredDate).toLocaleDateString()}</span>
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
                         `${booking.totalAmount - (booking.paidAmount || 0)} MAD balance`}
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

                  {/* Reminder Actions */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => handleSendReminder(booking._id, '24h')}
                      className="text-xs"
                    >
                      {isLoading ? (
                        <Clock className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      24h Reminder
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => handleSendReminder(booking._id, '2h')}
                      className="text-xs"
                    >
                      <Zap className="w-3 h-3" />
                      Urgent (2h)
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading}
                      onClick={() => handleSendReminder(booking._id, 'cash')}
                      className="text-xs"
                    >
                      <Banknote className="w-3 h-3" />
                      Cash Reminder
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isLoading || !customMessage}
                      onClick={() => handleSendReminder(booking._id, 'custom')}
                      className="text-xs"
                    >
                      <MessageCircle className="w-3 h-3" />
                      Custom
                    </Button>
                  </div>

                  {/* Direct WhatsApp */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      onClick={() => window.open(`https://wa.me/${booking.customerPhone.replace(/[^0-9]/g, '')}`, '_blank')}
                    >
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Open WhatsApp Chat
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
