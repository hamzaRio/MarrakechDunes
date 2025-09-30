import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MapPin, 
  Clock, 
  Users, 
  DollarSign,
  TrendingUp,
  CheckCircle,
  Lightbulb,
  Target
} from "lucide-react";

interface CustomerProfile {
  age: number;
  interests: string[];
  fitnessLevel: 'low' | 'medium' | 'high';
  budget: number;
  groupSize: number;
  previousBookings: string[];
  preferredTime: 'morning' | 'afternoon' | 'evening';
}

interface Activity {
  id: string;
  name: string;
  price: number;
  duration: string;
  location: string;
  category: string;
  difficulty: string;
  rating: number;
  imageUrl: string;
  description: string;
}

interface SmartBookingSystem {
  recommended: Activity[];
  alternatives: Activity[];
  reasons: string[];
}

interface TimeSlot {
  time: string;
  availability: 'available' | 'limited' | 'full';
  price: number;
  discount?: number;
}

interface SmartBookingSuggestionsProps {
  customerProfile: CustomerProfile;
  selectedActivity?: Activity;
  onActivitySelect: (activity: Activity) => void;
  onTimeSlotSelect: (timeSlot: TimeSlot) => void;
}

export default function SmartBookingSuggestions({
  customerProfile,
  selectedActivity,
  onActivitySelect,
  onTimeSlotSelect
}: SmartBookingSuggestionsProps) {
  const [recommendations, setRecommendations] = useState<SmartBookingSystem | null>(null);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const recommendations = getActivityRecommendations(customerProfile);
      setRecommendations(recommendations);
      
      if (selectedActivity) {
        const slots = suggestTimeSlots(selectedActivity, new Date());
        setTimeSlots(slots);
      }
      
      setIsLoading(false);
    };

    fetchRecommendations();
  }, [customerProfile, selectedActivity]);

  const getActivityRecommendations = (profile: CustomerProfile): SmartBookingSystem => {
    // Mock activities database
    const allActivities: Activity[] = [
      {
        id: "1",
        name: "Ballade en Montgolfière",
        price: 450,
        duration: "4 heures",
        location: "Marrakech",
        category: "aventure",
        difficulty: "facile",
        rating: 4.8,
        imageUrl: "/images/balloon.jpg",
        description: "Expérience magique au-dessus de Marrakech"
      },
      {
        id: "2",
        name: "Excursion Vallée d'Ourika",
        price: 350,
        duration: "7 heures",
        location: "Vallée d'Ourika",
        category: "nature",
        difficulty: "moyen",
        rating: 4.6,
        imageUrl: "/images/ourika.jpg",
        description: "Découverte des cascades et villages berbères"
      },
      {
        id: "3",
        name: "Journée Essaouira",
        price: 280,
        duration: "10 heures",
        location: "Essaouira",
        category: "culturel",
        difficulty: "facile",
        rating: 4.5,
        imageUrl: "/images/essaouira.jpg",
        description: "Visite de la ville côtière historique"
      },
      {
        id: "4",
        name: "Trek Atlas",
        price: 500,
        duration: "8 heures",
        location: "Atlas",
        category: "aventure",
        difficulty: "difficile",
        rating: 4.9,
        imageUrl: "/images/atlas.jpg",
        description: "Randonnée dans les montagnes de l'Atlas"
      }
    ];

    // Smart recommendation algorithm
    const scoredActivities = allActivities.map(activity => {
      let score = 0;
      const reasons: string[] = [];

      // Budget compatibility (25 points)
      if (activity.price <= profile.budget) {
        score += 25;
        reasons.push("Dans votre budget");
      } else if (activity.price <= profile.budget * 1.2) {
        score += 15;
        reasons.push("Légèrement au-dessus du budget");
      }

      // Fitness level compatibility (20 points)
      if (profile.fitnessLevel === 'low' && activity.difficulty === 'facile') {
        score += 20;
        reasons.push("Parfait pour votre niveau de forme");
      } else if (profile.fitnessLevel === 'medium' && activity.difficulty !== 'difficile') {
        score += 15;
        reasons.push("Adapté à votre niveau");
      } else if (profile.fitnessLevel === 'high') {
        score += 20;
        reasons.push("Défi parfait pour vous");
      }

      // Interest matching (15 points per match)
      profile.interests.forEach(interest => {
        if (activity.category === interest || activity.description.toLowerCase().includes(interest.toLowerCase())) {
          score += 15;
          reasons.push(`Correspond à votre intérêt: ${interest}`);
        }
      });

      // Group size compatibility (10 points)
      if (profile.groupSize >= 4 && activity.name.includes("Groupe")) {
        score += 10;
        reasons.push("Parfait pour les groupes");
      }

      // Time preference (10 points)
      if (profile.preferredTime === 'morning' && activity.name.includes("Ballade")) {
        score += 10;
        reasons.push("Idéal pour le matin");
      }

      // Rating bonus (5 points)
      if (activity.rating >= 4.5) {
        score += 5;
        reasons.push("Très bien noté");
      }

      return { activity, score, reasons };
    });

    // Sort by score and get top recommendations
    const sorted = scoredActivities.sort((a, b) => b.score - a.score);
    const recommended = sorted.slice(0, 2).map(item => item.activity);
    const alternatives = sorted.slice(2, 4).map(item => item.activity);
    const reasons = sorted.slice(0, 2).flatMap(item => item.reasons);

    return { recommended, alternatives, reasons };
  };

  const optimizePricing = (activity: Activity, groupSize: number) => {
    const basePrice = activity.price;
    let groupDiscount = 0;
    let earlyBirdDiscount = 0;

    // Group discount
    if (groupSize >= 4) {
      groupDiscount = basePrice * 0.05; // 5% group discount
    }

    // Early bird discount
    earlyBirdDiscount = basePrice * 0.10; // 10% early bird

    const totalSavings = groupDiscount + earlyBirdDiscount;

    return {
      basePrice,
      groupDiscount,
      earlyBirdDiscount,
      totalSavings
    };
  };

  const suggestTimeSlots = (activity: Activity, preferredDate: Date): TimeSlot[] => {
    // Mock time slots
    return [
      {
        time: "08:00",
        availability: "available",
        price: activity.price,
        discount: 0
      },
      {
        time: "10:00",
        availability: "limited",
        price: activity.price * 0.9,
        discount: activity.price * 0.1
      },
      {
        time: "14:00",
        availability: "available",
        price: activity.price,
        discount: 0
      },
      {
        time: "16:00",
        availability: "full",
        price: activity.price,
        discount: 0
      }
    ];
  };

  const getAvailabilityColor = (availability: string) => {
    switch (availability) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'limited': return 'bg-yellow-100 text-yellow-800';
      case 'full': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getAvailabilityText = (availability: string) => {
    switch (availability) {
      case 'available': return 'Disponible';
      case 'limited': return 'Places limitées';
      case 'full': return 'Complet';
      default: return 'Indisponible';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Analyse de vos préférences...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Smart Recommendations */}
      {recommendations && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-blue-600" />
              Recommandations Intelligentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Reasons */}
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4 text-green-600" />
                  Pourquoi ces activités?
                </h4>
                <ul className="space-y-1">
                  {recommendations.reasons.map((reason, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recommended Activities */}
              <div>
                <h4 className="font-semibold mb-3 text-green-600">⭐ Recommandées pour vous</h4>
                <div className="grid gap-4">
                  {recommendations.recommended.map((activity) => (
                    <Card 
                      key={activity.id}
                      className="cursor-pointer hover:shadow-md transition-all duration-200 border-green-200 bg-green-50"
                      onClick={() => onActivitySelect(activity)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                              <Star className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                              <h5 className="font-semibold text-gray-900">{activity.name}</h5>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {activity.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {activity.duration}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Star className="w-3 h-3" />
                                  {activity.rating}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">{activity.price} MAD</div>
                            <div className="text-sm text-gray-600">par personne</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Alternative Activities */}
              {recommendations.alternatives.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-3 text-blue-600">🔄 Alternatives</h4>
                  <div className="grid gap-3">
                    {recommendations.alternatives.map((activity) => (
                      <Card 
                        key={activity.id}
                        className="cursor-pointer hover:shadow-md transition-all duration-200"
                        onClick={() => onActivitySelect(activity)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900">{activity.name}</h5>
                              <div className="text-sm text-gray-600">
                                {activity.location} • {activity.duration} • {activity.rating}⭐
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-gray-900">{activity.price} MAD</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Time Slot Suggestions */}
      {selectedActivity && timeSlots.length > 0 && (
        <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-orange-600" />
              Créneaux Horaires Disponibles
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {timeSlots.map((slot, index) => (
                <Button
                  key={index}
                  variant={slot.availability === 'full' ? 'outline' : 'default'}
                  disabled={slot.availability === 'full'}
                  className={`h-auto p-3 flex flex-col ${
                    slot.availability === 'available' 
                      ? 'bg-green-50 border-green-200 text-green-800 hover:bg-green-100' 
                      : slot.availability === 'limited'
                      ? 'bg-yellow-50 border-yellow-200 text-yellow-800 hover:bg-yellow-100'
                      : 'bg-gray-50 border-gray-200 text-gray-500'
                  }`}
                  onClick={() => slot.availability !== 'full' && onTimeSlotSelect(slot)}
                >
                  <span className="font-semibold">{slot.time}</span>
                  <Badge className={`mt-1 ${getAvailabilityColor(slot.availability)}`}>
                    {getAvailabilityText(slot.availability)}
                  </Badge>
                  {slot.discount && slot.discount > 0 && (
                    <span className="text-xs text-green-600 mt-1">
                      -{slot.discount} MAD
                    </span>
                  )}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Optimization */}
      {selectedActivity && (
        <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              Optimisation des Prix
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const pricing = optimizePricing(selectedActivity, customerProfile.groupSize);
              return (
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Prix de base:</span>
                    <span>{pricing.basePrice} MAD</span>
                  </div>
                  {pricing.groupDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Remise de groupe:</span>
                      <span>-{pricing.groupDiscount} MAD</span>
                    </div>
                  )}
                  {pricing.earlyBirdDiscount > 0 && (
                    <div className="flex justify-between text-blue-600">
                      <span>Remise early bird:</span>
                      <span>-{pricing.earlyBirdDiscount} MAD</span>
                    </div>
                  )}
                  <div className="border-t pt-2">
                    <div className="flex justify-between font-semibold">
                      <span>Total avec remises:</span>
                      <span>{pricing.basePrice - pricing.totalSavings} MAD</span>
                    </div>
                    {pricing.totalSavings > 0 && (
                      <div className="text-sm text-green-600">
                        Vous économisez {pricing.totalSavings} MAD!
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
