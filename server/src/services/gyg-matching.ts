/**
 * GYG comparable-offer matching (Phase 3D-1).
 *
 * This module answers ONE question, kept deliberately separate from source
 * trust (see gyg-comparison.ts): given "our" MarrakechDunes activity and a
 * candidate GetYourGuide offer, is the candidate a commercially comparable
 * product? A verified, fresh, live-scraped offer can still be a POOR match
 * (e.g. a quad-bike-only listing compared against our camel-and-dinner
 * activity), and this module is what decides that — independent of whether
 * the underlying data source was trustworthy.
 *
 * Design notes:
 * - Pure, synchronous, framework-free functions. No Express, no Mongoose.
 * - Scoring never uses price or rating/review count as a matching signal —
 *   only textual/structural comparability (title, location, activity type,
 *   duration, inclusions/exclusions).
 * - The vocabulary lists below are intentionally small and easy to extend;
 *   this is not meant to be a general NLP system.
 */

export type ValidationState =
  | 'STRONG_MATCH'
  | 'LIKELY_MATCH'
  | 'WEAK_MATCH'
  | 'REJECTED_MATCH'
  | 'NEEDS_REVIEW';

export type ManualOverrideDecision = 'ACCEPTED' | 'REJECTED';

export interface MatchableActivity {
  name: string;
  description?: string | null;
  category?: string | null;
  duration?: string | null;
  location?: string | null;
}

export interface MatchCandidateInput {
  title: string;
  duration?: string | null;
  location?: string | null;
  category?: string | null;
}

export interface MatchResult {
  matchScore: number;
  validationState: ValidationState;
  matchReasons: string[];
  titleSimilarity: number;
  hardConflict: boolean;
}

export const MATCH_THRESHOLDS = { STRONG: 75, LIKELY: 55, WEAK: 35 } as const;
export const NEEDS_REVIEW_DICE_THRESHOLD = 0.6;

export const isComparableValidationState = (state: ValidationState | null | undefined): boolean =>
  state === 'STRONG_MATCH' || state === 'LIKELY_MATCH';

// ---------------------------------------------------------------------------
// Text normalization
// ---------------------------------------------------------------------------

const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'with', 'from', 'to', 'in', 'of', 'at', 'on', 'for',
]);

