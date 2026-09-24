import { Router, Request, Response, NextFunction } from 'express';
import axios from 'axios';
import { testConnection } from '../utils/gyg.js';
import { GYGFetcher, GYGActivity } from '../utils/gygFetcher.js';
import { MoroccoActivityFetcher, MoroccoActivity } from '../utils/moroccoActivityFetcher.js';
import { MoroccoDatabase, MoroccoActivityData } from '../utils/moroccoDatabase.js';
import GYGCache from '../models/GYGCache.js';
import GYGComparable, { SUPPORTED_GYG_CURRENCIES, SUPPORTED_MARKET_PROVIDERS, type SupportedGYGCurrency, type MarketProvider } from '../models/GYGComparable.js';
import { requireAdmin, requireSuperAdmin } from '../middleware/admin-auth.js';
import { calculateVerifiedMetrics, normalizeGYGOffer, type GYGTrustSource } from '../services/gyg-comparison.js';
import { consumeGYGRateLimit } from '../services/gyg-rate-limits.js';
import { gygRequestKey, gygResilience, isGYGServiceUnavailable } from '../services/gyg-resilience.js';
import { rankCandidateMatches, type MatchableActivity } from '../services/gyg-matching.js';
import { isOfficialGYGConfigured, searchOfficialGYG } from '../providers/gyg.js';

const router = Router();

const VIATOR_COMPARABLE_TTL_MS = 60 * 60 * 1000;

const isTrueQueryValue = (value: unknown) =>
  value === 'true' || value === '1' || value === true;

// Phase 3D-2: viewing the cache-first my-activities comparison workspace is
// an Admin-level action; only an explicit live scrape (forceRefresh=true) is
// Superadmin-only. Gating on useMyActivities alone (the old behavior) made
// the whole workspace Superadmin-only, which contradicts "Admin may view the
// comparison workspace but cannot force live refresh."
const requireSuperAdminForLiveRefresh = (req: Request, res: Response, next: NextFunction) => {
  if (!isTrueQueryValue(req.query.forceRefresh)) {
    return next();
  }

  return requireSuperAdmin(req, res, next);
};

// In-memory cache for GetYourGuide API responses
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30 * 1000; // 30 seconds

const trustSourceFor = (source: string): GYGTrustSource => {
  if (source === 'getyourguide-scraped') return 'LIVE_VERIFIED';
  if (source === 'curated-database') return 'CURATED_REFERENCE';
  if (source === 'fallback') return 'GENERATED_FALLBACK';
  return 'LEGACY_UNVERIFIED';
};

const comparisonResponse = (offers: Record<string, any>[], sourceType: GYGTrustSource, fetchedAt: Date | null, expiresAt: Date | null) => {
  const normalizedOffers = offers.map((offer) => normalizeGYGOffer(offer, {
    sourceType: offer.sourceType ?? sourceType,
    fetchedAt: offer.fetchedAt ?? fetchedAt,
    expiresAt: offer.expiresAt ?? expiresAt,
  }));
  return {
    offers: normalizedOffers,
    metadata: { sourceType, verified: normalizedOffers[0]?.verified ?? false, stale: normalizedOffers[0]?.stale ?? false, fetchedAt, expiresAt },
    metrics: calculateVerifiedMetrics(normalizedOffers),
  };
};

const circuitIsOpen = () => gygResilience.getDiagnostics().circuitState === 'OPEN';

/**
 * Official Partner API search used by the reusable staff search widget.
 * This route never fabricates results when credentials are unavailable; the
 * UI can then offer a direct GetYourGuide website search as a manual fallback.
 */
router.get('/official-search', requireAdmin, async (req: Request, res: Response) => {
  const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (query.length < 2) {
    return res.status(400).json({ error: 'A search query is required.' });
  }
  if (!isOfficialGYGConfigured()) {
    return res.status(503).json({
      code: 'GYG_API_NOT_CONFIGURED',
      message: 'GetYourGuide API access is not configured.',
      searchUrl: `https://www.getyourguide.com/s/?q=${encodeURIComponent(query)}`,
    });
  }
  if (!consumeGYGRateLimit(req, res, 'normalSearch')) return;
  try {
    const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 50);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const activities = await searchOfficialGYG(query, limit, offset);
    return res.json({ activities, total: activities.length, hasMore: activities.length >= limit, offset, limit });
  } catch (error: any) {
    console.warn('[GYG Official API] Search failed:', error?.message || 'unknown error');
    return res.status(503).json({
      code: error?.code || 'GYG_UPSTREAM_UNAVAILABLE',
      message: 'Live GetYourGuide data is temporarily unavailable.',
      searchUrl: `https://www.getyourguide.com/s/?q=${encodeURIComponent(query)}`,
    });
  }
});

/**
 * Load any superadmin ACCEPT/REJECT decisions recorded for this activity,
 * keyed by candidate id, so they can be re-attached to freshly-scraped
 * offers. This lookup never mutates the automatic matchScore/validationState
 * computed for the current run — it only overlays a human decision on top,
 * so a manual override survives cache expiry and rematching untouched.
 */
async function loadMatchOverrides(ourActivityId: string): Promise<Map<string, { decision: string; overriddenBy: string; overriddenAt: Date }>> {
  if (!ourActivityId) return new Map();
  try {
    const { default: GYGMatchOverride } = await import('../models/GYGMatchOverride.js');
    const docs = await GYGMatchOverride.find({ ourActivityId }).lean();
    const map = new Map<string, { decision: string; overriddenBy: string; overriddenAt: Date }>();
    for (const doc of docs as any[]) {
      map.set(String(doc.matchedExternalId), {
        decision: doc.decision,
        overriddenBy: doc.overriddenBy,
        overriddenAt: doc.overriddenAt,
      });
    }
    return map;
  } catch (err: any) {
    console.warn('[GYG Matching] Failed to load match overrides:', err?.message);
    return new Map();
  }
}

/**
 * Score raw GYG candidates against one of our activities for commercial
 * comparability, and overlay any persisted manual override. Offers are
 * returned best-match-first; matchScore/matchReasons/validationState/
 * manualOverride are read through by normalizeGYGOffer.
 */
async function attachMatchingToOffers(myActivity: any, rawOffers: any[]): Promise<any[]> {
  if (rawOffers.length === 0) return rawOffers;

  const ourActivityId = String(myActivity._id || myActivity.id || '');
  const ourActivityForMatching: MatchableActivity = {
    name: myActivity.name,
    description: myActivity.description,
    category: myActivity.category,
    duration: myActivity.duration,
    location: myActivity.location,
  };

  const overridesById = await loadMatchOverrides(ourActivityId);
  const ranked = rankCandidateMatches(ourActivityForMatching, rawOffers);

  return ranked.map((offer) => ({
    ...offer,
    ourActivityId,
    matchedExternalId: String(offer.id),
    manualOverride: overridesById.get(String(offer.id)) ?? null,
  }));
}

// Phase 3D-2 cache-first comparison storage. Reuses the existing GYGCache
// model (no new collection) keyed by a namespaced pseudo-query so it never
// collides with a real search term, and never bypasses its TTL index.
const ACTIVITY_COMPARISON_TTL_MS = 24 * 60 * 60 * 1000;
const activityCacheKey = (ourActivityId: string) => `activity:${ourActivityId}`;

async function loadCachedComparison(ourActivityId: string): Promise<{ offers: any[]; fetchedAt: Date | null; expiresAt: Date | null; fresh: boolean } | null> {
  if (!ourActivityId) return null;
  try {
    const doc = await GYGCache.findOne({ normalizedQuery: activityCacheKey(ourActivityId) });
    if (!doc || !Array.isArray(doc.results) || doc.results.length === 0) return null;
    const expiresAt = doc.expiresAt ?? null;
    return {
      offers: doc.results,
      fetchedAt: doc.fetchedAt ?? doc.lastFetched ?? null,
      expiresAt,
      fresh: !!expiresAt && expiresAt.getTime() > Date.now(),
    };
  } catch (err: any) {
    console.warn('[GYG Comparison] Failed to load cached comparison:', err?.message);
    return null;
  }
}

