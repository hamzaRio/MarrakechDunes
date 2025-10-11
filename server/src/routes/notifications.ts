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

    // Send email
    const success = await emailService.sendEmail(to, subject, message);

    if (success) {
      console.log(`[NOTIFICATIONS] Email sent successfully to: ${to}`);
      return res.status(200).json({
        success: true,
        message: 'Email envoyé avec succès'
      });
    } else {
      console.error(`[NOTIFICATIONS] Failed to send email to: ${to}`);
      return res.status(500).json({
        success: false,
        error: 'Erreur lors de l\'envoi de l\'email'
      });
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Email send error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erreur interne du serveur'
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
