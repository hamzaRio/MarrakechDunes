import { useMemo, useState, KeyboardEvent } from 'react';
import {
  ExternalLink, Globe, Search, Sparkles, Loader2, Star, MapPin, Clock,
  ChevronDown, ChevronUp, RefreshCw,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import ViatorActivitySearch from '@/components/viator-activity-search';
import type { NormalizedViatorActivity } from '@/lib/viator-api';

interface GYGReferenceToolProps {
  onActivitySelect?: (activity: any) => void;
}

type GYGValidationState = 'STRONG_MATCH' | 'LIKELY_MATCH' | 'WEAK_MATCH' | 'REJECTED_MATCH' | 'NEEDS_REVIEW';
type GYGTrustSource = 'MANUAL_VERIFIED' | 'LIVE_VERIFIED' | 'CACHED_VERIFIED' | 'STALE_VERIFIED' | 'CURATED_REFERENCE' | 'GENERATED_FALLBACK' | 'ESTIMATED' | 'LEGACY_UNVERIFIED';

interface GYGManualOverride {
  decision: 'ACCEPTED' | 'REJECTED';
  overriddenBy: string;
  overriddenAt: string | null;
}

interface GYGActivityResult {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string | null;
  url: string | null;
  duration?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  location?: string | null;
  sourceType: GYGTrustSource;
  verified: boolean;
  stale: boolean;
  fetchedAt: string | null;
  expiresAt: string | null;
  matchScore: number | null;
  matchReasons: string[];
  // null = comparability was never evaluated for this offer.
  validationState: GYGValidationState | null;
  ourActivityId?: string | null;
  matchedExternalId?: string | null;
  manualOverride?: GYGManualOverride | null;
  manualComparableId?: string;
  originalPrice?: number | null;
  originalCurrency?: string | null;
  normalizedMadPrice?: number | null;
  notes?: string | null;
  provider?: 'VIATOR' | 'GETYOURGUIDE' | 'OTHER';
  externalId?: string | null;
  checkedAt?: string | null;
}

interface GYGSearchResponse {
  offers: GYGActivityResult[];
  metadata: { sourceType: string; verified: boolean; stale: boolean; fetchedAt: string | null; expiresAt: string | null };
}

interface GYGMetrics {
  lowestVerifiedPrice: number | null;
  medianVerifiedPrice: number | null;
  averageVerifiedPrice: number | null;
  verifiedOfferCount: number;
}

interface ActivityComparisonRow {
  myActivity: { id: string; name: string; price: string | number; category?: string };
  gygMatches: GYGActivityResult[];
  metrics: GYGMetrics;
  dataStatus: 'fresh' | 'stale' | 'none' | 'unavailable';
  message?: string;
}

interface EnrichedRow extends ActivityComparisonRow {
  ourPrice: number;
  diff: { mad: number; percent: number } | null;
  bestOffer: GYGActivityResult | null;
  needsReview: boolean;
  lastChecked: string | null;
}

// Phase 3D-2 §5 — trust labels (source of the data). Kept separate from
// match-quality labels: a "Live verified" offer can still be a "Weak match".
const trustLabel: Record<GYGTrustSource, string> = {
  MANUAL_VERIFIED: 'Manual verified',
  LIVE_VERIFIED: 'Live verified',
  CACHED_VERIFIED: 'Cached verified',
  STALE_VERIFIED: 'Stale verified',
  CURATED_REFERENCE: 'Curated reference',
  GENERATED_FALLBACK: 'Generated fallback',
  ESTIMATED: 'Estimated',
  LEGACY_UNVERIFIED: 'Legacy / unverified',
};

const trustBadgeClass: Record<GYGTrustSource, string> = {
  MANUAL_VERIFIED: 'bg-emerald-100 text-emerald-800',
  LIVE_VERIFIED: 'bg-blue-600 text-white',
  CACHED_VERIFIED: 'bg-blue-100 text-blue-800',
  STALE_VERIFIED: 'bg-amber-100 text-amber-800',
  CURATED_REFERENCE: 'bg-slate-100 text-slate-700',
  GENERATED_FALLBACK: 'bg-slate-100 text-slate-700',
  ESTIMATED: 'bg-slate-100 text-slate-700',
  LEGACY_UNVERIFIED: 'bg-gray-100 text-gray-600',
};

// Phase 3D-2 §6 — canonical match-quality labels.
const validationStateLabel: Record<GYGValidationState, string> = {
  STRONG_MATCH: 'Strong match',
  LIKELY_MATCH: 'Likely match',
  WEAK_MATCH: 'Weak match',
  REJECTED_MATCH: 'Rejected',
  NEEDS_REVIEW: 'Needs review',
};

const validationStateBadgeClass: Record<GYGValidationState, string> = {
  STRONG_MATCH: 'bg-green-600 text-white',
  LIKELY_MATCH: 'bg-green-100 text-green-800',
  WEAK_MATCH: 'bg-amber-100 text-amber-800',
  REJECTED_MATCH: 'bg-red-100 text-red-800',
  NEEDS_REVIEW: 'bg-purple-100 text-purple-800',
};

const formatFetchedAt = (fetchedAt: string | null) => fetchedAt
  ? new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(fetchedAt))
  : null;

function toComparableOffer(activity: NormalizedViatorActivity): GYGActivityResult {
  return {
    id: activity.id,
    title: activity.title,
    price: activity.price.amount,
    currency: activity.price.currency,
    image: activity.imageUrl || null,
    url: activity.url || null,
    duration: activity.duration || null,
    rating: activity.rating,
    reviewCount: activity.reviewCount,
    location: activity.location || null,
    sourceType: 'LIVE_VERIFIED',
    verified: true,
    stale: false,
    fetchedAt: new Date().toISOString(),
    expiresAt: null,
    matchScore: null,
    matchReasons: [],
    validationState: null,
    originalPrice: activity.price.amount,
    originalCurrency: activity.price.currency,
    provider: activity.provider,
    externalId: activity.id,
    checkedAt: 'checkedAt' in activity ? activity.checkedAt : new Date().toISOString(),
  };
}