async function saveCachedComparison(ourActivityId: string, activityName: string, offers: any[], fetchedAt: Date): Promise<void> {
  if (!ourActivityId) return;
  try {
    const expiresAt = new Date(fetchedAt.getTime() + ACTIVITY_COMPARISON_TTL_MS);
    await GYGCache.findOneAndUpdate(
      { normalizedQuery: activityCacheKey(ourActivityId) },
      {
        query: activityName,
        normalizedQuery: activityCacheKey(ourActivityId),
        results: offers,
        source: 'getyourguide-scraped',
        ourActivityId,
        sourceType: 'LIVE_VERIFIED',
        verified: true,
        stale: false,
        fetchedAt,
        resultCount: offers.length,
        searchTime: 0,
        lastFetched: fetchedAt,
        expiresAt,
      },
      { upsert: true, new: true },
    );
  } catch (err: any) {
    console.warn('[GYG Comparison] Failed to cache comparison:', err?.message);
  }
}

async function withOverridesReattached(ourActivityId: string, offers: any[]): Promise<any[]> {
  const overridesById = await loadMatchOverrides(ourActivityId);
  return offers.map((offer: any) => ({
    ...offer,
    manualOverride: overridesById.get(String(offer.matchedExternalId ?? offer.id)) ?? null,
  }));
}

const normalizeComparableUrl = (value: unknown, provider: MarketProvider = 'GETYOURGUIDE'): string | null => {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value.trim());
    const host = url.hostname.toLowerCase();
    if (url.protocol !== 'https:') return null;
    if (provider === 'GETYOURGUIDE' && !(host === 'getyourguide.com' || host.endsWith('.getyourguide.com'))) return null;
    if (provider === 'VIATOR' && !(host === 'viator.com' || host.endsWith('.viator.com'))) return null;
    url.hash = '';
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

async function loadManualComparables(ourActivityId: string): Promise<any[]> {
  const records = await GYGComparable.find({ ourActivityId }).lean();
  return records.map((record: any) => {
    const isViator = record.provider === 'VIATOR';
    const expiresAt = record.expiresAt ? new Date(record.expiresAt) : null;
    const stale = isViator && (!expiresAt || expiresAt.getTime() <= Date.now());
    const sourceType = stale
      ? 'STALE_VERIFIED'
      : (record.sourceType ?? 'MANUAL_VERIFIED');

    return {
    id: `manual:${record._id}`,
    ourActivityId,
    matchedExternalId: `manual:${record._id}`,
    matchedUrl: record.url,
    url: record.url,
    title: record.title,
    price: Number(record.price) || 0,
    currency: record.currency,
    originalPrice: record.price,
    originalCurrency: record.currency,
    normalizedMadPrice: record.normalizedMadPrice,
    rating: record.rating,
    reviewCount: record.reviewCount,
    duration: record.duration,
    sourceType,
    verified: true,
    stale,
    fetchedAt: record.verifiedAt,
    expiresAt,
    validationState: 'STRONG_MATCH',
    matchReasons: Number(record.normalizedMadPrice) > 0 ? ['Manually verified comparable'] : ['Needs MAD normalization'],
    manualComparableId: String(record._id),
    notes: record.notes,
    provider: record.provider ?? 'GETYOURGUIDE',
    externalId: record.externalId ?? null,
    checkedAt: record.checkedAt ?? record.verifiedAt,
    };
  });
}

interface ActivityComparisonResult {
  gygMatches: any[];
  metrics: ReturnType<typeof calculateVerifiedMetrics>;
  dataStatus: 'fresh' | 'stale' | 'none' | 'unavailable';
  message?: string;
}

/**
 * Cache-first, per-activity comparison (Phase 3D-2 §9). A normal read never
 * calls GetYourGuide — it only ever reads GYGCache. Only forceRefresh=true
 * (Superadmin-gated at the route) performs a live, resilience-protected
 * scrape, and a failed live scrape falls back to the last verified cache
 * entry re-labeled STALE_VERIFIED, exactly like the generic /search route.
 */
async function getActivityComparison(myActivity: any, forceRefresh: boolean): Promise<ActivityComparisonResult> {
  const ourActivityId = String(myActivity._id || myActivity.id || '');
  const cached = await loadCachedComparison(ourActivityId);
  const manualOffers = await loadManualComparables(ourActivityId);

  const withManualOffers = (offers: any[], sourceType: GYGTrustSource, fetchedAt: Date | null, expiresAt: Date | null) => {
    const comparison = comparisonResponse([...manualOffers, ...offers], sourceType, fetchedAt, expiresAt);
    return { gygMatches: comparison.offers, metrics: comparison.metrics };
  };

  if (!forceRefresh) {
    if (cached && cached.fresh) {
      const offers = await withOverridesReattached(ourActivityId, cached.offers);
      return { ...withManualOffers(offers, 'CACHED_VERIFIED', cached.fetchedAt, cached.expiresAt), dataStatus: 'fresh' };
    }
    if (cached) {
      // Expired but present: show it as stale rather than silently scraping.
      const offers = await withOverridesReattached(ourActivityId, cached.offers);
      return { ...withManualOffers(offers, 'STALE_VERIFIED', cached.fetchedAt, cached.expiresAt), dataStatus: 'stale' };
    }
    if (manualOffers.length) {
      return { ...withManualOffers([], 'MANUAL_VERIFIED', null, null), dataStatus: 'fresh' };
    }
    return {
      gygMatches: [],
      metrics: calculateVerifiedMetrics([]),
      dataStatus: 'none',
      message: 'No verified comparable GetYourGuide offers are currently available.',
    };
  }

  // forceRefresh === true from here on (Superadmin-only, rate-limited,
  // single-flight and circuit-breaker protected via gygResilience.run).
  try {
    console.log(`[GYG Comparison] Force live refresh for "${myActivity.name}"...`);
    const scraped = await gygResilience.run(
      gygRequestKey('activity', ourActivityId || myActivity.name),
      () => GYGFetcher.searchActivities(myActivity.name),
    );

    if (scraped.length > 0) {
      const rawOffers = scraped.map((a: GYGActivity) => ({
        id: a.id,
        title: a.title,
        price: a.price || 0,
        currency: a.currency || 'MAD',
        url: a.link,
        rating: a.rating,
        reviewCount: a.reviewCount,
        image: a.image,
        duration: a.duration,
        location: a.location,
      }));
      const scoredMatches = await attachMatchingToOffers(myActivity, rawOffers);
      const fetchedAt = new Date();
      const comparison = comparisonResponse([...manualOffers, ...scoredMatches], 'LIVE_VERIFIED', fetchedAt, new Date(fetchedAt.getTime() + ACTIVITY_COMPARISON_TTL_MS));
      // Manual records live in their own collection. Persisting them in the
      // scrape cache would duplicate them on the next merged read.
      await saveCachedComparison(ourActivityId, myActivity.name, scoredMatches, fetchedAt);
      return { gygMatches: comparison.offers, metrics: comparison.metrics, dataStatus: 'fresh' };
    }

    if (cached) {
      const offers = await withOverridesReattached(ourActivityId, cached.offers);
      return { ...withManualOffers(offers, 'STALE_VERIFIED', cached.fetchedAt, cached.expiresAt), dataStatus: 'stale' };
    }
    return {
      gygMatches: [],
      metrics: calculateVerifiedMetrics(manualOffers.map((offer) => normalizeGYGOffer(offer))),
      dataStatus: 'none',
      message: 'No verified comparable GetYourGuide offers are currently available.',
    };
  } catch (scrapeError: any) {
    console.warn(`[GYG Comparison] Force live refresh failed for "${myActivity.name}":`, scrapeError.message);
    if (cached) {
      const offers = await withOverridesReattached(ourActivityId, cached.offers);
      const comparison = comparisonResponse([...manualOffers, ...offers], 'STALE_VERIFIED', cached.fetchedAt, cached.expiresAt);
      return {
        gygMatches: comparison.offers,
        metrics: comparison.metrics,
        dataStatus: 'stale',
        message: 'Using previously verified GetYourGuide data. Live refresh is temporarily unavailable.',
      };
    }
    if (isGYGServiceUnavailable(scrapeError) || circuitIsOpen()) {
      return {
        gygMatches: manualOffers.map((offer) => normalizeGYGOffer(offer)),
        metrics: calculateVerifiedMetrics(manualOffers.map((offer) => normalizeGYGOffer(offer))),
        dataStatus: 'unavailable',
        message: 'Live GetYourGuide data is temporarily unavailable.',
      };
    }
    return {
      gygMatches: manualOffers.map((offer) => normalizeGYGOffer(offer)),
      metrics: calculateVerifiedMetrics(manualOffers.map((offer) => normalizeGYGOffer(offer))),
      dataStatus: 'unavailable',
      message: 'Live GetYourGuide data is temporarily unavailable.',
    };
  }
}

