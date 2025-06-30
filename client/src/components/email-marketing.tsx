import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Send, Users, TrendingUp, Calendar, Target } from "lucide-react";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'welcome' | 'booking_confirmation' | 'follow_up' | 'promotion' | 'newsletter';
  status: 'draft' | 'scheduled' | 'sent';
  recipients: number;
  openRate: number;
  clickRate: number;
  scheduledDate?: Date;
  sentDate?: Date;
}

interface EmailTemplate {
  id: string;
  name: string;
  type: string;
  subject: string;
  content: string;
  variables: string[];
}

interface CustomerSegment {
  id: string;
  name: string;
  criteria: string;
  count: number;
  description: string;
}

export default function EmailMarketing() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [newCampaign, setNewCampaign] = useState({
    name: '',
    subject: '',
    content: '',
    type: 'newsletter' as const,
    segmentId: ''
  });

  useEffect(() => {
    loadCampaigns();
    loadTemplates();
    loadSegments();
  }, []);

  const loadCampaigns = () => {
    const mockCampaigns: EmailCampaign[] = [
      {
        id: '1',
        name: 'Spring Season Launch',
        subject: 'Discover Morocco\'s Best Season - 15% Off All Activities',
        content: 'Spring is here! Perfect weather for all our outdoor adventures...',
        type: 'promotion',
        status: 'sent',
        recipients: 2847,
        openRate: 32.5,
        clickRate: 8.7,
        sentDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      },
      {
        id: '2',
        name: 'Booking Confirmation Follow-up',
        subject: 'Get Ready for Your Moroccan Adventure!',
        content: 'Your booking is confirmed. Here\'s what to expect...',
        type: 'booking_confirmation',
        status: 'sent',
        recipients: 156,
        openRate: 78.2,
        clickRate: 23.4,
        sentDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
      },
      {
        id: '3',
        name: 'Summer Low Season Deals',
        subject: 'Beat the Heat with Our Best Prices - 30% Off',
        content: 'Summer special offers for early morning adventures...',
        type: 'promotion',
        status: 'scheduled',
        recipients: 1823,
        openRate: 0,
        clickRate: 0,
        scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: '4',
        name: 'Welcome New Subscribers',
        subject: 'Welcome to MarrakechDunes - Your Adventure Begins Here',
        content: 'Thank you for joining us! Here\'s your welcome discount...',
        type: 'welcome',
        status: 'draft',
        recipients: 0,
        openRate: 0,
        clickRate: 0
      }
    ];
    setCampaigns(mockCampaigns);
  };

  const loadTemplates = () => {
    const mockTemplates: EmailTemplate[] = [
      {
        id: '1',
        name: 'Booking Confirmation',
        type: 'booking_confirmation',
        subject: 'Your {{activity_name}} booking is confirmed!',
        content: `Dear {{customer_name}},

Your booking for {{activity_name}} is confirmed!

Booking Details:
- Date: {{booking_date}}
- Time: {{booking_time}}
- Number of people: {{number_of_people}}
- Total amount: {{total_amount}} MAD

What to expect:
- Hotel pickup will be arranged
- Professional guide included
- All equipment provided
- Meals included (where applicable)

Need to contact us? Reply to this email or WhatsApp +212600623630

Best regards,
MarrakechDunes Team`,
        variables: ['customer_name', 'activity_name', 'booking_date', 'booking_time', 'number_of_people', 'total_amount']
      },
      {
        id: '2',
        name: 'Seasonal Promotion',
        type: 'promotion',
        subject: '{{season}} Special - {{discount}}% Off All Activities',
        content: `Hello {{customer_name}},

{{season}} is the perfect time to explore Morocco!

🎯 Special Offer: {{discount}}% off all activities
📅 Valid until: {{expiry_date}}
🎁 Use code: {{promo_code}}

Our most popular {{season}} activities:
• Hot Air Balloon Rides - Perfect weather conditions
• Desert Experiences - Comfortable temperatures
• Day Trips - Crystal clear mountain views

Book now: marrakechdunes.com

Limited time offer - Don't miss out!

MarrakechDunes Team`,
        variables: ['customer_name', 'season', 'discount', 'expiry_date', 'promo_code']
      },
      {
        id: '3',
        name: 'Post-Activity Follow-up',
        type: 'follow_up',
        subject: 'How was your {{activity_name}} experience?',
        content: `Dear {{customer_name}},

We hope you had an amazing time on your {{activity_name}} adventure!

Would you mind sharing your experience with a quick review?
⭐ Leave a review: {{review_link}}

As a thank you, here's 10% off your next booking: {{discount_code}}

Planning your next adventure? Check out:
• {{recommended_activity_1}}
• {{recommended_activity_2}}
• {{recommended_activity_3}}

Thank you for choosing MarrakechDunes!

Best regards,
The Team`,
        variables: ['customer_name', 'activity_name', 'review_link', 'discount_code', 'recommended_activity_1', 'recommended_activity_2', 'recommended_activity_3']
      }
    ];
    setTemplates(mockTemplates);
  };

  const loadSegments = () => {
    const mockSegments: CustomerSegment[] = [
      {
        id: '1',
        name: 'First-time Visitors',
        criteria: 'Customers with 0 previous bookings',
        count: 1247,
        description: 'New subscribers who haven\'t booked yet'
      },
      {
        id: '2',
        name: 'Repeat Customers',
        criteria: 'Customers with 2+ bookings',
        count: 456,
        description: 'Loyal customers for VIP offers'
      },
      {
        id: '3',
        name: 'High-Value Customers',
        criteria: 'Total spent > 10,000 MAD',
        count: 123,
        description: 'Premium customers for exclusive experiences'
      },
      {
        id: '4',
        name: 'Inactive Customers',
        criteria: 'No activity in last 12 months',
        count: 789,
        description: 'Re-engagement campaigns'
      },
      {
        id: '5',
        name: 'French Speakers',
        criteria: 'Language preference: French',
        count: 1834,
        description: 'French content and promotions'
      },
      {
        id: '6',
        name: 'Adventure Lovers',
        criteria: 'Booked adventure activities',
        count: 967,
        description: 'Desert and balloon ride enthusiasts'
      }
    ];
    setSegments(mockSegments);
  };

  const createCampaign = () => {
    if (!newCampaign.name || !newCampaign.subject || !newCampaign.content) return;

    const campaign: EmailCampaign = {
      id: Date.now().toString(),
      ...newCampaign,
      status: 'draft',
      recipients: 0,
      openRate: 0,
      clickRate: 0
    };

    setCampaigns(prev => [campaign, ...prev]);
    setNewCampaign({
      name: '',
      subject: '',
      content: '',
      type: 'newsletter',
      segmentId: ''
    });
  };

  const sendCampaign = (campaignId: string) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { 
            ...campaign, 
            status: 'sent' as const,
            sentDate: new Date(),
            recipients: Math.floor(Math.random() * 2000) + 500
          }
        : campaign
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'welcome': return '👋';
      case 'booking_confirmation': return '✅';
      case 'follow_up': return '📧';
      case 'promotion': return '🎁';
      default: return '📰';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Email Marketing</h2>
        <Button>
          <Mail className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Subscribers</p>
                <p className="text-2xl font-bold">4,237</p>
                <p className="text-xs text-green-600">+12% this month</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Open Rate</p>
                <p className="text-2xl font-bold">35.8%</p>
                <p className="text-xs text-green-600">Above industry avg</p>
              </div>
              <Mail className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Click Rate</p>
                <p className="text-2xl font-bold">12.4%</p>
                <p className="text-xs text-green-600">+2.1% vs last month</p>
              </div>
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Revenue Generated</p>
                <p className="text-2xl font-bold">89,500 MAD</p>
                <p className="text-xs text-green-600">From email campaigns</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create New Campaign */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Campaign</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                placeholder="Campaign name"
                value={newCampaign.name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, name: e.target.value }))}
              />
              <Select value={newCampaign.type} onValueChange={(value: any) => setNewCampaign(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Campaign type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="promotion">Promotion</SelectItem>
                  <SelectItem value="welcome">Welcome</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                  <SelectItem value="booking_confirmation">Booking Confirmation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Input
              placeholder="Email subject line"
              value={newCampaign.subject}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, subject: e.target.value }))}
            />
            
            <Textarea
              placeholder="Email content..."
              value={newCampaign.content}
              onChange={(e) => setNewCampaign(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
            />
            
            <div className="flex gap-2">
              <Button onClick={createCampaign}>Create Campaign</Button>
              <Button variant="outline">Save as Template</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getTypeIcon(campaign.type)}</span>
                    <div>
                      <h4 className="font-semibold">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">{campaign.subject}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(campaign.status)}>
                      {campaign.status}
                    </Badge>
                    {campaign.status === 'draft' && (
                      <Button size="sm" onClick={() => sendCampaign(campaign.id)}>
                        <Send className="w-4 h-4 mr-1" />
                        Send
                      </Button>
                    )}
                  </div>
                </div>

                {campaign.status === 'sent' && (
                  <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 p-3 rounded">
                    <div>
                      <div className="font-bold text-blue-600">{campaign.recipients.toLocaleString()}</div>
                      <div className="text-xs text-gray-600">Recipients</div>
                    </div>
                    <div>
                      <div className="font-bold text-green-600">{campaign.openRate}%</div>
                      <div className="text-xs text-gray-600">Open Rate</div>
                    </div>
                    <div>
                      <div className="font-bold text-purple-600">{campaign.clickRate}%</div>
                      <div className="text-xs text-gray-600">Click Rate</div>
                    </div>
                  </div>
                )}

                {campaign.status === 'scheduled' && campaign.scheduledDate && (
                  <div className="bg-blue-50 p-3 rounded text-sm">
                    <Calendar className="w-4 h-4 inline mr-2" />
                    Scheduled for: {campaign.scheduledDate.toLocaleDateString()} at {campaign.scheduledDate.toLocaleTimeString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {segments.map((segment) => (
              <div key={segment.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{segment.name}</h4>
                  <Badge variant="outline">{segment.count.toLocaleString()}</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-2">{segment.description}</p>
                <p className="text-xs text-gray-500">{segment.criteria}</p>
                <Button size="sm" className="mt-3 w-full">Target Segment</Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Email Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Email Templates</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <div key={template.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold">{template.name}</h4>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{template.type}</Badge>
                    <Button size="sm" variant="outline">Use Template</Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-2">Subject: {template.subject}</p>
                <div className="text-xs text-gray-500">
                  Variables: {template.variables.map(v => `{{${v}}}`).join(', ')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Automation Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Email Automation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-semibold text-blue-700">Active Automations</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Welcome email: Sent immediately after subscription</li>
                <li>• Booking confirmation: Sent within 5 minutes of booking</li>
                <li>• Follow-up review request: Sent 3 days after activity</li>
                <li>• Abandoned cart: Sent 2 hours after incomplete booking</li>
                <li>• Birthday discount: Sent on customer's birthday</li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="font-semibold text-green-700">Performance Insights</h4>
              <ul className="space-y-2 text-sm text-gray-700">
                <li>• Booking confirmations: 78% open rate</li>
                <li>• Welcome emails: 65% open rate, 25% click rate</li>
                <li>• Review requests: 45% response rate</li>
                <li>• Promotional emails: 32% open rate, 12% click rate</li>
                <li>• Best send time: Tuesday-Thursday, 10 AM - 2 PM</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}