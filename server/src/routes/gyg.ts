import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { validateGYGQuery } from '../utils/gyg-validation.js';

export const gyg = Router();

/**
 * Public health endpoint (no auth required)
 */
gyg.get('/health', (req: Request, res: Response) => {
  const id = randomUUID();
  res.setHeader('X-Debug-Id', id);
  console.log('[GYG-REQ]', JSON.stringify({
    id,
    time: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    hasBasicAuth: false,
    contentType: null,
    contentLength: null,
    durationMs: 0
  }));
  res.json({ ok: true });
});

/**
 * Basic authentication middleware
 */
function requireBasicAuth(req: Request, res: Response, next: Function) {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Basic ')) {
    return res.status(401).set('WWW-Authenticate', 'Basic realm="GYG"').end();
  }

  const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':');
  if (
    user !== process.env.GYG_SUPPLIER_USER ||
    pass !== process.env.GYG_SUPPLIER_PASS
  ) {
    return res.status(401).set('WWW-Authenticate', 'Basic realm="GYG"').end();
  }
  next();
}

/**
 * GET /gyg/1/get-availabilities
 * Must return an ARRAY of product availability objects.
 */
gyg.get('/1/get-availabilities', requireBasicAuth, validateGYGQuery, (req: Request, res: Response) => {
  const id = randomUUID();
  res.setHeader('X-Debug-Id', id);
  
  const { product_id, from, to, currency, unavailable_from, unavailable_to } = req.gygParams!;

  const response = [
    {
      product_id: product_id || 'desert-tour-marrakech-001',
      currency: currency || 'MAD',
      availabilities: [
        {
          start_time: '2025-10-26T09:00:00Z',
          end_time: '2025-10-26T12:00:00Z',
          total_available: 10,
          price_per_person: 480,
          categories: {
            ADULT: { min: 1, max: 16 },
            CHILD: { min: 0, max: 8 },
          },
        },
        {
          start_time: '2025-12-27T09:00:00Z',
          end_time: '2025-12-27T12:00:00Z',
          total_available: 10,
          price_per_person: 480,
          categories: {
            ADULT: { min: 1, max: 16 },
            CHILD: { min: 0, max: 8 },
          },
        },
      ],
    },
  ];

  console.log('[GYG-REQ]', JSON.stringify({
    id,
    time: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: {
      product_id,
      from,
      to,
      currency,
      unavailable_from: unavailable_from || null,
      unavailable_to: unavailable_to || null
    },
    hasBasicAuth: true,
    contentType: req.headers['content-type'] || null,
    contentLength: req.headers['content-length'] || null,
    durationMs: 0
  }));
  
  console.log('[GYG-RESP] get-availabilities:', JSON.stringify(response).slice(0, 400));
  res.json(response);
});

/**
 * POST /gyg/1/notify-availability-update
 * Responds with { ok: true }.
 */
gyg.post('/1/notify-availability-update', requireBasicAuth, (req: Request, res: Response) => {
  const id = randomUUID();
  res.setHeader('X-Debug-Id', id);
  
  console.log('[GYG-REQ]', JSON.stringify({
    id,
    time: new Date().toISOString(),
    method: req.method,
    path: req.path,
    query: req.query,
    hasBasicAuth: true,
    contentType: req.headers['content-type'] || null,
    contentLength: req.headers['content-length'] || null,
    durationMs: 0
  }));
  
  console.log('[GYG-REQ] notify-availability-update payload:', req.body);
  res.json({ ok: true });
});

export default gyg;
