import nodemailer from 'nodemailer';

/**
 * Email service for MarrakechDunes
 * Uses Gmail SMTP with app password authentication
 */
class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  /**
   * Initialize Nodemailer transporter with Gmail SMTP
   */
  private initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER || 'timedizzy45@gmail.com',
          pass: process.env.EMAIL_PASS
        }
      });

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
        from: process.env.EMAIL_FROM || '"Marrakech Dunes" <timedizzy45@gmail.com>',
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
