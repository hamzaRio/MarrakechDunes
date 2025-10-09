import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Users, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Activity,
  FileText,
  Download,
  Plus,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  CheckCircle,
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
  Minus
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { marketIntelligence, type MarketInsights, type MarketActivity, type CompetitorData, type OpportunityData } from '@/lib/superior-market-intelligence';

interface DashboardStats {
  totalBookings: number;
  totalRevenue: number;
  activeActivities: number;
  customerRating: number;
  monthlyGrowth: number;
  marketPosition: string;
  competitorCount: number;
  priceOptimization: number;
}

interface Booking {
  id: string;
  customerName: string;
  activityName: string;
  date: string;
  price: number;
  status: 'confirmed' | 'pending' | 'cancelled';
  source: string;
  profit: number;
}

interface Activity {
  id: string;
  name: string;
  price: number;
  bookings: number;
  revenue: number;
  rating: number;
  category: string;
  marketPosition: string;
  competitorCount: number;
  priceOptimization: number;
}

// Superior price formatter with market intelligence
const formatPrice = (price: number, currency: string = 'MAD'): string => {
  return `${price.toLocaleString()} ${currency}`;
};

// Advanced API fetch with retry logic
const apiFetch = async (url: string, retries: number = 3): Promise<any> => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};

export default function SuperiorAdminDashboard() {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [stats, setStats] = useState<DashboardStats>({
    totalBookings: 0,
    totalRevenue: 0,
    activeActivities: 0,
    customerRating: 0,
    monthlyGrowth: 0,
    marketPosition: 'Unknown',
    competitorCount: 0,
    priceOptimization: 0
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [marketInsights, setMarketInsights] = useState<MarketInsights | null>(null);
  const [competitorData, setCompetitorData] = useState<CompetitorData | null>(null);
  const [opportunities, setOpportunities] = useState<OpportunityData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [researchQuery, setResearchQuery] = useState('');
  const [isResearching, setIsResearching] = useState(false);
  const { toast } = useToast();

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load stats
      const statsData = await apiFetch('/api/admin/dashboard/stats');
      setStats(statsData);
      
      // Load bookings
      const bookingsData = await apiFetch('/api/admin/bookings');
      setBookings(bookingsData);
      
      // Load activities
      const activitiesData = await apiFetch('/api/admin/activities/all');
      setActivities(activitiesData);
      
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Advanced market research
  const handleMarketResearch = async () => {
    if (!researchQuery.trim()) return;
    
    setIsResearching(true);
    try {
      console.log(`[Superior Dashboard] Researching: ${researchQuery}`);
      
      const [insights, competitors] = await Promise.all([
        marketIntelligence.researchMarket(researchQuery, 'Morocco'),
        marketIntelligence.analyzeCompetitors(researchQuery)
      ]);
      
      setMarketInsights(insights);
      setCompetitorData(competitors);
      
      // Get pricing opportunities
      const pricingOpps = await marketIntelligence.getPricingRecommendations(researchQuery, 200);
      setOpportunities(pricingOpps);
      
      toast({
        title: "Market Research Complete",
        description: `Found ${insights.totalActivities} activities and ${competitors.competitors.length} competitors`,
      });
      
    } catch (error: any) {
      console.error('Market research failed:', error);
      toast({
        title: "Research Failed",
        description: error.message || "Market research failed",
        variant: "destructive",
      });
    } finally {
      setIsResearching(false);
    }
  };

  // Export PDF with advanced features
  const handleExportPDF = async (type: 'bookings' | 'operations' | 'market-analysis') => {
    try {
      const response = await fetch(`/api/admin/export/${type}/pdf`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-report.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: `${type} report exported as PDF`,
      });
    } catch (error: any) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: error.message || "Failed to export PDF",
        variant: "destructive",
      });
    }
  };

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         booking.activityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || booking.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredActivities = activities.filter(activity => 
    activity.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading superior dashboard...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-red-500" />
        <div className="ml-2">
          <p className="text-red-500">Error: {error}</p>
          <Button onClick={loadDashboardData} className="mt-2">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Superior Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="h-8 w-8 text-blue-600" />
            Superior Admin Dashboard
          </h1>
          <p className="text-gray-600">Advanced market intelligence & business management</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExportPDF('market-analysis')}
            variant="outline"
            className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
          >
            <Brain className="h-4 w-4 mr-2" />
            Export Market Analysis
          </Button>
          <Button
            onClick={() => handleExportPDF('bookings')}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Bookings
          </Button>
        </div>
      </div>

      {/* Market Research Section */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Globe className="h-5 w-5" />
            Advanced Market Research
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="research-query">Research Activity or Category</Label>
              <Input
                id="research-query"
                placeholder="e.g., Desert tours, Hot air balloon, Cultural experiences"
                value={researchQuery}
                onChange={(e) => setResearchQuery(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleMarketResearch}
                disabled={isResearching}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isResearching ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {isResearching ? 'Researching...' : 'Research Market'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Superior Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.totalBookings}</div>
            <p className="text-xs text-green-600">
              +{stats.monthlyGrowth}% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-blue-600">
              Average: {stats.totalBookings > 0 ? formatPrice(Math.round(stats.totalRevenue / stats.totalBookings)) : '0 MAD'} per booking
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Market Position</CardTitle>
            <Target className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 capitalize">{stats.marketPosition}</div>
            <p className="text-xs text-purple-600">
              {stats.competitorCount} competitors analyzed
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Price Optimization</CardTitle>
            <Zap className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats.priceOptimization}%</div>
            <p className="text-xs text-orange-600">
              Potential revenue increase
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Market Intelligence Results */}
      {marketInsights && (
        <Card className="border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-indigo-800">
              <Brain className="h-5 w-5" />
              Market Intelligence Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-indigo-900">{marketInsights.totalActivities}</div>
                <div className="text-sm text-indigo-600">Total Activities Found</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-indigo-900">{formatPrice(marketInsights.averagePrice)}</div>
                <div className="text-sm text-indigo-600">Average Market Price</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg">
                <div className="text-2xl font-bold text-indigo-900">{marketInsights.priceOpportunities.length}</div>
                <div className="text-sm text-indigo-600">Pricing Opportunities</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Opportunities */}
      {opportunities.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <TrendingUp className="h-5 w-5" />
              Pricing Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {opportunities.map((opp, index) => (
                <div key={index} className="p-4 bg-white rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-yellow-900">{opp.activity}</h4>
                      <p className="text-sm text-yellow-700">{opp.reasoning}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-yellow-900">
                        {formatPrice(opp.suggestedPrice)}
                      </div>
                      <div className="text-sm text-yellow-600">
                        +{formatPrice(opp.potentialIncrease)} potential
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="market">Market Intelligence</TabsTrigger>
          <TabsTrigger value="analytics">Advanced Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Recent Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bookings.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{booking.customerName}</p>
                        <p className="text-sm text-gray-600">{booking.activityName}</p>
                        <p className="text-xs text-gray-500">Source: {booking.source}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(booking.price)}</p>
                        <p className="text-sm text-green-600">Profit: {formatPrice(booking.profit)}</p>
                        <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                          {booking.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Activity Performance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Activity Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activities.slice(0, 5).map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{activity.name}</p>
                        <p className="text-sm text-gray-600">{activity.bookings} bookings</p>
                        <p className="text-xs text-gray-500">Category: {activity.category}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{formatPrice(activity.revenue)}</p>
                        <p className="text-sm text-gray-600">⭐ {activity.rating}/5</p>
                        <Badge variant="outline" className="text-xs">
                          {activity.marketPosition}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="market" className="space-y-4">
          {marketInsights ? (
            <div className="space-y-6">
              {/* Market Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Market Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{marketInsights.totalActivities}</div>
                      <div className="text-sm text-gray-600">Total Activities</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{formatPrice(marketInsights.averagePrice)}</div>
                      <div className="text-sm text-gray-600">Average Price</div>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold">{formatPrice(marketInsights.priceRange.min)} - {formatPrice(marketInsights.priceRange.max)}</div>
                      <div className="text-sm text-gray-600">Price Range</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Top Categories */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Categories</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {marketInsights.topCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-600">{category.count} activities</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{formatPrice(category.averagePrice)}</p>
                          <p className="text-sm text-gray-600">{category.growth > 0 ? '+' : ''}{category.growth}% growth</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">Start market research to see intelligence data</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Business Intelligence</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Market Share</span>
                    <span className="font-medium">{competitorData?.marketShare || 0}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Position</span>
                    <span className="font-medium capitalize">{competitorData?.marketPosition || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Competitor Count</span>
                    <span className="font-medium">{competitorData?.competitors.length || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Price Trend</span>
                    <span className="font-medium capitalize">{competitorData?.priceTrend || 'Unknown'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Conversion Rate</span>
                    <span className="font-medium">12.5%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Booking Value</span>
                    <span className="font-medium">{formatPrice(450)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Customer Satisfaction</span>
                    <span className="font-medium">4.8/5</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Revenue Growth</span>
                    <span className="font-medium text-green-600">+15.3%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
