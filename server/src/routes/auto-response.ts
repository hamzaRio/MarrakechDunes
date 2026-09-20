/**
 * FREE Auto-Response Routes
 * Handles incoming customer messages and generates auto-responses
 * 100% Free - Uses notification queue
 */

import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { autoResponseService } from '../services/auto-response-service.js';
import { freeNotificationQueue } from '../services/free-notification-queue.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin-auth.js';

const router = Router();

const customerMessageSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required'),
  name: z.string().optional(),
  source: z.enum(['whatsapp', 'sms', 'web', 'portal']).optional().default('whatsapp')
});

/**
 * POST /api/auto-response/incoming
 * Receive customer message and generate auto-response
 * FREE MODE: Adds response to notification queue for admin review/sending
 */
router.post('/incoming', async (req: Request, res: Response) => {
  try {
    const data = customerMessageSchema.parse(req.body);
    
    console.log(`[AUTO-RESPONSE] Received message from ${data.phone}: ${data.message.substring(0, 50)}...`);

    // Analyze message and generate auto-response
    const response = await autoResponseService.analyzeAndRespond(
      data.message,
      data.phone,
      data.name
    );

    // Response is automatically added to notification queue
    // Admin can review and send via dashboard

    return res.status(200).json({
      status: 'success',
      message: 'Message received and auto-response generated',
      autoResponse: response.message,
      confidence: response.confidence,
      needsReview: response.type === 'needs_review',
      queueStatus: 'Response added to notification queue - admin can review and send',
      whatsappLink: freeNotificationQueue.generateWhatsAppLink(data.phone, response.message)
    });
  } catch (error: any) {
    console.error('[AUTO-RESPONSE] Error processing message:', error);
    return res.status(400).json({
      status: 'error',
      message: error.message || 'Failed to process message'
    });
  }
});

/**
 * GET /api/auto-response/messages
 * Get message history (admin only)
 */
router.get('/messages', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { phone, limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 50;

    let messages;
    if (phone) {
      messages = autoResponseService.getMessageHistory(phone as string, limitNum);
    } else {
      messages = autoResponseService.getAllMessages(limitNum);
    }

    return res.status(200).json({
      status: 'success',
      messages,
      count: messages.length
    });
  } catch (error: any) {
    console.error('[AUTO-RESPONSE] Error fetching messages:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch messages'
    });
  }
});

/**
 * POST /api/auto-response/test
 * Test auto-response with a sample message
 */
router.post('/test', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { message, phone } = req.body;
    
    if (!message || !phone) {
      return res.status(400).json({
        status: 'error',
        message: 'Message and phone are required'
      });
    }

    const response = await autoResponseService.analyzeAndRespond(message, phone, 'Test Customer');

    return res.status(200).json({
      status: 'success',
      originalMessage: message,
      autoResponse: response.message,
      confidence: response.confidence,
      type: response.type,
      whatsappLink: freeNotificationQueue.generateWhatsAppLink(phone, response.message)
    });
  } catch (error: any) {
    console.error('[AUTO-RESPONSE] Test error:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to test auto-response'
    });
  }
});

export default router;

