import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  Lightbulb, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Users,
  Calendar,
  Star,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  MapPin
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface StrategicInsight {
  id: string;
  type: 'opportunity' | 'strength' | 'warning' | 'recommendation';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  priority: 'urgent' | 'important' | 'nice-to-have';
  category: 'revenue' | 'operations' | 'marketing' | 'customer';
  metrics?: {
    current: number;
    potential: number;
    unit: string;
  };
  actionItems?: string[];
}

interface StrategicInsightsData {
  insights: StrategicInsight[];
  marketTrends: {
    seasonality: Array<{ month: string; factor: number }>;
    competitorAnalysis: Array<{ metric: string; ourValue: number; marketAvg: number }>;
  };
  recommendations: Array<{
    title: string;
    description: string;
    expectedImpact: string;
    effort: 'low' | 'medium' | 'high';
    timeline: string;
  }>;
}

export default function StrategicInsightsDashboard() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');

  // Mock strategic insights data (in production, this would come from AI analysis)
  const { data: insightsData, isLoading } = useQuery<StrategicInsightsData>({
    queryKey: ["/admin/strategic-insights"],
    queryFn: async () => {
      // Mock data - in production, this would be AI-generated insights
      return {
        insights: [
          {
            id: '1',
            type: 'opportunity',
            title: 'Hot Air Balloon Premium Pricing',
            description: 'Hot Air Balloon activity shows 40% higher customer satisfaction and could support 20% price increase',
            impact: 'high',
            priority: 'important',
            category: 'revenue',
            metrics: {
              current: 800,
              potential: 960,
              unit: 'MAD'
            },
            actionItems: [
              'Implement premium pricing tier',
              'Add exclusive sunrise/sunset options',
              'Create VIP package with photography'
            ]
          },
          {
            id: '2',
            type: 'strength',
            title: 'Excellent Customer Retention',
            description: '85% of customers rate experience 4.5+ stars, indicating strong service quality',
            impact: 'high',
            priority: 'important',
            category: 'customer',
            metrics: {
              current: 4.7,
              potential: 4.9,
              unit: 'stars'
            }
          },
          {
            id: '3',
            type: 'warning',
            title: 'Seasonal Revenue Fluctuation',
            description: 'Revenue drops 30% in summer months due to heat. Need diversification strategy',
            impact: 'medium',
            priority: 'urgent',
            category: 'operations',
            actionItems: [
              'Add indoor/evening activities',
              'Develop summer-specific packages',
              'Partner with air-conditioned venues'
            ]
          },
          {
            id: '4',
            type: 'recommendation',
            title: 'WhatsApp Marketing Automation',
            description: 'Implement automated WhatsApp campaigns to increase repeat bookings by 25%',
            impact: 'medium',
            priority: 'important',
            category: 'marketing',
            actionItems: [
              'Set up automated follow-up messages',
              'Create seasonal promotion campaigns',
              'Implement referral program'
            ]
          }
        ],
        marketTrends: {
          seasonality: [
            { month: 'Jan', factor: 0.8 },
            { month: 'Feb', factor: 0.9 },
            { month: 'Mar', factor: 1.1 },
            { month: 'Apr', factor: 1.2 },
            { month: 'May', factor: 1.3 },
            { month: 'Jun', factor: 0.7 },
            { month: 'Jul', factor: 0.6 },
            { month: 'Aug', factor: 0.7 },
            { month: 'Sep', factor: 1.0 },
            { month: 'Oct', factor: 1.1 },
            { month: 'Nov', factor: 0.9 },
            { month: 'Dec', factor: 0.8 }
          ],
          competitorAnalysis: [
            { metric: 'Average Price', ourValue: 750, marketAvg: 800 },
            { metric: 'Customer Rating', ourValue: 4.7, marketAvg: 4.2 },
            { metric: 'Response Time', ourValue: 2, marketAvg: 4 },
            { metric: 'Activity Variety', ourValue: 5, marketAvg: 3 }
          ]
        },
        recommendations: [
          {
            title: 'Premium Experience Packages',
            description: 'Create tiered pricing with premium add-ons like professional photography and exclusive access',
            expectedImpact: '+25% revenue per booking',
            effort: 'medium',
            timeline: '2-3 months'
          },
          {
            title: 'Digital Marketing Expansion',
            description: 'Invest in Instagram and TikTok marketing to reach younger demographics',
            expectedImpact: '+40% new customer acquisition',
            effort: 'high',
            timeline: '3-6 months'
          },
          {
            title: 'Partnership Program',
            description: 'Partner with hotels and riads for referral programs and package deals',
            expectedImpact: '+30% booking volume',
            effort: 'medium',
            timeline: '1-2 months'
          }
        ]
      };
    }
  });

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return <TrendingUp className="h-5 w-5 text-green-500" />;
      case 'strength': return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'recommendation': return <Lightbulb className="h-5 w-5 text-purple-500" />;
      default: return <Target className="h-5 w-5 text-gray-500" />;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'opportunity': return 'border-green-200 bg-green-50';
      case 'strength': return 'border-blue-200 bg-blue-50';
      case 'warning': return 'border-orange-200 bg-orange-50';
      case 'recommendation': return 'border-purple-200 bg-purple-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'important': return 'bg-yellow-100 text-yellow-800';
      case 'nice-to-have': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  const filteredInsights = insightsData?.insights.filter(insight => {
    const categoryMatch = selectedCategory === 'all' || insight.category === selectedCategory;
    const priorityMatch = selectedPriority === 'all' || insight.priority === selectedPriority;
    return categoryMatch && priorityMatch;
  }) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Strategic Insights</h2>
          <p className="text-gray-600">AI-powered business intelligence and recommendations</p>
        </div>
      </div>

      {/* Market Position */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-500" />
              Market Position
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insightsData?.marketTrends.competitorAnalysis.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.metric}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold">{item.ourValue}</span>
                    <span className="text-xs text-gray-500">vs {item.marketAvg} avg</span>
                    <Badge variant={item.ourValue > item.marketAvg ? "default" : "secondary"}>
                      {item.ourValue > item.marketAvg ? "Leading" : "Below Avg"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Seasonal Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insightsData?.marketTrends.seasonality.map((month, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium w-12">{month.month}</span>
                  <div className="flex-1 mx-3">
                    <Progress value={month.factor * 100} className="h-2" />
                  </div>
                  <span className="text-sm text-gray-600 w-12 text-right">
                    {(month.factor * 100).toFixed(0)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insightsData?.recommendations.map((rec, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <h4 className="font-semibold mb-2">{rec.title}</h4>
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-600 font-medium">Impact:</span>
                    <span>{rec.expectedImpact}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-blue-600 font-medium">Effort:</span>
                    <Badge variant="outline" className="text-xs">
                      {rec.effort}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-purple-600 font-medium">Timeline:</span>
                    <span>{rec.timeline}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredInsights.map((insight) => (
              <div key={insight.id} className={`p-4 border rounded-lg ${getInsightColor(insight.type)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-semibold">{insight.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={getPriorityColor(insight.priority)}>
                      {insight.priority}
                    </Badge>
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact} impact
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                
                {insight.metrics && (
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-sm">
                      <span className="text-gray-600">Current: </span>
                      <span className="font-semibold">{insight.metrics.current} {insight.metrics.unit}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-600">Potential: </span>
                      <span className="font-semibold text-green-600">{insight.metrics.potential} {insight.metrics.unit}</span>
                    </div>
                  </div>
                )}
                
                {insight.actionItems && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium mb-2">Action Items:</h5>
                    <ul className="space-y-1">
                      {insight.actionItems.map((item, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center gap-2">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full"></div>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
