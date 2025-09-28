import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Eye, 
  MousePointer, 
  Clock, 
  TrendingUp, 
  Globe, 
  Smartphone, 
  Monitor,
  MapPin,
  Calendar,
  BarChart3,
  PieChart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Cell, Pie } from "recharts";

interface UserAnalytics {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  returningUsers: number;
  averageSessionDuration: number;
  bounceRate: number;
  pageViews: number;
  uniqueVisitors: number;
  topPages: Array<{
    page: string;
    views: number;
    uniqueVisitors: number;
  }>;
  deviceBreakdown: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
  geographicData: Array<{
    country: string;
    users: number;
    percentage: number;
  }>;
  hourlyActivity: Array<{
    hour: number;
    users: number;
    sessions: number;
  }>;
  userJourney: Array<{
    step: string;
    users: number;
    dropoff: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function UserAnalytics() {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  // Fetch user analytics data
  const { data: analytics, isLoading } = useQuery<UserAnalytics>({
    queryKey: ["/analytics/users", timeRange],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">User Analytics</h2>
          <p className="text-gray-600">User behavior insights and engagement metrics</p>
        </div>
        <div className="flex gap-2">
          {(['7d', '30d', '90d'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
            </Button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.totalUsers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analytics?.newUsers || 0} new this period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.activeUsers?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.returningUsers || 0} returning
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Session Duration</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.averageSessionDuration || 0}m</div>
            <p className="text-xs text-muted-foreground">
              Average session time
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.bounceRate || 0}%</div>
            <p className="text-xs text-muted-foreground">
              Single page sessions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="geography">Geography</TabsTrigger>
          <TabsTrigger value="journey">User Journey</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Page Views Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Page Views Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics?.hourlyActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="sessions" stroke="#82ca9d" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Top Pages */}
          <Card>
            <CardHeader>
              <CardTitle>Top Pages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.topPages?.slice(0, 10).map((page, index) => (
                  <div key={page.page} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{page.page}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{page.views.toLocaleString()} views</div>
                      <div className="text-sm text-gray-500">{page.uniqueVisitors} unique</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Device Breakdown Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Device Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={[
                          { name: 'Desktop', value: analytics?.deviceBreakdown?.desktop || 0, color: '#0088FE' },
                          { name: 'Mobile', value: analytics?.deviceBreakdown?.mobile || 0, color: '#00C49F' },
                          { name: 'Tablet', value: analytics?.deviceBreakdown?.tablet || 0, color: '#FFBB28' },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Desktop', value: analytics?.deviceBreakdown?.desktop || 0, color: '#0088FE' },
                          { name: 'Mobile', value: analytics?.deviceBreakdown?.mobile || 0, color: '#00C49F' },
                          { name: 'Tablet', value: analytics?.deviceBreakdown?.tablet || 0, color: '#FFBB28' },
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Device Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Device Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-blue-500" />
                      <span className="font-medium">Desktop</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{analytics?.deviceBreakdown?.desktop || 0} users</div>
                      <div className="text-sm text-gray-500">
                        {((analytics?.deviceBreakdown?.desktop || 0) / (analytics?.totalUsers || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-5 w-5 text-green-500" />
                      <span className="font-medium">Mobile</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{analytics?.deviceBreakdown?.mobile || 0} users</div>
                      <div className="text-sm text-gray-500">
                        {((analytics?.deviceBreakdown?.mobile || 0) / (analytics?.totalUsers || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Monitor className="h-5 w-5 text-yellow-500" />
                      <span className="font-medium">Tablet</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{analytics?.deviceBreakdown?.tablet || 0} users</div>
                      <div className="text-sm text-gray-500">
                        {((analytics?.deviceBreakdown?.tablet || 0) / (analytics?.totalUsers || 1) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="geography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Geographic Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.geographicData?.slice(0, 10).map((country, index) => (
                  <div key={country.country} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{country.country}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-moroccan-blue h-2 rounded-full" 
                          style={{ width: `${country.percentage}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{country.users} users</div>
                        <div className="text-sm text-gray-500">{country.percentage.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="journey" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Journey Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analytics?.userJourney?.map((step, index) => (
                  <div key={step.step} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline">{index + 1}</Badge>
                      <span className="font-medium">{step.step}</span>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-bold">{step.users.toLocaleString()} users</div>
                        <div className="text-sm text-gray-500">
                          {index > 0 ? `${step.dropoff.toFixed(1)}% dropoff` : 'Entry point'}
                        </div>
                      </div>
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-moroccan-blue h-2 rounded-full" 
                          style={{ 
                            width: `${(step.users / (analytics?.userJourney?.[0]?.users || 1)) * 100}%` 
                          }}
                        ></div>
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
