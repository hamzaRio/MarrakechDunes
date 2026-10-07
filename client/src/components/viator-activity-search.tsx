import { useState } from 'react';
import { ExternalLink, Loader2, MapPin, Clock, Star, Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getViatorEurMadRate, getViatorProductDetail, searchViatorActivities, type NormalizedViatorActivity, type NormalizedViatorProductDetail } from '@/lib/viator-api';

interface ViatorActivitySearchProps {
  onCompare?: (activity: NormalizedViatorActivity) => void;
  onUseAsTemplate?: (activity: NormalizedViatorActivity) => void;
  marketIntelligenceEnabled?: boolean;
}

const providerError = (error: any) => {
  if (error?.response?.status === 503 || error?.response?.data?.code === 'VIATOR_API_NOT_CONFIGURED') {
    return 'Viator Partner API access is not configured. Add a server-side Partner API key to enable official search.';
  }
  if (error?.response?.status === 429) return 'Viator search is temporarily rate limited. Please try again later.';
  return 'Viator official search is temporarily unavailable.';
};

export default function ViatorActivitySearch({ onCompare, onUseAsTemplate, marketIntelligenceEnabled = false }: ViatorActivitySearchProps) {
  const [query, setQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [offset, setOffset] = useState(0);
  const [details, setDetails] = useState<Record<string, NormalizedViatorProductDetail>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);
  const search = useQuery({
    queryKey: ['viator-official-search', activeQuery, offset],
    enabled: activeQuery.length >= 2,
    queryFn: () => searchViatorActivities(activeQuery, 12, offset),
    staleTime: 60_000,
    retry: false,
  });
  const eurMadRate = useQuery({
    queryKey: ['viator-eur-mad-rate'],
    queryFn: getViatorEurMadRate,
    enabled: activeQuery.length >= 2,
    staleTime: 24 * 60 * 60 * 1000,
    retry: false,
  });

  const submit = () => {
    const value = query.trim();
    if (value.length < 2) return;
    setOffset(0);
    setActiveQuery(value);
  };
  const activities = search.data?.activities ?? [];
  const loadDetails = async (activity: NormalizedViatorActivity) => {
    if (details[activity.id] || detailLoading === activity.id) return;
    setDetailLoading(activity.id);
    setDetailError(null);
    try {
      const detail = await getViatorProductDetail(activity.id);
      setDetails((current) => ({ ...current, [activity.id]: detail }));
    } catch {
      setDetailError(activity.id);
    } finally {
      setDetailLoading(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') submit(); }} placeholder="Search Viator experiences…" aria-label="Viator search" />
        <Button onClick={submit} disabled={search.isFetching || query.trim().length < 2}><Search className="w-4 h-4 mr-1" />Search Viator</Button>
      </div>
      {!marketIntelligenceEnabled && <p className="text-xs text-slate-600">Viator Affiliate API results are currently available for discovery and affiliate referral only.</p>}
      {search.isFetching && <div className="flex items-center justify-center py-8 text-gray-500"><Loader2 className="w-5 h-5 mr-2 animate-spin" />Searching the official Viator Partner API…</div>}
      {search.isError && <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{providerError(search.error)}</div>}
      {!search.isFetching && !search.isError && activeQuery && activities.length === 0 && <p className="text-sm text-gray-500">No official Viator products matched this search.</p>}
      {activities.length > 0 && <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {activities.map((activity) => {
          const detail = details[activity.id];
          const productUrl = detail?.productUrl ?? activity.url;
          const rate = eurMadRate.data;
          const convertedMad = activity.price.currency === 'EUR' && Number.isFinite(activity.price.amount) && rate
            ? Math.round(activity.price.amount * rate.rate)
            : null;
          return (
          <Card key={activity.id}>
            {activity.imageUrl && <img src={activity.imageUrl} alt="" className="h-32 w-full object-cover rounded-t" />}
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2"><h4 className="font-semibold line-clamp-2">{activity.title}</h4><Badge className="bg-emerald-100 text-emerald-800">Official Viator</Badge></div>
              {activity.description && <p className="text-xs text-gray-600 line-clamp-2">{activity.description}</p>}
              <div className="flex flex-wrap gap-3 text-xs text-gray-600">
                <span className="font-semibold text-gray-900">{convertedMad != null ? `≈ ${convertedMad} MAD` : `${activity.price.amount} ${activity.price.currency}`}</span>
                {convertedMad != null && rate && <span title={`Approx. conversion using Bank Al-Maghrib reference rate (${rate.sourceDate})`}>{activity.price.amount} EUR · Viator</span>}
                {(detail?.rating ?? activity.rating) != null && <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />{detail?.rating ?? activity.rating}{(detail?.reviewCount ?? activity.reviewCount) != null ? ` (${(detail?.reviewCount ?? activity.reviewCount)!.toLocaleString()})` : ''}</span>}
                {activity.duration && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{activity.duration}</span>}
                {activity.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activity.location}</span>}
              </div>
              {detail?.firstImage && <img src={detail.firstImage} alt="" className="h-20 w-28 rounded object-cover" />}
              {detail && <div className="text-xs text-gray-600">{detail.status && <span>Status: {detail.status}</span>}{detail.destinationRefs.length > 0 && <span className="ml-3">Destination: {detail.destinationRefs.join(', ')}</span>}</div>}
              {detailLoading === activity.id && <div className="text-xs text-gray-500"><Loader2 className="mr-1 inline h-3 w-3 animate-spin" />Loading details…</div>}
              {detailError === activity.id && <div className="text-xs text-amber-700">Product details are temporarily unavailable.</div>}
              <div className="flex flex-wrap gap-2 pt-2 border-t">
                <Button size="sm" variant="outline" onClick={() => void loadDetails(activity)} disabled={detailLoading === activity.id || Boolean(detail)}>{detail ? 'Details loaded' : 'Details'}</Button>
                {productUrl && <Button size="sm" variant="outline" onClick={() => window.open(productUrl, '_blank', 'noopener,noreferrer')}><ExternalLink className="w-3 h-3 mr-1" />Open on Viator</Button>}
                {marketIntelligenceEnabled && onCompare && <Button size="sm" onClick={() => onCompare(activity)}>Compare with…</Button>}
                {marketIntelligenceEnabled && onUseAsTemplate && <Button size="sm" variant="outline" onClick={() => onUseAsTemplate(activity)}>Use as Activity Template</Button>}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>}
      {search.data?.hasMore && <Button variant="outline" onClick={() => setOffset((value) => value + 12)} disabled={search.isFetching}>Load more</Button>}
    </div>
  );
}
