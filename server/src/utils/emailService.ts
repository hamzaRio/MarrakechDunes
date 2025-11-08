import nodemailer from 'nodemailer';

/**
 * Email service for MarrakechDunes
 * Uses SMTP configuration (canonical) with fallback to legacy EMAIL_* vars
 * 
 * MIGRATION NOTE: This service now uses SMTP_* variables as canonical.
 * Legacy EMAIL_* variables are supported for backward compatibility.
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter with SMTP configuration
   * Supports both SMTP_* (canonical) and EMAIL_* (legacy) variables
   */
  private initializeTransporter() {
    try {
      // Use SMTP_* variables as canonical, fallback to EMAIL_* for backward compatibility
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
        secure: (process.env.SMTP_PORT || process.env.EMAIL_PORT) === '465',
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER || 'timedizzy45@gmail.com',
          pass: process.env.SMTP_PASS || process.env.EMAIL_PASS
        },
        // Add connection timeout settings to prevent long waits
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 10000, // 10 seconds
        socketTimeout: 10000, // 10 seconds
        // Retry configuration
        pool: false,
        maxConnections: 1,
        maxMessages: 1
      };

      // Warn if using legacy EMAIL_* variables
      if (process.env.EMAIL_USER && !process.env.SMTP_USER) {
        console.warn('[EMAIL] Using legacy EMAIL_* variables. Consider migrating to SMTP_* variables.');
      }

      this.transporter = nodemailer.createTransport(smtpConfig);

      console.log('[EMAIL] Transporter initialized successfully');
    } catch (error) {
      console.error('[EMAIL] Failed to initialize transporter:', error);
      this.transporter = null;
    }
  }

  /**
   * Send email notification
   * @param to - Recipient email address
   * @param subject - Email subject
   * @param message - Email message content
   * @returns Promise<boolean> - Success status
   */
  async sendEmail(to: string, subject: string, message: string): Promise<boolean> {
    if (!this.transporter) {
      console.error('[EMAIL] Transporter not initialized');
      return false;
    }

    try {
      const mailOptions = {
        from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Marrakech Dunes" <timedizzy45@gmail.com>',
        to,
        subject,
        text: message,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Marrakech Dunes</h2>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 14px;">
              Cordialement,<br>
              L'équipe Marrakech Dunes
            </p>
          </div>
        `
      };

      // Add timeout wrapper to prevent long waits
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000);
      });

      const sendPromise = this.transporter.sendMail(mailOptions);
      
      const result = await Promise.race([sendPromise, timeoutPromise]);
      if (result && typeof result === 'object' && 'messageId' in result) {
        console.log('[EMAIL] Email sent successfully:', result.messageId);
      } else {
        console.log('[EMAIL] Email sent successfully');
      }
      return true;
    } catch (error: any) {
      // Handle timeout and connection errors gracefully
      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        console.error('[EMAIL] Connection timeout or refused - SMTP server may be unreachable:', error.message || error.code);
      } else {
        console.error('[EMAIL] Failed to send email:', error);
      }
      return false;
    }
  }

  /**
   * Send booking confirmation email
   * @param customerEmail - Customer email address
   * @param customerName - Customer name
   * @param activityName - Activity name
   * @param bookingDate - Booking date
   * @param totalAmount - Total amount in MAD
   * @returns Promise<boolean> - Success status
   */
  async sendBookingConfirmation(
    customerEmail: string,
    customerName: string,
    activityName: string,
    bookingDate: string,
    totalAmount: number
  ): Promise<boolean> {
    const subject = 'Confirmation de votre réservation - Marrakech Dunes';
    const message = `
Bonjour ${customerName},

Votre réservation a été confirmée avec succès !

Détails de votre réservation :
- Activité : ${activityName}
- Date : ${bookingDate}
- Montant total : ${totalAmount} MAD

Nous vous contacterons bientôt pour finaliser les détails de votre excursion.

Merci de votre confiance !

L'équipe Marrakech Dunes
    `;

    return this.sendEmail(customerEmail, subject, message);
  }
}

export default new EmailService();
