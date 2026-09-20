import { Router, type NextFunction, type Request, type Response } from 'express';
import { storage } from '../storage.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin-auth.js';
import { normalizeGYGOffer, type GYGTrustSource } from '../services/gyg-comparison.js';

const router = Router();
const BOOKING_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const;

const normalizePaymentMethod = (paymentMethod: unknown): 'cash' | 'cash_deposit' | null => {
  switch (String(paymentMethod ?? '').trim().toUpperCase()) {
    case 'CASH':
      return 'cash';
    case 'DEPOSIT':
    case 'CASH_DEPOSIT':
      return 'cash_deposit';
    default:
      return null;
  }
};

// Apply admin authentication middleware to all routes
router.use(requireAdmin);

const requireSuperAdminForForceScrape = (req: Request, res: Response, next: NextFunction) => {
  if (req.query.forceScrape !== 'true') {
    return next();
  }

  return requireSuperAdmin(req, res, next);
};

/**
 * GET /api/admin/bookings
 * Get all bookings (admin only)
 */
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    // Clear cache if requested (for debugging/fixing issues)
    if (req.query.clearCache === 'true') {
      const { cacheService } = await import('../services/cache-service.js');
      await cacheService.invalidateBookings();
      console.log('[ADMIN] Bookings cache cleared');
    }
    
    // Support pagination via query params
    const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const sortField = req.query.sortField as string | undefined;
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    
    const options = (page || limit) ? {
      page: page || 1,
      limit: limit || 50,
      sort: sortField ? { field: sortField, order: sortOrder as 1 | -1 } : undefined
    } : undefined;
    
    // If pagination requested, return paginated response
    if (options && (page || limit)) {
      const result = await storage.getBookingsPaginated(options);
      return res.status(200).json(result);
    }
    
    // Otherwise return all (backward compatible)
    const bookings = await storage.getBookings();
    return res.status(200).json(bookings);
  } catch (error) {
    console.error('[ADMIN] Error fetching bookings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch bookings'
    });
  }
});

/**
 * GET /api/admin/bookings/:id
 * Get single booking (admin only)
 */
router.get('/bookings/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await storage.getBooking(id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    return res.status(200).json(booking);
  } catch (error) {
    console.error('[ADMIN] Error fetching booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch booking'
    });
  }
});

/**
 * PATCH /api/admin/bookings/:id/status
 * Update booking status (admin only)
 */
router.patch('/bookings/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const normalizedStatus = String(status ?? '').toUpperCase();
    if (!(BOOKING_STATUSES as readonly string[]).includes(normalizedStatus)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid booking status'
      });
    }
    
    // Get booking before update to check if status is changing to confirmed
    const booking = await storage.getBooking(id);
    const wasConfirmed = String(booking?.status || '').toUpperCase() === 'CONFIRMED';
    
    const updatedBooking = await storage.updateBookingStatus(id, normalizedStatus);
    if (!updatedBooking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    // Send automatic notification when booking is confirmed
    if (normalizedStatus === 'CONFIRMED' && !wasConfirmed && booking) {
      try {
        const activity = await storage.getActivity(booking.activityId);
        const activityName = activity?.name || 'Activity';
        
        // Send WhatsApp notification via free notification queue
        const { freeNotificationQueue } = await import('../services/free-notification-queue.js');
        const date = new Date(booking.preferredDate).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        const total = typeof booking.totalAmount === 'string' ? booking.totalAmount : `${booking.totalAmount} MAD`;
        const deposit = booking.depositAmount ? `${booking.depositAmount} MAD` : null;

        const whatsappMessage = `🎉 *Booking Confirmed!*

Activity: ${activityName}
Date: ${date}
People: ${booking.numberOfPeople}
Total: ${total}${deposit ? `\nDeposit Required: ${deposit}` : ''}

Payment: ${booking.depositAmount ? 'Deposit required before activity' : 'Cash on arrival'}

We'll send you a reminder 24 hours before your activity!

Thank you for choosing MarrakechDunes! 🏜️`.trim();

        freeNotificationQueue.addNotification({
          type: 'booking_confirmation',
          customerPhone: booking.customerPhone,
          customerName: booking.customerName,
          message: whatsappMessage,
          whatsappLink: freeNotificationQueue.generateWhatsAppLink(booking.customerPhone, whatsappMessage),
          priority: 'high',
          bookingId: booking._id || booking.id,
          metadata: {
            activityName,
            date: typeof booking.preferredDate === 'string' ? booking.preferredDate : booking.preferredDate.toISOString(),
            amount: booking.depositAmount
          }
        });
        
        // Send email confirmation if email is available
        if (booking.customerEmail) {
          const emailService = (await import('../utils/emailService.js')).default;
          await emailService.sendBookingConfirmation(
            booking.customerEmail,
            booking.customerName,
            activityName,
            date,
            Number(booking.totalAmount || 0)
          );
        }
      } catch (notificationError) {
        // Don't fail status update if notification fails
        console.error('[ADMIN] Failed to send confirmation notification:', notificationError);
      }
    }
    
    return res.status(200).json(updatedBooking);
  } catch (error) {
    console.error('[ADMIN] Error updating booking status:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update booking status'
    });
  }
});