// Secondary manual-search tool (French, unchanged from before this phase).
const getGYGErrorMessage = (error: unknown) => {
  const response = (error as any)?.response;
  const retryAfter = response?.data?.retryAfter;
  if (response?.status === 429 || response?.data?.code === 'GYG_RATE_LIMITED') {
    return `Trop de requêtes GetYourGuide. Réessayez${retryAfter ? ` dans ${retryAfter} secondes` : ' dans quelques instants'}.`;
  }
  if (response?.status === 503 || response?.data?.code === 'GYG_CIRCUIT_OPEN') {
    return `Le service GetYourGuide est temporairement indisponible. Réessayez${retryAfter ? ` dans ${retryAfter} secondes` : ' plus tard'}.`;
  }
  return 'Impossible de récupérer les activités. Vérifiez le terme de recherche ou réessayez plus tard.';
};

// Primary workspace (English, per Phase 3D-2 spec wording) — Phase 3D-2 §10
// exact degraded-state copy.
const getWorkspaceErrorMessage = (error: unknown): string => {
  const response = (error as any)?.response;
  if (response?.status === 429 || response?.data?.code === 'GYG_RATE_LIMITED') {
    return 'Too many GetYourGuide requests. Please try again later.';
  }
  if (response?.status === 503 || response?.data?.code === 'GYG_CIRCUIT_OPEN' || response?.data?.code === 'GYG_UPSTREAM_UNAVAILABLE') {
    return 'Live GetYourGuide data is temporarily unavailable.';
  }
  return 'Something went wrong loading market comparison data.';
};

const formatMAD = (value: number) => `${Math.round(value)} MAD`;

function computeDifference(ourPrice: number, median: number | null): { mad: number; percent: number } | null {
  if (median == null || median <= 0 || !(ourPrice > 0)) return null;
  const mad = ourPrice - median;
  const percent = (mad / median) * 100;
  return { mad, percent };
}

// Neutral, direction-explicit wording — never "better"/"worse", never a
// price-change recommendation (Phase 3D-2 §3).
function formatDiffMAD(diff: { mad: number }): string {
  if (diff.mad === 0) return 'At market';
  return `${Math.round(Math.abs(diff.mad))} MAD ${diff.mad > 0 ? 'above market' : 'below market'}`;
}
function formatDiffPercent(diff: { percent: number }): string {
  if (diff.percent === 0) return '0%';
  return `${Math.abs(diff.percent).toFixed(1)}% ${diff.percent > 0 ? 'above market' : 'below market'}`;
}

function MatchBadge({ state, score }: { state: GYGValidationState; score: number | null }) {
  return (
    <Badge className={validationStateBadgeClass[state]}>
      {validationStateLabel[state]}{typeof score === 'number' ? ` · ${score}/100` : ''}
    </Badge>
  );
}

function DataStatusBadge({ row }: { row: EnrichedRow }) {
  if (row.dataStatus === 'unavailable') {
    return <Badge className="bg-red-100 text-red-700">Unavailable</Badge>;
  }
  const source = row.bestOffer?.sourceType;
  if (!source) {
    return <Badge variant="outline" className="text-gray-500 border-gray-300">Never checked</Badge>;
  }
  return <Badge className={trustBadgeClass[source]}>{trustLabel[source]}</Badge>;
}

const FILTERS: Array<{ value: 'all' | 'below' | 'above' | 'needs-review' | 'no-data'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'below', label: 'Below market' },
  { value: 'above', label: 'Above market' },
  { value: 'needs-review', label: 'Needs review' },
  { value: 'no-data', label: 'No verified market data' },
];

type SortKey = 'activity' | 'ourPrice' | 'median' | 'difference' | 'lastChecked';

// Popular Morocco activities for quick search (secondary tool)
const POPULAR_SEARCHES = [
  { name: 'Hot Air Balloon', query: 'Montgolfière (Hot Air Balloon)', icon: '🎈' },
  { name: 'Desert Tour', query: 'Sahara Desert Tour', icon: '🏜️' },
  { name: 'Atlas Mountains', query: 'Atlas Mountains Day Trip', icon: '⛰️' },
  { name: 'Agafay Desert', query: 'Agafay Desert', icon: '🐫' },
  { name: 'Cooking Class', query: 'Moroccan Cooking Class', icon: '👨‍🍳' },
  { name: 'Essaouira', query: 'Essaouira Day Trip', icon: '🌊' },
  { name: 'Ouzoud Waterfalls', query: 'Ouzoud Waterfalls', icon: '💧' },
  { name: 'Hammam Spa', query: 'Traditional Hammam Spa', icon: '🧖' },
];

