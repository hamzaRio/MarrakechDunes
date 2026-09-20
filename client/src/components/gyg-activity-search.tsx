import React, { useState } from 'react';
import { Search, MapPin, Clock, Users, Star, ExternalLink, Wifi, WifiOff } from 'lucide-react';
import { searchGetYourGuideActivities, getGetYourGuideAPIStatus } from '../lib/getyourguide-api';

interface GYGActivity {
  id: string;
  title: string;
  location: string;
  duration: string;
  price: {
    amount: number;
    currency: string;
    originalAmount?: number;
  };
  rating: number;
  reviewCount: number;
  imageUrl: string;
  url: string;
  description: string;
  highlights: string[];
}

interface GYGSearchProps {
  onActivitySelect?: (activity: GYGActivity) => void;
}

export const GYGActivitySearch: React.FC<GYGSearchProps> = ({ onActivitySelect }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activities, setActivities] = useState<GYGActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiStatus, setApiStatus] = useState(getGetYourGuideAPIStatus());

  // API status indicator

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Search using real GetYourGuide API (with mock fallback)
      const result = await searchGetYourGuideActivities({
        q: searchTerm,
        limit: 12,
        location: 'Marrakech, Morocco'
      });

      setActivities(result.activities);
      setApiStatus(getGetYourGuideAPIStatus());
      
      // Browser-side provider access is intentionally disabled.
      if (!apiStatus.available) {
        console.warn('ℹ️ Les comparaisons GetYourGuide passent par l’API staff protégée.');
      }
    } catch (err) {
      setError('Échec de la recherche. Veuillez réessayer.');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: GYGActivity) => {
    if (onActivitySelect) {
      onActivitySelect(activity);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Search className="mr-2 text-blue-600" />
            Recherche d'Activités GetYourGuide
          </h2>
          <div className="flex items-center text-sm">
            {apiStatus.available ? (
              <div className="flex items-center text-green-600">
                <Wifi className="h-4 w-4 mr-1" />
                Live API
              </div>
            ) : (
              <div className="flex items-center text-orange-600">
                <WifiOff className="h-4 w-4 mr-1" />
                API staff protégée
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher des activités marocaines (ex: 'tour du désert', 'montagnes de l'Atlas', 'cours de cuisine', 'tour de ville', 'hammam')"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="mr-2 h-5 w-5" />
                  Rechercher
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {activities.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              {activities.length} activité{activities.length !== 1 ? 's' : ''} trouvée{activities.length !== 1 ? 's' : ''}
            </h3>
            
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activities.map((activity) => (
                <div
                  key={activity.id}
                  className="bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleActivityClick(activity)}
                >
                  <div className="aspect-w-16 aspect-h-9">
                    <img
                      src={activity.imageUrl}
                      alt={activity.title}
                      className="w-full h-48 object-cover rounded-t-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder-activity.jpg';
                      }}
                    />
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                      {activity.title}
                    </h4>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <MapPin className="h-4 w-4 mr-1" />
                      {activity.location}
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-2">
                      <Clock className="h-4 w-4 mr-1" />
                      {activity.duration}
                    </div>
                    
                    <div className="flex items-center text-gray-600 text-sm mb-3">
                      <Users className="h-4 w-4 mr-1" />
                      <Star className="h-4 w-4 mr-1 text-yellow-500" />
                      {activity.rating} ({activity.reviewCount} reviews)
                    </div>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl font-bold text-green-600">
                          ${activity.price.amount}
                        </span>
                        {activity.price.originalAmount && (
                          <span className="ml-2 text-sm text-gray-500 line-through">
                            ${activity.price.originalAmount}
                          </span>
                        )}
                        <span className="ml-1 text-sm text-gray-600">
                          {activity.price.currency}
                        </span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {activity.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {activity.highlights.slice(0, 3).map((highlight, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {highlight}
                        </span>
                      ))}
                    </div>
                    
                    <a
                      href={activity.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      onClick={(e) => e.stopPropagation()}
                    >
                      View on GetYourGuide
                      <ExternalLink className="ml-1 h-4 w-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activities.length === 0 && !loading && searchTerm && (
          <div className="text-center py-8 text-gray-500">
            <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No activities found for "{searchTerm}"</p>
            <p className="text-sm">Try different search terms like "desert", "atlas", "cooking", "city tour", "hammam", or "waterfalls"</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GYGActivitySearch;
