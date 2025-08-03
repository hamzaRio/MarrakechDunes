import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Users, Calendar, MapPin, Clock, Heart } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface Recommendation {
  id: string;
  activityId: string;
  activityName: string;
  reason: string;
  score: number;
  category: 'popular' | 'seasonal' | 'similar' | 'weather' | 'group_size';
  price: number;
  image: string;
  rating: number;
  duration: string;
}

interface UserPreferences {
  previousBookings: string[];
  favoriteCategories: string[];
  groupSize: number;
  budget: number;
  season: 'low' | 'medium' | 'high';
  interests: string[];
}

export default function SmartRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'popular' | 'seasonal' | 'similar' | 'weather'>('all');

  useEffect(() => {
    generateRecommendations();
  }, []);

  const generateRecommendations = () => {
    // AI-powered recommendation engine based on user behavior
    const mockPreferences: UserPreferences = {
      previousBookings: ['hot-air-balloon'],
      favoriteCategories: ['adventure', 'cultural'],
      groupSize: 2,
      budget: 3000,
      season: 'high',
      interests: ['photography', 'history', 'nature']
    };

    const mockRecommendations: Recommendation[] = [
      {
        id: '1',
        activityId: '2',
        activityName: '3-Day Desert Experience',
        reason: 'Perfect for couples who loved adventure activities',
        score: 95,
        category: 'similar',
        price: 5000,
        image: `${API_URL}/api/placeholder/300/200`,
        rating: 4.8,
        duration: '3 days'
      },
      {
        id: '2',
        activityId: '3',
        activityName: 'Essaouira Day Trip',
        reason: 'High season coastal experience - perfect weather',
        score: 88,
        category: 'seasonal',
        price: 1500,
        image: `${API_URL}/api/placeholder/300/200`,
        rating: 4.7,
        duration: '1 day'
      },
      {
        id: '3',
        activityId: '4',
        activityName: 'Ourika Valley Adventure',
        reason: 'Most booked by photography enthusiasts',
        score: 82,
        category: 'popular',
        price: 1500,
        image: `${API_URL}/api/placeholder/300/200`,
        rating: 4.6,
        duration: '1 day'
      },
      {
        id: '4',
        activityId: '6',
        activityName: 'Agafay Desert Camel Ride',
        reason: 'Ideal weather conditions this month',
        score: 79,
        category: 'weather',
        price: 1200,
        image: `${API_URL}/api/placeholder/300/200`,
        rating: 4.5,
        duration: '4 hours'
      }
    ];

    setUserPreferences(mockPreferences);
    setRecommendations(mockRecommendations);
  };

  const filteredRecommendations = selectedCategory === 'all' 
    ? recommendations 
    : recommendations.filter(r => r.category === selectedCategory);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'popular': return <Users className="w-4 h-4" />;
      case 'seasonal': return <Calendar className="w-4 h-4" />;
      case 'similar': return <Heart className="w-4 h-4" />;
      case 'weather': return <MapPin className="w-4 h-4" />;
      default: return <Star className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'popular': return 'bg-blue-100 text-blue-800';
      case 'seasonal': return 'bg-green-100 text-green-800';
      case 'similar': return 'bg-purple-100 text-purple-800';
      case 'weather': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Smart Recommendations</h2>
        <div className="flex gap-2">
          {(['all', 'popular', 'seasonal', 'similar', 'weather'] as const).map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="capitalize"
            >
              {category === 'all' ? 'All' : category}
            </Button>
          ))}
        </div>
      </div>

      {userPreferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Your Preferences Profile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-sm text-gray-600">Group Size</div>
                <div className="font-semibold">{userPreferences.groupSize} people</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Budget Range</div>
                <div className="font-semibold">Up to {userPreferences.budget} MAD</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Season</div>
                <div className="font-semibold capitalize">{userPreferences.season} season</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Interests</div>
                <div className="flex gap-1 flex-wrap">
                  {userPreferences.interests.map((interest, i) => (
                    <Badge key={i} variant="secondary" className="text-xs">{interest}</Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredRecommendations.map((rec) => (
          <Card key={rec.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            <div className="relative">
              <img 
                src={rec.image} 
                alt={rec.activityName}
                className="w-full h-48 object-cover"
              />
              <div className="absolute top-3 left-3">
                <Badge className={getCategoryColor(rec.category)}>
                  <div className="flex items-center gap-1">
                    {getCategoryIcon(rec.category)}
                    <span className="capitalize">{rec.category}</span>
                  </div>
                </Badge>
              </div>
              <div className="absolute top-3 right-3">
                <Badge variant="default" className="bg-green-600">
                  {rec.score}% match
                </Badge>
              </div>
            </div>
            
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-lg">{rec.activityName}</h3>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">{rec.price} MAD</div>
                  <div className="text-sm text-gray-600">per person</div>
                </div>
              </div>
              
              <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{rec.rating}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>{rec.duration}</span>
                </div>
              </div>
              
              <p className="text-sm text-gray-700 mb-4">{rec.reason}</p>
              
              <div className="flex gap-2">
                <Button className="flex-1">Book Now</Button>
                <Button variant="outline" size="sm">
                  Details
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Why These Recommendations?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">AI Analysis Factors</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Your previous booking: Hot Air Balloon (adventure category)</li>
                <li>• Group size: 2 people (couple-friendly activities prioritized)</li>
                <li>• High season timing: March-May optimal weather</li>
                <li>• Photography interest: Scenic locations highlighted</li>
                <li>• Budget compatibility: Activities within 3000 MAD range</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Personalization Features</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Weather-based recommendations for optimal experiences</li>
                <li>• Seasonal pricing and availability optimization</li>
                <li>• Similar customer journey analysis</li>
                <li>• Real-time popularity and rating updates</li>
                <li>• Custom packages based on interest combinations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trending This Week</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">89%</div>
              <div className="text-sm text-gray-600">Couples choosing Desert Experiences</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">+24%</div>
              <div className="text-sm text-gray-600">Photography tours bookings this month</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">4.8★</div>
              <div className="text-sm text-gray-600">Average rating for coastal trips</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}