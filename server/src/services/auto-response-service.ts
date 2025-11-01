/**
 * FREE Auto-Response Service
 * Automatically generates responses to common customer inquiries
 * 100% Free - Uses notification queue for admin review
 */

import { storage } from '../storage.js';
import { freeNotificationQueue } from './free-notification-queue.js';

export interface CustomerMessage {
  id: string;
  phone: string;
  name?: string;
  message: string;
  timestamp: Date;
  type?: 'question' | 'booking_inquiry' | 'complaint' | 'compliment' | 'general';
  bookingId?: string;
}

export interface AutoResponse {
  message: string;
  confidence: number; // 0-1, how confident we are this is the right response
  type: 'auto' | 'needs_review'; // Auto-send or needs admin review
}

class AutoResponseService {
  private messageHistory: CustomerMessage[] = [];
  private readonly MAX_HISTORY = 500;

  /**
   * Analyze customer message and generate auto-response
   */
  async analyzeAndRespond(message: string, phone: string, customerName?: string): Promise<AutoResponse> {
    const normalizedMessage = message.toLowerCase().trim();
    
    // Store incoming message
    const customerMsg: CustomerMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      phone,
      name: customerName,
      message,
      timestamp: new Date()
    };
    
    // Try to find customer bookings
    const bookings = await storage.getBookings();
    const customerBookings = bookings.filter(b => b.customerPhone === phone);
    const upcomingBooking = customerBookings.find(b => 
      new Date(b.preferredDate) > new Date() && 
      b.status !== 'CANCELLED' && 
      b.status !== 'COMPLETED'
    );

    // Pattern matching for auto-responses
    let response: AutoResponse | null = null;

    // Booking confirmation requests
    if (this.matchesPattern(normalizedMessage, ['confirm', 'confirmation', 'confirmé', 'reserved', 'booked'])) {
      if (upcomingBooking) {
        const activity = await storage.getActivity(upcomingBooking.activityId);
        const date = new Date(upcomingBooking.preferredDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        
        response = {
          message: `✅ *Booking Confirmed!*

Activity: ${activity?.name || 'Your Activity'}
Date: ${date}
People: ${upcomingBooking.numberOfPeople}
Total: ${upcomingBooking.totalAmount} MAD
${upcomingBooking.paymentStatus === 'unpaid' ? '\n💰 Payment: Cash on arrival' : 
  upcomingBooking.paymentStatus === 'deposit_paid' ? `\n💰 Deposit Paid: ${upcomingBooking.paidAmount} MAD\nBalance: ${Number(upcomingBooking.totalAmount) - (upcomingBooking.paidAmount || 0)} MAD` :
  '\n✅ Fully Paid'}

See you soon! 🏜️`,
          confidence: 0.95,
          type: 'auto'
        };
        customerMsg.bookingId = upcomingBooking._id || upcomingBooking.id;
      }
    }

    // Date/time questions
    if (!response && this.matchesPattern(normalizedMessage, ['when', 'what time', 'quelle heure', 'à quelle heure', 'time', 'heure'])) {
      if (upcomingBooking) {
        const date = new Date(upcomingBooking.preferredDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        });
        
        response = {
          message: `📅 Your activity is scheduled for:

${date}

We'll send you a reminder 24 hours before with exact meeting point details.

If you need to reschedule, please contact us or use your customer portal.`,
          confidence: 0.9,
          type: 'auto'
        };
        customerMsg.bookingId = upcomingBooking._id || upcomingBooking.id;
      }
    }

    // Location/meeting point
    if (!response && this.matchesPattern(normalizedMessage, ['where', 'location', 'address', 'où', 'adresse', 'meeting', 'point', 'pickup'])) {
      response = {
        message: `📍 *Meeting Point Information*

We'll send you the exact meeting point location via WhatsApp 24 hours before your activity.

For most activities, pickup is available from your hotel/riad in Marrakech.

Need specific directions? Reply with your address and we'll provide detailed instructions! 🗺️`,
        confidence: 0.85,
        type: 'auto'
      };
    }

