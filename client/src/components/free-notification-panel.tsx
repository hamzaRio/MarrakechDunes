/**
 * FREE Notification Panel
 * Shows pending WhatsApp messages that admins can send with one click
 * 100% Free - No API costs, uses WhatsApp web links
 */

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, Send, Check, Clock, DollarSign, Calendar, Users, ExternalLink, Bell } from "lucide-react";

interface Notification {
  id: string;
  type: 'booking_confirmation' | 'reminder_24h' | 'reminder_2h' | 'payment_confirmation' | 'reschedule' | 'cancellation';
  customerPhone: string;
  customerName: string;
  message: string;
  whatsappLink: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
  bookingId?: string;
  metadata?: {
    activityName?: string;
    date?: string;
    amount?: number;
  };
}

interface NotificationStats {
  total: number;
  byType: {
    booking_confirmation: number;
    reminder_24h: number;
    reminder_2h: number;
    payment_confirmation: number;
    reschedule: number;
    cancellation: number;
    auto_response: number;
  };
  byPriority: {
    high: number;
    medium: number;
    low: number;
  };
}

export default function FreeNotificationPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('all');

  const { data, isLoading } = useQuery<{ notifications: Notification[]; stats: NotificationStats }>({
    queryKey: ['/admin/notifications'],
    queryFn: async () => {
      const response = await api.get('/admin/notifications');
      return response.data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const markSentMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.post(`/admin/notifications/${id}/mark-sent`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/admin/notifications'] });
      toast({
        title: "Marked as Sent",
        description: "Notification removed from queue",
      });
    },
  });

  const handleSendClick = (notification: Notification) => {
    // Open WhatsApp link in new tab
    window.open(notification.whatsappLink, '_blank', 'noopener,noreferrer');
    
    // Mark as sent after 2 seconds (give time to send)
    setTimeout(() => {
      markSentMutation.mutate(notification.id);
    }, 2000);

    toast({
      title: "WhatsApp Opening",
      description: "Click send in WhatsApp to complete notification",
    });
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'booking_confirmation':
        return <Check className="h-4 w-4" />;
      case 'reminder_24h':
      case 'reminder_2h':
        return <Bell className="h-4 w-4" />;
      case 'payment_confirmation':
        return <DollarSign className="h-4 w-4" />;
      case 'reschedule':
        return <Calendar className="h-4 w-4" />;
      case 'cancellation':
        return <Clock className="h-4 w-4" />;
      case 'auto_response':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <MessageCircle className="h-4 w-4" />;
    }
  };

  const getNotificationLabel = (type: Notification['type']) => {
    switch (type) {
      case 'booking_confirmation':
        return 'Booking Confirmation';
      case 'reminder_24h':
        return '24h Reminder';
      case 'reminder_2h':
        return '2h Reminder';
      case 'payment_confirmation':
        return 'Payment Confirmed';
      case 'reschedule':
        return 'Reschedule Request';
      case 'cancellation':
        return 'Cancellation';
      case 'auto_response':
        return 'Auto-Response';
      default:
        return type;
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  const notifications = data?.notifications || [];
  const stats = data?.stats;
  const filteredNotifications = selectedType === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === selectedType);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            FREE WhatsApp Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading notifications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            FREE WhatsApp Notifications
            <Badge variant="secondary" className="ml-2">
              {notifications.length} Pending
            </Badge>
          </CardTitle>
          {stats && (
            <div className="flex gap-2 text-sm">
              <Badge variant={stats.byPriority.high > 0 ? 'destructive' : 'secondary'}>
                {stats.byPriority.high} High
              </Badge>
              <Badge variant="default">
                {stats.byPriority.medium} Medium
              </Badge>
            </div>
          )}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Click "Send via WhatsApp" to open WhatsApp web and send the message. 100% Free - No API costs!
        </p>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No pending notifications</p>
            <p className="text-sm text-gray-500 mt-2">
              New bookings and reminders will appear here
            </p>
          </div>
        ) : (
          <>
            <Tabs value={selectedType} onValueChange={setSelectedType} className="mb-4">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
                <TabsTrigger value="booking_confirmation">
                  Confirmations ({stats?.byType.booking_confirmation || 0})
                </TabsTrigger>
                <TabsTrigger value="reminder_24h">
                  24h ({stats?.byType.reminder_24h || 0})
                </TabsTrigger>
                <TabsTrigger value="reminder_2h">
                  2h ({stats?.byType.reminder_2h || 0})
                </TabsTrigger>
                <TabsTrigger value="auto_response">
                  Auto ({stats?.byType.auto_response || 0})
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {filteredNotifications.map((notification) => (
                <Card key={notification.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        <div>
                          <h4 className="font-semibold">{getNotificationLabel(notification.type)}</h4>
                          <p className="text-sm text-gray-600">
                            To: {notification.customerName} ({notification.customerPhone})
                          </p>
                        </div>
                      </div>
                      <Badge variant={getPriorityColor(notification.priority) as any}>
                        {notification.priority}
                      </Badge>
                    </div>

                    {notification.metadata?.activityName && (
                      <div className="mb-2">
                        <Badge variant="outline">
                          {notification.metadata.activityName}
                        </Badge>
                        {notification.metadata.date && (
                          <span className="text-sm text-gray-600 ml-2">
                            {new Date(notification.metadata.date).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    )}

                    {notification.type === 'auto_response' && notification.metadata?.originalMessage && (
                      <div className="mb-2 p-2 bg-blue-50 rounded border border-blue-200">
                        <p className="text-xs font-semibold text-blue-700 mb-1">Customer Message:</p>
                        <p className="text-sm text-blue-900">{notification.metadata.originalMessage}</p>
                        {notification.metadata.confidence !== undefined && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Confidence: {Math.round(notification.metadata.confidence * 100)}%
                            {notification.metadata.needsReview && ' • Needs Review'}
                          </Badge>
                        )}
                      </div>
                    )}

                    <div className="bg-gray-50 p-3 rounded-lg mb-3">
                      <p className="text-sm whitespace-pre-wrap">{notification.message}</p>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleSendClick(notification)}
                        className="gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Send via WhatsApp
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

