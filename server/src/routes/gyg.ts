import { Router, Request, Response } from 'express';

const router = Router();

// Basic Auth middleware
function basicAuth(req: Request, res: Response, next: Function) {
  const header = req.headers.authorization || '';
  const expected =
    'Basic ' +
    Buffer.from(
      `${process.env.GYG_SUPPLIER_USER}:${process.env.GYG_SUPPLIER_PASS}`
    ).toString('base64');

  if (header !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  next();
}

// no-auth health for the portal
router.get('/health', (_req, res) => res.json({ ok: true }));

// v=1 endpoints (Basic Auth)
router.get('/1/get-availabilities', basicAuth, (req, res) => {
  const { product_id, from, to } = req.query as Record<string, string>;
  const currency = (req.query.currency as string) || 'MAD';
  if (!product_id || !from || !to) {
    return res.status(400).json({ 
      error: 'Missing required query params: product_id, from, to',
      received: { product_id, from, to, currency }
    });
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

router.post('/1/notify-availability-update', basicAuth, (req, res) => {
  res.json({ ok: true });
});

export default router;
