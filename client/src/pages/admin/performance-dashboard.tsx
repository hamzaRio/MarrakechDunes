import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Server, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Calendar,
  DollarSign,
  Target,
  Gauge,
  Monitor,
  BarChart3,
  PieChart as PieChartIcon,
  Settings,
  Wrench
} from 'lucide-react';

interface PerformanceMetrics {
  responseTime: {
    average: number;
    p95: number;
    p99: number;
    trend: 'up' | 'down' | 'stable';
  };
  bookingConversion: {
    rate: number;
    trend: 'up' | 'down' | 'stable';
    byActivity: Array<{ name: string; rate: number; }>;
  };
  systemHealth: {
    cpu: number;
    memory: number;
    database: number;
    uptime: number;
    status: 'healthy' | 'warning' | 'critical';
  };
  bookingFlow: {
    stepConversion: Array<{ step: string; rate: number; dropoff: number; }>;
    averageTime: number;
    abandonmentRate: number;
  };
  revenue: {
    hourly: Array<{ hour: string; amount: number; bookings: number; }>;
    daily: Array<{ date: string; amount: number; bookings: number; }>;
    byActivity: Array<{ name: string; revenue: number; bookings: number; }>;
  };
  customerInsights: {
    deviceTypes: Array<{ type: string; percentage: number; }>;
    countries: Array<{ country: string; bookings: number; }>;
    peakHours: Array<{ hour: number; bookings: number; }>;
  };
  optimizationSuggestions: Array<{
    category: string;
    priority: 'high' | 'medium' | 'low';
    suggestion: string;
    impact: string;
    effort: string;
  }>;
}

export default function PerformanceDashboard() {
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const { data: metrics, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/performance-metrics', timeRange],
    queryFn: async () => {
      const response = await fetch(`/api/admin/performance-metrics?range=${timeRange}`);
      return response.json() as PerformanceMetrics;
    },
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds
  });

  useEffect(() => {
    const interval = autoRefresh ? setInterval(() => refetch(), 30000) : null;
    return () => interval && clearInterval(interval);
  }, [autoRefresh, refetch]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={`loading-${i}`} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Performance Dashboard</h1>
          <p className="text-gray-600">Real-time booking system optimization and analytics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">Last Hour</SelectItem>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.responseTime.average || 0}ms</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(metrics?.responseTime.trend || 'stable')}
              <span className="ml-1">P95: {metrics?.responseTime.p95 || 0}ms</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.bookingConversion.rate || 0}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getTrendIcon(metrics?.bookingConversion.trend || 'stable')}
              <span className="ml-1">Booking success rate</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(metrics?.systemHealth.status || 'healthy')}`}>
              {metrics?.systemHealth.status?.toUpperCase() || 'HEALTHY'}
            </div>
            <div className="text-xs text-muted-foreground">
              CPU: {metrics?.systemHealth.cpu || 0}% | RAM: {metrics?.systemHealth.memory || 0}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Abandonment Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.bookingFlow.abandonmentRate || 0}%</div>
            <div className="text-xs text-muted-foreground">
              Avg time: {metrics?.bookingFlow.averageTime || 0}min
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="conversion">Conversion</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trends</CardTitle>
                <CardDescription>Average response time over the selected period</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metrics?.revenue.hourly || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="amount" stroke="#8884d8" name="Response Time (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>Current system utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>CPU Usage</span>
                    <span>{metrics?.systemHealth.cpu || 0}%</span>
                  </div>
                  <Progress value={metrics?.systemHealth.cpu || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Memory Usage</span>
                    <span>{metrics?.systemHealth.memory || 0}%</span>
                  </div>
                  <Progress value={metrics?.systemHealth.memory || 0} className="h-2" />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Database Performance</span>
                    <span>{metrics?.systemHealth.database || 0}%</span>
                  </div>
                  <Progress value={metrics?.systemHealth.database || 0} className="h-2" />
                </div>
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Uptime</span>
                    <Badge variant="outline">
                      {Math.floor((metrics?.systemHealth.uptime || 0) / 3600)}h {Math.floor(((metrics?.systemHealth.uptime || 0) % 3600) / 60)}m
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Conversion Tab */}
        <TabsContent value="conversion" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Booking Flow Analysis</CardTitle>
                <CardDescription>Step-by-step conversion rates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.bookingFlow.stepConversion.map((step, index) => (
                    <div key={`step-${step.step}-${index}`} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{step.step}</span>
                        <span className="flex items-center">
                          {step.rate}%
                          {step.dropoff > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                              -{step.dropoff}%
                            </Badge>
                          )}
                        </span>
                      </div>
                      <Progress value={step.rate} className="h-2" />
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Conversion Rates</CardTitle>
                <CardDescription>Booking success by activity type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metrics?.bookingConversion.byActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#8884d8" name="Conversion Rate %" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trends</CardTitle>
                <CardDescription>Revenue and booking volume over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metrics?.revenue.daily || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="amount" stackId="1" stroke="#8884d8" fill="#8884d8" name="Revenue (MAD)" />
                    <Area type="monotone" dataKey="bookings" stackId="2" stroke="#82ca9d" fill="#82ca9d" name="Bookings" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Revenue by Activity</CardTitle>
                <CardDescription>Top performing activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metrics?.revenue.byActivity || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value} MAD`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="revenue"
                      nameKey="name"
                    >
                      {(metrics?.revenue.byActivity || []).map((entry, index) => (
                        <Cell key={`cell-${index}-${entry.name || index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Customer Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Device Types</CardTitle>
                <CardDescription>Customer device preferences</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {metrics?.customerInsights.deviceTypes.map((device, index) => (
                    <div key={`device-${device.type}-${index}`} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{device.type}</span>
                        <span>{device.percentage}%</span>
                      </div>
                      <Progress value={device.percentage} className="h-2" />
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Peak Booking Hours</CardTitle>
                <CardDescription>When customers book most</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={metrics?.customerInsights.peakHours || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="bookings" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Countries</CardTitle>
                <CardDescription>Customer geographical distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {metrics?.customerInsights.countries.slice(0, 5).map((country, index) => (
                    <div key={`country-${country.country}-${index}`} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-6 h-4 bg-gray-200 rounded mr-3 flex items-center justify-center text-xs">
                          {index + 1}
                        </div>
                        <span className="text-sm">{country.country}</span>
                      </div>
                      <Badge variant="outline">{country.bookings}</Badge>
                    </div>
                  )) || []}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wrench className="h-5 w-5 mr-2" />
                Optimization Recommendations
              </CardTitle>
              <CardDescription>AI-powered suggestions to improve performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.optimizationSuggestions.map((suggestion, index) => (
                  <div key={`suggestion-${index}-${suggestion.category}`} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Badge 
                          variant={suggestion.priority === 'high' ? 'destructive' : 
                                  suggestion.priority === 'medium' ? 'default' : 'secondary'}
                        >
                          {suggestion.priority.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{suggestion.category}</span>
                      </div>
                      <div className="flex space-x-2">
                        <Badge variant="outline">Impact: {suggestion.impact}</Badge>
                        <Badge variant="outline">Effort: {suggestion.effort}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{suggestion.suggestion}</p>
                    <div className="flex justify-end">
                      <Button size="sm" variant="outline">
                        Implement
                      </Button>
                    </div>
                  </div>
                )) || []}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}