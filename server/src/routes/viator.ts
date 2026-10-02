import { Router, type Request, type Response } from 'express';
import { requireAdmin } from '../middleware/admin-auth.js';
import { getViatorProductDetail, isViatorConfigured, isViatorMarketIntelligenceEnabled, searchViator, viatorProviderState, ViatorProviderError } from '../providers/viator.js';
import { BamProviderError, getEurMadReferenceRate } from '../providers/bam.js';

const router = Router();

/** Staff-only official Viator Partner API search. No fallback/scraper is used. */
router.post('/search', requireAdmin, async (req: Request, res: Response) => {
  const query = typeof req.body?.q === 'string' ? req.body.q.trim() : '';
  if (query.length < 2) return res.status(400).json({ code: 'VIATOR_QUERY_REQUIRED', message: 'A search query is required.' });

  const limit = Math.min(Math.max(Number(req.body?.limit) || 12, 1), 50);
  const offset = Math.max(Number(req.body?.offset) || 0, 0);
  try {
    const result = await searchViator(query, limit, offset);
    return res.json(result);
  } catch (error: any) {
    const providerError = error instanceof ViatorProviderError ? error : new ViatorProviderError('Viator search is temporarily unavailable.', 503, 'VIATOR_UPSTREAM_UNAVAILABLE');
    if (providerError.retryAfter) res.setHeader('Retry-After', providerError.retryAfter);
    return res.status(providerError.status).json({ code: providerError.code, message: providerError.message });
  }
});

router.get('/products/:productCode', requireAdmin, async (req: Request, res: Response) => {
  try {
    const detail = await getViatorProductDetail(req.params.productCode);
    return res.json(detail);
  } catch (error: any) {
    const providerError = error instanceof ViatorProviderError ? error : new ViatorProviderError('Viator product lookup is temporarily unavailable.', 503, 'VIATOR_UPSTREAM_UNAVAILABLE');
    if (providerError.retryAfter) res.setHeader('Retry-After', providerError.retryAfter);
    return res.status(providerError.status).json({ code: providerError.code, message: providerError.message });
  }
});

router.get('/exchange-rate', requireAdmin, async (_req: Request, res: Response) => {
  try {
    return res.json(await getEurMadReferenceRate());
  } catch (error: any) {
    const providerError = error instanceof BamProviderError ? error : new BamProviderError('Bank Al-Maghrib rate is temporarily unavailable.');
    return res.status(providerError.status).json({ code: providerError.code, message: providerError.message });
  }
});

export const viatorProviderStatus = () => ({
  provider: 'VIATOR',
  active: true,
  configured: isViatorConfigured(),
  state: viatorProviderState(),
  marketIntelligenceEnabled: isViatorMarketIntelligenceEnabled(),
  source: 'OFFICIAL_API',
  message: !isViatorConfigured()
    ? 'Viator Partner API access is not configured.'
    : viatorProviderState() === 'SANDBOX'
      ? 'Viator Sandbox API is configured.'
      : viatorProviderState() === 'ACTIVE'
        ? 'Viator Affiliate API is configured.'
        : 'Viator API is configured.',
});

export default router;
