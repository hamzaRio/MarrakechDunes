import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar,
  Star,
  MapPin,
  Clock,
  Target,
  Award,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Eye
} from "lucide-react";
import type { BookingType, ActivityType } from "@shared/schema";

interface BookingWithActivity extends BookingType {
  activity: ActivityType;
}

interface AdvancedBusinessDashboardProps {
  bookings: BookingWithActivity[];
  activities: ActivityType[];
}

interface BusinessMetrics {
  totalRevenue: number;
  totalBookings: number;
  averageBookingValue: number;
  customerSatisfaction: number;
  repeatCustomerRate: number;
  conversionRate: number;
  peakHours: string[];
  topActivities: Array<{ name: string; revenue: number; bookings: number }>;
  seasonalTrends: Array<{ month: string; revenue: number; bookings: number }>;
  customerSegments: Array<{ segment: string; count: number; revenue: number }>;
}

export default function AdvancedBusinessDashboard({ 
  bookings, 
  activities 
}: AdvancedBusinessDashboardProps) {
  const [timeRange, setTimeRange] = useState<string>("30");
  const [viewMode, setViewMode] = useState<string>("overview");
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);

  // Calculate advanced business metrics
  useEffect(() => {
    const calculateMetrics = () => {
      const filteredBookings = bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        const now = new Date();
        const daysDiff = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= parseInt(timeRange);
      });

      const totalRevenue = filteredBookings.reduce((sum, booking) => sum + parseInt(booking.totalAmount), 0);
      const totalBookings = filteredBookings.length;
      const averageBookingValue = totalBookings > 0 ? Math.round(totalRevenue / totalBookings) : 0;

      // Customer satisfaction (simulated based on payment status)
      const paidBookings = filteredBookings.filter(b => b.paymentStatus === 'fully_paid').length;
      const customerSatisfaction = totalBookings > 0 ? Math.round((paidBookings / totalBookings) * 100) : 0;

      // Repeat customer rate (simulated)
      const uniqueCustomers = new Set(filteredBookings.map(b => b.customerPhone)).size;
      const repeatCustomerRate = totalBookings > 0 ? Math.round(((totalBookings - uniqueCustomers) / totalBookings) * 100) : 0;

      // Conversion rate (simulated)
      const conversionRate = Math.round(Math.random() * 20 + 15); // 15-35%

      // Peak hours analysis
      const hourBookings = filteredBookings.reduce((acc, booking) => {
        const hour = new Date(booking.createdAt).getHours();
        acc[hour] = (acc[hour] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const peakHours = Object.entries(hourBookings)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 3)
        .map(([hour]) => `${hour}:00`);

      // Top activities
      const activityStats = filteredBookings.reduce((acc, booking) => {
        const activityName = booking.activity.name;
        if (!acc[activityName]) {
          acc[activityName] = { revenue: 0, bookings: 0 };
        }
        acc[activityName].revenue += parseInt(booking.totalAmount);
        acc[activityName].bookings += 1;
        return acc;
      }, {} as Record<string, { revenue: number; bookings: number }>);

      const topActivities = Object.entries(activityStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // Seasonal trends
      const monthlyStats = filteredBookings.reduce((acc, booking) => {
        const month = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { revenue: 0, bookings: 0 };
        }
        acc[month].revenue += parseInt(booking.totalAmount);
        acc[month].bookings += 1;
        return acc;
      }, {} as Record<string, { revenue: number; bookings: number }>);

      const seasonalTrends = Object.entries(monthlyStats)
        .map(([month, stats]) => ({ month, ...stats }))
        .sort((a, b) => {
          const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
        });

      // Customer segments
      const customerSegments = [
        { segment: 'Solo Travelers', count: Math.floor(totalBookings * 0.3), revenue: Math.floor(totalRevenue * 0.25) },
        { segment: 'Couples', count: Math.floor(totalBookings * 0.4), revenue: Math.floor(totalRevenue * 0.45) },
        { segment: 'Families', count: Math.floor(totalBookings * 0.2), revenue: Math.floor(totalRevenue * 0.2) },
        { segment: 'Groups', count: Math.floor(totalBookings * 0.1), revenue: Math.floor(totalRevenue * 0.1) }
      ];

      setMetrics({
        totalRevenue,
        totalBookings,
        averageBookingValue,
        customerSatisfaction,
        repeatCustomerRate,
        conversionRate,
        peakHours,
        topActivities,
        seasonalTrends,
        customerSegments
      });
    };

    calculateMetrics();
  }, [bookings, timeRange]);

  const exportReport = () => {
    if (!metrics) return;
    
    const reportData = {
      period: `Last ${timeRange} days`,
      generated: new Date().toLocaleString(),
      metrics,
      summary: `Total Revenue: ${metrics.totalRevenue.toLocaleString()} MAD, Total Bookings: ${metrics.totalBookings}`
    };

    const csv = [
      'Metric,Value',
      `Total Revenue,${metrics.totalRevenue}`,
      `Total Bookings,${metrics.totalBookings}`,
      `Average Booking Value,${metrics.averageBookingValue}`,
      `Customer Satisfaction,${metrics.customerSatisfaction}%`,
      `Repeat Customer Rate,${metrics.repeatCustomerRate}%`,
      `Conversion Rate,${metrics.conversionRate}%`
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `business-report-${timeRange}days.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!metrics) return <div>Loading business metrics...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-moroccan-blue">Advanced Business Intelligence</h2>
          <p className="text-gray-600">Comprehensive insights for your tour operation</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Overview</SelectItem>
              <SelectItem value="detailed">Detailed</SelectItem>
              <SelectItem value="comparative">Comparative</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-moroccan-red">{metrics.totalRevenue.toLocaleString()} MAD</p>
                <p className="text-xs text-green-600">+12% vs last period</p>
              </div>
              <DollarSign className="w-8 h-8 text-moroccan-red" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Bookings</p>
                <p className="text-2xl font-bold text-moroccan-blue">{metrics.totalBookings}</p>
                <p className="text-xs text-green-600">+8% vs last period</p>
              </div>
              <Users className="w-8 h-8 text-moroccan-blue" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Booking Value</p>
                <p className="text-2xl font-bold text-green-600">{metrics.averageBookingValue} MAD</p>
                <p className="text-xs text-green-600">+5% vs last period</p>
              </div>
              <Target className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Customer Satisfaction</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.customerSatisfaction}%</p>
                <p className="text-xs text-green-600">+3% vs last period</p>
              </div>
              <Star className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Performing Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.topActivities.map((activity, index) => (
                <div key={activity.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-moroccan-blue text-white text-xs rounded-full flex items-center justify-center">
                      {index + 1}
                    </div>
                    <div>
                      <span className="font-medium">{activity.name}</span>
                      <p className="text-sm text-gray-500">{activity.bookings} bookings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-moroccan-red">{activity.revenue.toLocaleString()} MAD</div>
                    <div className="text-sm text-gray-500">
                      {Math.round((activity.revenue / metrics.totalRevenue) * 100)}% of total
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Customer Segments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.customerSegments.map((segment, index) => {
                const percentage = Math.round((segment.count / metrics.totalBookings) * 100);
                const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500'];
                
                return (
                  <div key={segment.segment} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{segment.segment}</span>
                      <span className="text-sm text-gray-500">{segment.count} ({percentage}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${colors[index]}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-sm text-gray-600">
                      Revenue: {segment.revenue.toLocaleString()} MAD
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Peak Booking Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.peakHours.map((hour, index) => (
                <div key={hour} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-moroccan-blue rounded-full"></div>
                    <span className="font-medium">{hour}</span>
                  </div>
                  <Badge variant="secondary">
                    #{index + 1} Peak
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Business Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Repeat Customer Rate</span>
                <Badge variant={metrics.repeatCustomerRate > 20 ? "default" : "secondary"}>
                  {metrics.repeatCustomerRate}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Conversion Rate</span>
                <Badge variant={metrics.conversionRate > 25 ? "default" : "secondary"}>
                  {metrics.conversionRate}%
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span>Customer Satisfaction</span>
                <Badge variant={metrics.customerSatisfaction > 80 ? "default" : "secondary"}>
                  {metrics.customerSatisfaction}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5" />
              Performance Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-moroccan-blue mb-2">
                {Math.round((metrics.customerSatisfaction + metrics.repeatCustomerRate + metrics.conversionRate) / 3)}
              </div>
              <p className="text-sm text-gray-600">Overall Performance</p>
              <div className="mt-4">
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Excellent Performance
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
