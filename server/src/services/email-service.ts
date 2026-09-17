import nodemailer, { type Transporter } from 'nodemailer';
import type { NotificationData } from '../utils/notification-templates.js';

export class EmailService {
  private transporter: Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    const smtpConfig = {
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    };

    // Only initialize if all required environment variables are present
    if (smtpConfig.host && smtpConfig.auth.user && smtpConfig.auth.pass) {
      this.transporter = nodemailer.createTransport(smtpConfig);
      console.log('✅ Email service initialized');
    } else {
      console.log('⚠️ Email service not configured - missing SMTP credentials');
    }
  }

  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<boolean> {
    if (!this.transporter) {
      console.log('⚠️ Email service not available - SMTP not configured');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || 'MarrakechDunes <noreply@marrakechdunes.com>',
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  async sendBookingConfirmation(data: NotificationData): Promise<boolean> {
    const subject = 'Booking Confirmation - MarrakechDunes';
    const html = this.generateBookingConfirmationHTML(data);
    
    return this.sendEmail(data.customerPhone, subject, html);
  }

  async sendPaymentReceipt(data: NotificationData): Promise<boolean> {
    const subject = 'Payment Receipt - MarrakechDunes';
    const html = this.generatePaymentReceiptHTML(data);
    
    return this.sendEmail(data.customerPhone, subject, html);
  }

  async sendTourReminder(data: NotificationData): Promise<boolean> {
    const subject = 'Tour Reminder - MarrakechDunes';
    const html = this.generateTourReminderHTML(data);
    
    return this.sendEmail(data.customerPhone, subject, html);
  }

  private generateBookingConfirmationHTML(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Booking Confirmation - MarrakechDunes</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .booking-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏜️ MarrakechDunes</h1>
            <h2>Booking Confirmation</h2>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Thank you for booking with MarrakechDunes!</p>
            
            <div class="booking-details">
              <h3>Booking Details:</h3>
              <ul>
                <li><strong>Activity:</strong> ${data.activityName}</li>
                <li><strong>Date:</strong> ${data.preferredDate.toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${data.preferredDate.toLocaleTimeString()}</li>
                <li><strong>Participants:</strong> ${data.numberOfPeople}</li>
                <li><strong>Total Amount:</strong> ${data.totalAmount} MAD</li>
                <li><strong>Payment Method:</strong> Cash on Arrival</li>
                <li><strong>Status:</strong> PENDING CONFIRMATION</li>
              </ul>
            </div>
            
            <p>We'll send you a confirmation within 2 hours.</p>
            <p>Best regards,<br>MarrakechDunes Team</p>
          </div>
          <div class="footer">
            <p>MarrakechDunes - Your Gateway to Moroccan Adventures</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generatePaymentReceiptHTML(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Payment Receipt - MarrakechDunes</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .receipt-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💰 MarrakechDunes</h1>
            <h2>Payment Receipt</h2>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Payment received for your MarrakechDunes booking!</p>
            
            <div class="receipt-details">
              <h3>Receipt Details:</h3>
              <ul>
                <li><strong>Activity:</strong> ${data.activityName}</li>
                <li><strong>Date:</strong> ${data.preferredDate.toLocaleDateString()}</li>
                <li><strong>Amount:</strong> ${data.totalAmount} MAD</li>
                <li><strong>Payment Method:</strong> Cash</li>
                <li><strong>Receipt Number:</strong> ${data.bookingId || 'N/A'}</li>
              </ul>
            </div>
            
            <p>Thank you for your payment!</p>
            <p>Best regards,<br>MarrakechDunes Team</p>
          </div>
          <div class="footer">
            <p>MarrakechDunes - Your Gateway to Moroccan Adventures</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private generateTourReminderHTML(data: NotificationData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Tour Reminder - MarrakechDunes</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .reminder-details { background: white; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .footer { text-align: center; padding: 20px; color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎯 MarrakechDunes</h1>
            <h2>Tour Reminder</h2>
          </div>
          <div class="content">
            <p>Dear ${data.customerName},</p>
            <p>Your tour is coming up soon!</p>
            
            <div class="reminder-details">
              <h3>Tour Details:</h3>
              <ul>
                <li><strong>Activity:</strong> ${data.activityName}</li>
                <li><strong>Date:</strong> ${data.preferredDate.toLocaleDateString()}</li>
                <li><strong>Time:</strong> ${data.preferredDate.toLocaleTimeString()}</li>
                <li><strong>Participants:</strong> ${data.numberOfPeople}</li>
              </ul>
              
              <h3>Important Reminders:</h3>
              <ul>
                <li>Please arrive 15 minutes early</li>
                <li>Bring: ${this.getPackingList(data.activityName)}</li>
                <li>Contact: +212600000000</li>
              </ul>
            </div>
            
            <p>See you soon!</p>
            <p>Best regards,<br>MarrakechDunes Team</p>
          </div>
          <div class="footer">
            <p>MarrakechDunes - Your Gateway to Moroccan Adventures</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPackingList(activityName: string): string {
    const packingLists: Record<string, string> = {
      'Hot Air Balloon': 'Comfortable clothes, camera, sunglasses',
      'Desert Safari': 'Sun hat, sunscreen, comfortable shoes, camera',
      'Ouzoud Waterfalls': 'Swimming gear, towel, waterproof camera',
      'Ourika Valley': 'Hiking shoes, water bottle, camera',
      'Essaouira Day Trip': 'Light jacket, camera, comfortable walking shoes'
    };
    
    return packingLists[activityName] || 'Comfortable clothes, camera, water bottle';
  }
}

export const emailService = new EmailService();
