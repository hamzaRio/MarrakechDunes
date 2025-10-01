import type { NotificationTemplate } from "marrakechdunes-shared/schema";

export interface NotificationData {
  customerName: string;
  customerPhone: string;
  activityName: string;
  numberOfPeople: number;
  preferredDate: Date;
  totalAmount: number;
  paymentMethod?: string;
  paymentStatus?: string;
  status?: string;
  notes?: string;
  bookingId?: string;
  meetingPoint?: string;
  guideContact?: string;
  emergencyContact?: string;
}

export const NOTIFICATION_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'booking_confirmation',
    name: 'Booking Confirmation',
    description: 'Sent immediately when booking is created',
    template: `🏜️ MarrakechDunes Booking Confirmation

Customer: {{customerName}}
Activity: {{activityName}}
Date: {{preferredDate}}
Time: {{preferredTime}}
Participants: {{numberOfPeople}}
Total: {{totalAmount}} MAD
Payment: Cash on Arrival 💵

Meeting Point: {{meetingPoint}}
Guide Contact: {{guideContact}}
Emergency Contact: {{emergencyContact}}

Status: PENDING CONFIRMATION
Next Steps: Guide will confirm within 2 hours

Thank you for choosing MarrakechDunes!`,
    variables: ['customerName', 'activityName', 'preferredDate', 'preferredTime', 'numberOfPeople', 'totalAmount', 'meetingPoint', 'guideContact', 'emergencyContact'],
    timing: 'immediate'
  },
  {
    id: 'payment_reminder',
    name: 'Payment Reminder',
    description: 'Sent for payment reminders',
    template: `💰 Payment Reminder - MarrakechDunes

Customer: {{customerName}}
Activity: {{activityName}}
Date: {{preferredDate}}
Amount: {{totalAmount}} MAD

Payment Due: Before tour starts
Payment Method: Cash on Arrival
Meeting Point: {{meetingPoint}}

Guide Contact: {{guideContact}}
Thank you!`,
    variables: ['customerName', 'activityName', 'preferredDate', 'totalAmount', 'meetingPoint', 'guideContact'],
    timing: 'scheduled'
  },
  {
    id: 'tour_reminder',
    name: 'Tour Reminder',
    description: 'Sent before tour starts',
    template: `🎯 Tour Reminder - MarrakechDunes

Customer: {{customerName}}
Activity: {{activityName}}
Date: {{preferredDate}}
Time: {{preferredTime}}

Meeting Point: {{meetingPoint}}
Guide Contact: {{guideContact}}
Emergency Contact: {{emergencyContact}}

Please arrive 15 minutes early
Bring: {{packingList}}

See you soon!`,
    variables: ['customerName', 'activityName', 'preferredDate', 'preferredTime', 'meetingPoint', 'guideContact', 'emergencyContact', 'packingList'],
    timing: 'scheduled'
  },
  {
    id: 'post_tour_followup',
    name: 'Post-Tour Follow-up',
    description: 'Sent after tour completion',
    template: `⭐ Tour Completed - MarrakechDunes

Thank you for choosing MarrakechDunes!

Activity: {{activityName}}
Date: {{preferredDate}}
Guide: {{guideName}}

We hope you enjoyed your experience!
Please leave a review: {{reviewLink}}

Book your next adventure: {{websiteLink}}`,
    variables: ['activityName', 'preferredDate', 'guideName', 'reviewLink', 'websiteLink'],
    timing: 'scheduled'
  },
  {
    id: 'weather_alert',
    name: 'Weather Alert',
    description: 'Sent when weather conditions change',
    template: `🌤️ Weather Alert - MarrakechDunes

Customer: {{customerName}}
Activity: {{activityName}}
Date: {{preferredDate}}

Weather Update: {{weatherCondition}}
Recommendation: {{weatherRecommendation}}

Please contact us if you have concerns: {{guideContact}}

Stay safe!`,
    variables: ['customerName', 'activityName', 'preferredDate', 'weatherCondition', 'weatherRecommendation', 'guideContact'],
    timing: 'immediate'
  }
];

export function formatNotificationTemplate(
  template: NotificationTemplate,
  data: NotificationData
): string {
  let message = template.template;
  
  // Replace template variables with actual data
  template.variables.forEach(variable => {
    const value = getVariableValue(variable, data);
    const placeholder = `{{${variable}}}`;
    message = message.replace(new RegExp(placeholder, 'g'), value || '');
  });
  
  return message;
}

function getVariableValue(variable: string, data: NotificationData): string {
  const valueMap: Record<string, string> = {
    customerName: data.customerName,
    activityName: data.activityName,
    numberOfPeople: data.numberOfPeople.toString(),
    totalAmount: data.totalAmount.toString(),
    preferredDate: data.preferredDate.toLocaleDateString(),
    preferredTime: data.preferredDate.toLocaleTimeString(),
    meetingPoint: data.meetingPoint || 'TBD',
    guideContact: data.guideContact || '+212600000000',
    emergencyContact: data.emergencyContact || '+212700000000',
    paymentMethod: data.paymentMethod || 'Cash',
    paymentStatus: data.paymentStatus || 'Pending',
    status: data.status || 'PENDING',
    notes: data.notes || '',
    bookingId: data.bookingId || 'N/A',
    packingList: getPackingList(data.activityName),
    guideName: 'Your Guide',
    reviewLink: 'https://marrakech-dunes.vercel.app/reviews',
    websiteLink: 'https://marrakech-dunes.vercel.app',
    weatherCondition: 'Sunny with clear skies',
    weatherRecommendation: 'Perfect weather for outdoor activities'
  };
  
  return valueMap[variable] || '';
}

function getPackingList(activityName: string): string {
  const packingLists: Record<string, string> = {
    'Hot Air Balloon': 'Comfortable clothes, camera, sunglasses',
    'Desert Safari': 'Sun hat, sunscreen, comfortable shoes, camera',
    'Ouzoud Waterfalls': 'Swimming gear, towel, waterproof camera',
    'Ourika Valley': 'Hiking shoes, water bottle, camera',
    'Essaouira Day Trip': 'Light jacket, camera, comfortable walking shoes'
  };
  
  return packingLists[activityName] || 'Comfortable clothes, camera, water bottle';
}

export function getTemplateById(id: string): NotificationTemplate | undefined {
  return NOTIFICATION_TEMPLATES.find(template => template.id === id);
}
