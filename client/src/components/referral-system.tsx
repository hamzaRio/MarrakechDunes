import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Share2, Gift, Users, Crown, Copy, Check } from "lucide-react";

interface Referral {
  id: string;
  referrerName: string;
  referredName: string;
  referredEmail: string;
  status: 'pending' | 'confirmed' | 'rewarded';
  bookingAmount: number;
  rewardAmount: number;
  createdAt: Date;
  confirmedAt?: Date;
}

interface ReferralStats {
  totalReferrals: number;
  confirmedReferrals: number;
  totalRewards: number;
  pendingRewards: number;
  conversionRate: number;
  topReferrer: string;
}

export default function ReferralSystem() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [userReferralCode] = useState<string>('ADVENTURE2025');
  const [newReferralEmail, setNewReferralEmail] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = () => {
    const mockReferrals: Referral[] = [
      {
        id: '1',
        referrerName: 'Sarah Johnson',
        referredName: 'Mike Smith',
        referredEmail: 'mike.smith@email.com',
        status: 'rewarded',
        bookingAmount: 5000,
        rewardAmount: 500,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        referrerName: 'Sarah Johnson',
        referredName: 'Emma Wilson',
        referredEmail: 'emma.wilson@email.com',
        status: 'confirmed',
        bookingAmount: 3000,
        rewardAmount: 300,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        referrerName: 'David Brown',
        referredName: 'Lisa Garcia',
        referredEmail: 'lisa.garcia@email.com',
        status: 'pending',
        bookingAmount: 0,
        rewardAmount: 0,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: '4',
        referrerName: 'Sarah Johnson',
        referredName: 'Tom Anderson',
        referredEmail: 'tom.anderson@email.com',
        status: 'rewarded',
        bookingAmount: 7500,
        rewardAmount: 750,
        createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
        confirmedAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
      }
    ];

    const mockStats: ReferralStats = {
      totalReferrals: 24,
      confirmedReferrals: 18,
      totalRewards: 4750,
      pendingRewards: 800,
      conversionRate: 75,
      topReferrer: 'Sarah Johnson'
    };

    setReferrals(mockReferrals);
    setStats(mockStats);
  };

  const copyReferralLink = () => {
    const referralLink = `https://marrakechdunes.com?ref=${userReferralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendReferralInvite = () => {
    if (!newReferralEmail) return;
    
    const subject = 'Discover Amazing Moroccan Adventures - 10% Off Your First Booking!';
    const body = `Hi there!

I wanted to share something amazing with you - MarrakechDunes offers incredible authentic Moroccan experiences, and I thought you'd love them!

As my referral, you'll get 10% off your first booking, and I'll earn some rewards too when you book your adventure.

Check out their activities:
🎈 Hot Air Balloon Rides over Atlas Mountains
🏜️ Multi-day Desert Experiences
🌊 Coastal Day Trips to Essaouira
🏔️ Mountain Adventures in Ourika Valley

Book with my referral code: ${userReferralCode}
Visit: https://marrakechdunes.com?ref=${userReferralCode}

Trust me, you won't regret this adventure!

Best regards!`;

    const mailtoLink = `mailto:${newReferralEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink);
    setNewReferralEmail('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'rewarded': return 'bg-green-100 text-green-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const shareOnSocial = (platform: string) => {
    const referralLink = `https://marrakechdunes.com?ref=${userReferralCode}`;
    const message = "Discover authentic Moroccan adventures with MarrakechDunes! Get 10% off your first booking with my referral link:";
    
    let shareUrl = '';
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(message)}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(referralLink)}`;
        break;
      case 'whatsapp':
        shareUrl = `https://wa.me/?text=${encodeURIComponent(message + ' ' + referralLink)}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Referral Program</h2>
        <p className="text-gray-600">Share the adventure and earn rewards for every friend who books</p>
      </div>

      {/* Program Overview */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Gift className="w-8 h-8 text-purple-600" />
              <h3 className="text-2xl font-bold">How It Works</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Share2 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold mb-2">1. Share Your Code</h4>
                <p className="text-sm text-gray-600">Share your unique referral code with friends and family</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold mb-2">2. Friend Books</h4>
                <p className="text-sm text-gray-600">Your friend gets 10% off their first booking</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Crown className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold mb-2">3. You Earn Rewards</h4>
                <p className="text-sm text-gray-600">Receive 10% of their booking value as credit</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Your Referral Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Referrals</p>
                <p className="text-3xl font-bold text-blue-600">{stats.totalReferrals}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Confirmed</p>
                <p className="text-3xl font-bold text-green-600">{stats.confirmedReferrals}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Total Earned</p>
                <p className="text-3xl font-bold text-purple-600">{stats.totalRewards} MAD</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-600">{stats.pendingRewards} MAD</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-3xl font-bold text-orange-600">{stats.conversionRate}%</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Share Your Code */}
      <Card>
        <CardHeader>
          <CardTitle>Share Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={`https://marrakechdunes.com?ref=${userReferralCode}`}
                readOnly
                className="flex-1"
              />
              <Button onClick={copyReferralLink}>
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={() => shareOnSocial('whatsapp')} className="bg-green-600 hover:bg-green-700">
                Share on WhatsApp
              </Button>
              <Button onClick={() => shareOnSocial('facebook')} className="bg-blue-600 hover:bg-blue-700">
                Share on Facebook
              </Button>
              <Button onClick={() => shareOnSocial('twitter')} className="bg-sky-500 hover:bg-sky-600">
                Share on Twitter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Invitation */}
      <Card>
        <CardHeader>
          <CardTitle>Send Email Invitation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter friend's email address"
              value={newReferralEmail}
              onChange={(e) => setNewReferralEmail(e.target.value)}
              type="email"
            />
            <Button onClick={sendReferralInvite} disabled={!newReferralEmail}>
              Send Invite
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Referral History */}
      <Card>
        <CardHeader>
          <CardTitle>Your Referral History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {referrals.map((referral) => (
              <div key={referral.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="font-semibold">{referral.referredName}</h4>
                    <p className="text-sm text-gray-600">{referral.referredEmail}</p>
                  </div>
                  <Badge className={getStatusColor(referral.status)}>
                    {referral.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Invited:</span>
                    <div className="font-medium">{referral.createdAt.toLocaleDateString()}</div>
                  </div>
                  {referral.confirmedAt && (
                    <div>
                      <span className="text-gray-600">Booked:</span>
                      <div className="font-medium">{referral.confirmedAt.toLocaleDateString()}</div>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-600">Booking Value:</span>
                    <div className="font-medium">{referral.bookingAmount ? `${referral.bookingAmount} MAD` : 'Pending'}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Your Reward:</span>
                    <div className="font-medium text-green-600">{referral.rewardAmount ? `${referral.rewardAmount} MAD` : 'Pending'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Program Details */}
      <Card>
        <CardHeader>
          <CardTitle>Program Terms & Benefits</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Your Benefits</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Earn 10% of every confirmed booking</li>
                <li>• No limit on number of referrals</li>
                <li>• Rewards credited within 48 hours of activity completion</li>
                <li>• Use earned credits for future bookings</li>
                <li>• Special bonus for 5+ successful referrals</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Friend Benefits</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• 10% discount on first booking</li>
                <li>• Priority customer support</li>
                <li>• Access to exclusive experiences</li>
                <li>• Welcome gift on first activity</li>
                <li>• Invitation to referrer rewards program</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Referral rewards are credited after the referred customer completes their activity</li>
              <li>• Self-referrals and duplicate accounts are not permitted</li>
              <li>• Rewards expire 12 months from issue date if unused</li>
              <li>• Program terms subject to change with 30 days notice</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Leaderboard */}
      {stats && (
        <Card>
          <CardHeader>
            <CardTitle>Top Referrers This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gold-50 border border-gold-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gold-500 text-white rounded-full flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <div className="font-semibold">{stats.topReferrer}</div>
                    <div className="text-sm text-gray-600">12 confirmed referrals</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gold-600">2,840 MAD</div>
                  <div className="text-sm text-gray-600">earned</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <div className="font-semibold">David Brown</div>
                    <div className="text-sm text-gray-600">8 confirmed referrals</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-gray-600">1,920 MAD</div>
                  <div className="text-sm text-gray-600">earned</div>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <div className="font-semibold">Maria Rodriguez</div>
                    <div className="text-sm text-gray-600">6 confirmed referrals</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-amber-600">1,560 MAD</div>
                  <div className="text-sm text-gray-600">earned</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}