import express from 'express';
import { z } from 'zod';
import { PaymentStatus, PaymentType } from '../types/finance.js';
import { storage } from '../storage.js';

const router = express.Router();

const paymentUpdateSchema = z.object({
  type: z.nativeEnum(PaymentType),
  paidAmount: z.number().nonnegative(),
});

router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, paidAmount } = paymentUpdateSchema.parse(req.body);

    const booking = await storage.getBooking(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const total = Number(booking.totalAmount) ?? 0;
    const newPaid = Math.min(total, Number(paidAmount));

    let status: 'unpaid' | 'deposit_paid' | 'fully_paid' = 'unpaid';
    if (newPaid <= 0) status = 'unpaid';
    else if (newPaid < total) {
      status = type === PaymentType.DEPOSIT
        ? 'deposit_paid'
        : 'unpaid';
    } else {
      status = 'fully_paid';
    }

    // Map payment type to expected values
    let paymentMethod: 'cash' | 'cash_deposit' = 'cash';
    if (type === PaymentType.CASH) paymentMethod = 'cash';
    else if (type === PaymentType.DEPOSIT) paymentMethod = 'cash_deposit';
    else paymentMethod = 'cash';

    // Update booking with payment information
    const updatedBooking = await storage.updateBooking(id, {
      paidAmount: newPaid,
      paymentStatus: status,
      paymentMethod: paymentMethod,
    });

    res.json({ success: true, payment: {
      type,
      paidAmount: newPaid,
      remaining: Math.max(0, total - newPaid),
      status,
    }});
  } catch (e) {
    console.error('Payment update error', e);
    res.status(400).json({ error: 'Invalid payment payload' });
  }
});

export default router;
