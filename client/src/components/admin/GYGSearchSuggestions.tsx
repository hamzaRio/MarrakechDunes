import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface GYGActivity {
  id: string;
  title: string;
  gygPrice: number;
  suggestedPrice: number;
  currency: string;
  url: string;
}

interface GYGSearchSuggestionsProps {
  className?: string;
}

export default function GYGSearchSuggestions({ className = '' }: GYGSearchSuggestionsProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GYGActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search effect
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchActivities(query);
    }, 300); // 300ms debounce

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
      const response = await apiFetch(`/gyg/search?q=${encodeURIComponent(searchQuery)}`);
      setSuggestions(response);
      setShowSuggestions(true);
    } catch (err: any) {
      console.error('GetYourGuide search error:', err);
      setError(err.message || 'Failed to search GetYourGuide');
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setError(null);
    
    if (value.length >= 3) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (activity: GYGActivity) => {
    // Open GetYourGuide link in new tab
    window.open(activity.url, '_blank', 'noopener,noreferrer');
  };

  const formatPrice = (price: number, currency: string) => {
    return `${price} ${currency}`;
  };

  return (
    <div className={`relative ${className}`}>
      <Label htmlFor="gyg-search" className="text-sm font-medium text-gray-700 mb-2 block">
        Check GetYourGuide suggestions (for reference)
      </Label>
      
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            id="gyg-search"
            type="text"
            placeholder="Type activity name (e.g., 'Agadir', 'Essaouira surf')..."
            value={query}
            onChange={handleInputChange}
            className="pl-10 pr-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
            {error}
          </div>
        )}

        {/* Suggestions dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto"
          >
            {suggestions.map((activity) => (
              <Card
                key={activity.id}
                className="border-0 border-b border-gray-100 last:border-b-0 rounded-none hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleSuggestionClick(activity)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          GYG: {formatPrice(activity.gygPrice, activity.currency)}
                        </Badge>
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          Suggested: {formatPrice(activity.suggestedPrice, activity.currency)}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <ExternalLink className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-500">View</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* No results message */}
        {showSuggestions && suggestions.length === 0 && !isLoading && query.length >= 3 && !error && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
            <div className="text-center text-gray-500">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No activities found for "{query}"</p>
              <p className="text-xs text-gray-400 mt-1">Try different keywords</p>
            </div>
          </div>
        )}
      </div>

      {/* Help text */}
      <p className="text-xs text-gray-500 mt-2">
        💡 Search for activities to see GetYourGuide competitor pricing and our suggested competitive pricing
      </p>
    </div>
  );
}