const sendGYGUnavailable = (res: Response, error?: any) => {
  const diagnostics = gygResilience.getDiagnostics();
  const retryAfter = error?.retryAfterMs
    ? Math.max(1, Math.ceil(error.retryAfterMs / 1000))
    : diagnostics.nextProbeAt
      ? Math.max(1, Math.ceil((new Date(diagnostics.nextProbeAt).getTime() - Date.now()) / 1000))
      : 30;
  res.setHeader('Retry-After', String(retryAfter));
  return res.status(503).json({
    status: 'error',
    code: error?.code ?? 'GYG_UPSTREAM_UNAVAILABLE',
    message: 'GetYourGuide live data is temporarily unavailable. Please try again later.',
    retryAfter,
  });
};

// Set UTF-8 encoding for all responses
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// Manual, staff-verified comparables are the dependable fallback while the
// public GetYourGuide source is unavailable. All writes are superadmin-only;
// Admin can consume the resulting trusted comparison read model.
router.get('/comparables', requireAdmin, async (req: Request, res: Response) => {
  const activityId = typeof req.query.activityId === 'string' ? req.query.activityId : '';
  if (!activityId) return res.status(400).json({ status: 'error', message: 'activityId is required' });
  const offers = await loadManualComparables(activityId);
  return res.json({ offers: offers.map((offer) => normalizeGYGOffer(offer)) });
});

router.post('/comparables', requireSuperAdmin, async (req: Request, res: Response) => {
  const { activityId, url, title, price, currency, rating, reviewCount, duration, notes, normalizedMadPrice, conversionRate, provider, externalId } = req.body ?? {};
  const normalizedProvider = String(provider ?? 'GETYOURGUIDE').toUpperCase() as MarketProvider;
  const normalizedUrl = normalizeComparableUrl(url, normalizedProvider);
  const normalizedCurrency = String(currency ?? '').toUpperCase() as SupportedGYGCurrency;
  const numericPrice = Number(price);
  const numericRating = rating == null || rating === '' ? null : Number(rating);
  const numericReviewCount = reviewCount == null || reviewCount === '' ? null : Number(reviewCount);

  if (!activityId || !normalizedUrl || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ status: 'error', message: 'A valid activity, provider HTTPS URL and offer title are required.' });
  }
  if (!SUPPORTED_MARKET_PROVIDERS.includes(normalizedProvider)) return res.status(400).json({ status: 'error', message: 'Provider must be Viator, GetYourGuide, or Other.' });
  if (!Number.isFinite(numericPrice) || numericPrice <= 0 || !SUPPORTED_GYG_CURRENCIES.includes(normalizedCurrency)) {
    return res.status(400).json({ status: 'error', message: 'Price must be greater than zero and currency must be supported.' });
  }
  if (numericRating != null && (!Number.isFinite(numericRating) || numericRating < 0 || numericRating > 5)) {
    return res.status(400).json({ status: 'error', message: 'Rating must be between 0 and 5.' });
  }
  if (numericReviewCount != null && (!Number.isInteger(numericReviewCount) || numericReviewCount < 0)) {
    return res.status(400).json({ status: 'error', message: 'Review count must be a non-negative integer.' });
  }
  const providedNormalizedMadPrice = normalizedMadPrice === undefined || normalizedMadPrice === '' ? null : Number(normalizedMadPrice);
  const providedRate = conversionRate === undefined || conversionRate === '' ? null : Number(conversionRate);
  if (normalizedCurrency !== 'MAD' && ((providedNormalizedMadPrice == null) !== (providedRate == null) || (providedNormalizedMadPrice != null && (!Number.isFinite(providedNormalizedMadPrice) || providedNormalizedMadPrice <= 0 || !Number.isFinite(providedRate!) || providedRate! <= 0)))) return res.status(400).json({ status: 'error', message: 'Foreign currencies need both a positive MAD equivalent and manual conversion rate, or neither.' });

  const { storage } = await import('../storage.js');
  if (!await storage.getActivity(String(activityId))) return res.status(404).json({ status: 'error', message: 'Activity not found.' });

  const now = new Date();
  const isViator = normalizedProvider === 'VIATOR';
  try {
    const comparable = await GYGComparable.create({
      ourActivityId: activityId,
      provider: normalizedProvider,
      externalId: typeof externalId === 'string' && externalId.trim() ? externalId.trim() : null,
      source: normalizedProvider === 'VIATOR' ? 'viator_official_api' : normalizedProvider === 'GETYOURGUIDE' ? 'getyourguide_manual' : 'other_manual',
      url: normalizedUrl,
      normalizedUrl,
      title: title.trim(),
      price: numericPrice,
      currency: normalizedCurrency,
      normalizedMadPrice: normalizedCurrency === 'MAD' ? numericPrice : providedNormalizedMadPrice,
      conversionRate: normalizedCurrency === 'MAD' ? 1 : providedRate,
      conversionRateSource: normalizedCurrency === 'MAD' ? 'identity' : (providedNormalizedMadPrice ? 'manual_operator' : null),
      conversionRateVerifiedAt: normalizedCurrency === 'MAD' || providedNormalizedMadPrice ? new Date() : null,
      rating: numericRating,
      reviewCount: numericReviewCount,
      duration: typeof duration === 'string' && duration.trim() ? duration.trim() : null,
      notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null,
      createdBy: String((req.session as any).userId ?? 'superadmin'),
      sourceType: isViator ? 'LIVE_VERIFIED' : 'MANUAL_VERIFIED',
      verifiedAt: now,
      checkedAt: now,
      expiresAt: isViator ? new Date(now.getTime() + VIATOR_COMPARABLE_TTL_MS) : null,
    });
    return res.status(201).json({ comparable });
  } catch (error: any) {
    if (error?.code === 11000 && isViator) {
      // A fresh official search result may refresh the same historical URL.
      // Reusing the record preserves its audit identity while restarting the
      // one-hour freshness window. A stale record is never revived by the
      // generic reverify action below.
      const existing = await GYGComparable.findOne({ ourActivityId: activityId, normalizedUrl });
      if (existing && existing.provider === 'VIATOR') {
        existing.externalId = typeof externalId === 'string' && externalId.trim() ? externalId.trim() : existing.externalId;
        existing.title = title.trim();
        existing.price = numericPrice;
        existing.currency = normalizedCurrency;
        existing.normalizedMadPrice = normalizedCurrency === 'MAD' ? numericPrice : providedNormalizedMadPrice;
        existing.conversionRate = normalizedCurrency === 'MAD' ? 1 : providedRate;
        existing.conversionRateSource = normalizedCurrency === 'MAD' ? 'identity' : (providedNormalizedMadPrice ? 'manual_operator' : null);
        existing.conversionRateVerifiedAt = normalizedCurrency === 'MAD' || providedNormalizedMadPrice ? now : null;
        existing.rating = numericRating;
        existing.reviewCount = numericReviewCount;
        existing.duration = typeof duration === 'string' && duration.trim() ? duration.trim() : null;
        existing.notes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;
        existing.verifiedAt = now;
        existing.checkedAt = now;
        existing.expiresAt = new Date(now.getTime() + VIATOR_COMPARABLE_TTL_MS);
        await existing.save();
        return res.json({ comparable: existing, refreshed: true });
      }
    }
    if (error?.code === 11000) return res.status(409).json({ status: 'error', message: 'This marketplace URL is already recorded for the activity.' });
    throw error;
  }
});