    // Payment questions
    if (!response && this.matchesPattern(normalizedMessage, ['payment', 'pay', 'paiement', 'deposit', 'acompte', 'price', 'prix', 'cost', 'coût'])) {
      if (upcomingBooking) {
        const total = Number(upcomingBooking.totalAmount) || 0;
        const paid = upcomingBooking.paidAmount || 0;
        const remaining = total - paid;
        
        response = {
          message: `💰 *Payment Information*

Total: ${total} MAD
${paid > 0 ? `Paid: ${paid} MAD\nRemaining: ${remaining} MAD` : 'Payment: Cash on arrival'}

${upcomingBooking.depositAmount && paid === 0 ? `💳 Deposit Required: ${upcomingBooking.depositAmount} MAD\nCan be paid before or on arrival.` : ''}

Payment methods: Cash only (MAD) 💵`,
          confidence: 0.9,
          type: 'auto'
        };
        customerMsg.bookingId = upcomingBooking._id || upcomingBooking.id;
      } else {
        response = {
          message: `💰 Payment for our activities is accepted in *cash (MAD)* on the day of the activity.

We also accept deposits via bank transfer. For pricing information, please visit our website or contact us.

Need help? We're here to assist! 😊`,
          confidence: 0.8,
          type: 'auto'
        };
      }
    }

    // Cancellation requests
    if (!response && this.matchesPattern(normalizedMessage, ['cancel', 'cancellation', 'annuler', 'annulation', 'refund', 'remboursement'])) {
      if (upcomingBooking) {
        response = {
          message: `We're sorry to hear you need to cancel. 

You can cancel your booking through your customer portal, or reply with "CANCEL" and we'll process it for you.

Cancellation policy:
• More than 48h before: Full refund
• Less than 48h: 50% refund
• Same day: No refund

Would you like to proceed with cancellation?`,
          confidence: 0.85,
          type: 'needs_review'
        };
        customerMsg.bookingId = upcomingBooking._id || upcomingBooking.id;
        customerMsg.type = 'booking_inquiry';
      }
    }

    // Reschedule requests
    if (!response && this.matchesPattern(normalizedMessage, ['reschedule', 'change date', 'change time', 'modifier', 'changer', 'postpone', 'reporté'])) {
      if (upcomingBooking) {
        response = {
          message: `📅 We can help you reschedule your booking!

You can change the date through your customer portal, or tell us your preferred new date and we'll check availability.

Rescheduling is free if done more than 48 hours before your activity.

What date would work better for you?`,
          confidence: 0.9,
          type: 'auto'
        };
        customerMsg.bookingId = upcomingBooking._id || upcomingBooking.id;
        customerMsg.type = 'booking_inquiry';
      }
    }

    // Weather questions
    if (!response && this.matchesPattern(normalizedMessage, ['weather', 'rain', 'sun', 'météo', 'pluie', 'soleil'])) {
      response = {
        message: `🌤️ Weather in Marrakech is generally sunny and pleasant!

Most activities operate in all weather conditions. However, if severe weather is forecast, we'll contact you 24 hours in advance to discuss options.

Hot air balloon rides may be postponed due to wind conditions - we'll notify you the evening before.

Your safety is our priority! ☀️`,
        confidence: 0.8,
        type: 'auto'
      };
    }

    // What to bring questions
    if (!response && this.matchesPattern(normalizedMessage, ['bring', 'need', 'what to', 'apporter', 'besoin', 'quoi apporter'])) {
      response = {
        message: `🎒 *What to Bring*

✅ Comfortable shoes
✅ Sunscreen & hat
✅ Camera
✅ Water bottle
✅ Cash for payment
✅ ID/Passport

Specific items depend on your activity:
• Desert tours: Warm clothes for evening
• Mountain hikes: Good hiking boots
• Hot air balloon: Early morning - bring a jacket

Need activity-specific details? Just ask! 😊`,
        confidence: 0.85,
        type: 'auto'
      };
    }

