import { useState, KeyboardEvent } from 'react';
import { ExternalLink, Globe, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface GYGReferenceToolProps {
  onActivitySelect?: (activity: any) => void;
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
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    // Load recent searches from localStorage
    try {
      const stored = localStorage.getItem('gyg-recent-searches');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Generate GetYourGuide search URL
  const getGYGSearchUrl = (query: string) => {
    const moroccoQuery = query.trim() || 'morocco activities';
    return `https://www.getyourguide.com/s/?q=${encodeURIComponent(moroccoQuery)}&searchSource=3`;
  };

  // Open GetYourGuide website with search
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
      handleGYGSearch();
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
            onClick={() => handleGYGSearch()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 h-11"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Rechercher
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
              onClick={() => handleGYGSearch(item.query)}
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
                onClick={() => handleGYGSearch(search)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 text-sm text-gray-700 hover:text-blue-700 transition-colors"
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info Tip */}
      <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          💡 <strong>Astuce:</strong> Utilisez cette recherche pour voir les prix actuels sur GetYourGuide, puis ajustez vos propres prix pour rester compétitif sur le marché.
        </p>
      </div>
    </div>
  );
}