router.patch('/comparables/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  const comparable = await GYGComparable.findById(req.params.id);
  if (!comparable) return res.status(404).json({ status: 'error', message: 'Comparable not found.' });
  const { url, title, price, currency, rating, reviewCount, duration, notes, normalizedMadPrice, conversionRate, provider, externalId } = req.body ?? {};
  const normalizedProvider = String(provider ?? comparable.provider ?? 'GETYOURGUIDE').toUpperCase() as MarketProvider;
  if (!SUPPORTED_MARKET_PROVIDERS.includes(normalizedProvider)) return res.status(400).json({ status: 'error', message: 'Provider must be Viator, GetYourGuide, or Other.' });
  if (provider !== undefined && normalizedProvider !== (comparable.provider ?? 'GETYOURGUIDE')) return res.status(400).json({ status: 'error', message: 'Comparable provider cannot be changed after creation.' });
  if (externalId !== undefined && String(externalId ?? '') !== String(comparable.externalId ?? '')) return res.status(400).json({ status: 'error', message: 'Comparable external id cannot be changed after creation.' });
  if (url !== undefined) {
    const normalizedUrl = normalizeComparableUrl(url, normalizedProvider);
    if (!normalizedUrl) return res.status(400).json({ status: 'error', message: 'A valid provider HTTPS URL is required.' });
    comparable.url = normalizedUrl;
    comparable.normalizedUrl = normalizedUrl;
  }
  if (title !== undefined) {
    if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ status: 'error', message: 'Offer title is required.' });
    comparable.title = title.trim();
  }
  const normalizedCurrency = String(currency ?? comparable.currency).toUpperCase() as SupportedGYGCurrency;
  const numericPrice = price === undefined ? Number(comparable.price) : Number(price);
  if (!Number.isFinite(numericPrice) || numericPrice <= 0 || !SUPPORTED_GYG_CURRENCIES.includes(normalizedCurrency)) return res.status(400).json({ status: 'error', message: 'Price must be greater than zero and currency must be supported.' });
  comparable.price = numericPrice;
  comparable.currency = normalizedCurrency;
  const providedNormalizedMadPrice = normalizedMadPrice === undefined || normalizedMadPrice === '' ? null : Number(normalizedMadPrice);
  const providedRate = conversionRate === undefined || conversionRate === '' ? null : Number(conversionRate);
  if (normalizedCurrency !== 'MAD' && ((providedNormalizedMadPrice == null) !== (providedRate == null) || (providedNormalizedMadPrice != null && (!Number.isFinite(providedNormalizedMadPrice) || providedNormalizedMadPrice <= 0 || !Number.isFinite(providedRate!) || providedRate! <= 0)))) return res.status(400).json({ status: 'error', message: 'Foreign currencies need both a positive MAD equivalent and manual conversion rate, or neither.' });
  comparable.normalizedMadPrice = normalizedCurrency === 'MAD' ? numericPrice : providedNormalizedMadPrice;
  comparable.conversionRate = normalizedCurrency === 'MAD' ? 1 : providedRate;
  comparable.conversionRateSource = normalizedCurrency === 'MAD' ? 'identity' : (providedNormalizedMadPrice ? 'manual_operator' : null);
  comparable.conversionRateVerifiedAt = normalizedCurrency === 'MAD' || providedNormalizedMadPrice ? new Date() : null;
  if (rating !== undefined) {
    const value = rating === '' || rating == null ? null : Number(rating);
    if (value != null && (!Number.isFinite(value) || value < 0 || value > 5)) return res.status(400).json({ status: 'error', message: 'Rating must be between 0 and 5.' });
    comparable.rating = value;
  }
  if (reviewCount !== undefined) {
    const value = reviewCount === '' || reviewCount == null ? null : Number(reviewCount);
    if (value != null && (!Number.isInteger(value) || value < 0)) return res.status(400).json({ status: 'error', message: 'Review count must be a non-negative integer.' });
    comparable.reviewCount = value;
  }
  if (duration !== undefined) comparable.duration = typeof duration === 'string' && duration.trim() ? duration.trim() : null;
  if (notes !== undefined) comparable.notes = typeof notes === 'string' && notes.trim() ? notes.trim() : null;
  // Editing a Viator record is metadata maintenance only. It must not make
  // an expired official result current without a fresh Partner API search.
  if (comparable.provider !== 'VIATOR') {
    comparable.verifiedAt = new Date();
    comparable.checkedAt = new Date();
  }
  try {
    await comparable.save();
    return res.json({ comparable });
  } catch (error: any) {
    if (error?.code === 11000) return res.status(409).json({ status: 'error', message: 'This marketplace URL is already recorded for the activity.' });
    throw error;
  }
});

router.post('/comparables/:id/reverify', requireSuperAdmin, async (req: Request, res: Response) => {
  const comparable = await GYGComparable.findById(req.params.id);
  if (!comparable) return res.status(404).json({ status: 'error', message: 'Comparable not found.' });
  if (comparable.provider === 'VIATOR') {
    return res.status(409).json({ status: 'error', message: 'Viator comparables require a fresh official search before re-verification.' });
  }
  comparable.verifiedAt = new Date();
  comparable.checkedAt = new Date();
  await comparable.save();
  return res.json({ comparable });
});

router.delete('/comparables/:id', requireSuperAdmin, async (req: Request, res: Response) => {
  const comparable = await GYGComparable.findByIdAndDelete(req.params.id);
  if (!comparable) return res.status(404).json({ status: 'error', message: 'Comparable not found.' });
  return res.status(204).end();
});

/**
 * Calculate suggested price based on GetYourGuide price and competitive pricing rules
 */
function calculateSuggestedPrice(gygPrice: number, currency: string): number {
  // Simple pricing strategy: 10% undercut with minimum price
  const undercutPercent = 0.1; // 10% undercut
  const minPrice = 15; // Minimum 15 MAD
  
  // Calculate undercut price (percentage cheaper than GYG)
  const undercut = gygPrice * (1 - undercutPercent);
  
  // Ensure minimum price is respected
  const suggestedPrice = Math.max(undercut, minPrice);
  
  // Round to 2 decimal places
  return Math.round(suggestedPrice * 100) / 100;
}

// Mock data removed - using only real GetYourGuide Partner API

interface GetYourGuideActivity {
  id: string;
  title: string;
  gygPrice: number;
  suggestedPrice: number;
  currency: string;
  url: string;
}

/**
 * Search GetYourGuide activities with MongoDB caching and public site scraping
 * GET /api/gyg/search?q=...&forceRefresh=true&useMyActivities=true
 * 
 * If useMyActivities=true, it will:
 * 1. Get activities from your database
 * 2. Search GetYourGuide for each activity to find similar ones
 * 3. Return Morocco-based matches
 */
