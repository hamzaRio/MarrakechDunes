import { useState, KeyboardEvent } from 'react';
import { ExternalLink, Globe, Search, Sparkles, Loader2, Star, MapPin, Clock, DollarSign } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface GYGReferenceToolProps {
  onActivitySelect?: (activity: any) => void;
}

interface GYGActivityResult {
  id: string;
  title: string;
  gygPrice: number;
  suggestedPrice?: number;
  currency: string;
  image?: string | null;
  link: string;
  description?: string | null;
  duration?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  location?: string | null;
  category?: string | null;
}

// Popular Morocco activities for quick search
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
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [forceLiveScrape, setForceLiveScrape] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    // Load recent searches from localStorage
    try {
      const stored = localStorage.getItem('gyg-recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Fetch activities from GetYourGuide API
  const { data: searchResults, isLoading, error } = useQuery<GYGActivityResult[]>({
    queryKey: ['gyg-search', activeSearch, forceLiveScrape],
    enabled: activeSearch.length >= 3,
    queryFn: async () => {
      const response = await api.get('/gyg/search', {
        params: {
          q: activeSearch,
          forceRefresh: forceLiveScrape ? 'true' : 'false'
        }
      });
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Generate GetYourGuide search URL
  const getGYGSearchUrl = (query: string) => {
    const moroccoQuery = query.trim() || 'morocco activities';
    return `https://www.getyourguide.com/s/?q=${encodeURIComponent(moroccoQuery)}&searchSource=3`;
  };

  // Fetch activities from GetYourGuide (live search in dashboard)
  const handleFetchActivities = (query?: string, useLiveScrape: boolean = false) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm || searchTerm.length < 3) {
      return;
    }
    
    setActiveSearch(searchTerm);
    setForceLiveScrape(useLiveScrape);
    
    // Save to recent searches
    if (searchTerm && searchTerm !== 'morocco activities') {
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('gyg-recent-searches', JSON.stringify(updated));
    }
  };

  // Open GetYourGuide website with search (external link)
  const handleGYGSearch = (query?: string) => {
    const searchTerm = query || searchQuery.trim() || 'morocco activities';
    const gygUrl = getGYGSearchUrl(searchTerm);
    console.log('[GYG-REF] Opening GetYourGuide with search:', searchTerm);
    
    // Save to recent searches
    if (searchTerm && searchTerm !== 'morocco activities') {
      const updated = [searchTerm, ...recentSearches.filter(s => s !== searchTerm)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem('gyg-recent-searches', JSON.stringify(updated));
    }
    
    window.open(gygUrl, '_blank', 'noopener,noreferrer');
    
    if (onActivitySelect) {
      onActivitySelect({ query: searchTerm, url: gygUrl });
    }
  };

  // Open GetYourGuide Morocco page
  const handleGYGMorocco = () => {
    const gygUrl = 'https://www.getyourguide.com/morocco-l191/';
    console.log('[GYG-REF] Opening GetYourGuide Morocco page');
    window.open(gygUrl, '_blank', 'noopener,noreferrer');
  };

  // Handle Enter key press
  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleFetchActivities();
    }
  };

  // Clear recent searches
  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('gyg-recent-searches');
  };

  return (
    <div className="space-y-6">
      {/* Main Search Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Search className="w-6 h-6 text-blue-600" />
          <h3 className="text-xl font-semibold text-blue-800">Rechercher sur GetYourGuide</h3>
        </div>
        
        <p className="text-sm text-blue-700 mb-6">
          Recherchez des activités sur GetYourGuide pour comparer les prix et obtenir des idées de tarification pour vos propres activités.
        </p>

        {/* Search Input */}
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
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Recherche...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Chercher ici
              </>
            )}
          </Button>
          <Button
            onClick={() => handleFetchActivities(undefined, true)}
            disabled={!searchQuery.trim() || searchQuery.trim().length < 3}
            variant="outline"
            className="bg-purple-50 hover:bg-purple-100 border-purple-300 text-purple-700 px-4 h-11"
            title="Scraping en temps réel depuis GetYourGuide (plus lent mais plus précis)"
          >
            🔄 Live
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

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleGYGMorocco}
            variant="outline"
            className="bg-white hover:bg-green-50 border-green-300"
          >
            <Globe className="w-4 h-4 mr-2" />
            🇲🇦 Voir Maroc
          </Button>
          <Button
            onClick={() => handleGYGSearch('morocco activities')}
            variant="outline"
            className="bg-white hover:bg-indigo-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Toutes les activités
          </Button>
        </div>
      </div>

      {/* Popular Searches */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          Recherches populaires
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {POPULAR_SEARCHES.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                setSearchQuery(item.query);
                handleFetchActivities(item.query);
              }}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
              title={`Rechercher "${item.query}" sur GetYourGuide`}
            >
              <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                {item.icon}
              </span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                {item.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Searches */}
      {recentSearches.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">Recherches récentes</h4>
            <Button
              onClick={clearRecentSearches}
              variant="ghost"
              size="sm"
              className="text-gray-500 hover:text-gray-700"
            >
              Effacer
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => {
                  setSearchQuery(search);
                  handleFetchActivities(search);
                }}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {activeSearch && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Résultats pour "{activeSearch}"
            </h4>
            {searchResults && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {searchResults.length} activité{searchResults.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
              <span className="text-gray-600">
                {forceLiveScrape ? 'Scraping en temps réel depuis GetYourGuide...' : 'Recherche en cours...'}
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-semibold mb-1">Erreur de recherche</p>
              <p className="text-sm">
                Impossible de récupérer les activités. Essayez de cliquer sur "🔄 Live" pour forcer le scraping en temps réel.
              </p>
            </div>
          )}

          {!isLoading && !error && searchResults && searchResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">Aucun résultat trouvé pour "{activeSearch}"</p>
              <p className="text-sm">
                Essayez un autre terme de recherche ou cliquez sur "🔄 Live" pour forcer le scraping en temps réel.
              </p>
            </div>
          )}

          {!isLoading && !error && searchResults && searchResults.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {searchResults.map((activity) => (
                <Card
                  key={activity.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer overflow-hidden"
                  onClick={() => window.open(activity.link, '_blank', 'noopener,noreferrer')}
                >
                  {activity.image && (
                    <div className="relative h-40 bg-gray-200 overflow-hidden">
                      <img
                        src={activity.image}
                        alt={activity.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-blue-600 text-white">GetYourGuide</Badge>
                      </div>
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h5 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
                      {activity.title}
                    </h5>
                    
                    <div className="space-y-2 mb-3">
                      {activity.rating && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                          <span className="font-medium">{activity.rating}</span>
                          {activity.reviewCount && (
                            <span className="text-gray-500">({activity.reviewCount.toLocaleString()} avis)</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        {activity.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{activity.duration}</span>
                          </div>
                        )}
                        {activity.location && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{activity.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {activity.gygPrice} {activity.currency}
                          </span>
                          <span className="text-xs text-gray-500">per person</span>
                        </div>
                        {activity.suggestedPrice && (
                          <p className="text-xs text-gray-500 mt-1">
                            Prix suggéré: {activity.suggestedPrice} {activity.currency}
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(activity.link, '_blank', 'noopener,noreferrer');
                        }}
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
          )}
        </div>
      )}

      {/* Info Tip */}
      <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Astuce:</strong> Utilisez "Chercher ici" pour voir les résultats directement dans le tableau de bord, ou "🔄 Live" pour un scraping en temps réel depuis GetYourGuide (plus lent mais plus précis).
        </p>
      </div>
    </div>
  );
}
