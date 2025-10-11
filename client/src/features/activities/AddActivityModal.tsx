import { useState } from 'react';
import axios from '@/lib/api';
import { toast } from 'sonner';

type ExternalActivity = {
  title: string;
  city: string;
  priceMAD: number;
  durationText: string;
  rating?: number;
  provider: string;
  providerUrl?: string;
};

export default function AddActivityModal(/* your props */) {
  // existing form state
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [price, setPrice] = useState<number | ''>('');
  const [duration, setDuration] = useState('');

  const [searchLoading, setSearchLoading] = useState(false);
  const [results, setResults] = useState<ExternalActivity[]>([]);

  const searchCompetitors = async () => {
    try {
      if (!name && !city) {
        toast.error('Entrez au moins le nom ou la ville.');
        return;
      }
      setSearchLoading(true);
      toast.message('Recherche des activités similaires…');

      let mapped: ExternalActivity[] | null = null;
      // Prefer existing backend if present
      try {
        const r = await axios.get('/gyg/search', { params: { q: `${name} ${city} maroc` } });
        mapped = (r.data?.items ?? []).map((x: any) => ({
          title: x.title,
          city: x.city ?? city ?? '',
          priceMAD: x.priceMAD ?? x.price ?? 0,
          durationText: x.durationText ?? x.duration ?? '',
          rating: x.rating,
          provider: 'GetYourGuide',
          providerUrl: x.url,
        }));
      } catch {
        // Fallback
        const r2 = await axios.get('/api/external-activities', { params: { query: name, city } });
        mapped = r2.data;
      }

      setResults(mapped || []);
      setSearchLoading(false);
      toast.dismiss();
      if (!mapped || mapped.length === 0) toast.error('Aucune activité trouvée au Maroc.');
      else toast.success(`${mapped.length} activités trouvées au Maroc.`);
    } catch {
      setSearchLoading(false);
      toast.dismiss();
      toast.error('Erreur lors de la recherche.');
    }
  };

  const useActivity = (a: ExternalActivity) => {
    setName(a.title);
    setCity(a.city);
    setPrice(a.priceMAD);
    setDuration(a.durationText);
    toast.success('Champs autofillés.');
  };

  return (
    <div>
      {/* … vos champs existants (nom, description, prix, catégorie, lieu, durée) … */}

      <div className="mt-4 rounded-lg border bg-gradient-to-r from-blue-50 to-indigo-50 p-3">
        <div className="font-semibold mb-2">MA Recherche Concurrence Maroc</div>
        <p className="text-sm text-muted-foreground mb-3">
          Recherchez des activités similaires au Maroc pour comparer les prix.
        </p>
        <button
          onClick={searchCompetitors}
          disabled={searchLoading}
          className="px-4 py-2 rounded-md bg-rose-600 text-white"
        >
          {searchLoading ? 'Analyse en cours…' : '🔎 Recherche Concurrence Maroc'}
        </button>

        {results.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((a) => (
              <div key={`${a.provider}-${a.title}`} className="rounded-lg border bg-white p-3 shadow-sm">
                <div className="font-medium">{a.title}</div>
                <div className="text-sm text-muted-foreground">
                  {a.city} • {a.durationText} • ⭐ {a.rating ?? '—'}
                </div>
                <div className="text-sm font-semibold mt-1">{a.priceMAD} MAD</div>
                <div className="mt-2 flex gap-2">
                  <button onClick={() => useActivity(a)} className="px-2 py-1 rounded-md bg-green-600 text-white">
                    Utiliser Prix
                  </button>
                  {a.providerUrl && (
                    <a href={a.providerUrl} target="_blank" rel="noreferrer" className="px-2 py-1 rounded-md border">
                      Ouvrir ({a.provider})
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* … bouton Enregistrer existant … */}
    </div>
  );
}