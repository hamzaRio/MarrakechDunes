import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, Loader2, Lock, Unlock, Star, Clock, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface GYGLiveActivity {
  id: string;
  title: string;
  price: number;
  currency: string;
  image?: string;
  link: string;
}

interface GYGLiveSearchProps {
  className?: string;
  onActivitySelect?: (activity: GYGLiveActivity) => void;
  onPriceSelect?: (price: number, title: string) => void;
  isLocked?: boolean;
  onLockToggle?: () => void;
}

export default function GYGLiveSearch({ 
  className = '', 
  onActivitySelect,
  onPriceSelect,
  isLocked = false,
  onLockToggle
}: GYGLiveSearchProps) {
  const [query, setQuery] = useState('');
  const [activities, setActivities] = useState<GYGLiveActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<GYGLiveActivity | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    if (query.length < 3) {
      setActivities([]);
      setShowResults(false);
      setError(null);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchActivities(query);
    }, 500); // 500ms debounce as requested

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        resultsRef.current &&
        !resultsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchActivities = async (searchQuery: string) => {
    if (searchQuery.length < 3) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('[GYG-LIVE] Searching for:', searchQuery);
      const response = await apiFetch(`/getyourguide/search?q=${encodeURIComponent(searchQuery)}`);
      setActivities(response);
      setShowResults(true);
      console.log('[GYG-LIVE] Found activities:', response.length);
    } catch (err: any) {
      console.error('[GYG-LIVE] Search error:', err);
      const errorMessage = err.response?.data?.error || err.message || 'Failed to search GetYourGuide';
      setError(errorMessage);
      setActivities([]);
      setShowResults(true); // Show error in dropdown
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length >= 3) {
      setShowResults(true);
    } else {
      setShowResults(false);
    }
  };

  const handleActivityClick = (activity: GYGLiveActivity) => {
    setSelectedActivity(activity);
    setShowResults(false);
    
    // Call the callbacks if provided
    if (onActivitySelect) {
      onActivitySelect(activity);
    }
    if (onPriceSelect) {
      onPriceSelect(activity.price, activity.title);
    }
    
    // Open GetYourGuide link in new tab
    window.open(activity.link, '_blank', 'noopener,noreferrer');
  };

  const handleUnlock = () => {
    setSelectedActivity(null);
    if (onLockToggle) {
      onLockToggle();
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price} ${currency}`;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <Label htmlFor="gyg-live-search" className="text-sm font-medium text-gray-700">
          🏆 GetYourGuide Live Search
        </Label>
        {selectedActivity && (
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
              <Lock className="h-3 w-3 mr-1" />
              Data Locked
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={handleUnlock}
              className="text-xs h-6 px-2"
            >
              <Unlock className="h-3 w-3 mr-1" />
              Unlock
            </Button>
          </div>
        )}
      </div>
      
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          id="gyg-live-search"
          type="text"
          placeholder="Search live GetYourGuide activities (e.g., Agadir, Essaouira surf, Fes Medina...)"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowResults(true)}
          disabled={isLocked}
          className="pl-10 pr-4 py-2 border-2 border-gray-200 rounded-lg focus:border-moroccan-blue focus:ring-2 focus:ring-moroccan-blue/20 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200 flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Selected Activity Display */}
      {selectedActivity && (
        <Card className="mt-3 bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              {selectedActivity.image && (
                <img
                  src={selectedActivity.image}
                  alt={selectedActivity.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-medium text-green-800">{selectedActivity.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    GYG Price: {formatPrice(selectedActivity.price, selectedActivity.currency)}
                  </Badge>
                </div>
                <p className="text-xs text-green-600 mt-1">
                  Data fetched from GetYourGuide Partner API
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results dropdown */}
      {showResults && (activities.length > 0 || error) && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto"
        >
          {error ? (
            <div className="p-4 text-center text-red-600">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-red-400" />
              <p className="text-sm font-medium">{error}</p>
              <p className="text-xs text-gray-500 mt-1">Try different keywords or check your API configuration</p>
            </div>
          ) : activities.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm font-medium">No match found</p>
              <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
            </div>
          ) : (
            activities.map((activity) => (
              <Card
                key={activity.id}
                className="border-0 border-b border-gray-100 last:border-b-0 rounded-none hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleActivityClick(activity)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {activity.image && (
                      <img
                        src={activity.image}
                        alt={activity.title}
                        className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          {formatPrice(activity.price, activity.currency)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-gray-400">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Help text */}
      <p className="text-xs text-gray-500 mt-2">
        💡 Live data from GetYourGuide Partner API — click suggestions to auto-fill and lock fields
      </p>
    </div>
  );
}