router.get('/search', requireAdmin, requireSuperAdminForLiveRefresh, async (req: Request, res: Response) => {
  try {
    const { q, forceRefresh, useMyActivities, activityId } = req.query;
    if (!consumeGYGRateLimit(req, res, 'cachedRead')) return;

    // Only an ACTUAL live scrape consumes the forceRefresh budget. A
    // cache-first my-activities read (the normal workspace page load) never
    // calls GetYourGuide, so it must not spend the same limited quota as a
    // real live refresh — that was a real bug in the pre-3D-2 rate-limit
    // accounting (useMyActivities alone used to consume this bucket).
    const liveRefreshRequested = isTrueQueryValue(forceRefresh);
    if (liveRefreshRequested && !consumeGYGRateLimit(req, res, 'forceRefresh')) return;

    // If useMyActivities is true, this is the Phase 3D-2 market-comparison
    // workspace: cache-first, and only ever calls GetYourGuide when
    // forceRefresh=true (Superadmin-gated by requireSuperAdminForLiveRefresh
    // above, and rate-limited/circuit-protected via getActivityComparison).
    if (useMyActivities === 'true') {
      try {
        const { storage } = await import('../storage.js');
        const myActivities = await storage.getActivities();
        const wantsForceRefresh = isTrueQueryValue(forceRefresh);
        const targetActivityId = typeof activityId === 'string' && activityId ? activityId : null;

        if (!targetActivityId && (!q || q === '' || q === 'all')) {
          // Bulk summary for every activity — ONE request, cache-only reads,
          // safe to call on every page load. Every activity gets a row, even
          // with no cached data yet, so staff can see what hasn't been
          // checked rather than have it silently disappear.
          const results = await Promise.all(myActivities.map(async (myActivity: any) => {
            const comparison = await getActivityComparison(myActivity, false);
            return {
              myActivity: {
                id: myActivity._id || myActivity.id,
                name: myActivity.name,
                price: myActivity.price,
                category: myActivity.category,
              },
              gygMatches: comparison.gygMatches,
              metrics: comparison.metrics,
              dataStatus: comparison.dataStatus,
              message: comparison.message,
            };
          }));

          return res.json(results);
        } else {
          // Single-activity lookup, used by the details drawer and by
          // Force Live Refresh. Prefer an exact id match (activityId) over
          // fuzzy name matching (q) so a refresh action always targets the
          // intended activity.
          const matchingActivity = targetActivityId
            ? myActivities.find((a: any) => String(a._id || a.id) === targetActivityId)
            : myActivities.find((a: any) =>
                a.name.toLowerCase().includes((q as string).toLowerCase()) ||
                (q as string).toLowerCase().includes(a.name.toLowerCase())
              );

          if (!matchingActivity) {
            return res.status(404).json({
              error: `Activity "${targetActivityId || q}" not found in your database`
            });
          }

          const comparison = await getActivityComparison(matchingActivity, wantsForceRefresh);

          if (comparison.dataStatus === 'unavailable' && wantsForceRefresh) {
            // A genuinely failed live refresh with nothing cached to fall
            // back on is a 503, not a 200 with an empty match list — this
            // mirrors the generic /search route's own unavailable handling.
            return sendGYGUnavailable(res);
          }

          return res.json([{
            myActivity: {
              id: matchingActivity._id || matchingActivity.id,
              name: matchingActivity.name,
              price: matchingActivity.price,
              category: matchingActivity.category
            },
            gygMatches: comparison.gygMatches,
            metrics: comparison.metrics,
            dataStatus: comparison.dataStatus,
            message: comparison.message,
          }]);
        }
      } catch (dbError: any) {
        console.error('[GYG Search] Error accessing your activities:', dbError);
        if (isGYGServiceUnavailable(dbError) || circuitIsOpen()) {
          return sendGYGUnavailable(res, dbError);
        }
        return res.status(500).json({
          error: 'Failed to access your activities database'
        });
      }
    }

    if (!q || typeof q !== 'string' || q.length < 3) {
      return res.status(400).json({
        error: 'Query parameter "q" is required and must be at least 3 characters long'
      });
    }

    const query = q.trim();
    const normalizedQuery = query.toLowerCase();
    const shouldForceRefresh = forceRefresh === 'true';
    const startTime = Date.now();
    
    console.log(`[GYG Morocco Search] Query="${query}" | ForceRefresh=${shouldForceRefresh}`);

    // Check MongoDB cache first (unless force refresh is requested)
    if (!shouldForceRefresh) {
      try {
        const cachedResult = await GYGCache.findOne({ 
          normalizedQuery: normalizedQuery,
          expiresAt: { $gt: new Date() }
        });

        if (cachedResult) {
          const searchTime = Date.now() - startTime;
          console.log(`[GYG Morocco Search] Query="${query}" | Source=cache | Results=${cachedResult.resultCount} | Time=${searchTime}ms`);
          const sourceType = cachedResult.verified && cachedResult.sourceType === 'LIVE_VERIFIED'
            ? 'CACHED_VERIFIED'
            : 'LEGACY_UNVERIFIED';
          return res.json(comparisonResponse(cachedResult.results, sourceType, cachedResult.fetchedAt ?? cachedResult.lastFetched ?? null, cachedResult.expiresAt ?? null));
        }
      } catch (cacheError: any) {
        console.warn(`[GYG Morocco Search] Cache lookup failed for "${query}":`, cacheError.message);
      }
    }

    // Fetch fresh data from GetYourGuide public site
    let activities: GYGActivity[] = [];
    let source = 'live';

    try {
      console.log(`[GYG Search] Query="${query}" | Fetching from live GetYourGuide...`);
      
      // Priority: If forceRefresh, ONLY scrape from website - NO database fallback
      if (shouldForceRefresh) {
        // Force refresh: ONLY scrape from GetYourGuide website - show actual website results
        console.log(`[GYG Search] Query="${query}" | Force refresh - scraping GetYourGuide website ONLY (no database fallback)...`);
        try {
          activities = await gygResilience.run(
            gygRequestKey('search', normalizedQuery),
            () => GYGFetcher.searchActivities(query),
          );
          source = 'getyourguide-scraped';
          console.log(`[GYG Search] Query="${query}" | ✅ Scraped ${activities.length} activities from GetYourGuide website`);
          
          // If scraping returns empty, throw error instead of using database
          if (activities.length === 0) {
            throw new Error('No activities found from GetYourGuide website');
          }
        } catch (scrapeError: any) {
          console.error(`[GYG Search] Query="${query}" | ❌ Live scraping failed:`, scrapeError.message);
          console.error(`[GYG Search] Query="${query}" | NOT using database fallback - user wants real website results`);
          // DON'T fallback to database - user wants real website results
          // Re-throw error to be caught by outer catch block
          throw scrapeError;
        }
      } else {
        // Normal flow: Try database first, then scrape if needed
      console.log(`[Morocco Database] Query="${query}" | Searching curated Morocco database...`);
      try {
        const moroccoActivities = MoroccoDatabase.searchActivities(query);
        console.log(`[Morocco Database] Query="${query}" | Found ${moroccoActivities.length} activities from curated database`);
        
        if (moroccoActivities.length === 0) {
            console.log(`[Morocco Database] Query="${query}" | No results found, scraping GetYourGuide...`);
            if (!consumeGYGRateLimit(req, res, 'normalSearch')) return;
            try {
              activities = await gygResilience.run(
                gygRequestKey('search', normalizedQuery),
                () => GYGFetcher.searchActivities(query),
              );
              source = 'getyourguide-scraped';
            } catch (scrapeError: any) {
              console.error(`[GYG Search] Query="${query}" | Scraping failed:`, scrapeError.message);
              throw scrapeError;
            }
        } else {
          // Convert MoroccoActivityData to GYGActivity format
            activities = moroccoActivities.map((a: MoroccoActivityData) => ({
              id: a.id,
              title: a.title,
              price: a.price || a.gygPrice || 0,
              currency: a.currency || 'MAD',
              rating: a.rating,
              reviewCount: a.reviewCount,
              image: a.image,
              link: a.link,
              description: a.description,
              duration: a.duration,
              location: a.location
          }));
          source = 'curated-database';
        }
      } catch (databaseError: any) {
        console.error(`[Morocco Database] Query="${query}" | Database search failed:`, databaseError.message);
          console.log(`[Morocco Database] Query="${query}" | Falling back to live scraper`);
        if (!consumeGYGRateLimit(req, res, 'normalSearch')) return;
        
        try {
          activities = await gygResilience.run(
            gygRequestKey('search', normalizedQuery),
            () => GYGFetcher.searchActivities(query),
          );
            source = 'getyourguide-scraped';
        } catch (originalError: any) {
            console.error(`[GYG Search] Query="${query}" | Scraping failed:`, originalError.message);
          throw originalError;
          }
        }
      }

      // Transform activities to match expected format
      const transformedActivities = activities.map(activity => ({
        id: activity.id,
        title: activity.title,
        gygPrice: activity.price,
        suggestedPrice: calculateSuggestedPrice(activity.price, activity.currency),
        currency: activity.currency,
        image: activity.image || null,
        link: activity.link,
        description: `${activity.title} - ${activity.duration || 'Duration varies'}`,
        duration: activity.duration || null,
        rating: activity.rating,
        reviewCount: activity.reviewCount,
        location: activity.location || null,
        sourceType: source,
        verified: source === 'getyourguide-scraped'
      }));

      const sourceType = trustSourceFor(source);
      const fetchedAt = new Date();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const comparison = comparisonResponse(transformedActivities, sourceType, fetchedAt, expiresAt);

      // Only verified live offers populate the trusted cache. Unverified
      // curated and fallback responses remain response-only references.
      if (sourceType === 'LIVE_VERIFIED') {
        try {
        const searchTime = Date.now() - startTime;
        await GYGCache.findOneAndUpdate(
          { normalizedQuery: normalizedQuery },
          {
            query: query,
            normalizedQuery: normalizedQuery,
            results: comparison.offers,
            source: source,
            sourceType,
            verified: true,
            stale: false,
            fetchedAt,
            resultCount: transformedActivities.length,
            searchTime: searchTime,
            lastFetched: fetchedAt,
            expiresAt
          },
          { upsert: true, new: true }
        );
          console.log(`[GYG Morocco Search] Query="${query}" | Cached ${transformedActivities.length} results | Time=${searchTime}ms`);
        } catch (cacheError: any) {
          console.warn(`[GYG Morocco Search] Failed to cache results for "${query}":`, cacheError.message);
        }
      }

      const searchTime = Date.now() - startTime;
      console.log(`[GYG Morocco Search] Query="${query}" | Source=${source} | Results=${transformedActivities.length} | Time=${searchTime}ms`);
      res.json(comparison);

    } catch (fetchError: any) {
      console.error(`[GYG Morocco Search] Live fetch failed for "${query}":`, fetchError.message);
      
      // A previously verified response remains useful as explicitly stale data,
      // including when a force refresh cannot run because the circuit is open.
      try {
        const expiredCache = await GYGCache.findOne({ normalizedQuery: normalizedQuery });
        if (expiredCache && expiredCache.verified && expiredCache.sourceType === 'LIVE_VERIFIED' && expiredCache.results.length > 0) {
          const searchTime = Date.now() - startTime;
          console.log(`[GYG Morocco Search] Query="${query}" | Source=expired-cache | Results=${expiredCache.resultCount} | Time=${searchTime}ms`);
          return res.json(comparisonResponse(expiredCache.results, 'STALE_VERIFIED', expiredCache.fetchedAt ?? expiredCache.lastFetched ?? null, expiredCache.expiresAt ?? null));
        }
      } catch (cacheError: any) {
        console.warn(`[GYG Morocco Search] Failed to get expired cache for "${query}":`, cacheError.message);
      }

      // Force refresh never falls back to generated or curated data.
      if (shouldForceRefresh) {
        console.error(`[GYG Morocco Search] Query="${query}" | Force refresh failed - returning unavailable (NO generated fallback)`);
        return sendGYGUnavailable(res, fetchError);
      }

      if (isGYGServiceUnavailable(fetchError) || circuitIsOpen()) {
        return sendGYGUnavailable(res, fetchError);
      }

      // Final fallback with enhanced logging (only for non-forceRefresh)
      console.log(`[GYG Morocco Search] Using Morocco fallback data for: "${query}"`);
      const fallbackActivities = GYGFetcher.generateFallbackActivities(query);
      const transformedFallback = fallbackActivities.map(activity => ({
        id: activity.id,
        title: activity.title,
        gygPrice: activity.price,
        suggestedPrice: calculateSuggestedPrice(activity.price, activity.currency),
        currency: activity.currency,
        image: activity.image || null,
        link: activity.link,
        description: `${activity.title} - ${activity.duration || 'Duration varies'}`,
        duration: activity.duration || null,
        rating: activity.rating,
        reviewCount: activity.reviewCount,
        location: activity.location || null,
        sourceType: 'fallback',
        verified: false
      }));

      const searchTime = Date.now() - startTime;
      console.log(`[GYG Morocco Search] Query="${query}" | Source=emergency-fallback | Results=${transformedFallback.length} | Time=${searchTime}ms`);
      res.json(comparisonResponse(transformedFallback, 'GENERATED_FALLBACK', new Date(), null));
    }

  } catch (error: any) {
    console.error('[GYG Search] Unexpected error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error during GetYourGuide search',
      message: error.message
    });
  }
});

