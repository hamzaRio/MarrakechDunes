import { Router, Request, Response } from 'express';

const router = Router();

function guard(req: Request, res: Response) {
  const header = req.headers.authorization || '';
  const expected =
    'Basic ' +
    Buffer.from(
      `${process.env.GYG_SUPPLIER_USER}:${process.env.GYG_SUPPLIER_PASS}`
    ).toString('base64');

  if (header !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

router.get('/1/get-availabilities', (req, res) => {
  if (!guard(req, res)) return;

  const { product_id, from, to } = req.query as Record<string, string>;
  const currency = (req.query.currency as string) || 'MAD';
  if (!product_id || !from || !to) {
    return res.status(400).json({ error: 'Missing product_id/from/to' });
  }

  // Return two example windows inside requested range
  res.json({
    productId: product_id,
    currency,
    availabilities: [
      {
        start_time: `${from}T09:00:00Z`,
        end_time:   `${from}T12:00:00Z`,
        total_available: 8,
        price_per_person: 450,
        categories: { ADULT: { min: 1, max: 16 }, CHILD: { min: 0, max: 8 } }
      },
      {
        start_time: `${to}T09:00:00Z`,
        end_time:   `${to}T12:00:00Z`,
        total_available: 10,
        price_per_person: 480,
        categories: { ADULT: { min: 1, max: 16 }, CHILD: { min: 0, max: 8 } }
      }
    ]
  });
});

router.post('/1/notify-availability-update', (req, res) => {
  if (!guard(req, res)) return;
  res.json({ ok: true });
});

router.post('/1/deals', (req, res) => {
  if (!guard(req, res)) return;
  res.json({ id: 'deal-123' });
});

router.get('/1/deals', (req, res) => {
  if (!guard(req, res)) return;
  res.json({ deals: [] });
});

router.delete('/1/deals/:id', (req, res) => {
  if (!guard(req, res)) return;
  res.json({ ok: true });
});

router.post('/1/suppliers', (req, res) => {
  if (!guard(req, res)) return;
  res.json({ ok: true });
});

// Health check endpoint (no auth required for basic connectivity test)
router.get('/health', (req, res) => {
  res.json({ ok: true });
});

export default router;
