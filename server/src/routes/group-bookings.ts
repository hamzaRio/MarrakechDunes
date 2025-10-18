import express from 'express';
import { z } from 'zod';
import { groupBookingSystem } from '../utils/group-booking-system.js';
import { storage } from '../storage.js';

const router = express.Router();

const groupBookingRequestSchema = z.object({
  activityId: z.string().min(1),
  coordinatorName: z.string().min(2),
  coordinatorPhone: z.string().min(10),
  coordinatorEmail: z.string().email(),
  participants: z.array(z.object({
    name: z.string().min(2),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    specialRequirements: z.string().optional()
  })).min(2),
  preferredDate: z.string().datetime(),
  notes: z.string().optional()
});

// Calculate group booking pricing
router.post('/calculate', async (req, res) => {
  try {
    const requestData = groupBookingRequestSchema.parse(req.body);
    
    const activity = await storage.getActivity(requestData.activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const request = {
      activityId: requestData.activityId,
      coordinatorName: requestData.coordinatorName,
      coordinatorPhone: requestData.coordinatorPhone,
      coordinatorEmail: requestData.coordinatorEmail,
      participants: requestData.participants,
      preferredDate: new Date(requestData.preferredDate),
      notes: requestData.notes
    };

    const result = groupBookingSystem.calculateGroupBooking(activity, request);
    res.json(result);
  } catch (error) {
    console.error('Group booking calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create group booking
router.post('/create', async (req, res) => {
  try {
    const requestData = groupBookingRequestSchema.parse(req.body);
    
    const activity = await storage.getActivity(requestData.activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const request = {
      activityId: requestData.activityId,
      coordinatorName: requestData.coordinatorName,
      coordinatorPhone: requestData.coordinatorPhone,
      coordinatorEmail: requestData.coordinatorEmail,
      participants: requestData.participants,
      preferredDate: new Date(requestData.preferredDate),
      notes: requestData.notes
    };

    const result = await groupBookingSystem.createGroupBooking(activity, request);
    
    if (result.success) {
      // Create the actual booking in database
      const booking = await storage.createBooking({
        customerName: request.coordinatorName,
        customerPhone: request.coordinatorPhone,
        customerEmail: request.coordinatorEmail,
        activityId: request.activityId,
        numberOfPeople: request.participants.length,
        preferredDate: request.preferredDate,
        participantNames: request.participants.map(p => p.name),
        totalAmount: result.finalAmount.toString(),
        paymentStatus: 'unpaid',
        status: 'PENDING',
        paymentMethod: 'cash',
        paidAmount: 0,
        rescheduleCount: 0,
        isGroupBooking: true,
        groupDiscountPct: result.discountPercentage,
        notes: request.notes
      });

      res.json({
        success: true,
        booking,
        groupSummary: groupBookingSystem.generateGroupSummary(result),
        warnings: result.warnings
      });
    } else {
      res.status(400).json({
        success: false,
        errors: result.errors,
        warnings: result.warnings
      });
    }
  } catch (error) {
    console.error('Group booking creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get group discounts
router.get('/discounts', (req, res) => {
  const discounts = groupBookingSystem.getAvailableDiscounts();
  res.json(discounts);
});

// Get discount for specific group size
router.get('/discounts/:size', (req, res) => {
  try {
    const size = parseInt(req.params.size);
    if (isNaN(size) || size < 1) {
      return res.status(400).json({ error: 'Invalid group size' });
    }

    const discount = groupBookingSystem.getDiscountForGroupSize(size);
    res.json(discount);
  } catch (error) {
    console.error('Discount lookup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate group booking request
router.post('/validate', (req, res) => {
  try {
    const requestData = groupBookingRequestSchema.parse(req.body);
    
    const request = {
      activityId: requestData.activityId,
      coordinatorName: requestData.coordinatorName,
      coordinatorPhone: requestData.coordinatorPhone,
      coordinatorEmail: requestData.coordinatorEmail,
      participants: requestData.participants,
      preferredDate: new Date(requestData.preferredDate),
      notes: requestData.notes
    };

    const validation = groupBookingSystem.validateGroupBookingRequest(request);
    res.json(validation);
  } catch (error) {
    console.error('Group booking validation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