function normalizeMatchText(input?: string | null): string {
  if (!input) return '';
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '') // strip accents
    .replace(/[-_/&]/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function contentTokens(text: string): string[] {
  return normalizeMatchText(text)
    .split(' ')
    .filter((token) => token.length > 0 && !STOPWORDS.has(token));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function textContainsKeyword(normalizedText: string, keyword: string): boolean {
  const kw = normalizeMatchText(keyword);
  if (!kw) return false;
  return new RegExp(`(^|\\s)${escapeRegex(kw)}(\\s|$)`).test(normalizedText);
}

function intersect<T>(a: Set<T>, b: Set<T>): Set<T> {
  const out = new Set<T>();
  for (const value of a) if (b.has(value)) out.add(value);
  return out;
}

function diceCoefficient(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const overlap = intersect(a, b).size;
  return (2 * overlap) / (a.size + b.size);
}

function capitalize(value: string): string {
  return value.length === 0 ? value : value[0].toUpperCase() + value.slice(1);
}

// ---------------------------------------------------------------------------
// Domain vocabulary (small, maintainable)
// ---------------------------------------------------------------------------

// Mutually-exclusive concept clusters. Within a cluster, mentioning a
// different member than the other side signals a real product difference —
// e.g. "camel" vs "quad" — even when the surrounding text is very similar.
const EXCLUSIVE_CLUSTERS: Array<{ id: 'activity-mode' | 'meal-type' | 'time-of-day' | 'format'; members: string[] }> = [
  {
    id: 'activity-mode',
    members: [
      'camel', 'quad', 'buggy', 'buggies', 'atv', 'balloon', 'horse', 'horseback',
      'boat', 'kayak', 'kayaking', 'ski', 'skiing', 'hike', 'hiking', 'trek', 'trekking',
      'bike', 'biking', 'cycling', 'segway', 'zipline', 'rafting', 'jeep',
    ],
  },
  { id: 'meal-type', members: ['dinner', 'lunch', 'breakfast', 'brunch'] },
  { id: 'time-of-day', members: ['sunrise', 'sunset'] },
  { id: 'format', members: ['private', 'shared', 'group'] },
];

const CLUSTER_WEIGHTS: Record<string, { match: number; conflict: number }> = {
  'activity-mode': { match: 18, conflict: -35 },
  'meal-type': { match: 8, conflict: -15 },
  'time-of-day': { match: 6, conflict: -12 },
  format: { match: 5, conflict: -8 },
};

// Non-exclusive keywords: presence on both sides is a mild positive signal,
// but absence on either side is never penalized.
const GENERAL_KEYWORDS = [
  'day', 'overnight', 'multi day', 'guided', 'transfer', 'pickup', 'workshop',
  'picnic', 'shopping', 'cooking', 'tasting', 'market', 'hammam', 'spa', 'yoga', 'photography',
];
const GENERAL_KEYWORD_WEIGHT = 6;
const GENERAL_KEYWORD_CAP = 12;

// Destinations specific enough that sharing one is meaningful evidence of
// comparability. "Marrakech"/"morocco"/"desert" are too generic on their own.
const DISTINCTIVE_LOCATION_TOKENS = new Set([
  'agafay', 'essaouira', 'atlas', 'ouzoud', 'ourika', 'zagora', 'merzouga', 'sahara',
  'chefchaouen', 'fes', 'fez', 'rabat', 'tangier', 'casablanca', 'ouarzazate', 'imlil',
  'toubkal', 'benhaddou', 'erg', 'chebbi', 'dades', 'todra', 'skoura', 'taroudant',
  'tafraoute', 'asilah', 'larache', 'agadir',
]);
const GENERIC_LOCATION_TOKENS = new Set(['marrakech', 'morocco', 'moroccan', 'medina', 'desert']);

const PHRASE_MAP: Record<string, string> = {
  camel: 'a camel ride', quad: 'quad biking', buggy: 'a buggy ride', buggies: 'a buggy ride',
  atv: 'an ATV ride', balloon: 'a hot air balloon', horse: 'horseback riding',
  horseback: 'horseback riding', boat: 'a boat ride', kayak: 'kayaking', kayaking: 'kayaking',
  ski: 'skiing', skiing: 'skiing', hike: 'hiking', hiking: 'hiking', trek: 'trekking',
  trekking: 'trekking', bike: 'cycling', biking: 'cycling', cycling: 'cycling',
  segway: 'a Segway tour', zipline: 'a zipline', rafting: 'rafting', jeep: 'a jeep tour',
  dinner: 'dinner', lunch: 'lunch', breakfast: 'breakfast', brunch: 'brunch',
  sunrise: 'a sunrise departure', sunset: 'a sunset departure',
  private: 'a private format', shared: 'a shared/group format', group: 'a group format',
  day: 'a full-day format', overnight: 'an overnight stay', 'multi day': 'a multi-day format',
  guided: 'a guided experience', transfer: 'hotel transfer', pickup: 'pickup service',
  workshop: 'a hands-on workshop', picnic: 'a picnic', shopping: 'shopping',
  cooking: 'a cooking activity', tasting: 'a tasting', market: 'a market visit',
  hammam: 'a hammam experience', spa: 'a spa treatment', yoga: 'yoga', photography: 'photography',
};

function phrase(keyword: string): string {
  return PHRASE_MAP[keyword] ?? `"${keyword}"`;
}

function membersFoundIn(text: string, members: string[]): Set<string> {
  const normalized = normalizeMatchText(text);
  const found = new Set<string>();
  for (const member of members) {
    if (textContainsKeyword(normalized, member)) found.add(member);
  }
  return found;
}

function extractLocationTokens(text: string): { distinctive: Set<string>; generic: Set<string> } {
  const tokens = normalizeMatchText(text).split(' ').filter(Boolean);
  return {
    distinctive: new Set(tokens.filter((t) => DISTINCTIVE_LOCATION_TOKENS.has(t))),
    generic: new Set(tokens.filter((t) => GENERIC_LOCATION_TOKENS.has(t))),
  };
}

// ---------------------------------------------------------------------------
// Duration parsing
// ---------------------------------------------------------------------------

export function parseDurationHours(input?: string | null): number | null {
  if (!input) return null;
  const text = input.toLowerCase();

  if (/half[\s-]?day/.test(text)) return 4;
  if (/full[\s-]?day/.test(text)) return 8;
  if (/multi[\s-]?day|overnight/.test(text)) return 24;

  const rangeMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/);
  if (rangeMatch) {
    return (parseFloat(rangeMatch[1]) + parseFloat(rangeMatch[2])) / 2;
  }

  const dayMatch = text.match(/(\d+(?:\.\d+)?)\s*(days?)\b/);
  if (dayMatch) return parseFloat(dayMatch[1]) * 24;

  const hourMatch = text.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/);
  if (hourMatch) return parseFloat(hourMatch[1]);

  const minuteMatch = text.match(/(\d+(?:\.\d+)?)\s*(minutes?|mins?)\b/);
  if (minuteMatch) return parseFloat(minuteMatch[1]) / 60;

  return null;
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const TITLE_WEIGHT = 45;
const LOCATION_DISTINCTIVE_WEIGHT = 20;
const LOCATION_GENERIC_WEIGHT = 8;
const LOCATION_MISMATCH_PENALTY = -15;
const DURATION_CLOSE_BONUS = 10;
const DURATION_NEAR_BONUS = 5;
const DURATION_CONFLICT_PENALTY = -20;

function bandFor(score: number): ValidationState {
  if (score >= MATCH_THRESHOLDS.STRONG) return 'STRONG_MATCH';
  if (score >= MATCH_THRESHOLDS.LIKELY) return 'LIKELY_MATCH';
  if (score >= MATCH_THRESHOLDS.WEAK) return 'WEAK_MATCH';
  return 'REJECTED_MATCH';
}

/**
 * Score a single candidate offer against our activity. Never uses price or
 * rating/review counts as matching signals — those are commercial outcomes,
 * not evidence of comparability, and using them would be circular.
 */
export function scoreCandidateMatch(ourActivity: MatchableActivity, candidate: MatchCandidateInput): MatchResult {
  const ourText = [ourActivity.name, ourActivity.category, ourActivity.description].filter(Boolean).join(' ');
  const candText = [candidate.title, candidate.category].filter(Boolean).join(' ');

  const ourTokens = new Set(contentTokens(ourText));
  const candTokens = new Set(contentTokens(candText));
  const dice = diceCoefficient(ourTokens, candTokens);

  const reasons: string[] = [];
  let score = dice * TITLE_WEIGHT;
  let hardConflict = false;

  if (dice >= 0.7) reasons.push('Very similar activity titles');
  else if (dice < 0.15) reasons.push('Titles share little in common');

  // --- Location -------------------------------------------------------
  const ourLocationText = [ourActivity.location, ourActivity.name].filter(Boolean).join(' ');
  const candLocationText = [candidate.location, candidate.title].filter(Boolean).join(' ');
  const ourLoc = extractLocationTokens(ourLocationText);
  const candLoc = extractLocationTokens(candLocationText);
  const distinctiveOverlap = intersect(ourLoc.distinctive, candLoc.distinctive);

  if (distinctiveOverlap.size > 0) {
    score += LOCATION_DISTINCTIVE_WEIGHT;
    reasons.push(`Same destination: ${capitalize([...distinctiveOverlap][0])}`);
  } else if (ourLoc.distinctive.size > 0 && candLoc.distinctive.size > 0) {
    score += LOCATION_MISMATCH_PENALTY;
    reasons.push('Different destinations mentioned');
  } else {
    const genericOverlap = intersect(ourLoc.generic, candLoc.generic);
    if (genericOverlap.size > 0) {
      score += LOCATION_GENERIC_WEIGHT;
      reasons.push(`Both mention ${capitalize([...genericOverlap][0])}`);
    }
  }

  // --- Mutually-exclusive concept clusters -----------------------------
  for (const cluster of EXCLUSIVE_CLUSTERS) {
    const ourMembers = membersFoundIn(ourText, cluster.members);
    const candMembers = membersFoundIn(candText, cluster.members);
    if (ourMembers.size === 0 || candMembers.size === 0) continue;

    const overlap = intersect(ourMembers, candMembers);
    const weight = CLUSTER_WEIGHTS[cluster.id];
    if (overlap.size > 0) {
      score += weight.match;
      reasons.push(`Both include ${phrase([...overlap][0])}`);
    } else {
      score += weight.conflict;
      hardConflict = true;
      reasons.push(`Candidate includes ${phrase([...candMembers][0])} while our activity does not`);
    }
  }

  // --- General (non-exclusive) keywords --------------------------------
  const ourNorm = normalizeMatchText(ourText);
  const candNorm = normalizeMatchText(candText);
  const sharedGeneral = GENERAL_KEYWORDS.filter(
    (keyword) => textContainsKeyword(ourNorm, keyword) && textContainsKeyword(candNorm, keyword),
  );
  if (sharedGeneral.length > 0) {
    score += Math.min(GENERAL_KEYWORD_CAP, sharedGeneral.length * GENERAL_KEYWORD_WEIGHT);
    reasons.push(`Both mention ${sharedGeneral.slice(0, 2).map(phrase).join(' and ')}`);
  }

  // --- Duration ---------------------------------------------------------
  const ourHours = parseDurationHours(ourActivity.duration);
  const candHours = parseDurationHours(candidate.duration);
  if (ourHours != null && candHours != null) {
    const diff = Math.abs(ourHours - candHours);
    if (diff <= 1) {
      score += DURATION_CLOSE_BONUS;
      reasons.push('Duration difference under 1 hour');
    } else if (diff <= 2) {
      score += DURATION_NEAR_BONUS;
    } else if (diff > 4) {
      score += DURATION_CONFLICT_PENALTY;
      reasons.push(`Duration differs by more than ${Math.floor(diff)} hours`);
    }
  }
  // Missing duration on either side is never penalized.

  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  let validationState = bandFor(clamped);

  // A near-identical title combined with a hard conflict (e.g. same wording
  // but a different activity mode or meal) is ambiguous enough to need a
  // human decision rather than an automatic accept or reject.
  if (hardConflict && dice >= NEEDS_REVIEW_DICE_THRESHOLD) {
    validationState = 'NEEDS_REVIEW';
    reasons.push('Titles look similar but key details conflict — needs manual review');
  }

  return {
    matchScore: clamped,
    validationState,
    matchReasons: [...new Set(reasons)],
    titleSimilarity: dice,
    hardConflict,
  };
}

/**
 * Score and rank every candidate against our activity, best match first.
 * Pure and side-effect free; safe to call from routes or tests.
 */
export function rankCandidateMatches<T extends MatchCandidateInput>(
  ourActivity: MatchableActivity,
  candidates: T[],
): Array<T & MatchResult> {
  return candidates
    .map((candidate) => ({ ...candidate, ...scoreCandidateMatch(ourActivity, candidate) }))
    .sort((a, b) => b.matchScore - a.matchScore);
}