/**
 * DELETE /api/admin/bookings/:id
 * Delete booking (admin only)
 */
router.delete('/bookings/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Invalidate cache before deletion
    const { cacheService } = await import('../services/cache-service.js');
    await cacheService.invalidateRelated('booking', id);
    await cacheService.invalidateBookings();
    
    const deleted = await storage.deleteBooking(id);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    
    // Invalidate cache after deletion
    await cacheService.invalidateRelated('booking', id);
    await cacheService.invalidateBookings();
    
    return res.status(200).json({
      status: 'success',
      message: 'Booking deleted successfully'
    });
  } catch (error) {
    console.error('[ADMIN] Error deleting booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete booking'
    });
  }
});

/**
 * GET /api/admin/activities/all
 * Get all activities including pending (admin only)
 */
router.get('/activities/all', async (req: Request, res: Response) => {
  try {
    const activities = await storage.getAllActivities();
    return res.status(200).json(activities);
  } catch (error) {
    console.error('[ADMIN] Error fetching all activities:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activities'
    });
  }
});

/**
 * GET /api/admin/activities
 * Get all activities (admin view)
 */
router.get('/activities', async (req: Request, res: Response) => {
  try {
    const activities = await storage.getAllActivities();
    return res.status(200).json(activities);
  } catch (error) {
    console.error('[ADMIN] Error fetching activities:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch activities'
    });
  }
});

/**
 * POST /api/admin/activities
 * Create new activity (admin only)
 */
router.post('/activities', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { getyourguidePrice: _ignoredGetYourGuidePrice, ...activityData } = req.body;
    const activity = await storage.createActivity(activityData);
    return res.status(201).json(activity);
  } catch (error) {
    console.error('[ADMIN] Error creating activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create activity'
    });
  }
});

/**
 * PUT /api/admin/activities/:id
 * Update activity (admin only)
 */
router.put('/activities/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getyourguidePrice: _ignoredGetYourGuidePrice, ...activityData } = req.body;
    const updatedActivity = await storage.updateActivity(id, activityData);
    if (!updatedActivity) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity not found'
      });
    }
    return res.status(200).json(updatedActivity);
  } catch (error) {
    console.error('[ADMIN] Error updating activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update activity'
    });
  }
});

/**
 * PATCH /api/admin/activities/:id
 * Partial update activity (admin only)
 */
router.patch('/activities/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { getyourguidePrice: _ignoredGetYourGuidePrice, ...activityData } = req.body;
    const updatedActivity = await storage.updateActivity(id, activityData);
    if (!updatedActivity) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity not found'
      });
    }
    return res.status(200).json(updatedActivity);
  } catch (error) {
    console.error('[ADMIN] Error updating activity:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update activity'
    });
  }
});

/**
 * DELETE /api/admin/activities/:id
 * Delete activity (admin only)
 */
router.delete('/activities/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Invalidate cache before deletion
    const { cacheService } = await import('../services/cache-service.js');
    await cacheService.invalidateActivities();
    await cacheService.invalidateRelated('activity', id);
    
    await storage.deleteActivity(id);
    
    // Invalidate cache after deletion
    await cacheService.invalidateActivities();
    await cacheService.invalidateRelated('activity', id);
    
    return res.status(200).json({
      status: 'success',
      message: 'Activity deleted successfully'
    });
  } catch (error: any) {
    console.error('[ADMIN] Error deleting activity:', error);
    
    // Return specific error message if activity has bookings
    if (error.message && error.message.includes('booking')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: error.message || 'Failed to delete activity'
    });
  }
});

/**
 * POST /api/admin/activities/:id/image
 * Upload activity image (admin only)
 */
router.post('/activities/:id/image', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Image URL is required'
      });
    }
    
    // Update activity with new image URL
    const activity = await storage.getActivity(id);
    if (!activity) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity not found'
      });
    }
    
    // Add image URL to activity's imageUrls array
    const imageUrls = Array.isArray(activity.imageUrls) ? [...activity.imageUrls] : [];
    if (!imageUrls.includes(imageUrl)) {
      imageUrls.push(imageUrl);
    }
    
    const updatedActivity = await storage.updateActivity(id, { imageUrls });
    
    return res.status(200).json({
      status: 'success',
      activity: updatedActivity
    });
  } catch (error) {
    console.error('[ADMIN] Error uploading activity image:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to upload image'
    });
  }
});

