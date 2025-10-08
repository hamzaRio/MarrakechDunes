import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Star, 
  ExternalLink,
  Plus,
  Target
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompetitorPrice {
  source: string;
  price: number;
  currency: string;
  title: string;
  rating: number;
  reviewCount: number;
  link: string;
  image: string;
}

interface PriceAnalysis {
  averagePrice: number;
  minPrice: number;
  maxPrice: number;
  ourCompetitivePrice: number;
  savings: number;
  marketPosition: 'leader' | 'competitive' | 'premium';
}

interface CompetitorPriceFetcherProps {
  activityName: string;
  onPriceSelect?: (price: number, source: string) => void;
  onAddActivity?: (activity: any) => void;
  currentPrice?: number;
}

export default function CompetitorPriceFetcher({ 
  activityName, 
  onPriceSelect, 
  onAddActivity,
  currentPrice = 0 
}: CompetitorPriceFetcherProps) {
  const [searchQuery, setSearchQuery] = useState(activityName);
  const [selectedPrice, setSelectedPrice] = useState<CompetitorPrice | null>(null);
  const [ourPrice, setOurPrice] = useState<number>(0);
  const { toast } = useToast();

  // Search for competitor prices
  const { data: competitorData, isLoading, error } = useQuery({
    queryKey: ['/market/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return null;
      
      const response = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}&location=Marrakech`);
      if (!response.ok) throw new Error('Failed to fetch competitor prices');
      return response.json();
    },
    enabled: searchQuery.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handlePriceSelect = (price: CompetitorPrice) => {
    setSelectedPrice(price);
    const competitivePrice = Math.max(price.price * 0.8, price.price - 100); // 20% below competitor
    setOurPrice(competitivePrice);
    onPriceSelect?.(competitivePrice, price.source);
  };

  const handleAddActivity = () => {
    if (!selectedPrice || !ourPrice) return;
    
    const activityData = {
      name: selectedPrice.title,
      price: ourPrice,
      currency: 'MAD',
      getyourguidePrice: selectedPrice.price,
      competitorSource: selectedPrice.source,
      competitiveAdvantage: selectedPrice.price - ourPrice,
    };
    
    onAddActivity?.(activityData);
    
    toast({
      title: "Activity Added!",
      description: `${selectedPrice.title} added with competitive pricing`,
    });
  };

  const calculatePriceAnalysis = (prices: CompetitorPrice[]): PriceAnalysis => {
    if (prices.length === 0) {
      return {
        averagePrice: 0,
        minPrice: 0,
        maxPrice: 0,
        ourCompetitivePrice: 0,
        savings: 0,
        marketPosition: 'competitive'
      };
    }

    const averagePrice = prices.reduce((sum, p) => sum + p.price, 0) / prices.length;
    const minPrice = Math.min(...prices.map(p => p.price));
    const maxPrice = Math.max(...prices.map(p => p.price));
    const ourCompetitivePrice = Math.max(averagePrice * 0.8, minPrice);
    const savings = averagePrice - ourCompetitivePrice;
    
    let marketPosition: 'leader' | 'competitive' | 'premium';
    if (ourCompetitivePrice < minPrice) marketPosition = 'leader';
    else if (ourCompetitivePrice <= averagePrice) marketPosition = 'competitive';
    else marketPosition = 'premium';

    return {
      averagePrice,
      minPrice,
      maxPrice,
      ourCompetitivePrice,
      savings,
      marketPosition
    };
  };

  const getSourceIcon = (source: string) => {
    switch (source.toLowerCase()) {
      case 'getyourguide': return '🟢';
      case 'viator': return '🔵';
      case 'tripadvisor': return '🟡';
      case 'airbnb': return '🔴';
      default: return '⚪';
    }
  };

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'leader': return 'bg-green-100 text-green-800 border-green-200';
      case 'competitive': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'premium': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-moroccan-blue" />
            Competitor Price Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search for similar activities (e.g., 'desert tour', 'hot air balloon')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={() => setSearchQuery(searchQuery)}
              disabled={searchQuery.length < 3}
              className="bg-moroccan-blue hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze Prices
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing competitor prices...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <p>Failed to load competitor prices. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {competitorData && competitorData.activities && (
        <div className="space-y-6">
          {/* Price Analysis Summary */}
          {competitorData.activities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Market Price Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const analysis = calculatePriceAnalysis(competitorData.activities);
                  return (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="text-sm font-medium text-blue-700">Average Market Price</div>
                        <div className="text-2xl font-bold text-blue-600">
                          {analysis.averagePrice.toFixed(0)} MAD
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <div className="text-sm font-medium text-green-700">Our Competitive Price</div>
                        <div className="text-2xl font-bold text-green-600">
                          {analysis.ourCompetitivePrice.toFixed(0)} MAD
                        </div>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                        <div className="text-sm font-medium text-orange-700">Customer Savings</div>
                        <div className="text-2xl font-bold text-orange-600">
                          {analysis.savings.toFixed(0)} MAD
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                        <div className="text-sm font-medium text-purple-700">Market Position</div>
                        <div className="text-lg font-bold text-purple-600 capitalize">
                          {analysis.marketPosition}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          )}

          {/* Competitor Prices */}
          <Card>
            <CardHeader>
              <CardTitle>Competitor Prices</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {competitorData.activities.map((activity: any, index: number) => (
                  <div key={activity.id || index} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{getSourceIcon(activity.source)}</span>
                          <h3 className="font-semibold text-lg">{activity.title}</h3>
                          <Badge variant="outline">{activity.source}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {activity.rating} ({activity.reviewCount} reviews)
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{activity.location}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-moroccan-red">
                            {activity.price} {activity.currency}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePriceSelect(activity)}
                            className="bg-moroccan-blue text-white hover:bg-blue-700"
                          >
                            <Target className="h-4 w-4 mr-1" />
                            Use This Price
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(activity.link, '_blank')}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View Original
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Add Activity Form */}
          {selectedPrice && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  Add Activity: {selectedPrice.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Our Competitive Price (MAD)</label>
                      <Input
                        type="number"
                        value={ourPrice}
                        onChange={(e) => setOurPrice(Number(e.target.value))}
                        placeholder="Enter our competitive price"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        <div>Competitor: <span className="font-semibold">{selectedPrice.price} MAD</span></div>
                        <div>Our Advantage: <span className="font-semibold text-green-600">
                          {selectedPrice.price - ourPrice} MAD
                        </span></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddActivity}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Activity
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedPrice(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
