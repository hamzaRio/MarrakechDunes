import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Search, Loader2, Lock, Unlock, Star, Clock, Users } from 'lucide-react';
import { searchGetYourGuideActivities, formatGYGPrice, GYGActivity } from '@/lib/getyourguide-api';

// GYGActivity interface is now imported from getyourguide-api.ts

interface GYGSearchSuggestionsProps {
  className?: string;
  activityName?: string;
  onPriceSelect?: (price: number, activity: GYGActivity) => void;
  onTitleSelect?: (title: string, activity: GYGActivity) => void;
  isLocked?: boolean;
  onLockToggle?: () => void;
}

export default function GYGSearchSuggestions({ 
  className = '', 
  activityName = '', 
  onPriceSelect,
  onTitleSelect,
  isLocked = false,
  onLockToggle
}: GYGSearchSuggestionsProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GYGActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<GYGActivity | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Auto-search when activity name changes
  useEffect(() => {
    if (activityName && activityName.length >= 3) {
      setQuery(activityName);
      searchActivities(activityName);
    }
  }, [activityName]);

  // Debounced search effect
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchActivities(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
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
      const activities = await searchGetYourGuideActivities(searchQuery);
      setSuggestions(activities);
      setShowSuggestions(true);
    } catch (err: any) {
      console.error('[GYG] Live search error:', err);
      setError(err.message);
      setSuggestions([]);
      setShowSuggestions(true); // Show error in dropdown
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (activity: GYGActivity) => {
    setSelectedActivity(activity);
    setShowSuggestions(false);
    
    // Call the callbacks if provided
    if (onPriceSelect && activity.suggestedPrice != null) {
      onPriceSelect(activity.suggestedPrice, activity);
    }
    if (onTitleSelect) {
      onTitleSelect(activity.title, activity);
    }
    
    // Don't redirect - just populate the form fields
    console.log('[GYG] Selected activity for form:', activity.title);
  };

  const handleUnlock = () => {
    setSelectedActivity(null);
    if (onLockToggle) {
      onLockToggle();
    }
  };

  // formatPrice is now imported from getyourguide-api.ts

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="gyg-search" className="text-sm font-semibold text-gray-800">
            🇲🇦 GetYourGuide Morocco Search
          </Label>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Live Data
          </Badge>
        </div>
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
          id="gyg-search"
          type="text"
          placeholder="Search Morocco destinations (e.g., Agafay Desert, Ouzoud Waterfalls, Chefchaouen, Marrakech, Fes...)"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setShowSuggestions(true)}
          disabled={isLocked}
          className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:bg-gray-50 disabled:cursor-not-allowed shadow-sm transition-all duration-200"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
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
                  <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                    GYG: {formatGYGPrice(selectedActivity.gygPrice, selectedActivity.currency)}
                  </Badge>
                  {selectedActivity.suggestedPrice != null && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Suggested: {formatGYGPrice(selectedActivity.suggestedPrice, selectedActivity.currency)}
                    </Badge>
                  )}
                </div>
                {selectedActivity.rating && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                    <Star className="h-3 w-3 fill-current" />
                    {selectedActivity.rating} ({selectedActivity.reviewCount} reviews)
                  </div>
                )}
                {selectedActivity.duration && (
                  <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                    <Clock className="h-3 w-3" />
                    {selectedActivity.duration}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions dropdown */}
      {showSuggestions && (suggestions.length > 0 || error || (!isLoading && query.length >= 3)) && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-xl max-h-80 overflow-y-auto backdrop-blur-sm"
        >
          {error ? (
            <div className="p-4 text-center text-red-600">
              <p className="text-sm">{error}</p>
              <p className="text-xs text-gray-500 mt-1">Try: Day Trip, Tour, or Experience near {query}</p>
            </div>
          ) : suggestions.length === 0 && !isLoading ? (
            <div className="p-4 text-center text-gray-600">
              <p className="text-sm">No Morocco activity found on GetYourGuide</p>
              <p className="text-xs text-gray-500 mt-1">Try variations like "Tour", "Day Trip", or "Experience"</p>
              <p className="text-xs text-gray-400 mt-1">Supports Morocco destinations: Marrakech, Rabat, Casablanca, Tanger, Meknes, Chefchaouen, Essaouira, Agadir, Merzouga, Ouarzazate, Fes, Agafay...</p>
            </div>
          ) : (
            suggestions.map((activity) => (
              <Card
                key={activity.id}
                className="border-0 border-b border-gray-100 last:border-b-0 rounded-none hover:bg-blue-50 cursor-pointer transition-all duration-200 hover:shadow-md"
                onClick={() => handleSuggestionClick(activity)}
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
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {activity.title}
                        </h4>
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                          🇲🇦 Morocco
                        </span>
                      </div>
                      {activity.description && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          GYG: {formatGYGPrice(activity.gygPrice, activity.currency)}
                        </Badge>
                        {activity.suggestedPrice != null && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            Suggested: {formatGYGPrice(activity.suggestedPrice, activity.currency)}
                          </Badge>
                        )}
                        {activity.location && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            📍 {activity.location}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        {activity.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 fill-current text-yellow-400" />
                            {activity.rating} ({activity.reviewCount})
                          </div>
                        )}
                        {activity.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.duration}
                          </div>
                        )}
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
      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700 mb-2">
          💡 Morocco live data from GetYourGuide public site with MongoDB caching — for reference only. Click suggestions to auto-fill and lock fields.
        </p>
        <div className="flex items-center gap-2">
          <a 
            href={`https://www.getyourguide.com/s/?q=${encodeURIComponent(query || 'morocco')}&searchSource=3`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink className="h-3 w-3" />
            Search on GetYourGuide.com
          </a>
        </div>
      </div>
    </div>
  );
}
