import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Gift, 
  Users, 
  Star, 
  Share2, 
  Copy, 
  CheckCircle,
  Crown,
  Award,
  Heart,
  Zap,
  Target,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LoyaltyReferralSystemProps {
  customerId?: string;
  customerName?: string;
  totalBookings?: number;
  totalSpent?: number;
}

interface LoyaltyTier {
  name: string;
  level: number;
  minBookings: number;
  benefits: string[];
  color: string;
  icon: React.ReactNode;
}

interface ReferralReward {
  type: 'discount' | 'free_activity' | 'upgrade';
  value: string;
  description: string;
}

export default function LoyaltyReferralSystem({
  customerId = "CUST123",
  customerName = "Ahmed",
  totalBookings = 3,
  totalSpent = 1200
}: LoyaltyReferralSystemProps) {
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState("MARRAKECH2024");
  const [copied, setCopied] = useState(false);

  const loyaltyTiers: LoyaltyTier[] = [
    {
      name: "Explorer",
      level: 1,
      minBookings: 0,
      benefits: ["Welcome bonus", "Email updates", "Basic support"],
      color: "bg-gray-100 text-gray-800",
      icon: <Star className="w-4 h-4" />
    },
    {
      name: "Adventurer",
      level: 2,
      minBookings: 3,
      benefits: ["5% discount", "Priority booking", "Free cancellation"],
      color: "bg-blue-100 text-blue-800",
      icon: <Award className="w-4 h-4" />
    },
    {
      name: "Explorer Pro",
      level: 3,
      minBookings: 8,
      benefits: ["10% discount", "VIP support", "Free upgrades"],
      color: "bg-purple-100 text-purple-800",
      icon: <Crown className="w-4 h-4" />
    },
    {
      name: "Morocco Master",
      level: 4,
      minBookings: 15,
      benefits: ["15% discount", "Exclusive tours", "Personal guide"],
      color: "bg-yellow-100 text-yellow-800",
      icon: <Heart className="w-4 h-4" />
    }
  ];

  const currentTier = loyaltyTiers.find(tier => totalBookings >= tier.minBookings) || loyaltyTiers[0];
  const nextTier = loyaltyTiers.find(tier => tier.level === currentTier.level + 1);
  const progressToNext = nextTier ? 
    Math.round(((totalBookings - currentTier.minBookings) / (nextTier.minBookings - currentTier.minBookings)) * 100) : 100;

  const referralRewards: ReferralReward[] = [
    {
      type: 'discount',
      value: '10%',
      description: '10% off your next booking when someone books with your code'
    },
    {
      type: 'free_activity',
      value: 'Free Tour',
      description: 'Get a free activity when 3 friends book with your code'
    },
    {
      type: 'upgrade',
      value: 'VIP Upgrade',
      description: 'Free upgrade to premium experience for every 5 referrals'
    }
  ];

  const copyReferralCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    toast({
      title: "Referral Code Copied!",
      description: "Share this code with your friends to earn rewards!",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const shareReferral = (platform: string) => {
    const message = `🏜️ Discover amazing Moroccan adventures with MarrakechDunes! Use my referral code "${referralCode}" for 10% off your first booking! 🐪`;
    const url = `https://marrakechdunes.com?ref=${referralCode}`;
    
    let shareUrl = '';
    switch (platform) {
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + url)}`;
        break;
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Loyalty Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5" />
            Your Loyalty Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Tier */}
            <div className="flex items-center justify-between p-4 bg-moroccan-sand/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${currentTier.color}`}>
                  {currentTier.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{currentTier.name}</h3>
                  <p className="text-sm text-gray-600">Level {currentTier.level}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-moroccan-red">{totalBookings}</div>
                <div className="text-sm text-gray-500">Total Bookings</div>
              </div>
            </div>

            {/* Progress to Next Tier */}
            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Progress to {nextTier.name}</span>
                  <span className="text-sm text-gray-500">
                    {totalBookings}/{nextTier.minBookings} bookings
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-moroccan-blue h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(progressToNext, 100)}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500">
                  {nextTier.minBookings - totalBookings} more bookings to reach {nextTier.name}
                </p>
              </div>
            )}

            {/* Current Benefits */}
            <div>
              <h4 className="font-medium mb-2">Your Current Benefits:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {currentTier.benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Program */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Referral Program
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Referral Code */}
            <div className="space-y-2">
              <Label>Your Referral Code</Label>
              <div className="flex gap-2">
                <Input 
                  value={referralCode} 
                  readOnly 
                  className="font-mono text-center"
                />
                <Button 
                  onClick={copyReferralCode}
                  variant={copied ? "default" : "outline"}
                  className="min-w-[100px]"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-500">
                Share this code with friends to earn rewards when they book!
              </p>
            </div>

            {/* Share Buttons */}
            <div className="space-y-2">
              <Label>Share Your Code</Label>
              <div className="flex gap-2">
                <Button 
                  onClick={() => shareReferral('whatsapp')}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
                <Button 
                  onClick={() => shareReferral('facebook')}
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
                <Button 
                  onClick={() => shareReferral('twitter')}
                  variant="outline"
                  className="flex-1"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
              </div>
            </div>

            {/* Referral Rewards */}
            <div>
              <h4 className="font-medium mb-3">Earn These Rewards:</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {referralRewards.map((reward, index) => (
                  <div key={index} className="p-3 border rounded-lg text-center">
                    <div className="text-2xl mb-2">
                      {reward.type === 'discount' && <Zap className="w-6 h-6 mx-auto text-yellow-500" />}
                      {reward.type === 'free_activity' && <Gift className="w-6 h-6 mx-auto text-green-500" />}
                      {reward.type === 'upgrade' && <Crown className="w-6 h-6 mx-auto text-purple-500" />}
                    </div>
                    <div className="font-bold text-moroccan-red">{reward.value}</div>
                    <p className="text-sm text-gray-600">{reward.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loyalty Tiers Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            All Loyalty Tiers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {loyaltyTiers.map((tier, index) => {
              const isCurrentTier = tier.level === currentTier.level;
              const isUnlocked = totalBookings >= tier.minBookings;
              
              return (
                <div 
                  key={tier.level}
                  className={`p-4 rounded-lg border-2 ${
                    isCurrentTier 
                      ? 'border-moroccan-blue bg-moroccan-blue/5' 
                      : isUnlocked 
                        ? 'border-green-200 bg-green-50' 
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${tier.color}`}>
                        {tier.icon}
                      </div>
                      <div>
                        <h4 className="font-semibold">{tier.name}</h4>
                        <p className="text-sm text-gray-600">
                          {tier.minBookings} bookings required
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {isCurrentTier && (
                        <Badge className="bg-moroccan-blue">Current</Badge>
                      )}
                      {isUnlocked && !isCurrentTier && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Unlocked
                        </Badge>
                      )}
                      {!isUnlocked && (
                        <Badge variant="outline">Locked</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <h5 className="text-sm font-medium mb-2">Benefits:</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {tier.benefits.map((benefit, benefitIndex) => (
                        <div key={benefitIndex} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-3 h-3 text-green-500" />
                          <span>{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
