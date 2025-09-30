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
  findExactGetYourGuideActivity, 
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
  const [foundActivity, setFoundActivity] = useState<GetYourGuideActivity | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pricingSuggestions, setPricingSuggestions] = useState<any>(null);
  const [showResults, setShowResults] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Auto-search when activity name changes
  useEffect(() => {
    if (activityName && activityName.length > 3) {
      handleSearch(activityName);
    } else {
      setFoundActivity(null);
      setShowResults(false);
      setNotFound(false);
    }
  }, [activityName]);

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 3) return;
    
    setIsLoading(true);
    setNotFound(false);
    try {
      const activity = await findExactGetYourGuideActivity(searchTerm);
      if (activity) {
        setFoundActivity(activity);
        const suggestions = getCompetitivePricingSuggestions(activity.price);
        setPricingSuggestions(suggestions);
        onPriceSelect(activity.price, suggestions);
        setShowResults(true);
      } else {
        setNotFound(true);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error searching GetYourGuide:", error);
      setNotFound(true);
      setShowResults(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriceSuggestionSelect = (price: number) => {
    onPriceSelect(price, pricingSuggestions);
  };

  if (!showResults && !foundActivity) {
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
              <span className="ml-2 text-blue-600">Searching GetYourGuide for "{activityName}"...</span>
            </div>
          )}

          {notFound && !isLoading && (
            <div className="text-center py-4">
              <div className="text-gray-500 mb-2">
                <ExternalLink className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No exact match found on GetYourGuide</p>
                <p className="text-xs text-gray-400 mt-1">Activity: "{activityName}"</p>
              </div>
              <div className="text-xs text-gray-400 bg-gray-50 p-2 rounded">
                💡 Try variations like "Day Trip", "Tour", or "Experience"
              </div>
            </div>
          )}

          {foundActivity && !isLoading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">{foundActivity.name}</h4>
                  <p className="text-sm text-gray-600">GetYourGuide Price: {formatPrice(foundActivity.price)}</p>
                </div>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setFoundActivity(null);
                    setPricingSuggestions(null);
                    setShowResults(false);
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
