import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, DollarSign, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleMarketIntelligenceProps {
  activityName: string;
  onPriceSelect?: (price: number, source: string) => void;
  onAddActivity?: (activity: any) => void;
  currentPrice?: number;
}

export default function SimpleMarketIntelligence({ 
  activityName, 
  onPriceSelect, 
  onAddActivity,
  currentPrice = 0 
}: SimpleMarketIntelligenceProps) {
  const [searchQuery, setSearchQuery] = useState(activityName);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  // Mock competitor data for demonstration
  const mockCompetitors = [
    { source: 'GetYourGuide', price: 1200, title: 'Desert Tour Experience', rating: 4.8, reviews: 245 },
    { source: 'Viator', price: 1100, title: 'Sahara Desert Adventure', rating: 4.6, reviews: 189 },
    { source: 'TripAdvisor', price: 1300, title: 'Luxury Desert Camp', rating: 4.9, reviews: 156 }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsSearching(false);
    
    toast({
      title: "Market Analysis Complete",
      description: `Found ${mockCompetitors.length} competitor activities for "${searchQuery}"`,
    });
  };

  const handlePriceSelect = (competitor: any) => {
    const competitivePrice = Math.max(competitor.price * 0.8, competitor.price - 100);
    onPriceSelect?.(competitivePrice, competitor.source);
    
    toast({
      title: "Competitive Price Applied",
      description: `Set price to ${competitivePrice} MAD (20% below ${competitor.source})`,
    });
  };

  const handleAddActivity = (competitor: any) => {
    const competitivePrice = Math.max(competitor.price * 0.8, competitor.price - 100);
    const activityData = {
      name: competitor.title,
      price: competitivePrice,
      currency: 'MAD',
      getyourguidePrice: competitor.price,
      competitorSource: competitor.source,
      competitiveAdvantage: competitor.price - competitivePrice,
    };
    
    onAddActivity?.(activityData);
    
    toast({
      title: "Activity Added!",
      description: `${competitor.title} added with competitive pricing`,
    });
  };

  const averagePrice = mockCompetitors.reduce((sum, c) => sum + c.price, 0) / mockCompetitors.length;
  const ourCompetitivePrice = Math.max(averagePrice * 0.8, Math.min(...mockCompetitors.map(c => c.price)));

  return (
    <div className="space-y-4">
      {/* Search Section */}
      <div className="flex gap-2">
        <Input
          placeholder="Search for activities (e.g., 'desert tour', 'hot air balloon')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button 
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {isSearching ? 'Searching...' : 'Analyze Market'}
        </Button>
      </div>

      {/* Market Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4 text-green-600" />
            Market Analysis for "{searchQuery}"
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-blue-700">Average Price</div>
              <div className="text-lg font-bold text-blue-600">{averagePrice.toFixed(0)} MAD</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-sm font-medium text-green-700">Our Competitive Price</div>
              <div className="text-lg font-bold text-green-600">{ourCompetitivePrice.toFixed(0)} MAD</div>
            </div>
          </div>

          {/* Competitor List */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Competitor Activities:</h4>
            {mockCompetitors.map((competitor, index) => (
              <div key={index} className="bg-gray-50 p-3 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{competitor.title}</div>
                  <div className="flex items-center gap-2 text-xs text-gray-600">
                    <Star className="h-3 w-3 text-yellow-500" />
                    {competitor.rating} ({competitor.reviews} reviews)
                    <span className="text-purple-600 font-medium">{competitor.source}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="font-bold text-red-600">{competitor.price} MAD</div>
                    <div className="text-xs text-green-600">
                      Our: {Math.max(competitor.price * 0.8, competitor.price - 100)} MAD
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePriceSelect(competitor)}
                      className="h-6 px-2 text-xs"
                    >
                      Use Price
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddActivity(competitor)}
                      className="h-6 px-2 text-xs bg-green-600 text-white hover:bg-green-700"
                    >
                      Add Activity
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
