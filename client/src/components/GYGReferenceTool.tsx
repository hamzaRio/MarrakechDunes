import { useState, KeyboardEvent } from 'react';
import { ExternalLink, Globe, Search, Sparkles, Loader2, Star, MapPin, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/use-auth';

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
  sourceType?: 'getyourguide-scraped' | 'curated-database' | 'fallback';
  verified?: boolean;
}

interface MyActivityWithGYG {
  myActivity: {
    id: string;
    name: string;
    price: string | number;
    category?: string;
  };
  gygMatches: GYGActivityResult[];
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
  const { user } = useAuth();
  const canForceLiveRefresh = user?.role === 'superadmin';
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState<string>('');
  const [forceLiveScrape, setForceLiveScrape] = useState(false);
  const [searchMode, setSearchMode] = useState<'gyg' | 'my-activities'>('gyg');
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    // Load recent searches from localStorage
    try {
      const stored = localStorage.getItem('gyg-recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Normal staff searches are cache-first. Live refresh is a Superadmin action.
  const { data: searchResults, isLoading, error } = useQuery<GYGActivityResult[]>({
    queryKey: ['gyg-search', activeSearch, searchMode, forceLiveScrape],
    enabled: activeSearch.length >= 3 && searchMode === 'gyg',
    queryFn: async () => {
      const response = await api.get('/gyg/search', {
        params: {
          q: activeSearch,
          forceRefresh: forceLiveScrape && canForceLiveRefresh ? 'true' : 'false',
          useMyActivities: 'false'
        }
      });
      return response.data || [];
    },
    staleTime: 0, // Don't cache - always get fresh results
  });

  // Fetch activities based on YOUR database activities
  const { data: myActivitiesResults, isLoading: isLoadingMyActivities, error: errorMyActivities } = useQuery<MyActivityWithGYG[]>({
    queryKey: ['gyg-search-my-activities', activeSearch, forceLiveScrape],
    enabled: searchMode === 'my-activities' && canForceLiveRefresh,
    queryFn: async () => {
      const response = await api.get('/gyg/search', {
        params: {
          q: activeSearch || 'all',
          forceRefresh: forceLiveScrape ? 'true' : 'false',
          useMyActivities: 'true'
        }
      });
      return response.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  // Generate GetYourGuide search URL
  const getGYGSearchUrl = (query: string) => {
    const moroccoQuery = query.trim() || 'morocco activities';
    return `https://www.getyourguide.com/s/?q=${encodeURIComponent(moroccoQuery)}&searchSource=3`;
  };

  // Fetch activities from GetYourGuide (live search in dashboard)
  const handleFetchActivities = (query?: string, useLiveScrape: boolean = false, redirectToWebsite: boolean = false) => {
    const searchTerm = query || searchQuery.trim();
    if (!searchTerm || searchTerm.length < 3) {
      return;
    }
    
    // If redirect is requested, open GetYourGuide immediately
    if (redirectToWebsite) {
      const gygUrl = getGYGSearchUrl(searchTerm);
      window.open(gygUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    
    setActiveSearch(searchTerm);
    setForceLiveScrape(useLiveScrape && canForceLiveRefresh);
    
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

        {/* Search Mode Toggle */}
        <div className="flex gap-2 mb-4 p-2 bg-white rounded-lg border border-gray-200">
          <button
            onClick={() => {
              setSearchMode('gyg');
              setActiveSearch('');
              setSearchQuery('');
            }}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              searchMode === 'gyg'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            🔍 Recherche GetYourGuide
          </button>
          {canForceLiveRefresh ? (
            <button
              onClick={() => {
                setSearchMode('my-activities');
                setActiveSearch('all');
              }}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                searchMode === 'my-activities'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📋 Mes Activités vs GetYourGuide
            </button>
          ) : null}
        </div>

        {/* Search Input */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                searchMode === 'my-activities'
                  ? "Rechercher une activité spécifique (ou laisser vide pour toutes)..."
                  : "Ex: Hot Air Balloon, Desert Tour, Cooking Class..."
              }
              className="pl-10 h-11 bg-white"
              disabled={searchMode === 'my-activities' && activeSearch === 'all'}
            />
          </div>
          {searchMode === 'gyg' && (
            <>
              <Button
                onClick={() => handleFetchActivities()}
                disabled={!searchQuery.trim() || searchQuery.trim().length < 3}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-11"
              >
                {isLoading && activeSearch === searchQuery ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scraping GetYourGuide...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Chercher ici
                  </>
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
            </>
          )}
          {searchMode === 'my-activities' && (
            <Button
              onClick={() => {
                if (searchQuery.trim().length >= 3) {
                  setActiveSearch(searchQuery.trim());
                } else {
                  setActiveSearch('all');
                }
              }}
              disabled={searchMode === 'my-activities' && activeSearch === 'all' && !searchQuery.trim()}
              className="bg-green-600 hover:bg-green-700 text-white px-6 h-11"
            >
              {isLoadingMyActivities ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Recherche...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Comparer
                </>
              )}
            </Button>
          )}
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

      {/* Search Results - Regular GYG Search */}
      {activeSearch && searchMode === 'gyg' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Résultats GetYourGuide pour "{activeSearch}"
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
                Scraping en temps réel depuis GetYourGuide... Cela peut prendre 5-10 secondes...
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-semibold mb-1">Erreur de recherche</p>
              <p className="text-sm">
                Impossible de récupérer les activités. Vérifiez le terme de recherche ou réessayez plus tard.
              </p>
            </div>
          )}

          {!isLoading && !error && searchResults && searchResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">Aucun résultat trouvé pour "{activeSearch}"</p>
              <p className="text-sm">
                Essayez un autre terme de recherche.
              </p>
            </div>
          )}

          {!isLoading && !error && searchResults && searchResults.length > 0 && (
            <>
              <div className="mb-4 flex items-center justify-between bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Cliquez sur une carte pour voir sur GetYourGuide
                  </span>
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
                          <Badge className={activity.verified ? 'bg-blue-600 text-white' : 'bg-slate-600 text-white'}>
                            {activity.verified ? 'GetYourGuide vérifié' : 'Référence non vérifiée'}
                          </Badge>
                        </div>
                      </div>
                    )}
                    <CardContent className="p-4">
                      <h5 className="font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
                        {activity.title}
                      </h5>
                      <p className={`mb-2 text-xs ${activity.verified ? 'text-green-700' : 'text-slate-500'}`}>
                        {activity.verified ? 'Source GetYourGuide vérifiée en direct' : 'Référence interne — provenance non vérifiée'}
                      </p>
                      
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
                              Référence indicative: {activity.suggestedPrice} {activity.currency}
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
            </>
          )}
        </div>
      )}

      {/* Search Results - My Activities vs GetYourGuide */}
      {searchMode === 'my-activities' && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-800">
              Comparaison: Mes Activités vs GetYourGuide
            </h4>
            {myActivitiesResults && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                {myActivitiesResults.length} activité{myActivitiesResults.length > 1 ? 's' : ''} avec correspondances
              </Badge>
            )}
          </div>

          {isLoadingMyActivities && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-green-600 mr-3" />
              <span className="text-gray-600">
                Recherche des correspondances GetYourGuide pour vos activités...
              </span>
            </div>
          )}

          {errorMyActivities && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              <p className="font-semibold mb-1">Erreur de recherche</p>
              <p className="text-sm">
                Impossible de récupérer vos activités ou les correspondances GetYourGuide.
              </p>
            </div>
          )}

