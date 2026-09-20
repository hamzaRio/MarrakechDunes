export type GYGTrustSource =
  | 'LIVE_VERIFIED'
  | 'CACHED_VERIFIED'
  | 'STALE_VERIFIED'
  | 'CURATED_REFERENCE'
  | 'GENERATED_FALLBACK'
  | 'ESTIMATED'
  | 'LEGACY_UNVERIFIED';

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
  validationState: 'UNVALIDATED' | 'SOURCE_VALIDATED' | 'MATCH_VALIDATED';
}

const canonicalSources = new Set<GYGTrustSource>([
  'LIVE_VERIFIED',
  'CACHED_VERIFIED',
  'STALE_VERIFIED',
  'CURATED_REFERENCE',
  'GENERATED_FALLBACK',
  'ESTIMATED',
  'LEGACY_UNVERIFIED',
]);

function normalizeSourceType(value: unknown): GYGTrustSource {
  if (canonicalSources.has(value as GYGTrustSource)) {
    return value as GYGTrustSource;
  }

  return 'LEGACY_UNVERIFIED';
}

export const trustMetadata = (sourceType: GYGTrustSource, stale = false) => ({
  sourceType,
  verified: sourceType === 'LIVE_VERIFIED' || sourceType === 'CACHED_VERIFIED' || sourceType === 'STALE_VERIFIED',
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
    validationState: value.validationState ?? 'UNVALIDATED',
  };
}

export function calculateVerifiedMetrics(offers: NormalizedGYGOffer[]) {
  const prices = offers.filter((offer) => offer.verified && !offer.stale && offer.price > 0).map((offer) => offer.price).sort((a, b) => a - b);
  const count = prices.length;
  const median = count === 0 ? null : count % 2 ? prices[(count - 1) / 2] : (prices[count / 2 - 1] + prices[count / 2]) / 2;
  return {
    lowestVerifiedPrice: count ? prices[0] : null,
    medianVerifiedPrice: median,
    averageVerifiedPrice: count ? prices.reduce((sum, price) => sum + price, 0) / count : null,
    verifiedOfferCount: count,
  };
}
