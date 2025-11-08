import { Router } from 'express';
import { z } from 'zod';
import emailService from '../utils/emailService.js';

const router = Router();

/**
 * Zod schema for email notification payload
 */
const emailNotificationSchema = z.object({
  to: z.string().email('Adresse email invalide'),
  subject: z.string().min(1, 'Le sujet est requis'),
  message: z.string().min(1, 'Le message est requis')
});

/**
 * POST /api/notifications/email/send
 * Send email notification to customer
 * CSRF excluded for this route
 */
router.post('/email/send', async (req, res) => {
  const startTime = Date.now();
  
  try {
    // Validate request payload
    const validationResult = emailNotificationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: validationResult.error.errors
      });
    }

    const { to, subject, message } = validationResult.data;

    // Add overall timeout wrapper (20 seconds max)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 20000);
    });

    // Send email with timeout protection
    const sendPromise = emailService.sendEmail(to, subject, message);
    const success = await Promise.race([sendPromise, timeoutPromise]);

    const duration = Date.now() - startTime;

    if (success) {
      console.log(`[NOTIFICATIONS] Email sent successfully to: ${to} (${duration}ms)`);
      return res.status(200).json({
        success: true,
        message: 'Email envoyé avec succès'
      });
    } else {
      console.error(`[NOTIFICATIONS] Failed to send email to: ${to} (${duration}ms)`);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi de l\'email. Veuillez vérifier la configuration SMTP.'
      });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Handle timeout errors specifically
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.error(`[NOTIFICATIONS] Email send timeout after ${duration}ms to: ${req.body?.to || 'unknown'}`);
      return res.status(504).json({
        success: false,
        error: 'Timeout lors de la connexion au serveur email. Veuillez réessayer plus tard.'
      });
    }
    
    console.error(`[NOTIFICATIONS] Email send error (${duration}ms):`, error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/notifications/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', async (req, res) => {
  try {
    // TODO: Implement push notification subscription logic
    const { endpoint, keys } = req.body;
    console.log('[NOTIFICATIONS] Push subscription request:', { hasEndpoint: !!endpoint, hasKeys: !!keys });
    return res.status(200).json({
      success: true,
      message: 'Subscription successful'
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Subscribe error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to subscribe'
    });
  }
});

/**
 * POST /api/notifications/unsubscribe
 * Unsubscribe from push notifications
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    // TODO: Implement push notification unsubscription logic
    const { endpoint } = req.body;
    console.log('[NOTIFICATIONS] Push unsubscription request:', { hasEndpoint: !!endpoint });
    return res.status(200).json({
      success: true,
      message: 'Unsubscription successful'
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Unsubscribe error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to unsubscribe'
    });
  }
});

/**
 * POST /api/notifications/email/booking-confirmation
 * Send booking confirmation email
 */
router.post('/email/booking-confirmation', async (req, res) => {
  try {
    const bookingConfirmationSchema = z.object({
      customerEmail: z.string().email(),
      customerName: z.string().min(1),
      activityName: z.string().min(1),
      bookingDate: z.string().min(1),
      totalAmount: z.number().positive()
    });

    const validationResult = bookingConfirmationSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Données de réservation invalides',
        details: validationResult.error.errors
      });
    }

    const { customerEmail, customerName, activityName, bookingDate, totalAmount } = validationResult.data;

    const success = await emailService.sendBookingConfirmation(
      customerEmail,
      customerName,
      activityName,
      bookingDate,
      totalAmount
    );

    if (success) {
      console.log(`[NOTIFICATIONS] Booking confirmation sent to: ${customerEmail}`);
      return res.status(200).json({
        success: true,
        message: 'Confirmation de réservation envoyée'
      });
    } else {
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi de la confirmation'
      });
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Booking confirmation error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
    });
  }
});

export default router;
