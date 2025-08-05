import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Gift, Crown, Star, Trophy, Zap } from "lucide-react";

interface LoyaltyTier {
  name: string;
  minPoints: number;
  benefits: string[];
  color: string;
  icon: React.ComponentType<any>;
  discount: number;
}

interface UserLoyalty {
  points: number;
  tier: string;
  totalBookings: number;
  totalSpent: number;
  nextTierPoints: number;
  availableRewards: Reward[];
  pointsHistory: PointTransaction[];
}

interface Reward {
  id: string;
  name: string;
  cost: number;
  description: string;
  category: 'discount' | 'upgrade' | 'gift' | 'experience';
  available: boolean;
}

interface PointTransaction {
  id: string;
  date: Date;
  points: number;
  activity: string;
  type: 'earned' | 'redeemed';
}

export default function LoyaltyProgram() {
  const [userLoyalty, setUserLoyalty] = useState<UserLoyalty | null>(null);

  const loyaltyTiers: LoyaltyTier[] = [
    {
      name: "Explorer",
      minPoints: 0,
      benefits: ["5% booking discount", "Welcome gift", "Priority support"],
      color: "text-gray-600",
      icon: Star,
      discount: 5
    },
    {
      name: "Adventurer", 
      minPoints: 500,
      benefits: ["10% booking discount", "Free activity upgrade", "Birthday surprise", "Early access to new tours"],
      color: "text-blue-600",
      icon: Zap,
      discount: 10
    },
    {
      name: "Desert Master",
      minPoints: 1500,
      benefits: ["15% booking discount", "Complimentary transfers", "VIP experiences", "Personalized itinerary"],
      color: "text-purple-600", 
      icon: Crown,
      discount: 15
    },
    {
      name: "Moroccan Legend",
      minPoints: 3000,
      benefits: ["20% booking discount", "Free overnight stay", "Private guide", "Exclusive experiences", "Family discounts"],
      color: "text-gold-600",
      icon: Trophy,
      discount: 20
    }
  ];

  const rewards: Reward[] = [
    {
      id: "1",
      name: "50 MAD Discount Voucher",
      cost: 100,
      description: "Apply to any booking over 500 MAD",
      category: "discount",
      available: true
    },
    {
      id: "2",
      name: "Activity Upgrade",
      cost: 200,
      description: "Upgrade to premium package on your next booking",
      category: "upgrade", 
      available: true
    },
    {
      id: "3",
      name: "Moroccan Tea Set",
      cost: 300,
      description: "Authentic handcrafted tea set delivered to your hotel",
      category: "gift",
      available: true
    },
    {
      id: "4",
      name: "Private Photo Session",
      cost: 400,
      description: "Professional photographer for your desert experience",
      category: "experience",
      available: true
    },
    {
      id: "5",
      name: "150 MAD Discount Voucher",
      cost: 500,
      description: "Apply to any booking over 1500 MAD",
      category: "discount",
      available: true
    },
    {
      id: "6",
      name: "Free Camel Ride",
      cost: 600,
      description: "Complimentary camel experience in Agafay Desert",
      category: "experience",
      available: true
    }
  ];

  useEffect(() => {
    // Load user loyalty data
    const mockUserData: UserLoyalty = {
      points: 850,
      tier: "Adventurer",
      totalBookings: 3,
      totalSpent: 8500,
      nextTierPoints: 650, // 1500 - 850
      availableRewards: rewards.filter(r => r.cost <= 850),
      pointsHistory: [
        {
          id: "1",
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          points: 200,
          activity: "Hot Air Balloon Ride",
          type: "earned"
        },
        {
          id: "2", 
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          points: 500,
          activity: "3-Day Desert Experience",
          type: "earned"
        },
        {
          id: "3",
          date: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          points: 150,
          activity: "Essaouira Day Trip",
          type: "earned"
        },
        {
          id: "4",
          date: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000),
          points: -100,
          activity: "50 MAD Discount Voucher",
          type: "redeemed"
        }
      ]
    };

    setUserLoyalty(mockUserData);
  }, []);

  const getCurrentTier = () => {
    if (!userLoyalty) return loyaltyTiers[0];
    return loyaltyTiers.find(t => t.name === userLoyalty.tier) || loyaltyTiers[0];
  };

  const getNextTier = () => {
    const currentTierIndex = loyaltyTiers.findIndex(t => t.name === userLoyalty?.tier);
    return loyaltyTiers[currentTierIndex + 1] || null;
  };

  const redeemReward = (reward: Reward) => {
    if (!userLoyalty || userLoyalty.points < reward.cost) return;
    
    // Update user points and add transaction
    setUserLoyalty(prev => ({
      ...prev!,
      points: prev!.points - reward.cost,
      availableRewards: rewards.filter(r => r.cost <= (prev!.points - reward.cost)),
      pointsHistory: [
        {
          id: Date.now().toString(),
          date: new Date(),
          points: -reward.cost,
          activity: reward.name,
          type: "redeemed"
        },
        ...prev!.pointsHistory
      ]
    }));

    alert(`Successfully redeemed: ${reward.name}! Check your email for details.`);
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();
  const progressToNext = nextTier ? ((userLoyalty?.points || 0) - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints) * 100 : 100;

  if (!userLoyalty) return <div>Loading loyalty program...</div>;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">MarrakechDunes Loyalty Program</h2>
        <p className="text-gray-600">Earn points with every booking and unlock exclusive rewards</p>
      </div>

      {/* Current Status */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <currentTier.icon className={`w-8 h-8 ${currentTier.color}`} />
              <h3 className="text-2xl font-bold">{currentTier.name}</h3>
            </div>
            <div className="text-4xl font-bold text-blue-600 mb-1">{userLoyalty.points}</div>
            <div className="text-gray-600">Points Available</div>
          </div>

          {nextTier && (
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress to {nextTier.name}</span>
                <span>{userLoyalty.nextTierPoints} points to go</span>
              </div>
              <Progress value={progressToNext} className="h-3" />
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-green-600">{userLoyalty.totalBookings}</div>
              <div className="text-sm text-gray-600">Total Bookings</div>
            </div>
            <div>
              <div className="text-xl font-bold text-purple-600">{userLoyalty.totalSpent.toLocaleString()} MAD</div>
              <div className="text-sm text-gray-600">Total Spent</div>
            </div>
            <div>
              <div className="text-xl font-bold text-orange-600">{currentTier.discount}%</div>
              <div className="text-sm text-gray-600">Current Discount</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tier Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {loyaltyTiers.map((tier) => {

          const isCurrentTier = tier.name === userLoyalty.tier;
          const isUnlocked = userLoyalty.points >= tier.minPoints;
          
          return (
            <Card key={tier.name} className={`relative ${isCurrentTier ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <tier.icon className={`w-6 h-6 ${tier.color}`} />
                  {isCurrentTier && <Badge className="bg-blue-600">Current</Badge>}
                  {!isUnlocked && <Badge variant="secondary">Locked</Badge>}
                </div>
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <p className="text-sm text-gray-600">{tier.minPoints}+ points</p>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                    {tier.benefits.map((benefit, i) => (
                      <li key={i} className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Available Rewards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Available Rewards ({userLoyalty.availableRewards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userLoyalty.availableRewards.map((reward) => (
              <div key={reward.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold">{reward.name}</h4>
                  <Badge variant="outline">{reward.cost} pts</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">{reward.description}</p>
                <Button 
                  size="sm" 
                  className="w-full"
                  onClick={() => redeemReward(reward)}
                  disabled={userLoyalty.points < reward.cost}
                >
                  Redeem
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Points History */}
      <Card>
        <CardHeader>
          <CardTitle>Points History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {userLoyalty.pointsHistory.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${transaction.type === 'earned' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  <div>
                    <div className="font-medium">{transaction.activity}</div>
                    <div className="text-sm text-gray-600">{transaction.date.toLocaleDateString()}</div>
                  </div>
                </div>
                <div className={`font-bold ${transaction.type === 'earned' ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.type === 'earned' ? '+' : ''}{transaction.points} pts
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* How to Earn Points */}
      <Card>
        <CardHeader>
          <CardTitle>How to Earn Points</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Booking Activities</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 1 point per 10 MAD spent on bookings</li>
                <li>• Bonus: 50 points for first booking</li>
                <li>• Bonus: 100 points for bookings over 5000 MAD</li>
                <li>• Double points during low season (Jun-Aug)</li>
                <li>• Triple points on your birthday month</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Other Ways to Earn</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 100 points for writing a verified review</li>
                <li>• 200 points for referring a friend</li>
                <li>• 50 points for social media sharing</li>
                <li>• 150 points for completing customer survey</li>
                <li>• Special seasonal promotions and contests</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}