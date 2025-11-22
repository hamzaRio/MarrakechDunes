import nodemailer from 'nodemailer';
import fetch from 'node-fetch';

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
      const smtpPort = parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '465');
      const smtpConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        // Try port 465 (SSL) first, fallback to 587 (TLS) - some cloud providers block 587
        port: smtpPort,
        secure: smtpPort === 465, // Use SSL for port 465, TLS for 587
        auth: {
          user: process.env.SMTP_USER || process.env.EMAIL_USER || 'timedizzy45@gmail.com',
          // Remove spaces from password (Gmail app passwords should be 16 chars without spaces)
          pass: (process.env.SMTP_PASS || process.env.EMAIL_PASS)?.replace(/\s+/g, '') || undefined
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

      console.log(`[EMAIL] Transporter initialized - Host: ${smtpConfig.host}, Port: ${smtpPort}, Secure: ${smtpConfig.secure}, User: ${smtpConfig.auth.user}`);
    } catch (error) {
      console.error('[EMAIL] Failed to initialize transporter:', error);
      this.transporter = null;
    }
  }

  private hasSmtpCredentials(): boolean {
    return Boolean(
      (process.env.SMTP_USER || process.env.EMAIL_USER) &&
      (process.env.SMTP_PASS || process.env.EMAIL_PASS)
    );
  }

  private buildHtml(message: string): string {
    return `
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
    `;
  }

  private async sendViaSMTP(mailOptions: nodemailer.SendMailOptions): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Email sending timeout after 15 seconds')), 15000);
      });

      const sendPromise = this.transporter.sendMail(mailOptions);
      const result = await Promise.race([sendPromise, timeoutPromise]);

      if (result && typeof result === 'object' && 'messageId' in result) {
        console.log('[EMAIL] Email sent successfully:', result.messageId);
      } else {
        console.log('[EMAIL] Email sent successfully via SMTP');
      }
      return true;
    } catch (error: any) {
      if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED') {
        const errorMsg = error.message || error.code || 'Unknown timeout error';
        console.error(`[EMAIL] Connection timeout or refused - SMTP server may be unreachable: ${errorMsg}`);
        console.error(`[EMAIL] This often happens on cloud platforms like Render that block outbound SMTP ports.`);
        console.error(`[EMAIL] Solution: Use Resend API (set RESEND_API_KEY) or contact Render support to unblock SMTP.`);
      } else if (error.code === 'EAUTH' || error.message?.includes('Invalid login')) {
        console.error('[EMAIL] SMTP authentication failed - please verify SMTP_USER/SMTP_PASS:', error.message);
      } else {
        console.error('[EMAIL] Failed to send email via SMTP:', error.message || error);
      }
      return false;
    }
  }

  private async sendViaResend(to: string, subject: string, text: string, html: string): Promise<boolean> {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('[EMAIL] Resend API key not configured. Skipping fallback.');
      return false;
    }

    const from =
      process.env.RESEND_FROM ||
      process.env.SMTP_FROM ||
      process.env.EMAIL_FROM ||
      'Marrakech Dunes <onboarding@resend.dev>'; // Default Resend domain for testing

    try {
      // Add timeout for Resend API calls
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from,
          to,
          subject,
          html,
          text
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EMAIL] Resend API error:', response.status, errorText);
        return false;
      }

      const result = await response.json() as { id?: string };
      console.log('[EMAIL] Email sent successfully via Resend:', result.id || 'success');
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('[EMAIL] Resend API timeout after 10 seconds');
      } else {
        console.error('[EMAIL] Failed to send email via Resend:', error);
      }
      return false;
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
    const html = this.buildHtml(message);
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Marrakech Dunes" <timedizzy45@gmail.com>',
      to,
      subject,
      text: message,
      html
    };

    // Try SMTP first (primary method)
    if (!this.transporter && this.hasSmtpCredentials()) {
      this.initializeTransporter();
    }

    if (this.transporter && this.hasSmtpCredentials()) {
      const smtpSuccess = await this.sendViaSMTP(mailOptions);
      if (smtpSuccess) {
        return true;
      }
      console.warn('[EMAIL] SMTP delivery failed. Attempting Resend fallback if configured...');
    } else {
      console.warn('[EMAIL] SMTP credentials missing or transporter unavailable. Trying Resend if configured...');
    }

    // Fallback to Resend if SMTP failed and Resend is configured
    const resendApiKey = process.env.RESEND_API_KEY;
    if (resendApiKey) {
      console.log('[EMAIL] Attempting Resend fallback...');
      const resendSuccess = await this.sendViaResend(to, subject, message, html);
      if (resendSuccess) {
        return true;
      }
      console.warn('[EMAIL] Resend fallback also failed.');
    } else {
      console.warn('[EMAIL] Resend API key not configured. SMTP is the only email method available.');
    }

    // If both failed
    if (!this.hasSmtpCredentials() && !resendApiKey) {
      console.error('[EMAIL] No email service configured. Please set SMTP credentials or RESEND_API_KEY.');
    }

    return false;
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
