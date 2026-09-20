import express from 'express';
import { storage } from '../storage.js';
// Twilio removed - using free notification queue only

const router = express.Router();

const DEPOSIT_PERCENTAGE = 0.3;
const MIN_DEPOSIT_MAD = 100;

const isNonEmptyString = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * POST /api/bookings
 * Create a new booking request from the public site.
 *
 * SECURITY (Phase 4 §2): the browser is never trusted for totalAmount,
 * activity price, deposit amount, payment state, or booking status. Every
 * one of those is recomputed here from the server-side Activity record (or
 * hardcoded), and any client-submitted value for them is ignored.
 */
router.post('/', async (req, res) => {
  try {
    const {
      activityId,
      numberOfPeople,
      preferredDate,
      customerName,
      customerPhone,
      customerEmail,
      participantNames,
      notes,
    } = req.body ?? {};

    // --- Basic required fields -------------------------------------------------
    if (!isNonEmptyString(activityId)) {
      return res.status(400).json({ status: 'error', message: 'Activity is required.' });
    }
    if (!isNonEmptyString(customerName)) {
      return res.status(400).json({ status: 'error', message: 'Your name is required.' });
    }
    if (!isNonEmptyString(customerPhone)) {
      return res.status(400).json({ status: 'error', message: 'A phone/WhatsApp number is required.' });
    }

    // --- numberOfPeople: finite, positive integer only --------------------------
    const people = Number(numberOfPeople);
    if (!Number.isFinite(people) || !Number.isInteger(people) || people <= 0) {
      return res.status(400).json({ status: 'error', message: 'Number of people must be a whole number greater than 0.' });
    }

    // --- preferredDate: valid, not obviously in the past -------------------------
    const requestedDate = preferredDate ? new Date(preferredDate) : null;
    if (!requestedDate || Number.isNaN(requestedDate.getTime())) {
      return res.status(400).json({ status: 'error', message: 'A valid date is required.' });
    }
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    if (requestedDate < startOfToday) {
      return res.status(400).json({ status: 'error', message: 'The selected date has already passed. Please choose a future date.' });
    }

    // --- Activity must exist and be bookable -------------------------------------
    let activity;
    try {
      activity = await storage.getActivity(activityId);
    } catch {
      activity = null; // malformed id, etc. — treat the same as "not found"
    }
    if (!activity) {
      return res.status(404).json({ status: 'error', message: 'This activity could not be found. Please pick an activity again.' });
    }
    if (activity.isActive === false) {
      return res.status(400).json({ status: 'error', message: 'This activity is not currently available for booking.' });
    }

    const unitPrice = Number(activity.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      // A misconfigured activity price is a data problem, not something the
      // customer can fix — fail closed rather than booking at an invalid price.
      console.error('[BOOKINGS] Activity has an invalid price, refusing to book:', activityId, activity.price);
      return res.status(400).json({ status: 'error', message: 'This activity is temporarily unavailable for booking. Please contact us via WhatsApp.' });
    }

    // --- Capacity (Phase 4 §3, corrected): enforced only when the activity
    // actually defines a limit. capacitySettings.maxParticipants is treated
    // as authoritative when present; the legacy top-level maxParticipants is
    // the fallback. Overbooking is only allowed up to overbookingLimit when
    // capacitySettings.overbookingAllowed is explicitly true.
    //
    // Booking creation is a REQUEST workflow (PENDING -> admin review ->
    // CONFIRMED), so a pile of still-pending requests must never block a new
    // request. storage.getBookingsForActivityOnDate() only returns bookings
    // that already occupy a real seat (CONFIRMED/COMPLETED) for this exact
    // activity and calendar date - PENDING and CANCELLED bookings for this
    // date, and any booking for a different activity or date, are already
    // excluded there, not filtered here.
    const capacitySettings = (activity as any).capacitySettings;
    const capacityLimit: number | null =
      typeof capacitySettings?.maxParticipants === 'number'
        ? capacitySettings.maxParticipants
        : typeof (activity as any).maxParticipants === 'number'
          ? (activity as any).maxParticipants
          : null;

    if (capacityLimit != null && capacityLimit > 0) {
      const overbookingLimit = capacitySettings?.overbookingAllowed ? Number(capacitySettings.overbookingLimit) || 0 : 0;
      const confirmedSeats = await storage.getBookingsForActivityOnDate(activityId, requestedDate);
      const alreadyConfirmed = confirmedSeats.reduce((sum, b) => sum + (Number(b.numberOfPeople) || 0), 0);
      if (alreadyConfirmed + people > capacityLimit + overbookingLimit) {
        return res.status(400).json({
          status: 'error',
          message: 'This activity is fully booked for the selected date. Please choose another date or contact us via WhatsApp.',
        });
      }
    }

    // --- Server-computed financial fields (client input for these is ignored) ---
    const totalAmount = Math.round(unitPrice * people);
    const depositAmount = Math.max(Math.round((totalAmount * DEPOSIT_PERCENTAGE) / 10) * 10, MIN_DEPOSIT_MAD);

    const bookingData: Record<string, any> = {
      activityId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      numberOfPeople: people,
      preferredDate: requestedDate,
      status: 'PENDING',
      totalAmount: String(totalAmount),
      depositAmount,
      paymentMethod: 'cash_deposit',
      paymentStatus: 'unpaid',
      paidAmount: 0,
    };
    if (isNonEmptyString(customerEmail)) bookingData.customerEmail = customerEmail.trim();
    if (Array.isArray(participantNames)) bookingData.participantNames = participantNames;
    if (isNonEmptyString(notes)) bookingData.notes = notes.trim();

    const booking = await storage.createBooking(bookingData as any);

    // Send WhatsApp "request received" notice via the FREE notification queue.
    // This is a request, not a confirmation — the booking is PENDING until an
    // Admin/Superadmin explicitly confirms it (Phase 4 §4).
    try {
      const activityName = activity.name || 'Activity';
      const dateLabel = requestedDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      const bookingRef = String(booking._id || booking.id || '');

      const { freeNotificationQueue } = await import('../services/free-notification-queue.js');
      const message = `📩 *Booking Request Received*

Activity: ${activityName}
Date: ${dateLabel}
People: ${people}
Total: ${totalAmount} MAD
Deposit: ${depositAmount} MAD${bookingRef ? `\nReference: ${bookingRef.slice(-8).toUpperCase()}` : ''}

Our team will confirm availability with you via WhatsApp shortly.

Thank you for choosing MarrakechDunes! 🏜️`.trim();

      freeNotificationQueue.addNotification({
        type: 'booking_confirmation',
        customerPhone: bookingData.customerPhone,
        customerName: bookingData.customerName,
        message,
        whatsappLink: freeNotificationQueue.generateWhatsAppLink(bookingData.customerPhone, message),
        priority: 'high',
        bookingId: booking._id || booking.id,
        metadata: {
          activityName,
          date: requestedDate.toISOString(),
          amount: depositAmount,
        },
      });
    } catch (notificationError) {
      // Don't fail booking creation if notification fails
      console.error('[BOOKINGS] Failed to send request-received notice:', notificationError);
    }

    return res.status(201).json(booking);
  } catch (error) {
    console.error('[BOOKINGS] Error creating booking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Booking could not be submitted. Please try again or contact us via WhatsApp.',
    });
  }
});

export default router;
