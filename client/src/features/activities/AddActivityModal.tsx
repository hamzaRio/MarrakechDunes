import { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExternalLink, Globe, Search } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { buildGyGSearchUrl, buildGyGCountryUrl, openGyGSearch, openGyGCountry } from '@/lib/gyg-links';
import { GYG_LANG, GYG_CURRENCY } from '@/lib/env';

interface ExternalActivity {
  title: string;
  city: string;
  priceMAD: number;
  durationText: string;
  rating?: number;
  provider: string;
  providerUrl?: string;
}

interface AddActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (activity: any) => void;
}

export default function AddActivityModal({ isOpen, onClose, onSubmit }: AddActivityModalProps) {
  const [name, setName] = useState('');
  const [city, setCity] = useState('marrakech');
  const [price, setPrice] = useState<number | ''>('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');

  // Debounced search query
  const searchQuery = useMemo(() => {
    const trimmed = name.trim();
    return trimmed.length >= 2 ? trimmed : '';
  }, [name]);

  // Fetch GYG suggestions (dry-run only)
  const { data: suggestions = [], isLoading } = useQuery({
    queryKey: ['gyg-suggestions', searchQuery, city],
    queryFn: async () => {
      if (!searchQuery) return [];
      
      const response = await api.get('/market/search', {
        params: { provider: 'gyg', q: searchQuery, city }
      });
      
      return (response.data?.sampleNormalizedShape || []).slice(0, 5).map((item: any) => ({
        title: item.title,
        city: item.city,
        priceMAD: item.price_from,
        durationText: item.duration_text,
        rating: item.rating,
        provider: 'GetYourGuide',
        providerUrl: item.url
      }));
    },
    enabled: !!searchQuery,
    staleTime: 30000, // 30 seconds
  });

  const handleActivitySelect = useCallback((activity: ExternalActivity) => {
    setName(activity.title);
    setCity(activity.city);
    setPrice(activity.priceMAD);
    setDuration(activity.durationText);
    toast.success('Données de l\'activité appliquées');
  }, []);

  const handleOpenGYGSearch = useCallback(() => {
    const searchTerm = name.trim() || 'activités maroc';
    openGyGSearch({ 
      q: searchTerm, 
      city: city || 'marrakech',
      lang: GYG_LANG,
      currency: GYG_CURRENCY
    });
  }, [name, city]);

  const handleOpenGYGCountry = useCallback(() => {
    openGyGCountry({
      country: 'morocco',
      lang: GYG_LANG,
      currency: GYG_CURRENCY
    });
  }, []);

  const handleSubmit = useCallback(() => {
    if (!name.trim()) {
      toast.error('Le nom de l\'activité est requis');
      return;
    }

    const activityData = {
      name: name.trim(),
      city: city.trim(),
      price: Number(price) || 0,
      duration: duration.trim(),
      description: description.trim()
    };

    onSubmit?.(activityData);
    onClose();
    toast.success('Activité ajoutée avec succès');
  }, [name, city, price, duration, description, onSubmit, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Ajouter une Nouvelle Activité</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* GYG Research Bar - Reference Only */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-blue-800">🔍 Référence GetYourGuide</h3>
            </div>
            
            <p className="text-sm text-blue-700 mb-4">
              Recherchez des activités sur GetYourGuide pour obtenir des idées de prix et de contenu (référence uniquement)
            </p>

            <div className="space-y-3">
              {/* Search Input with Suggestions */}
              <div className="relative">
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tapez pour rechercher (ex: tanger, desert, fes)..."
                  className="w-full"
                />
                
                {/* Suggestions Dropdown */}
                {searchQuery && (
                  <div className="absolute left-0 right-0 mt-2 max-h-60 overflow-auto rounded-md border bg-white shadow-lg z-[1000]">
                    {isLoading && (
                      <div className="p-3 text-center text-gray-500">Recherche...</div>
                    )}
                    
                    {!isLoading && suggestions.length === 0 && (
                      <div className="p-3 text-center text-gray-500">Aucune suggestion trouvée</div>
                    )}
                    
                    {!isLoading && suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleActivitySelect(suggestion)}
                        className="w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{suggestion.title}</div>
                        <div className="text-sm text-gray-600">
                          {suggestion.city} • {suggestion.priceMAD} MAD
                          {suggestion.rating && ` • ⭐ ${suggestion.rating}`}
                        </div>
                        {suggestion.durationText && (
                          <div className="text-xs text-gray-500">{suggestion.durationText}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  onClick={handleOpenGYGSearch}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  🔍 Rechercher sur GetYourGuide
                </Button>
                
                <Button
                  onClick={handleOpenGYGCountry}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Globe className="w-4 h-4 mr-2" />
                  🇲🇦 Voir Maroc
                </Button>
              </div>

              <div className="text-xs text-gray-600 bg-blue-100 p-2 rounded">
                💡 <strong>Astuce:</strong> Utilisez cette recherche pour voir les prix et activités disponibles sur GetYourGuide, puis créez votre propre activité avec des prix compétitifs.
              </div>
            </div>
          </div>

          {/* Activity Form */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nom de l'Activité *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Excursion dans le désert d'Agafay"
                required
              />
            </div>

            <div>
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex: Marrakech"
              />
            </div>

            <div>
              <Label htmlFor="price">Prix (MAD)</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : '')}
                placeholder="Ex: 450"
              />
            </div>

            <div>
              <Label htmlFor="duration">Durée</Label>
              <Input
                id="duration"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="Ex: 8 heures"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de l'activité..."
                className="w-full p-2 border rounded-md"
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              Ajouter l'Activité
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}