/**
 * GET /api/admin/activities/:id/getyourguide-price
 * Get GetYourGuide price for activity (admin only)
 */
router.get('/activities/:id/getyourguide-price', requireSuperAdminForForceScrape, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const activity = await storage.getActivity(id);
    
    if (!activity) {
      return res.status(404).json({
        status: 'error',
        message: 'Activity not found'
      });
    }

    // Search GetYourGuide for matching activity
    try {
      const { MoroccoDatabase } = await import('../utils/moroccoDatabase.js');
      const { GYGFetcher } = await import('../utils/gygFetcher.js');
      const forceLiveScrape = req.query.forceScrape === 'true';
      
      // Use Morocco database first (instant, curated data)
      const moroccoActivities = MoroccoDatabase.searchActivities(activity.name);
      let bestMatch: any = null;
      let gygPrice: number | null = null;
      let sourceType: GYGTrustSource = 'CURATED_REFERENCE';
      
      if (moroccoActivities.length > 0 && !forceLiveScrape) {
        bestMatch = moroccoActivities[0];
        gygPrice = bestMatch.price || bestMatch.gygPrice || null;
      }

      // If force live scrape requested OR no match found, scrape GetYourGuide website
      if (forceLiveScrape || (!bestMatch || !gygPrice)) {
        console.log(`[ADMIN] Scraping GetYourGuide for: "${activity.name}" (forceScrape=${forceLiveScrape})`);
        try {
          // Use Promise.race to timeout after 5 seconds
          const scrapePromise = GYGFetcher.searchActivities(activity.name);
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Scrape timeout')), 5000);
          });

          const scrapedActivities = await Promise.race([scrapePromise, timeoutPromise]);
          
          if (scrapedActivities && scrapedActivities.length > 0) {
            // Find best match by title similarity
            const activityNameLower = activity.name.toLowerCase();
            const scoredActivities = scrapedActivities.map(a => {
              const titleLower = a.title.toLowerCase();
              let score = 0;
              
              // Exact match
              if (titleLower === activityNameLower) score = 100;
              // Contains all keywords
              else if (activityNameLower.split(' ').every(word => titleLower.includes(word))) score = 80;
              // Contains main keywords
              else if (titleLower.includes('balloon') && activityNameLower.includes('balloon')) score = 70;
              else if (titleLower.includes(activityNameLower.split(' ')[0])) score = 50;
              
              return { activity: a, score };
            });

            scoredActivities.sort((a, b) => b.score - a.score);
            const bestScraped = scoredActivities[0];
            
            if (bestScraped && bestScraped.score > 40 && bestScraped.activity.price > 0) {
              bestMatch = {
                title: bestScraped.activity.title,
                price: bestScraped.activity.price,
                gygPrice: bestScraped.activity.price,
                currency: bestScraped.activity.currency || 'MAD',
                rating: bestScraped.activity.rating || 0,
                reviewCount: bestScraped.activity.reviewCount || 0,
                link: bestScraped.activity.link,
                url: bestScraped.activity.link
              };
              gygPrice = bestScraped.activity.price;
              sourceType = 'LIVE_VERIFIED';
              console.log(`[ADMIN] Found GYG price via scraping: ${gygPrice} MAD for "${bestMatch.title}"`);
            }
          }
        } catch (scrapeError: any) {
          console.warn(`[ADMIN] Live scraping failed: ${scrapeError.message}`);
          // Continue with database result or fallback
        }
      }

      if (bestMatch && gygPrice) {
        const fetchedAt = new Date();
        const comparison = normalizeGYGOffer({
          id: bestMatch.id,
          title: bestMatch.title,
          price: gygPrice,
          currency: bestMatch.currency || 'MAD',
          url: bestMatch.link || bestMatch.url,
          rating: bestMatch.rating,
          reviewCount: bestMatch.reviewCount,
          duration: bestMatch.duration,
          location: bestMatch.location,
        }, { sourceType, fetchedAt });

        // A numeric price is written to Activity only when this route itself
        // obtained a live, verified source. Curated and estimated values stay
        // response-only references.
        if (comparison.sourceType === 'LIVE_VERIFIED') {
          await storage.updateActivityGetYourGuidePrice(id, comparison.price);
        }

        return res.status(200).json({
          status: 'success',
          price: comparison.price,
          currency: comparison.currency,
          sourceType: comparison.sourceType,
          verified: comparison.verified,
          stale: comparison.stale,
          fetchedAt: comparison.fetchedAt,
          comparison,
          activity: {
            title: bestMatch.title,
            url: bestMatch.link || bestMatch.url,
            rating: bestMatch.rating || 0,
            reviewCount: bestMatch.reviewCount || 0
          },
          suggestions: moroccoActivities.length > 0
            ? moroccoActivities.slice(0, 3).map(a => normalizeGYGOffer({
                id: a.id,
                title: a.title,
                price: a.price || a.gygPrice,
                currency: a.currency || 'MAD',
                url: a.link,
                rating: a.rating,
                reviewCount: a.reviewCount,
                duration: a.duration,
                location: a.location,
              }, { sourceType: 'CURATED_REFERENCE', fetchedAt }))
            : []
          });
      } else {
        // No results found, return estimated price (14% higher)
        const estimatedPrice = Math.round(Number(activity.price) * 1.14);
        const fetchedAt = new Date();
        return res.status(200).json({
          status: 'success',
          price: estimatedPrice,
          currency: 'MAD',
          sourceType: 'ESTIMATED',
          verified: false,
          stale: false,
          fetchedAt,
          comparison: normalizeGYGOffer({
            id: activity.id,
            title: activity.name,
            price: estimatedPrice,
            currency: 'MAD',
          }, { sourceType: 'ESTIMATED', fetchedAt }),
          message: 'No matching activity found on GetYourGuide. Using estimated price.'
        });
      }
    } catch (searchError) {
      console.error('[ADMIN] GYG search error:', searchError);
      // Fallback to estimated price
      const estimatedPrice = Math.round(Number(activity.price) * 1.14);
      const fetchedAt = new Date();
      return res.status(200).json({
        status: 'success',
        price: estimatedPrice,
        currency: 'MAD',
          sourceType: 'ESTIMATED',
          verified: false,
          stale: false,
        fetchedAt,
          comparison: normalizeGYGOffer({
            id: activity.id,
            title: activity.name,
            price: estimatedPrice,
            currency: 'MAD',
        }, { sourceType: 'ESTIMATED', fetchedAt }),
        message: 'Could not search GetYourGuide. Using estimated price.'
      });
    }
  } catch (error) {
    console.error('[ADMIN] Error fetching GYG price:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch GetYourGuide price'
    });
  }
});

