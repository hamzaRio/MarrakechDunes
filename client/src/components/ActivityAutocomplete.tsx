import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

const MIN = 2;

export default function ActivityAutocomplete({
  value, onChange, onSelectActivity, city = 'marrakech', placeholder = 'Tapez pour rechercher...'
}: {
  value: string;
  city?: string;
  placeholder?: string;
  onChange: (v: string) => void;
  onSelectActivity: (item: any) => void;
}) {
  const q = (value || '').trim();

  const { data, isFetching } = useQuery({
    queryKey: ['gyg-suggest', q, city],
    enabled: q.length >= MIN,
    staleTime: 30_000,
    queryFn: async () => {
      const res = await api.get('/market/search', { params: { provider: 'gyg', q, city } });
      const items = res.data?.sampleNormalizedShape ?? [];
      return items.map((p: any) => ({
        title: p.title,
        city: p.city,
        priceMAD: p.price_from,
        rating: p.rating,
        durationText: p.duration_text,
        url: p.url,
      }));
    },
  });

  const suggestions = data ?? [];

  return (
    <div className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border px-4 py-2"
      />

      {q.length >= MIN && (
        <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-auto rounded-md border bg-white shadow-lg z-[1000]">
          {isFetching && <div className="p-3 text-center text-gray-500">Recherche...</div>}
          {!isFetching && suggestions.map((a, i) => (
            <button
              key={i}
              onClick={() => onSelectActivity(a)}
              className="flex w-full items-start justify-between gap-2 p-3 text-left hover:bg-gray-50"
            >
              <div>
                <div className="font-medium">{a.title}</div>
                <div className="text-xs text-gray-500">{a.city}</div>
              </div>
              <div className="text-right">
                {a.rating ? <div className="text-xs">⭐ {a.rating}</div> : null}
                {a.priceMAD ? <div className="text-sm font-semibold">{a.priceMAD} MAD</div> : null}
                {a.durationText ? <div className="text-[10px] text-gray-500">{a.durationText}</div> : null}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
