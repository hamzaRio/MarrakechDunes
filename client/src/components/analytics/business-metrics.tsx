import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Calendar, 
  Star,
  ShoppingCart,
  CreditCard,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, AreaChart, Area } from "recharts";

interface BusinessMetrics {
  revenue: {
    total: number;
    monthly: number;
    growth: number;
    target: number;
  };
  bookings: {
    total: number;
    confirmed: number;
    pending: number;
    cancelled: number;
    conversionRate: number;
  };
  customers: {
    total: number;
    new: number;
    returning: number;
    averageOrderValue: number;
    lifetimeValue: number;
  };
  activities: {
    total: number;
    popular: Array<{
      name: string;
      bookings: number;
      revenue: number;
    }>;
    performance: Array<{
      name: string;
      bookings: number;
      revenue: number;
      rating: number;
    }>;
  };
  trends: {
    revenue: Array<{
      date: string;
      amount: number;
      bookings: number;
    }>;
    bookings: Array<{
      date: string;
      bookings: number;
      revenue: number;
    }>;
    seasonal: Array<{
      month: string;
      bookings: number;
      revenue: number;
    }>;
  };
  goals: {
    monthlyRevenue: {
      target: number;
      current: number;
      percentage: number;
    };
    monthlyBookings: {
      target: number;
      current: number;
      percentage: number;
    };
    customerSatisfaction: {
      target: number;
      current: number;
      percentage: number;
    };
  };
}

export default function BusinessMetrics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  // Fetch business metrics
  const { data: metrics, isLoading } = useQuery<BusinessMetrics>({
    queryKey: ["/analytics/business", timeRange],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return "text-green-600";
    if (growth < 0) return "text-red-600";
    return "text-gray-600";
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <TrendingUp className="h-4 w-4" />;
    if (growth < 0) return <TrendingDown className="h-4 w-4" />;
    return <Activity className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Metrics</h2>
          <p className="text-gray-600">Revenue, bookings, and business performance insights</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : 
               range === '30d' ? '30 Days' : 
               range === '90d' ? '90 Days' : '1 Year'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.revenue?.total?.toLocaleString() || 0} MAD</div>
            <div className="flex items-center gap-1 text-xs">
              {getGrowthIcon(metrics?.revenue?.growth || 0)}
              <span className={getGrowthColor(metrics?.revenue?.growth || 0)}>
                {Math.abs(metrics?.revenue?.growth || 0)}% from last period
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.bookings?.total?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics?.bookings?.confirmed || 0} confirmed
            </p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.bookings?.conversionRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Visitors to bookings
            </p>
          </CardContent>
        </Card>

        {/* Average Order Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.customers?.averageOrderValue || 0} MAD</div>
            <p className="text-xs text-muted-foreground">
              Per booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Goals Progress */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Monthly Revenue Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{metrics?.goals?.monthlyRevenue?.percentage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(metrics?.goals?.monthlyRevenue?.percentage || 0, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{metrics?.goals?.monthlyRevenue?.current || 0} MAD</span>
                <span>{metrics?.goals?.monthlyRevenue?.target || 0} MAD</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Monthly Bookings Goal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{metrics?.goals?.monthlyBookings?.percentage || 0}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full" 
                  style={{ width: `${Math.min(metrics?.goals?.monthlyBookings?.percentage || 0, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>{metrics?.goals?.monthlyBookings?.current || 0} bookings</span>
                <span>{metrics?.goals?.monthlyBookings?.target || 0} bookings</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Rating</span>
                <span>{metrics?.goals?.customerSatisfaction?.current || 0}/5</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-yellow-500 h-2 rounded-full" 
                  style={{ width: `${(metrics?.goals?.customerSatisfaction?.current || 0) / 5 * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Current: {metrics?.goals?.customerSatisfaction?.current || 0}/5</span>
                <span>Target: {metrics?.goals?.customerSatisfaction?.target || 0}/5</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics?.trends?.revenue || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} MAD`, 'Revenue']} />
                    <Area type="monotone" dataKey="amount" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bookings" className="space-y-6">
          {/* Bookings Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={metrics?.trends?.bookings || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activities" className="space-y-6">
          {/* Popular Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Most Popular Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.activities?.popular?.slice(0, 10).map((activity, index) => (
                  <div key={activity.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{activity.name}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{activity.bookings} bookings</div>
                      <div className="text-sm text-gray-500">{activity.revenue.toLocaleString()} MAD</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Activity Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Activity Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.activities?.performance || []} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          {/* Seasonal Trends */}
          <Card>
            <CardHeader>
              <CardTitle>Seasonal Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metrics?.trends?.seasonal || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#8884d8" />
                    <Bar dataKey="revenue" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