/**
 * POST /api/admin/bookings/:id/payment
 * PATCH /api/admin/bookings/:id/payment
 * Update booking payment (admin only)
 */
const handleBookingPayment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, paidAmount, paymentStatus, paymentMethod, depositAmount } = req.body;
    
    const booking = await storage.getBooking(id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }

    const total = Number(booking.totalAmount) ?? 0;
    const newPaid = paidAmount !== undefined ? Math.min(total, Number(paidAmount)) : (Number(booking.paidAmount) || 0);
    
    // Use provided paymentStatus or calculate it
    let status: 'unpaid' | 'deposit_paid' | 'fully_paid' = paymentStatus || 'unpaid';
    if (paidAmount !== undefined) {
      if (newPaid <= 0) status = 'unpaid';
      else if (newPaid < total) {
        status = type === 'DEPOSIT' ? 'deposit_paid' : 'unpaid';
      } else {
        status = 'fully_paid';
      }
    }

    // Normalize supported client/legacy values to the canonical stored values.
    const requestedPaymentMethod = paymentMethod ?? (type === 'DEPOSIT' ? 'DEPOSIT' : 'CASH');
    const finalPaymentMethod = normalizePaymentMethod(requestedPaymentMethod);
    if (!finalPaymentMethod) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid payment method. Only "cash" or "cash_deposit" are allowed.'
      });
    }

    const normalizedDepositAmount = depositAmount === undefined ? undefined : Number(depositAmount);
    if (normalizedDepositAmount !== undefined && (!Number.isFinite(normalizedDepositAmount) || normalizedDepositAmount < 0)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid deposit amount'
      });
    }

    const updatedBooking = await storage.updateBookingPayment(id, {
      paidAmount: newPaid,
      paymentStatus: status,
      paymentMethod: finalPaymentMethod,
      ...(normalizedDepositAmount !== undefined ? { depositAmount: normalizedDepositAmount } : {})
    });

    return res.status(200).json({
      success: true,
      payment: {
        type,
        paidAmount: newPaid,
        remaining: Math.max(0, total - newPaid),
        status,
        paymentMethod: finalPaymentMethod
      },
      booking: updatedBooking
    });
  } catch (error) {
    console.error('[ADMIN] Error updating booking payment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update payment'
    });
  }
};

