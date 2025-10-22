import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from '@/lib/api';
import { Search, ExternalLink, Globe } from 'lucide-react';

interface GYGActivity {
  title: string;
  city: string;
  price: number;
  currency: string;
  durationText: string;
  provider: string;
  providerUrl: string;
}

interface GYGSearchBarProps {
  onActivitySelect?: (activity: GYGActivity) => void;
}

export default function GYGSearchBar({ onActivitySelect }: GYGSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch real GYG data
  const { data: gygActivities = [], isLoading, isError } = useQuery({
    queryKey: ['gyg-search', debouncedQuery],
    queryFn: async () => {
      if (debouncedQuery.trim().length < 2) return [];
      
      console.log('[GYG-SEARCH] Searching for:', debouncedQuery);
      
      const response = await axios.get('/competitors/suggest', {
        params: {
          query: debouncedQuery,
          city: 'Morocco',
          provider: 'gyg',
          live: false // Use reference data instead of live API
        }
      });
      
      console.log('[GYG-SEARCH] Response:', response.data);
      return response.data.items || [];
    },
    enabled: debouncedQuery.trim().length >= 2,
    staleTime: 30000, // Cache for 30 seconds
  });

  const handleActivityClick = (activity: GYGActivity) => {
    if (onActivitySelect) {
      onActivitySelect(activity);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Globe className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">Recherche GetYourGuide</h3>
      </div>
      
      <p className="text-sm text-blue-700 mb-4">
        Recherchez des activités sur GetYourGuide pour obtenir des idées de prix et de contenu (référence uniquement)
      </p>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher des activités sur GetYourGuide..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {searchQuery && (
          <div className="text-sm text-gray-600">
            {isLoading ? 'Recherche en cours...' : 
             isError ? 'Erreur de recherche' :
             gygActivities.length > 0 ? `${gygActivities.length} activités trouvées sur GetYourGuide` :
             'Aucune activité trouvée'}
          </div>
        )}

        {gygActivities.length > 0 && (
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg bg-white">
            {gygActivities.map((activity, index) => (
              <div
                key={`${activity.provider}-${activity.title}-${index}`}
                className="p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                onClick={() => handleActivityClick(activity)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{activity.title}</h4>
                    <p className="text-sm text-gray-600">{activity.city} • {activity.durationText}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-lg font-bold text-green-600">{activity.price} {activity.currency}</span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {activity.provider}
                      </span>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                </div>
                {activity.providerUrl && (
                  <a
                    href={activity.providerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:text-blue-800 mt-1 block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Voir sur GetYourGuide →
                  </a>
                )}
              </div>
            ))}
          </div>
        )}

        {searchQuery && gygActivities.length === 0 && !isLoading && !isError && (
          <div className="text-center py-4 text-gray-500">
            <Globe className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p>Aucune activité trouvée sur GetYourGuide</p>
            <p className="text-xs">Essayez avec d'autres mots-clés</p>
          </div>
        )}
      </div>
    </div>
  );
}
