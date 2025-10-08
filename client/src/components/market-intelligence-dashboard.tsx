import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Star, 
  MapPin, 
  Clock, 
  Plus,
  ExternalLink,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CompetitorActivity {
  id: string;
  title: string;
  price: number;
  currency: string;
  rating: number;
  reviewCount: number;
  image: string;
  link: string;
  source: 'getyourguide' | 'viator' | 'tripadvisor' | 'airbnb';
  location: string;
  duration: string;
  category: string;
}

interface MarketAnalysis {
  activity: CompetitorActivity;
  priceDifference: number;
  competitiveAdvantage: 'strong' | 'moderate' | 'weak';
  marketPosition: 'leader' | 'competitive' | 'follower';
  recommendedPrice: number;
  profitMargin: number;
}

interface MarketIntelligence {
  query: string;
  totalResults: number;
  activities: CompetitorActivity[];
  analysis: MarketAnalysis[];
  marketInsights: {
    averagePrice: number;
    priceRange: { min: number; max: number };
    topCompetitors: string[];
    marketGaps: string[];
  };
}

export default function MarketIntelligenceDashboard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<CompetitorActivity | null>(null);
  const [ourPrice, setOurPrice] = useState<number>(0);
  const [ourDescription, setOurDescription] = useState('');
  const [ourDuration, setOurDuration] = useState('');
  const [ourLocation, setOurLocation] = useState('Marrakech');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Market intelligence search
  const { data: marketData, isLoading, error } = useQuery<MarketIntelligence>({
    queryKey: ['/market/search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 3) return null;
      
      const response = await fetch(`/api/market/search?q=${encodeURIComponent(searchQuery)}&location=Marrakech`);
      if (!response.ok) throw new Error('Market search failed');
      return response.json();
    },
    enabled: searchQuery.length >= 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Add activity mutation
  const addActivityMutation = useMutation({
    mutationFn: async (activityData: any) => {
      const response = await fetch('/api/market/add-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activityData),
      });
      if (!response.ok) throw new Error('Failed to add activity');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Activity Added Successfully!",
        description: `${data.activity.name} added with competitive pricing`,
      });
      queryClient.invalidateQueries({ queryKey: ['/activities'] });
      setSelectedActivity(null);
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Add Activity",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleSelectActivity = (activity: CompetitorActivity) => {
    setSelectedActivity(activity);
    setOurPrice(Math.max(activity.price * 0.8, activity.price - 100)); // 20% below competitor
    setOurDescription(activity.title);
    setOurDuration(activity.duration);
  };

  const handleAddActivity = () => {
    if (!selectedActivity || !ourPrice) return;

    addActivityMutation.mutate({
      competitorActivity: selectedActivity,
      ourPrice,
      ourDescription,
      ourDuration,
      ourLocation,
    });
  };

  const getCompetitiveAdvantageColor = (advantage: string) => {
    switch (advantage) {
      case 'strong': return 'bg-green-100 text-green-800 border-green-200';
      case 'moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'weak': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getMarketPositionColor = (position: string) => {
    switch (position) {
      case 'leader': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'competitive': return 'bg-green-100 text-green-800 border-green-200';
      case 'follower': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'getyourguide': return '🟢';
      case 'viator': return '🔵';
      case 'tripadvisor': return '🟡';
      case 'airbnb': return '🔴';
      default: return '⚪';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-moroccan-blue" />
            Market Intelligence Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Search for activities (e.g., 'desert tour', 'hot air balloon')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={() => handleSearch(searchQuery)}
              disabled={searchQuery.length < 3}
              className="bg-moroccan-blue hover:bg-blue-700"
            >
              <Search className="h-4 w-4 mr-2" />
              Analyze Market
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue mx-auto mb-4"></div>
              <p className="text-gray-600">Analyzing market intelligence...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-red-600">
              <p>Failed to load market intelligence. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {marketData && (
        <div className="space-y-6">
          {/* Market Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-moroccan-blue" />
                Market Overview for "{marketData.query}"
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-sm font-medium text-blue-700">Total Results</div>
                  <div className="text-2xl font-bold text-blue-600">{marketData.totalResults}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-sm font-medium text-green-700">Average Price</div>
                  <div className="text-2xl font-bold text-green-600">
                    {marketData.marketInsights.averagePrice.toFixed(0)} MAD
                  </div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <div className="text-sm font-medium text-orange-700">Price Range</div>
                  <div className="text-lg font-bold text-orange-600">
                    {marketData.marketInsights.priceRange.min} - {marketData.marketInsights.priceRange.max} MAD
                  </div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-sm font-medium text-purple-700">Top Competitors</div>
                  <div className="text-lg font-bold text-purple-600">
                    {marketData.marketInsights.topCompetitors.join(', ')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Market Gaps */}
          {marketData.marketInsights.marketGaps.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-600" />
                  Market Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {marketData.marketInsights.marketGaps.map((gap, index) => (
                    <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <p className="text-yellow-800 font-medium">{gap}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Competitor Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Competitor Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketData.activities.map((activity, index) => (
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
                            <MapPin className="h-4 w-4" />
                            {activity.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {activity.duration}
                          </div>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500" />
                            {activity.rating} ({activity.reviewCount} reviews)
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-2xl font-bold text-moroccan-red">
                            {activity.price} {activity.currency}
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSelectActivity(activity)}
                            className="bg-moroccan-blue text-white hover:bg-blue-700"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add to Our Activities
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

          {/* Add Activity Modal */}
          {selectedActivity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5 text-green-600" />
                  Add Activity: {selectedActivity.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Our Price (MAD)</label>
                      <Input
                        type="number"
                        value={ourPrice}
                        onChange={(e) => setOurPrice(Number(e.target.value))}
                        placeholder="Enter our competitive price"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Duration</label>
                      <Input
                        value={ourDuration}
                        onChange={(e) => setOurDuration(e.target.value)}
                        placeholder="e.g., 8 hours"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Input
                      value={ourDescription}
                      onChange={(e) => setOurDescription(e.target.value)}
                      placeholder="Enter activity description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Location</label>
                      <Input
                        value={ourLocation}
                        onChange={(e) => setOurLocation(e.target.value)}
                        placeholder="e.g., Marrakech"
                      />
                    </div>
                    <div className="flex items-end">
                      <div className="text-sm text-gray-600">
                        Competitor Price: <span className="font-semibold">{selectedActivity.price} MAD</span>
                        <br />
                        Our Advantage: <span className="font-semibold text-green-600">
                          {selectedActivity.price - ourPrice} MAD
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      onClick={handleAddActivity}
                      disabled={addActivityMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {addActivityMutation.isPending ? 'Adding...' : 'Add Activity'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedActivity(null)}
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
