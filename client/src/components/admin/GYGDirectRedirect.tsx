import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Search, MapPin, Clock, Star } from 'lucide-react';

interface GYGDirectRedirectProps {
  className?: string;
  activityName?: string;
  onPriceSelect?: (price: number, activity: any) => void;
  onTitleSelect?: (title: string, activity: any) => void;
}

export default function GYGDirectRedirect({ 
  className = '', 
  activityName = '',
  onPriceSelect,
  onTitleSelect
}: GYGDirectRedirectProps) {
  const [query, setQuery] = useState(activityName);

  // Generate GetYourGuide search URL with Morocco focus
  const getGYGSearchUrl = (searchQuery: string) => {
    const moroccoQuery = `${searchQuery} morocco`;
    return `https://www.getyourguide.com/s/?q=${encodeURIComponent(moroccoQuery)}&searchSource=3&location=Morocco`;
  };

  // Handle search redirect
  const handleSearchRedirect = () => {
    try {
      if (query.trim()) {
        const searchUrl = getGYGSearchUrl(query);
        console.log('🔗 Redirecting to GetYourGuide:', searchUrl);
        console.log('📝 Query:', query);
        // Use direct navigation instead of pop-up
        window.location.href = searchUrl;
      } else {
        // If no query, redirect to general Morocco search
        const generalUrl = 'https://www.getyourguide.com/s/?q=morocco&searchSource=3&location=Morocco';
        console.log('🇲🇦 Redirecting to general Morocco search:', generalUrl);
        // Use direct navigation instead of pop-up
        window.location.href = generalUrl;
      }
    } catch (error) {
      console.error('❌ Error opening GetYourGuide:', error);
      alert('Error opening GetYourGuide. Please check console for details.');
    }
  };

  // Handle Enter key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchRedirect();
    }
  };

  // Popular Morocco activities for quick access
  const popularActivities = [
    {
      title: 'Marrakech City Tour',
      price: 'From 180 MAD',
      duration: '4 hours',
      rating: '4.5',
      searchTerm: 'Marrakech city tour'
    },
    {
      title: 'Agafay Desert Day Trip',
      price: 'From 520 MAD',
      duration: '8 hours',
      rating: '4.8',
      searchTerm: 'Agafay Desert'
    },
    {
      title: 'Ouzoud Waterfalls',
      price: 'From 350 MAD',
      duration: '10 hours',
      rating: '4.6',
      searchTerm: 'Ouzoud Waterfalls'
    },
    {
      title: 'Chefchaouen Day Trip',
      price: 'From 400 MAD',
      duration: '12 hours',
      rating: '4.8',
      searchTerm: 'Chefchaouen'
    },
    {
      title: 'Atlas Mountains Trek',
      price: 'From 450 MAD',
      duration: '8 hours',
      rating: '4.7',
      searchTerm: 'Atlas Mountains'
    },
    {
      title: 'Hammam & Massage',
      price: 'From 300 MAD',
      duration: '2 hours',
      rating: '4.9',
      searchTerm: 'Hammam massage Marrakech'
    }
  ];

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Label htmlFor="gyg-search" className="text-sm font-semibold text-gray-800">
            🇲🇦 GetYourGuide Morocco Search
          </Label>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            Direct Search
          </Badge>
        </div>
        <Button
          onClick={handleSearchRedirect}
          size="sm"
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <ExternalLink className="h-3 w-3 mr-1" />
          Go to GetYourGuide
        </Button>
      </div>
      
      <div className="space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            id="gyg-search"
            type="text"
            placeholder="Search Morocco activities on GetYourGuide..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-sm transition-all duration-200"
          />
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearchRedirect}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {query.trim() ? `Search "${query}" on GetYourGuide.com` : 'Search Morocco on GetYourGuide.com'}
        </Button>
      </div>

      {/* Popular Activities */}
      <div className="mt-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Popular Morocco Activities</h4>
        <div className="grid grid-cols-1 gap-2">
          {popularActivities.map((activity, index) => (
            <div
              key={index}
              className="p-3 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg cursor-pointer transition-all duration-200"
              onClick={() => {
                setQuery(activity.searchTerm);
                const searchUrl = getGYGSearchUrl(activity.searchTerm);
                window.open(searchUrl, '_blank', 'noopener,noreferrer');
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h5 className="text-sm font-medium text-gray-800">{activity.title}</h5>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-green-600 font-medium">{activity.price}</span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      {activity.duration}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      {activity.rating}
                    </div>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Help Text */}
      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-700 mb-2">
          💡 This will open GetYourGuide.com in a new tab with Morocco-specific search results. 
          You can then copy pricing and activity details back to your form.
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-600 font-medium">Search URL:</span>
          <code className="text-xs text-blue-800 bg-blue-100 px-2 py-1 rounded">
            {query ? getGYGSearchUrl(query) : 'https://www.getyourguide.com/s/?q=morocco&searchSource=3'}
          </code>
        </div>
      </div>
    </div>
  );
}
