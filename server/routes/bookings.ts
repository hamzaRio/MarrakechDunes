import express from 'express';
import { z } from 'zod';
import { PaymentStatus, PaymentType } from '../../shared/types/finance';
import Booking from '../models/Booking';

const router = express.Router();

const paymentUpdateSchema = z.object({
  type: z.nativeEnum(PaymentType),
  paidAmount: z.number().nonnegative(),
});

router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { type, paidAmount } = paymentUpdateSchema.parse(req.body);

    const booking = await Booking.findById(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const total = booking.totalAmount ?? 0;
    const newPaid = Math.min(total, paidAmount);

    let status: PaymentStatus = PaymentStatus.UNPAID;
    if (newPaid <= 0) status = PaymentStatus.UNPAID;
    else if (newPaid < total) {
      status = type === PaymentType.DEPOSIT
        ? PaymentStatus.DEPOSIT_PAID
        : PaymentStatus.PARTIALLY_PAID;
    } else {
      status = PaymentStatus.FULLY_PAID;
    }

    booking.payment = {
      ...(booking.payment ?? {}),
      type,
      paidAmount: newPaid,
      remaining: Math.max(0, total - newPaid),
      status,
    };

    await booking.save();
    res.json({ success: true, payment: booking.payment });
  } catch (e) {
    console.error('Payment update error', e);
    res.status(400).json({ error: 'Invalid payment payload' });
  }
});

export default router;
