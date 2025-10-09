import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Brain,
  Globe,
  Shield,
  Star,
  Clock,
  MapPin,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  DollarSign,
  Users,
  Activity,
  Calendar,
  FileText,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  Award,
  TrendingUp as Growth
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BusinessMetrics {
  revenue: number;
  growth: number;
  marketShare: number;
  customerSatisfaction: number;
  conversionRate: number;
  averageOrderValue: number;
  customerLifetimeValue: number;
  churnRate: number;
  netPromoterScore: number;
  operationalEfficiency: number;
}

interface CompetitiveAnalysis {
  ourPosition: string;
  competitorCount: number;
  priceAdvantage: number;
  qualityAdvantage: number;
  marketGaps: string[];
  opportunities: string[];
  threats: string[];
}

interface MarketTrends {
  seasonalPatterns: SeasonalData[];
  priceTrends: PriceTrendData[];
  demandForecast: DemandData[];
  customerBehavior: BehaviorData[];
}

interface SeasonalData {
  month: string;
  revenue: number;
  bookings: number;
  demand: 'low' | 'medium' | 'high';
}

interface PriceTrendData {
  period: string;
  ourPrice: number;
  marketAverage: number;
  competitorMin: number;
  competitorMax: number;
}

interface DemandData {
  period: string;
  predicted: number;
  confidence: number;
  factors: string[];
}

interface BehaviorData {
  segment: string;
  percentage: number;
  characteristics: string[];
  recommendations: string[];
}

