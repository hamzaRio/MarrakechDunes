import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Calendar, 
  Star, 
  Target,
  Download,
  FileText,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Award,
  Activity
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ExecutiveMetrics {
  summary: {
    totalBookings: number;
    totalRevenue: number;
    averageBookingValue: number;
    totalActivities: number;
    averageRating: number;
  };
  activityPerformance: Array<{
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
    popularity: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    bookings: number;
    revenue: number;
  }>;
  topActivities: Array<{
    name: string;
    bookings: number;
    revenue: number;
    rating: number;
  }>;
}

export default function ExecutiveSummaryDashboard() {
  const { toast } = useToast();
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  // Fetch executive metrics
  const { data: metrics, isLoading } = useQuery<ExecutiveMetrics>({
    queryKey: ["/admin/operations-report"],
    queryFn: () => apiFetch("/admin/operations-report"),
  });

  // Export handlers
  const handleExportExecutiveReport = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://marrakechdunes-sppy.onrender.com/api';
      const response = await fetch(`${apiBaseUrl}/admin/export/operations-report/pdf`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'executive-summary-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Exported",
        description: "Executive summary report downloaded successfully",
      });
    } catch (error) {
      console.error('Executive Report Export Error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export executive report",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  const topActivity = metrics?.topActivities[0];
  const monthlyGrowth = metrics?.monthlyTrends ? 
    ((metrics.monthlyTrends[metrics.monthlyTrends.length - 1]?.revenue || 0) - 
     (metrics.monthlyTrends[metrics.monthlyTrends.length - 2]?.revenue || 0)) / 
    (metrics.monthlyTrends[metrics.monthlyTrends.length - 2]?.revenue || 1) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Executive Summary</h2>
          <p className="text-gray-600">Key business metrics and strategic insights</p>
        </div>
        <Button onClick={handleExportExecutiveReport} className="bg-moroccan-blue hover:bg-moroccan-blue/90">
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.totalRevenue || 0} MAD</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {monthlyGrowth > 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
              )}
              <span className={monthlyGrowth > 0 ? "text-green-500" : "text-red-500"}>
                {Math.abs(monthlyGrowth).toFixed(1)}% vs last month
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg: {metrics?.summary.averageBookingValue.toFixed(0) || 0} MAD per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.averageRating.toFixed(1) || 0}/5</div>
            <p className="text-xs text-muted-foreground">
              Based on customer reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.summary.totalActivities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available for booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Performing Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topActivity ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{topActivity.name}</h3>
                  <Badge className="bg-yellow-100 text-yellow-800">
                    #1 Revenue Generator
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Revenue</p>
                    <p className="text-xl font-bold text-green-600">{topActivity.revenue} MAD</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Bookings</p>
                    <p className="text-xl font-bold">{topActivity.bookings}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="font-medium">{topActivity.rating.toFixed(1)}/5</span>
                  <span className="text-sm text-gray-600">rating</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">No activity data available</p>
            )}
          </CardContent>
        </Card>

        {/* Business Health */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-500" />
              Business Health
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Customer Satisfaction</span>
                <Badge variant={metrics?.summary.averageRating && metrics.summary.averageRating >= 4.5 ? "default" : "secondary"}>
                  {metrics?.summary.averageRating && metrics.summary.averageRating >= 4.5 ? "Excellent" : "Good"}
                </Badge>
              </div>
              <Progress 
                value={metrics?.summary.averageRating ? (metrics.summary.averageRating / 5) * 100 : 0} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revenue Growth</span>
                <Badge variant={monthlyGrowth > 0 ? "default" : "destructive"}>
                  {monthlyGrowth > 0 ? "Growing" : "Declining"}
                </Badge>
              </div>
              <Progress 
                value={Math.abs(monthlyGrowth)} 
                className="h-2"
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Activity Portfolio</span>
                <Badge variant={metrics?.summary.totalActivities && metrics.summary.totalActivities >= 5 ? "default" : "secondary"}>
                  {metrics?.summary.totalActivities && metrics.summary.totalActivities >= 5 ? "Diverse" : "Limited"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-500" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-semibold text-green-600 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Strengths
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Strong customer satisfaction rating
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Diversified activity portfolio
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  Consistent booking volume
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-semibold text-orange-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Opportunities
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Expand marketing for top activities
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Consider seasonal pricing strategies
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  Develop customer retention programs
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Detailed Report
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Manage Admins
            </Button>
            <Button variant="outline" size="sm">
              <Activity className="h-4 w-4 mr-2" />
              Activity Performance
            </Button>
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Booking Calendar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
