import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Clock, Users, Star, TrendingUp, Heart } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CustomerProfile {
  groupSize: number;
  interests: string[];
  fitnessLevel: 'low' | 'medium' | 'high';
  budget: 'low' | 'medium' | 'high';
  timeAvailable: number; // hours
  previousActivities: string[];
}

interface ActivityRecommendation {
  activity: {
    _id: string;
    name: string;
    price: number;
    duration: string;
    difficulty: string;
    description: string;
    imageUrls: string[];
    maxGroupSize: number;
    weatherDependent: boolean;
    preparationTips: string[];
  };
  score: number;
  reasons: string[];
  matchPercentage: number;
  estimatedCost: number;
  bestTimeSlots: string[];
  groupDiscount: number;
}

interface WeatherData {
  condition: string;
  temperature: number;
  windSpeed: number;
  humidity: number;
  forecast: string;
}

export default function ActivityRecommendations() {
  const [customerProfile, setCustomerProfile] = useState<CustomerProfile>({
    groupSize: 2,
    interests: [],
    fitnessLevel: 'medium',
    budget: 'medium',
    timeAvailable: 8,
    previousActivities: []
  });

  const [recommendations, setRecommendations] = useState<ActivityRecommendation[]>([]);

  // Get activities and weather data
  const { data: activities = [] } = useQuery({
    queryKey: ['activities'],
    queryFn: () => apiFetch('/activities')
  });

  const { data: weather } = useQuery({
    queryKey: ['weather'],
    queryFn: () => apiFetch<WeatherData>('/weather'),
    refetchInterval: 30 * 60 * 1000 // 30 minutes
  });

  // Calculate recommendations based on profile
  useEffect(() => {
    if (activities.length === 0) return;

    const calculateRecommendations = (): ActivityRecommendation[] => {
      return activities.map((activity: any) => {
        let score = 0;
        const reasons: string[] = [];
        let matchPercentage = 0;

        // Group size compatibility
        if (activity.maxGroupSize >= customerProfile.groupSize) {
          score += 20;
          reasons.push(`Perfect for groups of ${customerProfile.groupSize}`);
        } else if (activity.maxGroupSize >= customerProfile.groupSize * 0.8) {
          score += 15;
          reasons.push(`Good for groups of ${customerProfile.groupSize}`);
        }

        // Budget compatibility
        const activityPrice = parseInt(activity.price);
        const totalCost = activityPrice * customerProfile.groupSize;
        
        if (customerProfile.budget === 'low' && totalCost <= 500) {
          score += 25;
          reasons.push('Great value for money');
        } else if (customerProfile.budget === 'medium' && totalCost <= 1000) {
          score += 25;
          reasons.push('Good price point');
        } else if (customerProfile.budget === 'high') {
          score += 20;
          reasons.push('Premium experience');
        }

        // Fitness level compatibility
        const difficulty = activity.difficulty?.toLowerCase() || 'medium';
        if (customerProfile.fitnessLevel === 'low' && difficulty === 'easy') {
          score += 20;
          reasons.push('Perfect for beginners');
        } else if (customerProfile.fitnessLevel === 'medium' && ['easy', 'medium'].includes(difficulty)) {
          score += 20;
          reasons.push('Suitable fitness level');
        } else if (customerProfile.fitnessLevel === 'high') {
          score += 15;
          reasons.push('Challenging adventure');
        }

        // Weather compatibility
        if (weather) {
          if (activity.weatherDependent && weather.condition === 'sunny') {
            score += 15;
            reasons.push('Perfect weather conditions');
          } else if (!activity.weatherDependent) {
            score += 10;
            reasons.push('Weather-independent activity');
          }
        }

        // Interest matching
        const activityKeywords = [
          ...activity.name.toLowerCase().split(' '),
          ...activity.description.toLowerCase().split(' ')
        ];
        
        const matchedInterests = customerProfile.interests.filter(interest =>
          activityKeywords.some(keyword => keyword.includes(interest.toLowerCase()))
        );
        
        if (matchedInterests.length > 0) {
          score += matchedInterests.length * 10;
          reasons.push(`Matches your interests: ${matchedInterests.join(', ')}`);
        }

        // Time availability
        const activityDuration = parseInt(activity.duration?.replace(/\D/g, '') || '4');
        if (activityDuration <= customerProfile.timeAvailable) {
          score += 15;
          reasons.push(`Fits your ${customerProfile.timeAvailable}h schedule`);
        }

        // Group discounts
        let groupDiscount = 0;
        if (customerProfile.groupSize >= 4) {
          groupDiscount = 5; // 5% discount
          score += 10;
          reasons.push('Group discount available');
        }
        if (customerProfile.groupSize >= 8) {
          groupDiscount = 10; // 10% discount
          score += 15;
          reasons.push('Large group discount');
        }

        // Calculate match percentage
        matchPercentage = Math.min(100, Math.round((score / 100) * 100));

        // Calculate estimated cost with discounts
        const estimatedCost = Math.round(totalCost * (1 - groupDiscount / 100));

        // Best time slots based on activity type
        const bestTimeSlots = getBestTimeSlots(activity.name);

        return {
          activity,
          score,
          reasons,
          matchPercentage,
          estimatedCost,
          bestTimeSlots,
          groupDiscount
        };
      }).sort((a, b) => b.score - a.score);
    };

    setRecommendations(calculateRecommendations());
  }, [customerProfile, activities, weather]);

  const getBestTimeSlots = (activityName: string): string[] => {
    const name = activityName.toLowerCase();
    
    if (name.includes('balloon') || name.includes('sunrise')) {
      return ['06:00', '06:30', '07:00'];
    } else if (name.includes('desert') || name.includes('agafay')) {
      return ['08:00', '09:00', '16:00', '17:00'];
    } else if (name.includes('valley') || name.includes('ourika')) {
      return ['08:00', '09:00', '10:00'];
    } else if (name.includes('waterfall') || name.includes('ouzoud')) {
      return ['08:00', '09:00', '10:00'];
    } else if (name.includes('essaouira') || name.includes('coastal')) {
      return ['08:00', '09:00', '10:00'];
    } else {
      return ['09:00', '10:00', '14:00', '15:00'];
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Customer Profile Setup */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Tell Us About Your Group</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group Size</label>
            <select
              value={customerProfile.groupSize}
              onChange={(e) => setCustomerProfile({
                ...customerProfile,
                groupSize: parseInt(e.target.value)
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(size => (
                <option key={size} value={size}>{size} {size === 1 ? 'person' : 'people'}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Fitness Level</label>
            <select
              value={customerProfile.fitnessLevel}
              onChange={(e) => setCustomerProfile({
                ...customerProfile,
                fitnessLevel: e.target.value as 'low' | 'medium' | 'high'
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="low">Low (Easy pace)</option>
              <option value="medium">Medium (Moderate)</option>
              <option value="high">High (Challenging)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget</label>
            <select
              value={customerProfile.budget}
              onChange={(e) => setCustomerProfile({
                ...customerProfile,
                budget: e.target.value as 'low' | 'medium' | 'high'
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value="low">Low (Under 500 MAD)</option>
              <option value="medium">Medium (500-1000 MAD)</option>
              <option value="high">High (1000+ MAD)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Time Available</label>
            <select
              value={customerProfile.timeAvailable}
              onChange={(e) => setCustomerProfile({
                ...customerProfile,
                timeAvailable: parseInt(e.target.value)
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
            >
              <option value={4}>Half Day (4 hours)</option>
              <option value={8}>Full Day (8 hours)</option>
              <option value={12}>Extended (12 hours)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Interests (Select all that apply)</label>
            <div className="flex flex-wrap gap-2">
              {['photography', 'nature', 'adventure', 'culture', 'relaxation', 'history', 'food', 'shopping'].map(interest => (
                <label key={interest} className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={customerProfile.interests.includes(interest)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setCustomerProfile({
                          ...customerProfile,
                          interests: [...customerProfile.interests, interest]
                        });
                      } else {
                        setCustomerProfile({
                          ...customerProfile,
                          interests: customerProfile.interests.filter(i => i !== interest)
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm capitalize">{interest}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weather Information */}
      {weather && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            <h4 className="font-medium text-blue-900">Weather Update</h4>
          </div>
          <p className="text-blue-800">
            {weather.condition}, {weather.temperature}°C - {weather.forecast}
          </p>
        </div>
      )}

      {/* Recommendations */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Recommended Activities</h3>
        
        {recommendations.slice(0, 6).map((rec, index) => (
          <div key={rec.activity._id} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-lg">#{index + 1}</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-gray-900">{rec.activity.name}</h4>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {rec.activity.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      Max {rec.activity.maxGroupSize} people
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${getDifficultyColor(rec.activity.difficulty)}`}>
                      {rec.activity.difficulty}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className={`text-2xl font-bold ${getMatchColor(rec.matchPercentage)}`}>
                  {rec.matchPercentage}%
                </div>
                <div className="text-sm text-gray-600">Match</div>
              </div>
            </div>

            <p className="text-gray-700 mb-4">{rec.activity.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Estimated Cost</div>
                <div className="text-lg font-semibold text-gray-900">
                  {rec.estimatedCost} MAD
                  {rec.groupDiscount > 0 && (
                    <span className="text-green-600 text-sm ml-2">
                      ({rec.groupDiscount}% group discount)
                    </span>
                  )}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Best Times</div>
                <div className="text-sm text-gray-900">
                  {rec.bestTimeSlots.join(', ')}
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="text-sm text-gray-600">Why This Activity?</div>
                <div className="text-sm text-gray-900">
                  {rec.reasons.slice(0, 2).join(', ')}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-red-500" />
                <span className="text-sm text-gray-600">
                  {rec.reasons.length} reasons to choose this activity
                </span>
              </div>
              
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700">
                Book This Activity
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