    // Thank you / appreciation
    if (!response && this.matchesPattern(normalizedMessage, ['thank', 'thanks', 'merci', 'appreciate', 'great', 'excellent'])) {
      response = {
        message: `🙏 Thank you so much! 

We're thrilled you enjoyed your experience with us! Your feedback means the world to us.

If you have a moment, we'd love a review on Google or TripAdvisor. It helps other travelers discover amazing experiences in Morocco!

Looking forward to hosting you again! 🏜️✨`,
        confidence: 0.9,
        type: 'auto'
      };
      customerMsg.type = 'compliment';
    }

    // Greetings / Hello
    if (!response && this.matchesPattern(normalizedMessage, ['hello', 'hi', 'bonjour', 'bonsoir', 'salut', 'hey'])) {
      if (upcomingBooking) {
        const activity = await storage.getActivity(upcomingBooking.activityId);
        response = {
          message: `👋 Hello${customerName ? ` ${customerName}` : ''}! 

We're excited about your upcoming ${activity?.name || 'activity'}! 

How can we help you today?
• Booking details
• Date/time questions
• Payment information
• Directions
• Reschedule/cancel

Just ask! 😊`,
          confidence: 0.95,
          type: 'auto'
        };
        customerMsg.bookingId = upcomingBooking._id || upcomingBooking.id;
      } else {
        response = {
          message: `👋 Hello${customerName ? ` ${customerName}` : ''}! 

Welcome to MarrakechDunes! 🏜️

We're here to help you discover amazing experiences in Morocco. 

How can we assist you today?
• Book an activity
• Get information
• Check availability
• Ask questions

Just let us know what you need! 😊`,
          confidence: 0.9,
          type: 'auto'
        };
      }
    }

    // Default response for unmatched queries
    if (!response) {
      response = {
        message: `Hello${customerName ? ` ${customerName}` : ''}! 

Thank you for contacting MarrakechDunes! 🙏

We received your message and one of our team members will get back to you shortly.

For quick answers:
• Booking info: Check your customer portal
• Urgent matters: Call +212 600 623 630

We'll respond as soon as possible! 😊`,
        confidence: 0.5,
        type: 'needs_review'
      };
      customerMsg.type = 'general';
    }

    // Store message in history
    this.addMessage(customerMsg);

    // Add response to notification queue for admin to review/send
    freeNotificationQueue.addNotification({
      type: 'auto_response',
      customerPhone: phone,
      customerName: customerName || 'Customer',
      message: response.message,
      whatsappLink: freeNotificationQueue.generateWhatsAppLink(phone, response.message),
      priority: response.type === 'needs_review' ? 'high' : response.confidence > 0.8 ? 'medium' : 'low',
      bookingId: customerMsg.bookingId,
      metadata: {
        activityName: upcomingBooking ? 'Check booking' : undefined,
        date: customerMsg.timestamp.toString(),
        originalMessage: message,
        confidence: response.confidence,
        needsReview: response.type === 'needs_review'
      }
    });

    return response;
  }

  /**
   * Check if message matches any patterns
   */
  private matchesPattern(message: string, patterns: string[]): boolean {
    return patterns.some(pattern => message.includes(pattern));
  }

  /**
   * Add message to history
   */
  private addMessage(message: CustomerMessage): void {
    this.messageHistory.unshift(message);
    if (this.messageHistory.length > this.MAX_HISTORY) {
      this.messageHistory = this.messageHistory.slice(0, this.MAX_HISTORY);
    }
  }

  /**
   * Get message history for a phone number
   */
  getMessageHistory(phone: string, limit = 10): CustomerMessage[] {
    return this.messageHistory
      .filter(msg => msg.phone === phone)
      .slice(0, limit);
  }

  /**
   * Get all messages (admin view)
   */
  getAllMessages(limit = 50): CustomerMessage[] {
    return this.messageHistory.slice(0, limit);
  }
}

export const autoResponseService = new AutoResponseService();

