import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  ExternalLink, 
  TrendingUp, 
  TrendingDown, 
  DollarSign,
  Clock,
  MapPin,
  Star,
  Users,
  Loader2
} from "lucide-react";
import { 
  searchGetYourGuideActivities, 
  getCompetitivePricingSuggestions, 
  formatPrice,
  type GetYourGuideActivity 
} from "@/lib/getyourguide-api";

interface GetYourGuidePriceFetcherProps {
  activityName: string;
  onPriceSelect: (price: number, suggestions: any) => void;
  currentPrice?: number;
}

export default function GetYourGuidePriceFetcher({ 
  activityName, 
  onPriceSelect, 
  currentPrice = 0 
}: GetYourGuidePriceFetcherProps) {
  const [searchResults, setSearchResults] = useState<GetYourGuideActivity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<GetYourGuideActivity | null>(null);
  const [pricingSuggestions, setPricingSuggestions] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);

  // Auto-search when activity name changes
  useEffect(() => {
    if (activityName && activityName.length > 3) {
      handleSearch(activityName);
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [activityName]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) return;
    
    setIsLoading(true);
    try {
      const results = await searchGetYourGuideActivities(searchTerm);
      setSearchResults(results.activities);
      setShowResults(true);
    } catch (error) {
      console.error("Error searching GetYourGuide:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivitySelect = (activity: GetYourGuideActivity) => {
    setSelectedActivity(activity);
    const suggestions = getCompetitivePricingSuggestions(activity.price);
    setPricingSuggestions(suggestions);
    onPriceSelect(activity.price, suggestions);
  };

  const handlePriceSuggestionSelect = (price: number) => {
    onPriceSelect(price, pricingSuggestions);
  };

  if (!showResults && !selectedActivity) {
    return null;
  }

  return (
    <div className="space-y-4 mt-4">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-blue-900 flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            GetYourGuide Competitor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-blue-600">Searching GetYourGuide...</span>
            </div>
          )}

          {searchResults.length > 0 && !selectedActivity && (
            <div className="space-y-3">
              <Label className="text-sm font-medium text-blue-900">
                Found {searchResults.length} similar activities:
              </Label>
              {searchResults.map((activity) => (
                <Card 
                  key={activity.id} 
                  className="cursor-pointer hover:bg-blue-100 transition-colors border-blue-200"
                  onClick={() => handleActivitySelect(activity)}
                >
                  <CardContent className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 text-sm">{activity.name}</h4>
                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            {formatPrice(activity.price)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {activity.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {activity.location}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                            <span className="text-xs text-gray-600">{activity.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">({activity.reviewCount} reviews)</span>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="ml-2">
                        Select
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {selectedActivity && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{selectedActivity.name}</h4>
                  <p className="text-sm text-gray-600">GetYourGuide Price: {formatPrice(selectedActivity.price)}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setSelectedActivity(null);
                    setPricingSuggestions(null);
                  }}
                >
                  Change
                </Button>
              </div>

              {pricingSuggestions && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-blue-900">
                    Competitive Pricing Suggestions:
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Card 
                      className={`cursor-pointer transition-colors ${
                        currentPrice === pricingSuggestions.aggressive 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-gray-200 hover:border-green-300'
                      }`}
                      onClick={() => handlePriceSuggestionSelect(pricingSuggestions.aggressive)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingDown className="h-4 w-4 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Aggressive</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(pricingSuggestions.aggressive)}
                        </div>
                        <div className="text-xs text-gray-500">15% below</div>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-colors ${
                        currentPrice === pricingSuggestions.competitive 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-blue-300'
                      }`}
                      onClick={() => handlePriceSuggestionSelect(pricingSuggestions.competitive)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <DollarSign className="h-4 w-4 text-blue-600" />
                          <span className="text-xs font-medium text-blue-600">Competitive</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(pricingSuggestions.competitive)}
                        </div>
                        <div className="text-xs text-gray-500">5% below</div>
                      </CardContent>
                    </Card>

                    <Card 
                      className={`cursor-pointer transition-colors ${
                        currentPrice === pricingSuggestions.premium 
                          ? 'border-purple-500 bg-purple-50' 
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                      onClick={() => handlePriceSuggestionSelect(pricingSuggestions.premium)}
                    >
                      <CardContent className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1 mb-1">
                          <TrendingUp className="h-4 w-4 text-purple-600" />
                          <span className="text-xs font-medium text-purple-600">Premium</span>
                        </div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatPrice(pricingSuggestions.premium)}
                        </div>
                        <div className="text-xs text-gray-500">10% above</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                    💡 {pricingSuggestions.description}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