          {!isLoadingMyActivities && !errorMyActivities && myActivitiesResults && myActivitiesResults.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <p className="mb-2">Aucune correspondance trouvée sur GetYourGuide</p>
              <p className="text-sm">
                Vos activités ne correspondent à aucune activité trouvée sur GetYourGuide pour le moment.
              </p>
            </div>
          )}

          {!isLoadingMyActivities && !errorMyActivities && myActivitiesResults && myActivitiesResults.length > 0 && (
            <div className="space-y-6">
              {myActivitiesResults.map((item) => (
                <Card key={item.myActivity.id} className="border-2 border-green-200">
                  <CardContent className="p-6">
                    {/* Your Activity */}
                    <div className="mb-4 pb-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-lg font-bold text-gray-900 mb-1">
                            {item.myActivity.name}
                          </h5>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {item.myActivity.category && (
                              <Badge variant="outline">{item.myActivity.category}</Badge>
                            )}
                            <span className="font-semibold text-green-600">
                              Votre prix: {item.myActivity.price} MAD
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* GetYourGuide Matches */}
                    <div>
                      <h6 className="text-sm font-semibold text-gray-700 mb-3">
                        Correspondances GetYourGuide ({item.gygMatches.length})
                      </h6>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {item.gygMatches.map((gygActivity) => {
                          const myPrice = Number(item.myActivity.price);
                          const gygPrice = gygActivity.gygPrice;
                          const priceDiff = myPrice - gygPrice;
                          const priceDiffPercent = gygPrice > 0 ? Math.round((priceDiff / gygPrice) * 100) : 0;

                          return (
                            <Card
                              key={gygActivity.id}
                              className="hover:shadow-md transition-shadow cursor-pointer overflow-hidden border-blue-200"
                              onClick={() => window.open(gygActivity.link, '_blank', 'noopener,noreferrer')}
                            >
                              {gygActivity.image && (
                                <div className="relative h-32 bg-gray-200 overflow-hidden">
                                  <img
                                    src={gygActivity.image}
                                    alt={gygActivity.title}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                  <Badge className="absolute top-2 right-2 bg-blue-600 text-white">
                                    GetYourGuide
                                  </Badge>
                                </div>
                              )}
                              <CardContent className="p-4">
                                <h6 className="font-semibold text-sm text-gray-900 mb-2 line-clamp-2 h-10">
                                  {gygActivity.title}
                                </h6>
                                
                                <div className="space-y-2 mb-3">
                                  {gygActivity.rating && (
                                    <div className="flex items-center gap-1 text-xs text-gray-600">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      <span>{gygActivity.rating}</span>
                                      {gygActivity.reviewCount && (
                                        <span>({gygActivity.reviewCount.toLocaleString()})</span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div className="pt-3 border-t border-gray-200">
                                  <div className="flex items-baseline gap-2 mb-1">
                                    <span className="text-xl font-bold text-blue-600">
                                      {gygPrice} {gygActivity.currency}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="text-xs">
                                      {priceDiff !== 0 && (
                                        <span className={`font-medium ${
                                          priceDiff > 0 ? 'text-red-600' : 'text-green-600'
                                        }`}>
                                          {priceDiff > 0 ? '+' : ''}{priceDiff} MAD ({priceDiffPercent > 0 ? '+' : ''}{priceDiffPercent}%)
                                        </span>
                                      )}
                                      {priceDiff === 0 && (
                                        <span className="text-gray-500">Même prix</span>
                                      )}
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(gygActivity.link, '_blank', 'noopener,noreferrer');
                                      }}
                                      className="h-7 text-xs border-blue-300 text-blue-600 hover:bg-blue-50"
                                    >
                                      Voir
                                    </Button>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
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
          💡 <strong>Astuce:</strong> Les recherches normales utilisent les références disponibles. Le rafraîchissement en direct est réservé aux Superadmins.
        </p>
      </div>
    </div>
  );
}