/**
 * Test GetYourGuide API connection
 * GET /api/gyg/test
 */
router.get('/test', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    if (!consumeGYGRateLimit(req, res, 'adminAction')) return;
    if (!consumeGYGRateLimit(req, res, 'forceRefresh')) return;
    console.log('[GYG] Testing GetYourGuide API connection...');
    
    const result = await gygResilience.run(gygRequestKey('connection-test', 'supplier-api'), async () => {
      if (!process.env.GYG_SUPPLIER_USER || !process.env.GYG_SUPPLIER_PASS) {
        const configurationError = new Error('GetYourGuide provider is not configured.') as Error & { code?: string };
        configurationError.code = 'GYG_CONFIGURATION';
        throw configurationError;
      }
      const connectionResult = await testConnection();
      if (connectionResult.status !== 'ok') {
        const upstreamError = new Error(connectionResult.message || 'GetYourGuide API connection failed') as Error & { code?: string; statusCode?: number };
        upstreamError.code = 'GYG_UPSTREAM_FAILURE';
        upstreamError.statusCode = connectionResult.details?.status;
        throw upstreamError;
      }
      return connectionResult;
    });
    
    if (result.status === 'ok') {
      res.json({
        status: 'ok',
        response: result.response,
        message: result.message || 'GetYourGuide API connection successful'
      });
    } else {
      res.status(500).json({
        status: 'error',
        error: result.error,
        message: result.message || 'GetYourGuide API connection failed'
      });
    }
  } catch (error: any) {
    console.error('[GYG] Test route error:', error.message);
    if (isGYGServiceUnavailable(error) || circuitIsOpen()) {
      return sendGYGUnavailable(res, error);
    }
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'GetYourGuide API test failed'
    });
  }
});

/**
 * Get ALL GetYourGuide activities for admin dashboard
 * GET /api/gyg/activities
 */
