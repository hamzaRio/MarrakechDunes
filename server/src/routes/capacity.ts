import express from 'express';
import { capacityManagementSystem } from '../utils/capacity-management.js';
import { storage } from '../storage.js';

const router = express.Router();

// Check capacity for a booking
router.get('/:activityId/check', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { date, participants } = req.query;
    
    if (!date || !participants) {
      return res.status(400).json({ error: 'Date and participants are required' });
    }

    const activity = await storage.getActivity(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const existingBookings = await storage.getBookingsByDate(new Date(date as string));
    const result = capacityManagementSystem.checkCapacity(
      activity,
      new Date(date as string),
      parseInt(participants as string),
      existingBookings
    );

    res.json(result);
  } catch (error) {
    console.error('Capacity check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get capacity status for an activity
router.get('/:activityId/status', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: 'Date is required' });
    }

    const activity = await storage.getActivity(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const existingBookings = await storage.getBookingsByDate(new Date(date as string));
    const status = capacityManagementSystem.getCapacityStatus(
      activity,
      new Date(date as string),
      existingBookings
    );

    res.json(status);
  } catch (error) {
    console.error('Capacity status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to waitlist
router.post('/:activityId/waitlist', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { customerName, customerPhone, customerEmail, preferredDate, participants } = req.body;
    
    if (!customerName || !customerPhone || !customerEmail || !preferredDate || !participants) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const activity = await storage.getActivity(activityId);
    if (!activity) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    const waitlistEntry = capacityManagementSystem.addToWaitlist(
      activityId,
      customerName,
      customerPhone,
      customerEmail,
      new Date(preferredDate),
      parseInt(participants)
    );

    res.json({
      success: true,
      waitlistEntry,
      message: 'Added to waitlist successfully'
    });
  } catch (error) {
    console.error('Waitlist addition error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get waitlist for an activity
router.get('/:activityId/waitlist', async (req, res) => {
  try {
    const { activityId } = req.params;
    const waitlist = capacityManagementSystem.getWaitlist(activityId);
    res.json(waitlist);
  } catch (error) {
    console.error('Waitlist retrieval error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Remove from waitlist
router.delete('/:activityId/waitlist/:entryId', async (req, res) => {
  try {
    const { activityId, entryId } = req.params;
    const removed = capacityManagementSystem.removeFromWaitlist(activityId, entryId);
    
    if (removed) {
      res.json({ success: true, message: 'Removed from waitlist' });
    } else {
      res.status(404).json({ error: 'Waitlist entry not found' });
    }
  } catch (error) {
    console.error('Waitlist removal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Process waitlist when spots become available
router.post('/:activityId/process-waitlist', async (req, res) => {
  try {
    const { activityId } = req.params;
    const { availableSpots, date } = req.body;
    
    if (!availableSpots || !date) {
      return res.status(400).json({ error: 'Available spots and date are required' });
    }

    const promotedEntries = await capacityManagementSystem.processWaitlist(
      activityId,
      parseInt(availableSpots),
      new Date(date)
    );

    res.json({
      success: true,
      promotedEntries,
      count: promotedEntries.length
    });
  } catch (error) {
    console.error('Waitlist processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get capacity policy
router.get('/policy', (req, res) => {
  const policy = capacityManagementSystem.getPolicy();
  res.json(policy);
});

// Update capacity policy
router.put('/policy', (req, res) => {
  try {
    const newPolicy = req.body;
    capacityManagementSystem.updatePolicy(newPolicy);
    res.json({ success: true, policy: capacityManagementSystem.getPolicy() });
  } catch (error) {
    console.error('Policy update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
