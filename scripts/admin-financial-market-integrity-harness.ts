import assert from 'node:assert/strict';
import express from 'express';
import request from 'supertest';
import { calculateBookingSummary } from '../server/src/utils/booking-query.js';
import { calculateDynamicPricing } from '../server/src/utils/dynamic-pricing.js';
import { isGYGLiveIntegrationEnabled } from '../server/src/services/gyg-live-integration.js';
import { storage } from '../server/src/storage.js';
import adminRouter from '../server/src/routes/admin.js';
import gygRouter from '../server/src/routes/getyourguide.js';
import marketIntelligenceRouter from '../server/src/routes/market-intelligence.js';

const originalLiveFlag = process.env.GYG_LIVE_INTEGRATION_ENABLED;
const originalGetUser = storage.getUser;

try {
  delete process.env.GYG_LIVE_INTEGRATION_ENABLED;
  assert.equal(isGYGLiveIntegrationEnabled(), false, 'live GYG must be opt-in');
  process.env.GYG_LIVE_INTEGRATION_ENABLED = 'true';
  assert.equal(isGYGLiveIntegrationEnabled(), true, 'explicit opt-in should be recognized');
  process.env.GYG_LIVE_INTEGRATION_ENABLED = 'false';

  // The observed production values are consistent with the documented rules:
  // cancelled bookings do not create active gross value or receivables, while
  // cash already recorded remains visible until a refund transaction exists.
  const financial = calculateBookingSummary([
    { status: 'CANCELLED', totalAmount: '450', paidAmount: 450 },
    { status: 'COMPLETED', totalAmount: '200', paidAmount: 100 },
  ]);
  assert.equal(financial.collectedPayments, 550);
  assert.equal(financial.grossBookingValue, 200);
  assert.equal(financial.outstandingAmount, 100);
  assert.equal(financial.cancelledBookings, 1);

  const lowSeasonQuote = calculateDynamicPricing({
    activityId: 'activity',
    date: new Date('2040-01-15T00:00:00.000Z'),
    partySize: 1,
    basePrice: 200,
    currentBookings: 5,
    maxCapacity: 10,
  });
  assert.equal(lowSeasonQuote.breakdown.base, 200);
  assert.equal(lowSeasonQuote.seasonalAdjustment, -10);
  assert.equal(lowSeasonQuote.finalPrice, 180, 'seasonal price calculation must remain available');

  (storage as any).getUser = async () => ({ _id: 'staff', id: 'staff', role: 'superadmin' });
  const withSession = (app: express.Express) => {
    app.use((_req, _res, next) => {
      (_req as any).session = {
        authenticated: true,
        role: 'superadmin',
        userId: 'staff',
        destroy: (callback?: () => void) => callback?.(),
      };
      next();
    });
    return app;
  };

  const gygApp = withSession(express());
  gygApp.use('/api/gyg', gygRouter);
  const disabledSearch = await request(gygApp).get('/api/gyg/search').query({ q: 'desert' });
  assert.equal(disabledSearch.status, 503);
  assert.equal(disabledSearch.body.code, 'GYG_LIVE_INTEGRATION_DISABLED');

  const adminApp = withSession(express());
  adminApp.use('/api/admin', adminRouter);
  const disabledPriceUpdate = await request(adminApp).get('/api/admin/activities/activity/getyourguide-price');
  assert.equal(disabledPriceUpdate.status, 503);
  assert.equal(disabledPriceUpdate.body.code, 'GYG_LIVE_INTEGRATION_DISABLED');

  const marketApp = withSession(express());
  marketApp.use('/api/market', marketIntelligenceRouter);
  const providerStatus = await request(marketApp).get('/api/market/providers');
  assert.equal(providerStatus.status, 200);
  assert.equal(providerStatus.body.providers.getyourguide.active, false);
  const disabledMarketSearch = await request(marketApp).get('/api/market/search').query({ provider: 'gyg', q: 'desert' });
  assert.equal(disabledMarketSearch.status, 503);
  assert.equal(disabledMarketSearch.body.code, 'GYG_LIVE_INTEGRATION_DISABLED');

  console.log('admin financial, pricing, and disabled GYG integration: PASS');
} finally {
  (storage as any).getUser = originalGetUser;
  if (originalLiveFlag === undefined) delete process.env.GYG_LIVE_INTEGRATION_ENABLED;
  else process.env.GYG_LIVE_INTEGRATION_ENABLED = originalLiveFlag;
}
