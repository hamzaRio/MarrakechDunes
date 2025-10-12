import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/api';

type ExternalActivity = {
  title: string;
  city: string;
  priceMAD: number;
  durationText: string;
  rating?: number;
  reviewsCount?: number;
  provider: string;
  providerUrl?: string;
};

type Props = {
  city?: string;
  onPick: (a: ExternalActivity) => void;
};

export default function ActivityAutocomplete({ city, onPick }: Props) {
  const [text, setText] = useState('');
  const [debouncedText, setDebouncedText] = useState('');
  
  // Manual debounce implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, 350);
    
    return () => clearTimeout(timer);
  }, [text]);
  
  const enabled = debouncedText.trim().length >= 2;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['competitors', debouncedText, city],
    queryFn: async () => {
      const r = await axios.get('/api/competitors/suggest', { params: { query: debouncedText, city } });
      return r.data.items as ExternalActivity[];
    },
    enabled
  });

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">Nom de l'Activité (recherche Maroc)</label>
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="ex. désert, montgolfière, souks…"
        className="w-full rounded-md border p-2"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {!enabled ? 'Tapez au moins 2 lettres…'
          : isLoading ? 'Recherche des activités similaires…'
          : isError ? 'Erreur de recherche.'
          : (data?.length ?? 0) === 0 ? 'Aucune activité similaire trouvée.'
          : `${data?.length ?? 0} activités trouvées au Maroc.`}
      </p>

      {enabled && (data?.length ?? 0) > 0 && (
        <div className="absolute z-20 mt-2 w-full max-h-72 overflow-auto rounded-lg border bg-white shadow-lg">
          {data!.map((a) => (
            <button
              key={`${a.provider}-${a.title}-${a.city}`}
              type="button"
              onClick={() => onPick(a)}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex justify-between">
                <span className="font-medium">{a.title}</span>
                <span className="text-sm">{a.priceMAD} MAD</span>
              </div>
              <div className="text-xs text-gray-500">
                {a.city} • {a.durationText} • ⭐ {a.rating ?? '—'} ({a.provider})
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}