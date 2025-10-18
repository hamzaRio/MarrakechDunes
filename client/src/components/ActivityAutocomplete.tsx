import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  value?: string;
  onChange?: (value: string) => void;
  onSelectActivity?: (activity: ExternalActivity) => void;
};

export default function ActivityAutocomplete({ city, onPick, value, onChange, onSelectActivity }: Props) {
  const [text, setText] = useState(value || '');
  const [debouncedText, setDebouncedText] = useState('');
  const [provider, setProvider] = useState<'all'|'gyg'|'rezdy'>('all');
  const [useLiveGYG, setUseLiveGYG] = useState(false);
  
  // Manual debounce implementation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedText(text);
    }, 350);
    
    return () => clearTimeout(timer);
  }, [text]);
  
  const enabled = debouncedText.trim().length >= 2;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['competitors', debouncedText, city, provider, useLiveGYG],
    queryFn: async () => {
      const params: any = { query: debouncedText, city, provider };
      if (useLiveGYG) {
        params.live = true;
      }
      const r = await axios.get('/competitors/suggest', { params });
      return r.data.items as ExternalActivity[];
    },
    enabled
  });

  return (
    <div className="relative">
      <label className="block text-sm font-medium mb-1">Nom de l'Activité (recherche Maroc)</label>
      <div className="flex gap-2 mb-2">
                <input
                  value={text}
                  onChange={(e) => {
                    setText(e.target.value);
                    onChange?.(e.target.value);
                  }}
                  placeholder="ex. désert, montgolfière, souks…"
                  className="flex-1 rounded-md border p-2"
                />
        <Select value={provider} onValueChange={(value: 'all'|'gyg'|'rezdy') => setProvider(value)}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="gyg">GetYourGuide</SelectItem>
            <SelectItem value="rezdy">Rezdy</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Live GYG Toggle */}
      <div className="flex items-center gap-2 mb-2">
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={useLiveGYG}
            onChange={(e) => setUseLiveGYG(e.target.checked)}
            className="rounded"
          />
          <span>Utiliser GYG en direct</span>
        </label>
      </div>
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
              onClick={() => {
                onPick(a);
                onSelectActivity?.(a);
              }}
              className="w-full text-left px-3 py-2 hover:bg-gray-50"
            >
              <div className="flex justify-between">
                <span className="font-medium">{a.title}</span>
                <span className="text-sm">{a.priceMAD} MAD</span>
              </div>
              <div className="text-xs text-gray-500">
                {a.city} • {a.durationText} • ⭐ {a.rating ?? '—'} 
                <span className="ml-1 px-1 py-0.5 bg-blue-100 text-blue-800 text-xs rounded">
                  {a.provider === 'GetYourGuide' ? '(GYG)' : a.provider === 'Rezdy' ? '(Rezdy)' : `(${a.provider})`}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}