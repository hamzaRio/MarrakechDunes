import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Bell, MessageCircle, Clock, CheckCircle, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface NotificationTemplate {
  id: string;
  type: 'booking_confirmation' | 'reminder_24h' | 'reminder_2h' | 'weather_alert' | 'payment_reminder';
  title: string;
  template: string;
  timing: 'immediate' | 'scheduled';
  conditions: string[];
}

interface SmartNotification {
  id: string;
  type: string;
  recipient: string;
  message: string;
  status: 'pending' | 'sent' | 'failed';
  scheduledFor?: Date;
  sentAt?: Date;
  template: string;
  personalization: Record<string, string>;
}

const notificationTemplates: NotificationTemplate[] = [
  {
    id: 'booking_confirmation',
    type: 'booking_confirmation',
    title: 'Booking Confirmation',
    template: `🎉 Booking Confirmed!

Hello {customerName},
Your {activityName} is confirmed for {date} at {time}.

📋 Details:
• Participants: {numberOfPeople}
• Meeting Point: {meetingPoint}
• Total Amount: {totalAmount} MAD
• Payment: {paymentMethod}

We'll contact you 24h before your activity.
See you soon! 🚀`,
    timing: 'immediate',
    conditions: ['booking_created']
  },
  {
    id: 'reminder_24h',
    type: 'reminder_24h',
    title: '24-Hour Reminder',
    template: `⏰ Reminder: Your activity is tomorrow!

Hello {customerName},
Don't forget your {activityName} tomorrow at {time}.

📍 Meeting Point: {meetingPoint}
💰 Amount to pay: {remainingAmount} MAD

Weather: {weatherForecast}
What to bring: {preparationList}

See you tomorrow! 🌟`,
    timing: 'scheduled',
    conditions: ['24_hours_before']
  },
  {
    id: 'reminder_2h',
    type: 'reminder_2h',
    title: '2-Hour Reminder',
    template: `🚀 Final Reminder!

Hello {customerName},
Your {activityName} starts in 2 hours at {time}.

📍 Meeting Point: {meetingPoint}
👥 Guide: {guideName} ({guidePhone})

Please arrive 15 minutes early.
See you soon! 🎯`,
    timing: 'scheduled',
    conditions: ['2_hours_before']
  },
  {
    id: 'weather_alert',
    type: 'weather_alert',
    title: 'Weather Alert',
    template: `🌤️ Weather Update

Hello {customerName},
Weather forecast for your {activityName} tomorrow:

{weatherForecast}

{weatherRecommendation}

If you have any concerns, please contact us.
Stay safe! ☔`,
    timing: 'immediate',
    conditions: ['weather_warning']
  },
  {
    id: 'payment_reminder',
    type: 'payment_reminder',
    title: 'Payment Reminder',
    template: `💳 Payment Reminder

Hello {customerName},
Reminder: {remainingAmount} MAD is due on arrival for your {activityName}.

Payment methods:
• Cash (preferred)
• Bank transfer (contact us)

See you tomorrow! 💰`,
    timing: 'scheduled',
    conditions: ['deposit_paid', '24_hours_before']
  }
];

export default function SmartNotifications() {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [selectedBookings, setSelectedBookings] = useState<string[]>([]);

  // Get pending notifications
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiFetch<SmartNotification[]>('/admin/notifications')
  });

  // Get bookings for notification targeting
  const { data: bookings = [] } = useQuery({
    queryKey: ['bookings'],
    queryFn: () => apiFetch('/bookings')
  });

  // Send notification mutation
  const sendNotificationMutation = useMutation({
    mutationFn: async (data: {
      templateId: string;
      bookingIds: string[];
      customMessage?: string;
    }) => {
      return apiFetch('/admin/notifications/send', {
        method: 'POST',
        data
      });
    },
    onSuccess: () => {
      refetch();
      setSelectedBookings([]);
      setCustomMessage('');
    }
  });

  // Auto-send notifications based on conditions
  useEffect(() => {
    const checkAutoNotifications = async () => {
      const now = new Date();
      
      // Check for 24h reminders
      const bookings24h = bookings.filter((booking: any) => {
        const bookingDate = new Date(booking.preferredDate);
        const timeDiff = bookingDate.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000;
      });

      if (bookings24h.length > 0) {
        // Auto-send 24h reminders
        sendNotificationMutation.mutate({
          templateId: 'reminder_24h',
          bookingIds: bookings24h.map((b: any) => b._id)
        });
      }

      // Check for 2h reminders
      const bookings2h = bookings.filter((booking: any) => {
        const bookingDate = new Date(booking.preferredDate);
        const timeDiff = bookingDate.getTime() - now.getTime();
        return timeDiff > 0 && timeDiff <= 2 * 60 * 60 * 1000;
      });

      if (bookings2h.length > 0) {
        // Auto-send 2h reminders
        sendNotificationMutation.mutate({
          templateId: 'reminder_2h',
          bookingIds: bookings2h.map((b: any) => b._id)
        });
      }
    };

    // Check every 30 minutes
    const interval = setInterval(checkAutoNotifications, 30 * 60 * 1000);
    checkAutoNotifications(); // Initial check

    return () => clearInterval(interval);
  }, [bookings, sendNotificationMutation]);

  const handleSendNotification = () => {
    if (!selectedTemplate || selectedBookings.length === 0) return;

    sendNotificationMutation.mutate({
      templateId: selectedTemplate,
      bookingIds: selectedBookings,
      customMessage: customMessage || undefined
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_confirmation': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'reminder_24h': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'reminder_2h': return <Bell className="w-5 h-5 text-orange-500" />;
      case 'weather_alert': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'payment_reminder': return <MessageCircle className="w-5 h-5 text-purple-500" />;
      default: return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'failed': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification Templates */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Smart Notification Templates</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {notificationTemplates.map((template) => (
            <div
              key={template.id}
              className={`p-4 rounded-lg border cursor-pointer transition-all ${
                selectedTemplate === template.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                {getNotificationIcon(template.type)}
                <h4 className="font-medium text-gray-900">{template.title}</h4>
              </div>
              
              <p className="text-sm text-gray-600 mb-3">
                {template.timing === 'immediate' ? 'Sends immediately' : 'Scheduled delivery'}
              </p>
              
              <div className="text-xs text-gray-500">
                Conditions: {template.conditions.join(', ')}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Send Custom Notification */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Send Custom Notification</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Bookings
            </label>
            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-3">
              {bookings.map((booking: any) => (
                <label key={booking._id} className="flex items-center gap-2 p-2 hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedBookings.includes(booking._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBookings([...selectedBookings, booking._id]);
                      } else {
                        setSelectedBookings(selectedBookings.filter(id => id !== booking._id));
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">
                    {booking.customerName} - {booking.activity?.name} ({booking.preferredDate})
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Custom Message (Optional)
            </label>
            <textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
              placeholder="Add a custom message to the template..."
            />
          </div>

          <button
            onClick={handleSendNotification}
            disabled={!selectedTemplate || selectedBookings.length === 0 || sendNotificationMutation.isPending}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sendNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
          </button>
        </div>
      </div>

      {/* Notification History */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
        
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3">
                {getNotificationIcon(notification.type)}
                <div>
                  <p className="font-medium text-gray-900">{notification.recipient}</p>
                  <p className="text-sm text-gray-600">{notification.message.substring(0, 100)}...</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(notification.status)}`}>
                  {notification.status}
                </span>
                <span className="text-xs text-gray-500">
                  {notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