router.get('/activities', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!consumeGYGRateLimit(req, res, 'cachedRead')) return;
    console.log('[GYG] Fetching ALL GetYourGuide activities for admin...');
    
    // Check cache first
    const cacheKey = 'all_activities';
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log('[GYG] Returning cached all activities');
      const cachedSourceType = cached.data?.metadata?.sourceType === 'LIVE_VERIFIED'
        ? 'CACHED_VERIFIED'
        : cached.data?.metadata?.sourceType ?? 'LEGACY_UNVERIFIED';
      return res.json(comparisonResponse(
        cached.data?.offers ?? [],
        cachedSourceType,
        cached.data?.metadata?.fetchedAt ?? null,
        cached.data?.metadata?.expiresAt ?? null,
      ));
    }

    if ((req.session as any).role !== 'superadmin') {
      return res.status(403).json({
        status: 'error',
        message: 'Superadmin access is required to refresh GetYourGuide activities.'
      });
    }

    if (!consumeGYGRateLimit(req, res, 'forceRefresh')) return;
    
    // Validate credentials
    if (!process.env.GYG_SUPPLIER_USER || !process.env.GYG_SUPPLIER_PASS) {
      console.log('[ERROR] GetYourGuide credentials not configured');
      try {
        await gygResilience.run(gygRequestKey('supplier-configuration', 'credentials'), async () => {
          const configurationError = new Error('GetYourGuide provider is not configured.') as Error & { code?: string };
          configurationError.code = 'GYG_CONFIGURATION';
          throw configurationError;
        });
      } catch (configurationError) {
        return sendGYGUnavailable(res, configurationError);
      }
    }
    
    let activities: any[] = [];
    let sourceType: GYGTrustSource = 'LIVE_VERIFIED';
    
    try {
      console.log('[GYG] Calling GetYourGuide Partner API for all activities...');
      
      // Try to get activities from multiple popular destinations
      const destinations = ['Marrakech', 'Agadir', 'Casablanca', 'Rabat', 'Fes', 'Essaouira', 'Chefchaouen', 'Tangier'];
      
      for (const destination of destinations) {
        try {
          const response = await gygResilience.run(
            gygRequestKey('supplier-destination', destination),
            () => axios.get(`${process.env.GYG_SUPPLIER_BASE}/tours?location=${destination}`, {
              auth: {
                username: process.env.GYG_SUPPLIER_USER!,
                password: process.env.GYG_SUPPLIER_PASS!,
              },
              headers: {
                Accept: "application/json"
              },
              timeout: 10000
            }),
          );
          
          if (response.data && response.data.tours && Array.isArray(response.data.tours)) {
            const destinationActivities = response.data.tours.map((tour: any) => {
              const gygPrice = tour.price?.amount || tour.price || 0;
              const currency = tour.price?.currency || 'MAD';
              const suggestedPrice = calculateSuggestedPrice(gygPrice, currency);
              
              return {
                id: tour.id || `gyg-${Date.now()}-${Math.random()}`,
                title: tour.title || 'Untitled Activity',
                gygPrice: gygPrice,
                suggestedPrice: suggestedPrice,
                currency: currency,
                image: tour.picture?.url || tour.image || null,
                link: tour.links?.activity_link || tour.url || `https://www.getyourguide.com/activity-${tour.id}`,
                description: tour.description || null,
                duration: tour.duration || null,
                rating: tour.rating || null,
                reviewCount: tour.review_count || tour.reviewCount || null,
                location: destination,
                category: tour.category || 'Tour'
              };
            });
            
            activities = activities.concat(destinationActivities);
            console.log(`[GYG] Added ${destinationActivities.length} activities from ${destination}`);
          }
        } catch (destError: any) {
          console.log(`[GYG] Failed to fetch activities for ${destination}:`, destError.message);
          if (isGYGServiceUnavailable(destError) || circuitIsOpen()) break;
          // Continue with other destinations
        }
      }
      
      // If no real data, use comprehensive fallback
      if (activities.length === 0) {
        if (circuitIsOpen()) {
          if (cached?.data?.metadata?.verified && (cached.data?.offers?.length ?? 0) > 0) {
            return res.json(comparisonResponse(
              cached.data.offers,
              'STALE_VERIFIED',
              cached.data.metadata.fetchedAt ?? null,
              cached.data.metadata.expiresAt ?? null,
            ));
          }
          return sendGYGUnavailable(res);
        }
        console.log('[GYG] Using comprehensive fallback data for all activities');
        sourceType = 'GENERATED_FALLBACK';
        activities = [
          // Marrakech Activities
          { id: 'marrakech-1', title: 'Marrakech City Tour', gygPrice: 180, suggestedPrice: 162, currency: 'MAD', location: 'Marrakech', category: 'City Tour', duration: '4 hours', rating: 4.5, reviewCount: 120, description: 'Explore the Red City with our comprehensive tour' },
          { id: 'marrakech-2', title: 'Atlas Mountains Day Trip', gygPrice: 350, suggestedPrice: 315, currency: 'MAD', location: 'Marrakech', category: 'Adventure', duration: '8 hours', rating: 4.8, reviewCount: 95, description: 'Discover the beauty of Atlas Mountains' },
          { id: 'marrakech-3', title: 'Jemaa el-Fnaa Food Tour', gygPrice: 120, suggestedPrice: 108, currency: 'MAD', location: 'Marrakech', category: 'Food', duration: '3 hours', rating: 4.3, reviewCount: 78, description: 'Taste authentic Moroccan cuisine' },
          
          // Agadir Activities
          { id: 'agadir-1', title: 'Agadir Beach Day', gygPrice: 150, suggestedPrice: 135, currency: 'MAD', location: 'Agadir', category: 'Beach', duration: '6 hours', rating: 4.2, reviewCount: 65, description: 'Relax on Agadir beautiful beaches' },
          { id: 'agadir-2', title: 'Souss Valley Tour', gygPrice: 280, suggestedPrice: 252, currency: 'MAD', location: 'Agadir', category: 'Nature', duration: '7 hours', rating: 4.6, reviewCount: 45, description: 'Explore the fertile Souss Valley' },
          
          // Casablanca Activities
          { id: 'casablanca-1', title: 'Hassan II Mosque Tour', gygPrice: 200, suggestedPrice: 180, currency: 'MAD', location: 'Casablanca', category: 'Cultural', duration: '2 hours', rating: 4.7, reviewCount: 89, description: 'Visit the magnificent Hassan II Mosque' },
          { id: 'casablanca-2', title: 'Casablanca City Center', gygPrice: 160, suggestedPrice: 144, currency: 'MAD', location: 'Casablanca', category: 'City Tour', duration: '4 hours', rating: 4.1, reviewCount: 52, description: 'Discover modern Casablanca' },
          
          // Rabat Activities
          { id: 'rabat-1', title: 'Rabat Royal Tour', gygPrice: 220, suggestedPrice: 198, currency: 'MAD', location: 'Rabat', category: 'Cultural', duration: '5 hours', rating: 4.4, reviewCount: 67, description: 'Explore the capital city' },
          { id: 'rabat-2', title: 'Chellah Necropolis', gygPrice: 140, suggestedPrice: 126, currency: 'MAD', location: 'Rabat', category: 'Historical', duration: '3 hours', rating: 4.0, reviewCount: 34, description: 'Visit ancient Roman ruins' },
          
          // Fes Activities
          { id: 'fes-1', title: 'Fes Medina Walking Tour', gygPrice: 190, suggestedPrice: 171, currency: 'MAD', location: 'Fes', category: 'Cultural', duration: '4 hours', rating: 4.6, reviewCount: 112, description: 'Navigate the labyrinth of Fes Medina' },
          { id: 'fes-2', title: 'Al-Qarawiyyin University', gygPrice: 110, suggestedPrice: 99, currency: 'MAD', location: 'Fes', category: 'Educational', duration: '2 hours', rating: 4.3, reviewCount: 56, description: 'Visit the world oldest university' },
          
          // Essaouira Activities
          { id: 'essaouira-1', title: 'Essaouira Beach Day', gygPrice: 170, suggestedPrice: 153, currency: 'MAD', location: 'Essaouira', category: 'Beach', duration: '6 hours', rating: 4.5, reviewCount: 83, description: 'Enjoy the Atlantic coast' },
          { id: 'essaouira-2', title: 'Essaouira Medina Tour', gygPrice: 130, suggestedPrice: 117, currency: 'MAD', location: 'Essaouira', category: 'Cultural', duration: '3 hours', rating: 4.2, reviewCount: 47, description: 'Explore the UNESCO World Heritage site' },
          
          // Chefchaouen Activities
          { id: 'chefchaouen-1', title: 'Chefchaouen Blue City', gygPrice: 250, suggestedPrice: 225, currency: 'MAD', location: 'Chefchaouen', category: 'Cultural', duration: '6 hours', rating: 4.8, reviewCount: 156, description: 'Discover the famous blue city' },
          { id: 'chefchaouen-2', title: 'Rif Mountains Hike', gygPrice: 320, suggestedPrice: 288, currency: 'MAD', location: 'Chefchaouen', category: 'Adventure', duration: '8 hours', rating: 4.7, reviewCount: 73, description: 'Hike through the beautiful Rif Mountains' },
          
          // Tangier Activities
          { id: 'tangier-1', title: 'Tangier City Tour', gygPrice: 180, suggestedPrice: 162, currency: 'MAD', location: 'Tangier', category: 'City Tour', duration: '4 hours', rating: 4.3, reviewCount: 91, description: 'Explore the gateway to Africa' },
          { id: 'tangier-2', title: 'Hercules Caves', gygPrice: 140, suggestedPrice: 126, currency: 'MAD', location: 'Tangier', category: 'Nature', duration: '3 hours', rating: 4.1, reviewCount: 58, description: 'Visit the legendary Hercules Caves' }
        ];
      }
      
      console.log('[SUCCESS] GetYourGuide all activities:', activities.length, 'activities');
    } catch (apiError: any) {
      console.error('[ERROR] GetYourGuide API call failed:', apiError.message);

      if (isGYGServiceUnavailable(apiError) || circuitIsOpen()) {
        if (cached?.data?.metadata?.verified && (cached.data?.offers?.length ?? 0) > 0) {
          return res.json(comparisonResponse(
            cached.data.offers,
            'STALE_VERIFIED',
            cached.data.metadata.fetchedAt ?? null,
            cached.data.metadata.expiresAt ?? null,
          ));
        }
        return sendGYGUnavailable(res, apiError);
      }
      
      // Use fallback data
      console.log('[GYG] Using comprehensive fallback data');
      sourceType = 'GENERATED_FALLBACK';
      activities = [
        { id: 'marrakech-1', title: 'Marrakech City Tour', gygPrice: 180, suggestedPrice: 162, currency: 'MAD', location: 'Marrakech', category: 'City Tour', duration: '4 hours', rating: 4.5, reviewCount: 120, description: 'Explore the Red City' },
        { id: 'agadir-1', title: 'Agadir Beach Day', gygPrice: 150, suggestedPrice: 135, currency: 'MAD', location: 'Agadir', category: 'Beach', duration: '6 hours', rating: 4.2, reviewCount: 65, description: 'Relax on beautiful beaches' },
        { id: 'fes-1', title: 'Fes Medina Tour', gygPrice: 190, suggestedPrice: 171, currency: 'MAD', location: 'Fes', category: 'Cultural', duration: '4 hours', rating: 4.6, reviewCount: 112, description: 'Navigate the ancient medina' }
      ];
    }
    
    const response = comparisonResponse(activities, sourceType, new Date(), null);

    // Cache the normalized response so this active comparison route cannot
    // later return its legacy provider-shaped records.
    cache.set(cacheKey, { data: response, timestamp: Date.now() });
    
    console.log('[SUCCESS] Returning all GetYourGuide activities:', activities.length, 'activities');
    res.json(response);
    
  } catch (error: any) {
    console.error('[ERROR] GetYourGuide all activities error:', error.message);
    return res.status(500).json({
      error: 'Internal server error during GetYourGuide all activities fetch'
    });
  }
});

