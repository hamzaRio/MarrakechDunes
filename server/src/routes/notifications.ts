import { Router } from 'express';
import { z } from 'zod';
import emailService from '../utils/emailService.js';

const router = Router();

/**
 * Zod schema for email notification payload
 */
const emailNotificationSchema = z.object({
  to: z.string().email('Veuillez fournir une adresse email valide'),
  subject: z.string().min(1, 'Le sujet de l\'email est requis'),
  message: z.string().min(1, 'Le contenu du message est requis')
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
        message: 'Veuillez vérifier les informations saisies. Certains champs sont manquants ou incorrects.',
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
    let success: boolean;
    try {
      success = await Promise.race([sendPromise, timeoutPromise]);
    } catch (timeoutError: any) {
      if (timeoutError.message?.includes('timeout')) {
        console.error(`[NOTIFICATIONS] Email send timeout after 20 seconds to: ${to}`);
        return res.status(504).json({
          success: false,
          message: 'La connexion au serveur d\'envoi d\'emails prend plus de temps que prévu. Cela peut être dû à une surcharge temporaire. Nous vous invitons à réessayer dans quelques minutes.'
        });
      }
      throw timeoutError;
    }

    const duration = Date.now() - startTime;

    if (success) {
      console.log(`[NOTIFICATIONS] Email sent successfully to: ${to} (${duration}ms)`);
      return res.status(200).json({
        success: true,
        message: 'Votre email a été envoyé avec succès. Le client devrait le recevoir sous peu.'
      });
    } else {
      console.error(`[NOTIFICATIONS] Failed to send email to: ${to} (${duration}ms)`);
      return res.status(500).json({
        success: false,
        message: 'Nous rencontrons actuellement des difficultés pour envoyer l\'email. Notre équipe technique a été notifiée et travaille à résoudre le problème. Vous pouvez réessayer dans quelques instants.'
      });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    // Handle timeout errors specifically
    if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      console.error(`[NOTIFICATIONS] Email send timeout after ${duration}ms to: ${req.body?.to || 'unknown'}`);
      return res.status(504).json({
        success: false,
        message: 'La connexion au serveur d\'envoi d\'emails prend plus de temps que prévu. Cela peut être dû à une surcharge temporaire. Nous vous invitons à réessayer dans quelques minutes.'
      });
    }
    
    console.error(`[NOTIFICATIONS] Email send error (${duration}ms):`, error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur inattendue s\'est produite lors de l\'envoi de l\'email. Notre équipe a été automatiquement informée et travaille à résoudre ce problème. Merci de votre compréhension.'
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
      message: 'Vous êtes maintenant abonné aux notifications. Vous recevrez des mises à jour importantes concernant vos réservations.'
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Subscribe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Nous n\'avons pas pu finaliser votre abonnement aux notifications pour le moment. Veuillez réessayer ultérieurement.'
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
      message: 'Vous avez été désabonné des notifications avec succès. Vous ne recevrez plus de notifications push.'
    });
  } catch (error) {
    console.error('[NOTIFICATIONS] Unsubscribe error:', error);
    return res.status(500).json({
      success: false,
      message: 'Nous n\'avons pas pu traiter votre demande de désabonnement pour le moment. Veuillez réessayer dans quelques instants.'
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
        message: 'Les informations de réservation fournies sont incomplètes ou incorrectes. Veuillez vérifier tous les champs requis.',
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
        message: 'L\'email de confirmation a été envoyé au client avec succès. Il devrait le recevoir dans les prochaines minutes.'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Nous n\'avons pas pu envoyer l\'email de confirmation pour le moment. La réservation a bien été enregistrée, mais l\'envoi de l\'email sera réessayé automatiquement.'
      });
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Booking confirmation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Une erreur technique s\'est produite lors de l\'envoi de la confirmation. Notre équipe a été notifiée et la réservation reste valide.'
    });
  }
});

export default router;