export default function GYGReferenceTool({ onActivitySelect }: GYGReferenceToolProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const canForceLiveRefresh = user?.role === 'superadmin';
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const providerStatusQuery = useQuery({
    queryKey: ['market-provider-status'],
    queryFn: async () => (await api.get('/market/providers')).data,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  // ------------------------------------------------------------------
  // Primary: market comparison workspace (Phase 3D-2). Cache-first: this
  // read never triggers a live GetYourGuide request (forceRefresh is always
  // 'false' here) — safe to run on every page load/mount.
  // ------------------------------------------------------------------
  const workspaceQuery = useQuery<ActivityComparisonRow[]>({
    queryKey: ['gyg-workspace-summary'],
    queryFn: async () => {
      const response = await api.get('/gyg/search', {
        params: { q: 'all', useMyActivities: 'true', forceRefresh: 'false' },
      });
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const [filter, setFilter] = useState<'all' | 'below' | 'above' | 'needs-review' | 'no-data'>('all');
  const [sortBy, setSortBy] = useState<SortKey>('activity');
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [officialOfferToCompare, setOfficialOfferToCompare] = useState<GYGActivityResult | null>(null);
  const [compareActivityDialogOpen, setCompareActivityDialogOpen] = useState(false);
  const [activityPickerMode, setActivityPickerMode] = useState<'compare' | 'manual' | null>(null);
  const [comparableDialogOpen, setComparableDialogOpen] = useState(false);
  const [editingComparable, setEditingComparable] = useState<GYGActivityResult | null>(null);
  const [comparableForm, setComparableForm] = useState({ provider: 'GETYOURGUIDE', url: '', externalId: '', title: '', price: '', currency: 'MAD', normalizedMadPrice: '', conversionRate: '', rating: '', reviewCount: '', duration: '', notes: '' });
  const [comparableErrors, setComparableErrors] = useState<Record<string, string>>({});

  const enrichedRows: EnrichedRow[] = useMemo(() => {
    const rows = workspaceQuery.data ?? [];
    return rows.map((row) => {
      const ourPrice = Number(row.myActivity.price) || 0;
      const diff = computeDifference(ourPrice, row.metrics.medianVerifiedPrice);
      const bestOffer = row.gygMatches[0] ?? null;
      const needsReview = row.gygMatches.some((offer) => offer.validationState === 'NEEDS_REVIEW' && !offer.manualOverride);
      return {
        ...row,
        ourPrice,
        diff,
        bestOffer,
        needsReview,
        lastChecked: bestOffer?.fetchedAt ?? null,
      };
    });
  }, [workspaceQuery.data]);

  const needsReviewCount = useMemo(() => enrichedRows.filter((r) => r.needsReview).length, [enrichedRows]);

  const filteredSortedRows = useMemo(() => {
    const filtered = enrichedRows.filter((row) => {
      switch (filter) {
        case 'below': return !!row.diff && row.diff.mad < 0;
        case 'above': return !!row.diff && row.diff.mad > 0;
        case 'needs-review': return row.needsReview;
        case 'no-data': return row.metrics.medianVerifiedPrice == null;
        default: return true;
      }
    });
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'ourPrice': return a.ourPrice - b.ourPrice;
        case 'median': return (a.metrics.medianVerifiedPrice ?? Number.POSITIVE_INFINITY) - (b.metrics.medianVerifiedPrice ?? Number.POSITIVE_INFINITY);
        case 'difference': return (a.diff?.mad ?? 0) - (b.diff?.mad ?? 0);
        case 'lastChecked': return new Date(a.lastChecked ?? 0).getTime() - new Date(b.lastChecked ?? 0).getTime();
        default: return a.myActivity.name.localeCompare(b.myActivity.name);
      }
    });
    return sorted;
  }, [enrichedRows, filter, sortBy]);

  const selectedRow = enrichedRows.find((r) => r.myActivity.id === selectedActivityId) ?? null;

  // Superadmin-only actions. The server independently enforces requireSuperAdmin
  // on all three endpoints, so hiding these controls from Admin is a UX
  // convenience, not the security boundary itself.
  const matchOverrideMutation = useMutation({
    mutationFn: async (payload: {
      ourActivityId: string;
      matchedExternalId: string;
      decision: 'ACCEPTED' | 'REJECTED';
      automaticValidationState?: string | null;
      automaticMatchScore?: number | null;
    }) => (await api.post('/admin/gyg-matches/override', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyg-workspace-summary'] });
      toast({ title: 'Decision saved' });
    },
    onError: (error) => toast({ title: 'Could not save decision', description: getWorkspaceErrorMessage(error), variant: 'destructive' }),
  });

  const clearOverrideMutation = useMutation({
    mutationFn: async (payload: { ourActivityId: string; matchedExternalId: string }) =>
      (await api.delete('/admin/gyg-matches/override', { data: payload })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyg-workspace-summary'] });
      toast({ title: 'Manual override cleared — automatic scoring is authoritative again' });
    },
    onError: (error) => toast({ title: 'Could not clear override', description: getWorkspaceErrorMessage(error), variant: 'destructive' }),
  });

  const comparableMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRow) throw new Error('Select an activity first.');
      const payload = {
        activityId: selectedRow.myActivity.id,
        provider: comparableForm.provider,
        url: comparableForm.url,
        externalId: comparableForm.externalId || undefined,
        title: comparableForm.title,
        price: Number(comparableForm.price),
        currency: comparableForm.currency,
        normalizedMadPrice: comparableForm.normalizedMadPrice === '' ? undefined : Number(comparableForm.normalizedMadPrice),
        conversionRate: comparableForm.conversionRate === '' ? undefined : Number(comparableForm.conversionRate),
        rating: comparableForm.rating === '' ? undefined : Number(comparableForm.rating),
        reviewCount: comparableForm.reviewCount === '' ? undefined : Number(comparableForm.reviewCount),
        duration: comparableForm.duration || undefined,
        notes: comparableForm.notes || undefined,
      };
      if (editingComparable?.manualComparableId) {
        return (await api.patch(`/gyg/comparables/${editingComparable.manualComparableId}`, payload)).data;
      }
      return (await api.post('/gyg/comparables', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gyg-workspace-summary'] });
      setComparableDialogOpen(false);
      setEditingComparable(null);
      toast({ title: 'Verified comparable saved' });
    },
    onError: (error: any) => toast({ title: 'Could not save comparable', description: error?.response?.data?.message || 'Check the comparable details.', variant: 'destructive' }),
  });

  const reverifyComparableMutation = useMutation({
    mutationFn: async (id: string) => (await api.post(`/gyg/comparables/${id}/reverify`)).data,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyg-workspace-summary'] }); toast({ title: 'Comparable re-verified' }); },
    onError: () => toast({ title: 'Could not re-verify comparable', variant: 'destructive' }),
  });

  const deleteComparableMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/gyg/comparables/${id}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['gyg-workspace-summary'] }); toast({ title: 'Comparable removed' }); },
    onError: () => toast({ title: 'Could not remove comparable', variant: 'destructive' }),
  });

  const openComparableDialog = (offer?: GYGActivityResult) => {
    setEditingComparable(offer ?? null);
    setComparableErrors({});
    setComparableForm(offer ? {
      provider: offer.provider ?? 'GETYOURGUIDE', url: offer.url || '', externalId: offer.externalId ?? '', title: offer.title, price: String(offer.originalPrice ?? offer.price), currency: offer.originalCurrency ?? offer.currency,
      normalizedMadPrice: offer.normalizedMadPrice == null ? '' : String(offer.normalizedMadPrice), conversionRate: '', rating: offer.rating == null ? '' : String(offer.rating), reviewCount: offer.reviewCount == null ? '' : String(offer.reviewCount), duration: offer.duration || '', notes: offer.notes || '',
    } : { provider: 'GETYOURGUIDE', url: '', externalId: '', title: '', price: '', currency: 'MAD', normalizedMadPrice: '', conversionRate: '', rating: '', reviewCount: '', duration: '', notes: '' });
    setComparableDialogOpen(true);
  };

  const handleViatorCompare = (activity: NormalizedViatorActivity) => {
    const offer = toComparableOffer(activity);
    if (selectedRow) {
      openComparableDialog(offer);
      return;
    }
    setOfficialOfferToCompare(offer);
    setActivityPickerMode('compare');
    setCompareActivityDialogOpen(true);
  };

  const handleViatorTemplate = (activity: NormalizedViatorActivity) => {
    sessionStorage.setItem('marketplace-activity-template', JSON.stringify(activity));
    setLocation('/admin/activities/new');
  };

  const submitComparable = () => {
    const errors: Record<string, string> = {};
    if (!comparableForm.url.trim()) errors.url = 'Marketplace HTTPS URL is required for manual entry.';
    if (!comparableForm.title.trim()) errors.title = 'Offer title is required for manual entry.';
    if (!comparableForm.price || Number(comparableForm.price) <= 0) errors.price = 'Offer price must be greater than zero.';
    if (comparableForm.rating !== '' && (Number(comparableForm.rating) < 0 || Number(comparableForm.rating) > 5)) errors.rating = 'Rating must be between 0 and 5.';
    if (comparableForm.reviewCount !== '' && Number(comparableForm.reviewCount) < 0) errors.reviewCount = 'Review count cannot be negative.';
    setComparableErrors(errors);
    if (Object.keys(errors).length === 0) comparableMutation.mutate();
  };

  // ------------------------------------------------------------------
  // Secondary: manual GetYourGuide search (unchanged behavior, kept as a
  // de-emphasized secondary tool — Phase 3D-2 §12).
  // ------------------------------------------------------------------
  const [showManualSearch, setShowManualSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [forceLiveScrape, setForceLiveScrape] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('gyg-recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const { data: searchResults, isLoading, error } = useQuery<GYGSearchResponse>({
    queryKey: ['gyg-search', activeSearch, forceLiveScrape],
    enabled: activeSearch.length >= 3,
    queryFn: async () => {
      const response = await api.get('/gyg/search', {
        params: {
          q: activeSearch,
          forceRefresh: forceLiveScrape && canForceLiveRefresh ? 'true' : 'false',
          useMyActivities: 'false',
        },
      });
      return response.data;
    },
    staleTime: 0,
  });
  const searchOffers = searchResults?.offers ?? [];

  const getGYGSearchUrl = (query: string) => {
    const moroccoQuery = query.trim() || 'morocco activities';
    return `https://www.getyourguide.com/s/?q=${encodeURIComponent(moroccoQuery)}&searchSource=3`;
  };

  const handleFetchActivities = (query?: string, useLiveScrape: boolean = false, redirectToWebsite: boolean = false) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm || searchTerm.length < 3) return;

    if (redirectToWebsite) {
      window.open(getGYGSearchUrl(searchTerm), '_blank', 'noopener,noreferrer');
      return;
    }

    setActiveSearch(searchTerm);
    setForceLiveScrape(useLiveScrape && canForceLiveRefresh);

    if (searchTerm && searchTerm !== 'morocco activities') {
      const updated = [searchTerm, ...recentSearches.filter((s) => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('gyg-recent-searches', JSON.stringify(updated));
    }
  };

  const handleGYGSearch = (query?: string) => {
    const searchTerm = query || searchQuery.trim() || 'morocco activities';
    const gygUrl = getGYGSearchUrl(searchTerm);

    if (searchTerm && searchTerm !== 'morocco activities') {
      const updated = [searchTerm, ...recentSearches.filter((s) => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('gyg-recent-searches', JSON.stringify(updated));
    }

    window.open(gygUrl, '_blank', 'noopener,noreferrer');
    if (onActivitySelect) onActivitySelect({ query: searchTerm, url: gygUrl });
  };

  const handleGYGMorocco = () => {
    window.open('https://www.getyourguide.com/morocco-l191/', '_blank', 'noopener,noreferrer');
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleFetchActivities();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('gyg-recent-searches');
  };

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Market Reference</h2>
          <p className="text-sm text-gray-500">Use official marketplace results for factual comparison. Internal MarrakechDunes prices remain manually controlled.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Card className="border-emerald-200 bg-emerald-50/40">
            <CardContent className="p-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900">Viator</h3><Badge className="bg-emerald-600 text-white">Active</Badge></div>
              <p className="mt-1 text-xs text-gray-600">Official Partner API search and trusted comparison workflow.</p>
              <p className="mt-2 text-xs text-gray-500">{providerStatusQuery.data?.providers?.viator?.configured ? 'Ready' : 'Partner API key not configured'}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between"><h3 className="font-semibold text-gray-900">GetYourGuide</h3><Badge variant="outline">Disabled</Badge></div>
              <p className="mt-1 text-xs text-gray-600">Read-only legacy comparables remain visible. Official Partner API access is required for live search.</p>
            </CardContent>
          </Card>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Official Viator Search</h3>
          <p className="text-sm text-gray-500 mb-3">Search Viator, compare offers, or use factual fields as an activity template. Foreign-currency offers are not treated as MAD metrics without verified normalization.</p>
          <ViatorActivitySearch onCompare={handleViatorCompare} onUseAsTemplate={handleViatorTemplate} />
        </div>
      </section>

      {/* ============================================================ */}
      {/* PRIMARY: Market Comparison Workspace                          */}
      {/* ============================================================ */}
      <div className="space-y-4">
        <div className="flex items-start justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Market Comparison</h3>
            <p className="text-sm text-gray-500">
              Internal market intelligence for MarrakechDunes activities. Uses cached comparison data —
              opening this workspace never sends live requests to GetYourGuide.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => workspaceQuery.refetch()}
            disabled={workspaceQuery.isFetching}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${workspaceQuery.isFetching ? 'animate-spin' : ''}`} />
            Reload cached data
          </Button>
        </div>

        {workspaceQuery.isError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {getWorkspaceErrorMessage(workspaceQuery.error)}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={filter === f.value ? 'default' : 'outline'}
              className="h-7 text-xs"
              onClick={() => setFilter(f.value)}
            >
              {f.label}
              {f.value === 'needs-review' && needsReviewCount > 0 && (
                <Badge className="ml-1.5 bg-purple-600 text-white h-4 min-w-4 px-1 text-[10px]">{needsReviewCount}</Badge>
              )}
            </Button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-gray-500">Sort by</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="h-7 text-xs w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="activity">Activity</SelectItem>
                <SelectItem value="ourPrice">Our price</SelectItem>
                <SelectItem value="median">Market median</SelectItem>
                <SelectItem value="difference">Difference</SelectItem>
                <SelectItem value="lastChecked">Last checked</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {workspaceQuery.isLoading && (
          <div className="flex items-center justify-center py-10 text-gray-500 text-sm">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading cached comparison data…
          </div>
        )}

        {!workspaceQuery.isLoading && !workspaceQuery.isError && filteredSortedRows.length === 0 && (
          <div className="text-center py-10 text-sm text-gray-500">No activities match this filter.</div>
        )}

        {filteredSortedRows.length > 0 && (
          <>
            {/* Desktop table */}
            <div className="hidden md:block border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead>Our Price</TableHead>
                    <TableHead>Verified GYG Median</TableHead>
                    <TableHead>Difference</TableHead>
                    <TableHead>% Difference</TableHead>
                    <TableHead>Verified Comparable Offers</TableHead>
                    <TableHead>Match Status</TableHead>
                    <TableHead>Data Status</TableHead>
                    <TableHead>Last Checked</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSortedRows.map((row) => (
                    <TableRow
                      key={row.myActivity.id}
                      className="cursor-pointer"
                      onClick={() => setSelectedActivityId(row.myActivity.id)}
                    >
                      <TableCell className="font-medium">{row.myActivity.name}</TableCell>
                      <TableCell>{formatMAD(row.ourPrice)}</TableCell>
                      <TableCell>
                        {row.metrics.medianVerifiedPrice != null
                          ? formatMAD(row.metrics.medianVerifiedPrice)
                          : <span className="text-gray-400 text-xs">No verified comparable market price</span>}
                      </TableCell>
                      <TableCell className="text-sm">{row.diff ? formatDiffMAD(row.diff) : '—'}</TableCell>
                      <TableCell className="text-sm">{row.diff ? formatDiffPercent(row.diff) : '—'}</TableCell>
                      <TableCell>{row.metrics.verifiedOfferCount}</TableCell>
                      <TableCell>
                        {row.bestOffer?.validationState
                          ? <MatchBadge state={row.bestOffer.validationState} score={row.bestOffer.matchScore} />
                          : <span className="text-gray-400 text-xs">—</span>}
                      </TableCell>
                      <TableCell><DataStatusBadge row={row} /></TableCell>
                      <TableCell className="text-xs text-gray-500">{formatFetchedAt(row.lastChecked) ?? 'Never'}</TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedActivityId(row.myActivity.id)}>
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {filteredSortedRows.map((row) => (
                <Card key={row.myActivity.id} className="cursor-pointer" onClick={() => setSelectedActivityId(row.myActivity.id)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{row.myActivity.name}</span>
                      <DataStatusBadge row={row} />
                    </div>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-gray-600">
                      <div>Our price: <span className="font-medium text-gray-900">{formatMAD(row.ourPrice)}</span></div>
                      <div>Offers: <span className="font-medium text-gray-900">{row.metrics.verifiedOfferCount}</span></div>
                      <div>Median: <span className="font-medium text-gray-900">{row.metrics.medianVerifiedPrice != null ? formatMAD(row.metrics.medianVerifiedPrice) : '—'}</span></div>
                      <div>{row.diff ? formatDiffPercent(row.diff) : ''}</div>
                    </div>
                    {row.diff && <div className="text-xs text-gray-600">{formatDiffMAD(row.diff)}</div>}
                    {row.metrics.medianVerifiedPrice == null && (
                      <p className="text-[11px] text-gray-400">No verified comparable market price</p>
                    )}
                    {row.bestOffer?.validationState && (
                      <MatchBadge state={row.bestOffer.validationState} score={row.bestOffer.matchScore} />
                    )}
                    <p className="text-[11px] text-gray-400">Last checked: {formatFetchedAt(row.lastChecked) ?? 'Never'}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Details drawer */}
      <Sheet open={!!selectedActivityId} onOpenChange={(open) => !open && setSelectedActivityId(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedRow && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedRow.myActivity.name}</SheetTitle>
                <SheetDescription asChild>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>Our price: <span className="font-medium text-gray-900">{formatMAD(selectedRow.ourPrice)}</span></div>
                    <div>
                      Verified market median:{' '}
                      <span className="font-medium text-gray-900">
                        {selectedRow.metrics.medianVerifiedPrice != null ? formatMAD(selectedRow.metrics.medianVerifiedPrice) : 'No verified comparable market price'}
                      </span>
                    </div>
                    {selectedRow.diff && (
                      <div>Difference: <span className="font-medium text-gray-900">{formatDiffMAD(selectedRow.diff)} ({formatDiffPercent(selectedRow.diff)})</span></div>
                    )}
                    <div>Last checked: {formatFetchedAt(selectedRow.lastChecked) ?? 'Never'}</div>
                  </div>
                </SheetDescription>
              </SheetHeader>

              <div className="mt-4 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">
                  Manage Comparables · marketplace offers ({selectedRow.gygMatches.length})
                </h4>
                <div className="flex gap-2">
                  {canForceLiveRefresh && <Button size="sm" className="h-7 text-xs" onClick={() => openComparableDialog()}>Add Verified Comparable Manually</Button>}
                </div>
              </div>

              {selectedRow.message && (
                <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  {selectedRow.message}
                </div>
              )}

              {selectedRow.gygMatches.length === 0 && !selectedRow.message && (
                <p className="mt-3 text-sm text-gray-500">No verified comparable GetYourGuide offers are currently available.</p>
              )}

              <div className="mt-3 space-y-3">
                {selectedRow.gygMatches.map((offer) => (
                  <Card key={offer.id} className="overflow-hidden">
                    <CardContent className="p-4 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="font-semibold text-sm text-gray-900">{offer.title}</h5>
                        {offer.url && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs shrink-0"
                            onClick={() => window.open(offer.url!, '_blank', 'noopener,noreferrer')}
                          >
                            <ExternalLink className="w-3 h-3 mr-1" /> Open on GetYourGuide
                          </Button>
                        )}
                      </div>

                      <div className="flex items-baseline gap-2">
                        <span className="text-lg font-bold text-blue-600">{offer.originalPrice ?? offer.price} {offer.originalCurrency ?? offer.currency}</span>
                        {offer.originalCurrency && offer.originalCurrency !== 'MAD' && <span className="text-xs text-gray-500">({formatMAD(offer.price)})</span>}
                        {typeof offer.rating === 'number' && (
                          <span className="flex items-center gap-1 text-xs text-gray-600">
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" /> {offer.rating}
                            {typeof offer.reviewCount === 'number' && <span>({offer.reviewCount.toLocaleString()} reviews)</span>}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-gray-600">
                        {offer.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{offer.duration}</span>}
                        {offer.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{offer.location}</span>}
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="text-[10px]">{offer.provider ?? 'GETYOURGUIDE'}</Badge>
                        <Badge className={trustBadgeClass[offer.sourceType]}>{trustLabel[offer.sourceType]}</Badge>
                        {offer.validationState && <MatchBadge state={offer.validationState} score={offer.matchScore} />}
                        {offer.manualOverride && (
                          <Badge variant="outline" className="text-[10px]">
                            Manual: {offer.manualOverride.decision === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
                          </Badge>
                        )}
                        {!offer.manualOverride && <Badge variant="outline" className="text-[10px] text-gray-500">Automatic</Badge>}
                      </div>

                      {offer.matchReasons.length > 0 && (
                        <ul className="text-[11px] text-gray-500 list-disc list-inside space-y-0.5">
                          {offer.matchReasons.map((reason, idx) => <li key={idx}>{reason}</li>)}
                        </ul>
                      )}

                      {formatFetchedAt(offer.fetchedAt) && (
                        <p className="text-[11px] text-slate-500">Checked: {formatFetchedAt(offer.fetchedAt)}</p>
                      )}

                      {canForceLiveRefresh && offer.manualComparableId && (
                        <div className="flex gap-1 pt-1">
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" onClick={() => openComparableDialog(offer)}>Edit</Button>
                          {offer.provider !== 'VIATOR' && <Button size="sm" variant="outline" className="h-6 px-2 text-[11px]" disabled={reverifyComparableMutation.isPending} onClick={() => reverifyComparableMutation.mutate(offer.manualComparableId!)}>Re-verify</Button>}
                          <Button size="sm" variant="outline" className="h-6 px-2 text-[11px] text-red-700" disabled={deleteComparableMutation.isPending} onClick={() => deleteComparableMutation.mutate(offer.manualComparableId!)}>Remove</Button>
                        </div>
                      )}

                      {/* Superadmin-only override controls (§7). Admin sees the
                          state above, read-only — no buttons rendered for Admin.
                          The server enforces this independently (requireSuperAdmin
                          on both endpoints), so this is a convenience, not the
                          security boundary. */}
                      {canForceLiveRefresh && offer.ourActivityId && offer.matchedExternalId && (
                        <div className="flex gap-1 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={matchOverrideMutation.isPending}
                            className="h-6 px-2 text-[11px] border-green-300 text-green-700 hover:bg-green-50"
                            onClick={() => matchOverrideMutation.mutate({
                              ourActivityId: offer.ourActivityId!,
                              matchedExternalId: offer.matchedExternalId!,
                              decision: 'ACCEPTED',
                              automaticValidationState: offer.validationState,
                              automaticMatchScore: offer.matchScore,
                            })}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={matchOverrideMutation.isPending}
                            className="h-6 px-2 text-[11px] border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => matchOverrideMutation.mutate({
                              ourActivityId: offer.ourActivityId!,
                              matchedExternalId: offer.matchedExternalId!,
                              decision: 'REJECTED',
                              automaticValidationState: offer.validationState,
                              automaticMatchScore: offer.matchScore,
                            })}
                          >
                            Reject
                          </Button>
                          {offer.manualOverride && (
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={clearOverrideMutation.isPending}
                              className="h-6 px-2 text-[11px] text-gray-500 hover:text-gray-700"
                              onClick={() => clearOverrideMutation.mutate({
                                ourActivityId: offer.ourActivityId!,
                                matchedExternalId: offer.matchedExternalId!,
                              })}
                            >
                              Clear override
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={compareActivityDialogOpen} onOpenChange={setCompareActivityDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader>
            <DialogTitle>Compare with a MarrakechDunes activity</DialogTitle>
            <DialogDescription>Select the internal activity that should receive this official GetYourGuide comparable.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-80 overflow-y-auto py-2">
            {enrichedRows.map((row) => (
              <Button
                key={row.myActivity.id}
                type="button"
                variant="outline"
                className="w-full justify-between h-auto py-3"
                onClick={() => {
                  setSelectedActivityId(row.myActivity.id);
                  setCompareActivityDialogOpen(false);
                  if (activityPickerMode === 'compare' && officialOfferToCompare) {
                    openComparableDialog(officialOfferToCompare);
                  } else if (activityPickerMode === 'manual') {
                    openComparableDialog();
                  }
                  setOfficialOfferToCompare(null);
                  setActivityPickerMode(null);
                }}
              >
                <span className="text-left">
                  <span className="block font-medium">{row.myActivity.name}</span>
                  <span className="block text-xs text-gray-500">Our price: {formatMAD(row.ourPrice)}</span>
                </span>
                <span className="text-xs text-blue-600">Select</span>
              </Button>
            ))}
            {enrichedRows.length === 0 && <p className="text-sm text-gray-500">No MarrakechDunes activities are available to compare.</p>}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCompareActivityDialogOpen(false)}>Cancel</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={comparableDialogOpen} onOpenChange={setComparableDialogOpen}>
        <DialogContent className="max-w-lg bg-white">
          <DialogHeader><DialogTitle>{editingComparable ? 'Edit Verified Comparable' : 'Add Verified Comparable Manually'}</DialogTitle><DialogDescription>For: {selectedRow?.myActivity.name}. Pasting a URL does not import metadata; enter the offer facts you verified.</DialogDescription></DialogHeader>
          <div className="grid gap-3 py-2">
            <Select value={comparableForm.provider} onValueChange={(provider) => setComparableForm({ ...comparableForm, provider })}><SelectTrigger aria-label="Marketplace provider"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="VIATOR">Viator</SelectItem><SelectItem value="GETYOURGUIDE">GetYourGuide</SelectItem><SelectItem value="OTHER">Other</SelectItem></SelectContent></Select>
            <div><Input aria-label="Marketplace URL" placeholder={comparableForm.provider === 'VIATOR' ? 'https://www.viator.com/...' : comparableForm.provider === 'GETYOURGUIDE' ? 'https://www.getyourguide.com/...' : 'https://...'} value={comparableForm.url} onChange={(e) => setComparableForm({ ...comparableForm, url: e.target.value })} />{comparableErrors.url && <p className="text-xs text-red-600 mt-1">{comparableErrors.url}</p>}</div>
            <Input aria-label="External product code" placeholder="External product code (optional)" value={comparableForm.externalId} onChange={(e) => setComparableForm({ ...comparableForm, externalId: e.target.value })} />
            <div><Input aria-label="Offer title" placeholder="Offer title" value={comparableForm.title} onChange={(e) => setComparableForm({ ...comparableForm, title: e.target.value })} />{comparableErrors.title && <p className="text-xs text-red-600 mt-1">{comparableErrors.title}</p>}</div>
            <div className="grid grid-cols-2 gap-2"><div><Input aria-label="Price" type="number" min="0" placeholder="Price" value={comparableForm.price} onChange={(e) => setComparableForm({ ...comparableForm, price: e.target.value })} />{comparableErrors.price && <p className="text-xs text-red-600 mt-1">{comparableErrors.price}</p>}</div><Select value={comparableForm.currency} onValueChange={(currency) => setComparableForm({ ...comparableForm, currency })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="MAD">MAD</SelectItem><SelectItem value="EUR">EUR</SelectItem><SelectItem value="USD">USD</SelectItem><SelectItem value="GBP">GBP</SelectItem></SelectContent></Select></div>
            {comparableForm.currency !== 'MAD' && <div className="grid grid-cols-2 gap-2"><Input aria-label="Normalized MAD price" type="number" min="0" placeholder="MAD equivalent (optional)" value={comparableForm.normalizedMadPrice} onChange={(e) => setComparableForm({ ...comparableForm, normalizedMadPrice: e.target.value })} /><Input aria-label="Manual conversion rate" type="number" min="0" step="0.0001" placeholder="Manual rate (optional)" value={comparableForm.conversionRate} onChange={(e) => setComparableForm({ ...comparableForm, conversionRate: e.target.value })} /></div>}
            <div className="grid grid-cols-2 gap-2"><div><Input aria-label="Rating" type="number" min="0" max="5" step="0.1" placeholder="Rating (optional)" value={comparableForm.rating} onChange={(e) => setComparableForm({ ...comparableForm, rating: e.target.value })} />{comparableErrors.rating && <p className="text-xs text-red-600 mt-1">{comparableErrors.rating}</p>}</div><div><Input aria-label="Review count" type="number" min="0" placeholder="Review count (optional)" value={comparableForm.reviewCount} onChange={(e) => setComparableForm({ ...comparableForm, reviewCount: e.target.value })} />{comparableErrors.reviewCount && <p className="text-xs text-red-600 mt-1">{comparableErrors.reviewCount}</p>}</div></div>
            <Input aria-label="Duration" placeholder="Duration (optional)" value={comparableForm.duration} onChange={(e) => setComparableForm({ ...comparableForm, duration: e.target.value })} />
            <Input aria-label="Notes" placeholder="Notes (optional)" value={comparableForm.notes} onChange={(e) => setComparableForm({ ...comparableForm, notes: e.target.value })} />
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setComparableDialogOpen(false)}>Cancel</Button><Button disabled={comparableMutation.isPending} onClick={submitComparable}>{editingComparable ? 'Save' : 'Add Comparable'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {canForceLiveRefresh && <>
      <Separator />

      {/* ============================================================ */}
      {/* SECONDARY: legacy diagnostic search, Superadmin only          */}
      {/* ============================================================ */}
      <div>
        <button
          onClick={() => setShowManualSearch((v) => !v)}
          className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-gray-800"
        >
          {showManualSearch ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          Legacy diagnostics: manual GetYourGuide source
        </button>

        {showManualSearch && (
          <div className="mt-4 space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <Search className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-semibold text-blue-800">Rechercher sur GetYourGuide</h3>
              </div>

              <p className="text-sm text-blue-700 mb-6">
                Recherchez des activités sur GetYourGuide pour comparer les prix et obtenir des idées de tarification pour vos propres activités.
              </p>

              <div className="flex gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <Input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ex: Hot Air Balloon, Desert Tour, Cooking Class..."
                    className="pl-10 h-11 bg-white"
                  />
                </div>
                <Button
                  onClick={() => handleFetchActivities()}
                  disabled={!searchQuery.trim() || searchQuery.trim().length < 3}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-11"
                >
                  {isLoading && activeSearch === searchQuery ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Scraping GetYourGuide...</>
                  ) : (
                    <><Search className="w-4 h-4 mr-2" />Chercher ici</>
                  )}
                </Button>
                {canForceLiveRefresh ? (
                  <Button
                    onClick={() => handleFetchActivities(undefined, true)}
                    disabled={!searchQuery.trim() || searchQuery.trim().length < 3}
                    variant="outline"
                    className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 px-4 h-11"
                    title="Forcer le scraping en temps réel (ignorer le cache)"
                  >
                    🔄 Force Live
                  </Button>
                ) : null}
                <Button
                  onClick={() => handleFetchActivities(undefined, false, true)}
                  disabled={!searchQuery.trim() || searchQuery.trim().length < 3}
                  variant="outline"
                  className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700 px-4 h-11"
                  title="Ouvrir GetYourGuide dans un nouvel onglet avec cette recherche"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ouvrir GYG
                </Button>
                <Button
                  onClick={() => handleGYGSearch()}
                  variant="outline"
                  className="bg-white hover:bg-gray-50 border-gray-300 px-4 h-11"
                  title="Ouvrir GetYourGuide dans un nouvel onglet"
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleGYGMorocco} variant="outline" className="bg-white hover:bg-green-50 border-green-300">
                  <Globe className="w-4 h-4 mr-2" />
                  🇲🇦 Voir Maroc
                </Button>
                <Button onClick={() => handleGYGSearch('morocco activities')} variant="outline" className="bg-white hover:bg-indigo-50">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Toutes les activités
                </Button>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Recherches populaires
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {POPULAR_SEARCHES.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => { setSearchQuery(item.query); handleFetchActivities(item.query); }}
                    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
                    title={`Rechercher "${item.query}" sur GetYourGuide`}
                  >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">{item.icon}</span>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {recentSearches.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Recherches récentes</h4>
                  <Button onClick={clearRecentSearches} variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
                    Effacer
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={index}
                      onClick={() => { setSearchQuery(search); handleFetchActivities(search); }}
                      className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSearch && (
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-gray-800">Résultats GetYourGuide pour "{activeSearch}"</h4>
                  {searchResults && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {searchOffers.length} activité{searchOffers.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>

                {isLoading && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                    <span className="text-gray-600">Scraping en temps réel depuis GetYourGuide... Cela peut prendre 5-10 secondes...</span>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    <p className="font-semibold mb-1">Erreur de recherche</p>
                    <p className="text-sm">{getGYGErrorMessage(error)}</p>
                  </div>
                )}

                {!error && searchResults?.metadata.stale && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
                    <p className="font-semibold mb-1">Données vérifiées mais expirées</p>
                    <p className="text-sm">GetYourGuide est temporairement indisponible. Ces résultats proviennent du dernier cache vérifié.</p>
                  </div>
                )}

                {!isLoading && !error && searchResults && searchOffers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <p className="mb-2">Aucun résultat trouvé pour "{activeSearch}"</p>
                    <p className="text-sm">Essayez un autre terme de recherche.</p>
                  </div>
                )}

                {!isLoading && !error && searchResults && searchOffers.length > 0 && (
                  <>
                    <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {searchOffers.length} résultat{searchOffers.length > 1 ? 's' : ''} trouvé{searchOffers.length > 1 ? 's' : ''}
                        </Badge>
                        <span className="text-sm text-gray-600">Cliquez sur une carte pour voir sur GetYourGuide</span>
                      </div>
                      <Button
                        onClick={() => handleGYGSearch(activeSearch)}
                        variant="outline"
                        size="sm"
                        className="bg-green-50 hover:bg-green-100 border-green-300 text-green-700"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Voir tous sur GetYourGuide
                      </Button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {searchOffers.map((activity) => (
                        <Card
                          key={activity.id}
                          className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                          onClick={() => activity.url && window.open(activity.url, '_blank', 'noopener,noreferrer')}
                        >
                          {activity.image && (
                            <div className="relative h-40 bg-gray-200 overflow-hidden">
                              <img
                                src={activity.image}
                                alt={activity.title}
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="absolute top-2 right-2">
                                <Badge className={activity.verified ? (activity.stale ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white') : 'bg-slate-600 text-white'}>
                                  {trustLabel[activity.sourceType]}
                                </Badge>
                              </div>
                            </div>
                          )}
                          <CardContent className="p-4">
                            <h5 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">{activity.title}</h5>
                            <p className={`mb-2 text-xs ${activity.verified ? (activity.stale ? 'text-amber-700' : 'text-green-700') : 'text-slate-500'}`}>
                              {activity.stale
                                ? 'Résultat vérifié expiré — ne pas utiliser comme prix actuel.'
                                : activity.verified
                                  ? 'Source GetYourGuide vérifiée.'
                                  : 'Référence non vérifiée — ne pas utiliser comme prix de marché vérifié.'}
                            </p>
                            {formatFetchedAt(activity.fetchedAt) && (
                              <p className="mb-2 text-xs text-slate-500">Vérifié le: {formatFetchedAt(activity.fetchedAt)}</p>
                            )}
                            <div className="space-y-2 mb-3">
                              {activity.rating && (
                                <div className="flex items-center gap-1 text-sm text-gray-600">
                                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                                  <span className="font-medium">{activity.rating}</span>
                                  {activity.reviewCount && <span className="text-gray-500">({activity.reviewCount.toLocaleString()} avis)</span>}
                                </div>
                              )}
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                {activity.duration && (
                                  <div className="flex items-center gap-1"><Clock className="w-4 h-4" /><span>{activity.duration}</span></div>
                                )}
                                {activity.location && (
                                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /><span className="truncate">{activity.location}</span></div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                              <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-bold text-blue-600">{activity.price} {activity.currency}</span>
                                <span className="text-xs text-gray-500">per person</span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => { e.stopPropagation(); if (activity.url) window.open(activity.url, '_blank', 'noopener,noreferrer'); }}
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                              >
                                <ExternalLink className="w-3 h-3 mr-1" />
                                Voir
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      </>}

      {/* Info Tip */}
      <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Astuce:</strong> Le tableau de comparaison utilise des données mises en cache. Le rafraîchissement en direct (par activité) est réservé aux Superadmins.
        </p>
      </div>
    </div>
  );
}
