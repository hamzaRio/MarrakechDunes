import type { ValidationState, ManualOverrideDecision } from './gyg-matching.js';

export type GYGTrustSource =
  | 'MANUAL_VERIFIED'
  | 'LIVE_VERIFIED'
  | 'CACHED_VERIFIED'
  | 'STALE_VERIFIED'
  | 'CURATED_REFERENCE'
  | 'GENERATED_FALLBACK'
  | 'ESTIMATED'
  | 'LEGACY_UNVERIFIED';

export interface GYGManualOverride {
  decision: ManualOverrideDecision;
  overriddenBy: string;
  overriddenAt: string | Date;
}

export interface NormalizedGYGOffer {
  id: string;
  ourActivityId: string | null;
  matchedExternalId: string | null;
  matchedUrl: string | null;
  title: string;
  price: number;
  currency: string;
  originalPrice: number | null;
  originalCurrency: string | null;
  normalizedMadPrice: number | null;
  rating: number | null;
  reviewCount: number | null;
  duration: string | null;
  location: string | null;
  url: string | null;
  image: string | null;
  sourceType: GYGTrustSource;
  verified: boolean;
  stale: boolean;
  fetchedAt: Date | null;
  expiresAt: Date | null;
  matchScore: number | null;
  matchReasons: string[];
  // Commercial-comparability state. `null` means this offer was never run
  // through comparability matching (e.g. generic/aggregate competitor
  // listings that aren't compared against one specific activity) — it is
  // NOT a rejection, and is treated permissively by isEligibleForVerifiedMetrics
  // for backward compatibility with routes that predate Phase 3D-1 matching.
  validationState: ValidationState | null;
  manualOverride: GYGManualOverride | null;
}

const canonicalSources = new Set<GYGTrustSource>([
  'MANUAL_VERIFIED',
  'LIVE_VERIFIED',
  'CACHED_VERIFIED',
  'STALE_VERIFIED',
  'CURATED_REFERENCE',
  'GENERATED_FALLBACK',
  'ESTIMATED',
  'LEGACY_UNVERIFIED',
]);

const canonicalValidationStates = new Set<ValidationState>([
  'STRONG_MATCH',
  'LIKELY_MATCH',
  'WEAK_MATCH',
  'REJECTED_MATCH',
  'NEEDS_REVIEW',
]);

function normalizeSourceType(value: unknown): GYGTrustSource {
  if (canonicalSources.has(value as GYGTrustSource)) {
    return value as GYGTrustSource;
  }

  return 'LEGACY_UNVERIFIED';
}

function normalizeValidationState(value: unknown): ValidationState | null {
  if (value == null) return null;
  return canonicalValidationStates.has(value as ValidationState) ? (value as ValidationState) : null;
}

function normalizeManualOverride(value: unknown): GYGManualOverride | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, any>;
  if (candidate.decision !== 'ACCEPTED' && candidate.decision !== 'REJECTED') return null;
  return {
    decision: candidate.decision,
    overriddenBy: String(candidate.overriddenBy ?? 'unknown'),
    overriddenAt: candidate.overriddenAt ?? null,
  };
}

export const trustMetadata = (sourceType: GYGTrustSource, stale = false) => ({
  sourceType,
  verified: sourceType === 'MANUAL_VERIFIED' || sourceType === 'LIVE_VERIFIED' || sourceType === 'CACHED_VERIFIED' || sourceType === 'STALE_VERIFIED',
  stale: sourceType === 'STALE_VERIFIED' || stale,
});

export function normalizeGYGOffer(value: Record<string, any>, defaults: Partial<NormalizedGYGOffer> = {}): NormalizedGYGOffer {
  const sourceType = normalizeSourceType(defaults.sourceType ?? value.sourceType);
  const metadata = trustMetadata(sourceType, defaults.stale ?? value.stale);
  return {
    id: String(value.id ?? value.matchedExternalId ?? ''),
    ourActivityId: value.ourActivityId == null ? null : String(value.ourActivityId),
    matchedExternalId: value.matchedExternalId == null ? (value.id == null ? null : String(value.id)) : String(value.matchedExternalId),
    matchedUrl: value.matchedUrl ?? value.url ?? value.link ?? null,
    title: String(value.title ?? 'Untitled activity'),
    price: Number(value.price ?? value.price_from ?? value.gygPrice ?? 0),
    currency: String(value.currency ?? 'MAD'),
    originalPrice: value.originalPrice == null ? null : Number(value.originalPrice),
    originalCurrency: value.originalCurrency ?? null,
    normalizedMadPrice: value.normalizedMadPrice == null ? null : Number(value.normalizedMadPrice),
    rating: value.rating == null ? null : Number(value.rating),
    reviewCount: value.reviewCount == null ? (value.reviews_count == null ? null : Number(value.reviews_count)) : Number(value.reviewCount),
    duration: value.duration ?? value.duration_text ?? null,
    location: value.location ?? value.city ?? null,
    url: value.url ?? value.link ?? value.matchedUrl ?? null,
    image: value.image ?? null,
    ...metadata,
    fetchedAt: defaults.fetchedAt ?? value.fetchedAt ?? value.lastFetched ?? null,
    expiresAt: defaults.expiresAt ?? value.expiresAt ?? null,
    matchScore: value.matchScore == null ? null : Number(value.matchScore),
    matchReasons: Array.isArray(value.matchReasons) ? value.matchReasons : [],
    validationState: normalizeValidationState(value.validationState ?? defaults.validationState),
    manualOverride: normalizeManualOverride(value.manualOverride ?? defaults.manualOverride),
  };
}

/**
 * An offer counts toward verified market metrics only when:
 *  1. Its DATA SOURCE is trusted (verified, not stale, has a real price) — and
 *  2. It is either commercially comparable to our activity (STRONG_MATCH /
 *     LIKELY_MATCH), or a superadmin has explicitly accepted it, and it has
 *     not been explicitly rejected.
 *
 * `validationState === null` means comparability was never evaluated for
 * this offer (it isn't tied to one specific activity, e.g. broad
 * competitor/market listings) — those are treated permissively so this
 * change doesn't regress metrics that predate Phase 3D-1's per-activity
 * matching and were never in scope for it.
 */
export function isEligibleForVerifiedMetrics(offer: NormalizedGYGOffer): boolean {
  if (!offer.verified || offer.stale || !(offer.price > 0)) return false;

  if (offer.manualOverride?.decision === 'REJECTED') return false;
  if (offer.manualOverride?.decision === 'ACCEPTED') return true;

  if (offer.validationState === null) return true;
  return offer.validationState === 'STRONG_MATCH' || offer.validationState === 'LIKELY_MATCH';
}

export function calculateVerifiedMetrics(offers: NormalizedGYGOffer[]) {
  const prices = offers.filter(isEligibleForVerifiedMetrics).map((offer) => offer.price).sort((a, b) => a - b);
  const count = prices.length;
  const median = count === 0 ? null : count % 2 ? prices[(count - 1) / 2] : (prices[count / 2 - 1] + prices[count / 2]) / 2;
  return {
    lowestVerifiedPrice: count ? prices[0] : null,
    medianVerifiedPrice: median,
    averageVerifiedPrice: count ? prices.reduce((sum, price) => sum + price, 0) / count : null,
    verifiedOfferCount: count,
  };
}