export default function AdvancedBusinessIntelligence() {
  const [metrics, setMetrics] = useState<BusinessMetrics>({
    revenue: 0,
    growth: 0,
    marketShare: 0,
    customerSatisfaction: 0,
    conversionRate: 0,
    averageOrderValue: 0,
    customerLifetimeValue: 0,
    churnRate: 0,
    netPromoterScore: 0,
    operationalEfficiency: 0
  });
  const [competitiveAnalysis, setCompetitiveAnalysis] = useState<CompetitiveAnalysis>({
    ourPosition: 'Unknown',
    competitorCount: 0,
    priceAdvantage: 0,
    qualityAdvantage: 0,
    marketGaps: [],
    opportunities: [],
    threats: []
  });
  const [marketTrends, setMarketTrends] = useState<MarketTrends>({
    seasonalPatterns: [],
    priceTrends: [],
    demandForecast: [],
    customerBehavior: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessIntelligence();
  }, []);

  const loadBusinessIntelligence = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate loading business intelligence data
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Load metrics
      setMetrics({
        revenue: 125000,
        growth: 15.3,
        marketShare: 12.5,
        customerSatisfaction: 4.8,
        conversionRate: 12.5,
        averageOrderValue: 450,
        customerLifetimeValue: 1200,
        churnRate: 8.2,
        netPromoterScore: 65,
        operationalEfficiency: 78.5
      });
      
      // Load competitive analysis
      setCompetitiveAnalysis({
        ourPosition: 'Premium',
        competitorCount: 15,
        priceAdvantage: -5.2,
        qualityAdvantage: 12.8,
        marketGaps: [
          'Adventure tours for solo travelers',
          'Luxury cultural experiences',
          'Sustainable tourism options'
        ],
        opportunities: [
          'Expand to digital experiences',
          'Partner with luxury hotels',
          'Develop eco-tourism packages'
        ],
        threats: [
          'New competitors entering market',
          'Economic downturn affecting travel',
          'Regulatory changes in tourism'
        ]
      });
      
      // Load market trends
      setMarketTrends({
        seasonalPatterns: generateSeasonalData(),
        priceTrends: generatePriceTrends(),
        demandForecast: generateDemandForecast(),
        customerBehavior: generateBehaviorData()
      });
      
    } catch (err: any) {
      console.error('Error loading business intelligence:', err);
      setError(err.message || 'Failed to load business intelligence');
      toast({
        title: "Error",
        description: "Failed to load business intelligence data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateSeasonalData = (): SeasonalData[] => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.map(month => ({
      month,
      revenue: Math.random() * 20000 + 8000,
      bookings: Math.floor(Math.random() * 100) + 20,
      demand: Math.random() > 0.6 ? 'high' : Math.random() > 0.3 ? 'medium' : 'low'
    }));
  };

  const generatePriceTrends = (): PriceTrendData[] => {
    const periods = ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024'];
    return periods.map(period => ({
      period,
      ourPrice: Math.random() * 100 + 200,
      marketAverage: Math.random() * 100 + 180,
      competitorMin: Math.random() * 50 + 150,
      competitorMax: Math.random() * 100 + 250
    }));
  };

  const generateDemandForecast = (): DemandData[] => {
    const periods = ['Next Month', 'Next Quarter', 'Next 6 Months', 'Next Year'];
    return periods.map(period => ({
      period,
      predicted: Math.random() * 50 + 25,
      confidence: Math.random() * 30 + 70,
      factors: ['Seasonal trends', 'Economic indicators', 'Tourism growth']
    }));
  };

  const generateBehaviorData = (): BehaviorData[] => {
    return [
      {
        segment: 'Luxury Travelers',
        percentage: 25,
        characteristics: ['High spending', 'Quality focused', 'Experience seekers'],
        recommendations: ['Premium packages', 'Exclusive access', 'Personalized service']
      },
      {
        segment: 'Budget Travelers',
        percentage: 35,
        characteristics: ['Price sensitive', 'Group bookings', 'Value focused'],
        recommendations: ['Group discounts', 'Basic packages', 'Cost-effective options']
      },
      {
        segment: 'Adventure Seekers',
        percentage: 20,
        characteristics: ['Active lifestyle', 'Unique experiences', 'Social media active'],
        recommendations: ['Adventure packages', 'Instagram-worthy moments', 'Group activities']
      },
      {
        segment: 'Cultural Enthusiasts',
        percentage: 20,
        characteristics: ['Education focused', 'Local experiences', 'Authentic interactions'],
        recommendations: ['Cultural immersion', 'Local guides', 'Educational content']
      }
    ];
  };

  const formatCurrency = (amount: number): string => {
    return `${amount.toLocaleString()} MAD`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpRight className="h-4 w-4 text-green-600" />;
    if (value < 0) return <ArrowDownRight className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-600" />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading business intelligence...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="ml-2">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={loadBusinessIntelligence} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-purple-600" />
            Advanced Business Intelligence
          </h1>
          <p className="text-gray-600">Comprehensive business analytics and insights</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {/* Export functionality */}}
            variant="outline"
            className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{formatCurrency(metrics.revenue)}</div>
            <div className="flex items-center text-xs text-green-600">
              {getTrendIcon(metrics.growth)}
              <span className="ml-1">+{formatPercentage(metrics.growth)} growth</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Market Share</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatPercentage(metrics.marketShare)}</div>
            <div className="text-xs text-blue-600">
              {competitiveAnalysis.competitorCount} competitors
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Customer Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{metrics.customerSatisfaction}/5</div>
            <div className="text-xs text-purple-600">
              NPS: {metrics.netPromoterScore}
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Operational Efficiency</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{formatPercentage(metrics.operationalEfficiency)}</div>
            <div className="text-xs text-orange-600">
              Process optimization
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="competitive">Competitive Analysis</TabsTrigger>
          <TabsTrigger value="trends">Market Trends</TabsTrigger>
          <TabsTrigger value="customers">Customer Insights</TabsTrigger>
          <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Business Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Conversion Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatPercentage(metrics.conversionRate)}</span>
                      {getTrendIcon(2.1)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Order Value</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(metrics.averageOrderValue)}</span>
                      {getTrendIcon(5.3)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Customer Lifetime Value</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(metrics.customerLifetimeValue)}</span>
                      {getTrendIcon(8.7)}
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Churn Rate</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatPercentage(metrics.churnRate)}</span>
                      {getTrendIcon(-1.2)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Position */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Market Position
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-gray-900 capitalize">{competitiveAnalysis.ourPosition}</div>
                    <div className="text-sm text-gray-600">Market Position</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <div className="text-lg font-bold text-blue-900">{formatPercentage(competitiveAnalysis.priceAdvantage)}</div>
                      <div className="text-xs text-blue-600">Price Advantage</div>
                    </div>
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-lg font-bold text-green-900">{formatPercentage(competitiveAnalysis.qualityAdvantage)}</div>
                      <div className="text-xs text-green-600">Quality Advantage</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="competitive" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Market Gaps */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Market Gaps
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitiveAnalysis.marketGaps.map((gap, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                      <p className="font-medium text-yellow-900">{gap}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitiveAnalysis.opportunities.map((opportunity, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-green-50 border-green-200">
                      <p className="font-medium text-green-900">{opportunity}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Threats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Threats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {competitiveAnalysis.threats.map((threat, index) => (
                    <div key={index} className="p-3 border rounded-lg bg-red-50 border-red-200">
                      <p className="font-medium text-red-900">{threat}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seasonal Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Seasonal Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketTrends.seasonalPatterns.slice(0, 6).map((pattern, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{pattern.month}</p>
                        <p className="text-sm text-gray-600">{pattern.bookings} bookings</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatCurrency(pattern.revenue)}</p>
                        <Badge variant={pattern.demand === 'high' ? 'default' : 'secondary'}>
                          {pattern.demand}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Price Trends */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Price Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {marketTrends.priceTrends.map((trend, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{trend.period}</span>
                        <span className="text-sm text-gray-600">Our Price: {formatCurrency(trend.ourPrice)}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Market Avg: {formatCurrency(trend.marketAverage)} | 
                        Range: {formatCurrency(trend.competitorMin)} - {formatCurrency(trend.competitorMax)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Customer Segments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketTrends.customerBehavior.map((segment, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">{segment.segment}</h4>
                      <Badge variant="outline">{segment.percentage}%</Badge>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Characteristics:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {segment.characteristics.map((char, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">{char}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Recommendations:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {segment.recommendations.map((rec, i) => (
                            <Badge key={i} variant="outline" className="text-xs">{rec}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forecasting" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Demand Forecasting
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {marketTrends.demandForecast.map((forecast, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{forecast.period}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">{forecast.predicted}%</span>
                        <Badge variant="outline">{forecast.confidence.toFixed(0)}% confidence</Badge>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Key Factors:</p>
                      <div className="flex flex-wrap gap-1">
                        {forecast.factors.map((factor, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{factor}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
