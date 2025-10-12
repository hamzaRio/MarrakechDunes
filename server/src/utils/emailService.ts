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
        }
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

      const result = await this.transporter.sendMail(mailOptions);
      console.log('[EMAIL] Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      console.error('[EMAIL] Failed to send email:', error);
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
