import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { validateGYGQuery } from '../utils/gyg-validation.js';

export const gyg = Router();

// In-memory storage for availability data
const availabilityStore: Map<string, any[]> = new Map();

/**
 * Public health endpoint (no auth required)
 */
gyg.get('/1/health', (req: Request, res: Response) => {
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
    console.log('[GYG-AUTH] Missing or invalid Authorization header');
    return res.status(401)
      .set('WWW-Authenticate', 'Basic realm="GYG"')
      .json({ ok: false, error: 'unauthorized' });
  }

  try {
    const [user, pass] = Buffer.from(auth.slice(6), 'base64').toString('utf8').split(':');
    
    const expectedUser = process.env.GYG_SUPPLIER_USER;
    const expectedPass = process.env.GYG_SUPPLIER_PASS;
    
    if (!expectedUser || !expectedPass) {
      console.log('[GYG-AUTH] Missing GYG_SUPPLIER_USER or GYG_SUPPLIER_PASS environment variables');
      return res.status(500)
        .json({ ok: false, error: 'server configuration error' });
    }
    
    if (user !== expectedUser || pass !== expectedPass) {
      console.log('[GYG-AUTH] Invalid credentials provided');
      return res.status(401)
        .set('WWW-Authenticate', 'Basic realm="GYG"')
        .json({ ok: false, error: 'unauthorized' });
    }
    
    console.log('[GYG-AUTH] Authentication successful');
    next();
  } catch (error) {
    console.log('[GYG-AUTH] Error parsing Authorization header:', error);
    return res.status(401)
      .set('WWW-Authenticate', 'Basic realm="GYG"')
      .json({ ok: false, error: 'unauthorized' });
  }
}

/**
 * GET /gyg/1/get-availabilities
 * Must return an ARRAY of product availability objects.
 */
gyg.get('/1/get-availabilities', requireBasicAuth, validateGYGQuery, (req: Request, res: Response) => {
  const id = randomUUID();
  res.setHeader('X-Debug-Id', id);
  
  const { product_id, from, to, currency, unavailable_from, unavailable_to } = req.gygParams!;

  // Get stored availability data for this product
  const productId = product_id || 'desert-tour-marrakech-001';
  const storedAvailabilities = availabilityStore.get(productId) || [];
  
  // If no stored data, return default availability
  const availabilities = storedAvailabilities.length > 0 ? storedAvailabilities : [
    {
      start_time: '2025-11-10T09:00:00Z',
      end_time: '2025-11-10T12:00:00Z',
      total_available: 10,
      price_per_person: 480,
      categories: {
        ADULT: { min: 1, max: 16 },
        CHILD: { min: 0, max: 8 },
      },
    },
    {
      start_time: '2025-11-10T15:00:00Z',
      end_time: '2025-11-10T18:00:00Z',
      total_available: 10,
      price_per_person: 480,
      categories: {
        ADULT: { min: 1, max: 16 },
        CHILD: { min: 0, max: 8 },
      },
    },
  ];

  const response = [
    {
      product_id: productId,
      currency: currency || 'MAD',
      availabilities: availabilities,
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
 * Stores availability data in memory and responds with { ok: true }.
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
  
  // Store the availability data in memory
  const { product_id, date, slots } = req.body;
  
  if (product_id && slots && Array.isArray(slots)) {
    // Store slots by product_id
    availabilityStore.set(product_id, slots);
    console.log(`[GYG-STORE] Stored ${slots.length} slots for product ${product_id}`);
  }
  
  res.json({ ok: true });
});

export default gyg;