/**
 * Cache management endpoints
 * GET /api/gyg/cache/stats - Get cache statistics
 * DELETE /api/gyg/cache/clear - Clear all cache
 * DELETE /api/gyg/cache/clear?query=... - Clear specific query cache
 */
router.get('/cache/stats', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    if (!consumeGYGRateLimit(req, res, 'adminAction')) return;
    const totalEntries = await GYGCache.countDocuments();
    const activeEntries = await GYGCache.countDocuments({ expiresAt: { $gt: new Date() } });
    const expiredEntries = totalEntries - activeEntries;
    
    // Get source distribution
    const sourceStats = await GYGCache.aggregate([
      {
        $group: {
          _id: '$source',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get average search time
    const avgSearchTime = await GYGCache.aggregate([
      {
        $group: {
          _id: null,
          avgSearchTime: { $avg: '$searchTime' }
        }
      }
    ]);
    
    const recentEntries = await GYGCache.find({})
      .sort({ lastFetched: -1 })
      .limit(10)
      .select('query normalizedQuery lastFetched source resultCount searchTime')
      .lean();

    res.json({
      status: 'success',
      cache: {
        totalEntries,
        activeEntries,
        expiredEntries,
        sourceDistribution: sourceStats.reduce((acc, stat) => {
          acc[stat._id] = stat.count;
          return acc;
        }, {} as Record<string, number>),
        averageSearchTime: avgSearchTime[0]?.avgSearchTime || 0,
        recentEntries: recentEntries.map(entry => ({
          query: entry.query,
          normalizedQuery: entry.normalizedQuery,
          lastFetched: entry.lastFetched,
          source: entry.source,
          resultCount: entry.resultCount,
          searchTime: entry.searchTime
        }))
      },
      resilience: gygResilience.getDiagnostics(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[GYG] Cache stats error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'Failed to get cache statistics'
    });
  }
});

router.delete('/cache/clear', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    if (!consumeGYGRateLimit(req, res, 'adminAction')) return;
    const { query } = req.query;
    
    if (query && typeof query === 'string') {
      // Clear specific query (both normalized and original)
      const normalizedQuery = query.trim().toLowerCase();
      const result = await GYGCache.deleteOne({ normalizedQuery: normalizedQuery });
      console.log(`[GYG] Cleared cache for query: "${query}" (normalized: "${normalizedQuery}")`);
      res.json({
        status: 'success',
        message: `Cache cleared for query: "${query}"`,
        deletedCount: result.deletedCount
      });
    } else {
      // Clear all cache
      const result = await GYGCache.deleteMany({});
      console.log(`[GYG] Cleared all cache entries: ${result.deletedCount}`);
      res.json({
        status: 'success',
        message: 'All cache entries cleared',
        deletedCount: result.deletedCount
      });
    }
  } catch (error: any) {
    console.error('[GYG] Cache clear error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'Failed to clear cache'
    });
  }
});

/**
 * Simple test route for debugging
 * GET /api/gyg/debug
 */
router.get('/debug', requireSuperAdmin, async (req: Request, res: Response) => {
  try {
    if (!consumeGYGRateLimit(req, res, 'adminAction')) return;
    console.log('[GYG] Debug route called');
    
    // Test environment variables
    const envCheck = {
      GYG_SUPPLIER_BASE: process.env.GYG_SUPPLIER_BASE ? 'SET' : 'NOT SET',
      GYG_SUPPLIER_USER: process.env.GYG_SUPPLIER_USER ? 'SET' : 'NOT SET',
      GYG_SUPPLIER_PASS: process.env.GYG_SUPPLIER_PASS ? 'SET' : 'NOT SET',
      GYG_ENABLE_LIVE_SEARCH: process.env.GYG_ENABLE_LIVE_SEARCH
    };
    
    console.log('[GYG] Environment check:', envCheck);
    
    res.json({
      status: 'success',
      message: 'GetYourGuide debug route working',
      environment: envCheck,
      resilience: gygResilience.getDiagnostics(),
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[GYG] Debug route error:', error.message);
    res.status(500).json({
      status: 'error',
      error: error.message,
      message: 'GetYourGuide debug route failed'
    });
  }
});


export default router;
