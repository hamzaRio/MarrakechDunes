import twilio from 'twilio';
import { randomInt } from 'crypto';

interface OTPSession {
  otp: string;
  phone: string;
  expiresAt: Date;
  attempts: number;
}

class TwilioService {
  private client: twilio.Twilio | null = null;
  private otpStore: Map<string, OTPSession> = new Map();
  private readonly OTP_EXPIRY_MINUTES = 10;
  private readonly MAX_ATTEMPTS = 3;

  constructor() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (accountSid && authToken) {
      this.client = twilio(accountSid, authToken);
      console.log('✅ Twilio service initialized');
    } else {
      console.warn('⚠️ Twilio credentials not found - OTP and WhatsApp disabled. Add TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to .env');
    }

    // Clean up expired OTPs every 5 minutes
    setInterval(() => this.cleanupExpiredOTPs(), 5 * 60 * 1000);
  }

  /**
   * Check if Twilio is configured
   */
  isConfigured(): boolean {
    return this.client !== null;
  }

  /**
   * Generate and send OTP via SMS
   */
  async sendOTP(phone: string): Promise<{ success: boolean; message: string }> {
    if (!this.client) {
      // Fallback: Store OTP in memory for development/testing
      const otp = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);
      
      this.otpStore.set(phone, {
        otp,
        phone,
        expiresAt,
        attempts: 0
      });

      console.log(`[TWILIO] Development mode - OTP for ${phone}: ${otp} (valid for ${this.OTP_EXPIRY_MINUTES} minutes)`);
      return { success: true, message: `OTP sent (dev mode - check console for code: ${otp})` };
    }

    try {
      // Generate 6-digit OTP
      const otp = randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + this.OTP_EXPIRY_MINUTES * 60 * 1000);

      // Store OTP
      this.otpStore.set(phone, {
        otp,
        phone,
        expiresAt,
        attempts: 0
      });

      // Send SMS
      const message = `Your MarrakechDunes verification code is: ${otp}. Valid for ${this.OTP_EXPIRY_MINUTES} minutes.`;
      
      await this.client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phone
      });

      console.log(`[TWILIO] OTP sent to ${phone}`);
      return { success: true, message: 'OTP sent successfully' };
    } catch (error: any) {
      console.error('[TWILIO] Error sending OTP:', error.message);
      return { success: false, message: `Failed to send OTP: ${error.message}` };
    }
  }

  /**
   * Send WhatsApp message (FREE MODE: Returns clickable link instead)
   */
  async sendWhatsApp(phone: string, message: string): Promise<boolean> {
    if (!this.client || !process.env.TWILIO_WHATSAPP_NUMBER) {
      // FREE MODE: Generate WhatsApp link and log it
      const whatsappLink = this.generateWhatsAppLink(phone, message);
      console.log(`\n📱 FREE WhatsApp Message (Click to send):`);
      console.log(`   To: ${phone}`);
      console.log(`   Link: ${whatsappLink}`);
      console.log(`   Message:\n   ${message.split('\n').join('\n   ')}\n`);
      return false; // Return false so system knows to use fallback
    }

    try {
      await this.client.messages.create({
        body: message,
        from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`,
        to: `whatsapp:${phone}`
      });

      console.log(`[TWILIO] WhatsApp sent to ${phone}`);
      return true;
    } catch (error: any) {
      console.error('[TWILIO] WhatsApp error:', error.message);
      return false;
    }
  }

  /**
   * Generate WhatsApp web link (FREE - no API needed)
   */
  private generateWhatsAppLink(phone: string, message: string): string {
    const cleanPhone = phone.replace(/\D/g, ''); // Remove non-digits
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  }

  /**
   * Get WhatsApp link for phone and message (for UI display)
   */
  getWhatsAppLink(phone: string, message: string): string {
    return this.generateWhatsAppLink(phone, message);
  }

  /**
   * Verify OTP
   */
  verifyOTP(phone: string, otp: string): { valid: boolean; message: string } {
    const session = this.otpStore.get(phone);

    if (!session) {
      return { valid: false, message: 'OTP not found or expired. Please request a new one.' };
    }

    // Check expiry
    if (new Date() > session.expiresAt) {
      this.otpStore.delete(phone);
      return { valid: false, message: 'OTP expired. Please request a new one.' };
    }

    // Check attempts
    if (session.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(phone);
      return { valid: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Verify OTP
    if (session.otp === otp) {
      this.otpStore.delete(phone); // OTP is single-use
      return { valid: true, message: 'OTP verified successfully' };
    }

    // Increment attempts
    session.attempts++;
    this.otpStore.set(phone, session);

    return { 
      valid: false, 
      message: `Invalid OTP. ${this.MAX_ATTEMPTS - session.attempts} attempts remaining.` 
    };
  }

  /**
   * Clean up expired OTPs
   */
  private cleanupExpiredOTPs(): void {
    const now = new Date();
    for (const [phone, session] of this.otpStore.entries()) {
      if (now > session.expiresAt) {
        this.otpStore.delete(phone);
      }
    }
  }

  /**
   * Send booking confirmation via WhatsApp
   */
  async sendBookingConfirmation(booking: {
    customerPhone: string;
    customerName: string;
    activityName: string;
    preferredDate: Date | string;
    numberOfPeople: number;
    totalAmount: number | string;
    depositAmount?: number;
    paymentMethod?: string;
  }): Promise<boolean> {
    const activityName = booking.activityName || 'Activity';
    const date = new Date(booking.preferredDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    const total = typeof booking.totalAmount === 'string' ? booking.totalAmount : `${booking.totalAmount} MAD`;
    const deposit = booking.depositAmount ? `${booking.depositAmount} MAD` : null;

    const message = `
🎉 *Booking Confirmed!*

Activity: ${activityName}
Date: ${date}
People: ${booking.numberOfPeople}
Total: ${total}${deposit ? `\nDeposit Required: ${deposit}` : ''}

Payment: ${booking.depositAmount ? 'Deposit required before activity' : 'Cash on arrival'}

We'll send you a reminder 24 hours before your activity!

Thank you for choosing MarrakechDunes! 🏜️
    `.trim();

    return this.sendWhatsApp(booking.customerPhone, message);
  }

  /**
   * Send reminder
   */
  async sendReminder(booking: {
    customerPhone: string;
    activityName: string;
    preferredDate: Date | string;
    paymentStatus?: string;
    numberOfPeople?: number;
  }, hoursBefore: number): Promise<boolean> {
    const activityName = booking.activityName || 'Activity';
    const date = new Date(booking.preferredDate).toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });

    const paymentReminder = booking.paymentStatus === 'unpaid' 
      ? '\n💰 Remember to bring cash payment'
      : booking.paymentStatus === 'deposit_paid'
      ? '\n💰 Balance payment due on arrival'
      : '\n✅ Payment received';

    const message = `
⏰ *Reminder: ${hoursBefore}h until your activity!*

*${activityName}*
📅 ${date}
👥 ${booking.numberOfPeople || 1} ${booking.numberOfPeople === 1 ? 'person' : 'people'}${paymentReminder}

See you soon! 🏜️
    `.trim();

    return this.sendWhatsApp(booking.customerPhone, message);
  }

  /**
   * Send payment confirmation
   */
  async sendPaymentConfirmation(booking: {
    customerPhone: string;
    customerName: string;
    activityName: string;
    paidAmount: number;
    totalAmount: number;
    paymentStatus: string;
  }): Promise<boolean> {
    const remaining = booking.totalAmount - booking.paidAmount;
    const message = `
✅ *Payment Received!*

Activity: ${booking.activityName}
Paid: ${booking.paidAmount} MAD${remaining > 0 ? `\nRemaining: ${remaining} MAD` : '\n✅ Fully Paid'}

Thank you for your payment! See you at your activity! 🎉
    `.trim();

    return this.sendWhatsApp(booking.customerPhone, message);
  }
}

export const twilioService = new TwilioService();