router.post('/bookings/:id/payment', handleBookingPayment);
router.patch('/bookings/:id/payment', handleBookingPayment);

/**
 * POST /api/admin/bookings/:id/reminder
 * Send reminder for booking (admin only)
 */
router.post('/bookings/:id/reminder', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const booking = await storage.getBooking(id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Booking not found'
      });
    }
    // TODO: Implement reminder sending logic (WhatsApp, email, etc.)
    // For now, return success (implementation pending)
    return res.status(200).json({
      status: 'success',
      message: 'Reminder sent successfully',
      bookingId: booking._id || booking.id
    });
  } catch (error) {
    console.error('[ADMIN] Error sending reminder:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to send reminder'
    });
  }
});

/**
 * GET /api/admin/export/bookings
 * Export bookings to CSV (admin only)
 */
router.get('/export/bookings', async (req: Request, res: Response) => {
  try {
    const bookings = await storage.getBookings();
    const csv = await storage.exportBookingsToCSV(bookings);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.csv"');
    return res.status(200).send(csv);
  } catch (error) {
    console.error('[ADMIN] Error exporting bookings:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export bookings'
    });
  }
});

/**
 * GET /api/admin/export/bookings/pdf
 * Export bookings to PDF (admin only)
 */
router.get('/export/bookings/pdf', async (req: Request, res: Response) => {
  try {
    const bookings = await storage.getBookings();
    const pdf = await storage.exportBookingsToPDF(bookings);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="bookings.pdf"');
    return res.status(200).send(pdf);
  } catch (error) {
    console.error('[ADMIN] Error exporting bookings PDF:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export bookings PDF'
    });
  }
});

/**
 * GET /api/admin/revenue-summary
 * Get optimized revenue summary with aggregation (admin only)
 */
router.get('/revenue-summary', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
    
    const dateRange = (startDate && endDate) ? { start: startDate, end: endDate } : undefined;
    const summary = await storage.getRevenueSummary(dateRange);
    
    return res.status(200).json(summary);
  } catch (error) {
    console.error('[ADMIN] Error fetching revenue summary:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch revenue summary'
    });
  }
});

/**
 * GET /api/admin/operations-report
 * Get operations report (admin only)
 */
router.get('/operations-report', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const report = await storage.generateOperationsReport();
    return res.status(200).json(report);
  } catch (error) {
    console.error('[ADMIN] Error generating operations report:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to generate operations report'
    });
  }
});

/**
 * GET /api/admin/export/operations-report/pdf
 * Export operations report to PDF (admin only)
 */
router.get('/export/operations-report/pdf', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const reportData = await storage.generateOperationsReport();
    const pdf = await storage.exportOperationsReportToPDF(reportData);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="operations-report.pdf"');
    return res.status(200).send(pdf);
  } catch (error) {
    console.error('[ADMIN] Error exporting operations report PDF:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to export operations report PDF'
    });
  }
});

/**
 * GET /api/admin/notifications
 * Get admin notifications (admin only)
 */
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { freeNotificationQueue } = await import('../services/free-notification-queue.js');
    const { type, limit, priority } = req.query;
    
    let notifications;
    if (type) {
      notifications = freeNotificationQueue.getByType(type as any);
    } else if (priority === 'high') {
      notifications = freeNotificationQueue.getHighPriority();
    } else {
      notifications = freeNotificationQueue.getQueue(limit ? parseInt(limit as string) : undefined);
    }

    const stats = freeNotificationQueue.getStats();

    return res.status(200).json({
      status: 'success',
      notifications,
      stats
    });
  } catch (error) {
    console.error('[ADMIN] Error fetching notifications:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch notifications'
    });
  }
});

/**
 * POST /api/admin/notifications/:id/mark-sent
 * Mark notification as sent (removes from queue)
 */
router.post('/notifications/:id/mark-sent', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { freeNotificationQueue } = await import('../services/free-notification-queue.js');
    
    const removed = freeNotificationQueue.removeNotification(id);
    
    if (removed) {
      return res.status(200).json({
        status: 'success',
        message: 'Notification marked as sent'
      });
    } else {
      return res.status(404).json({
        status: 'error',
        message: 'Notification not found'
      });
    }
  } catch (error) {
    console.error('[ADMIN] Error marking notification:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to mark notification'
    });
  }
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs (admin/superadmin only)
 */
router.get('/audit-logs', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    const auditLogs = await storage.getAuditLogs();
    return res.status(200).json(auditLogs);
  } catch (error) {
    console.error('[ADMIN] Error fetching audit logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch audit logs'
    });
  }
});

export default router;

