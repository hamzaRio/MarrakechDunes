import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  TrendingUp, 
  Users, 
  Calendar, 
  DollarSign, 
  Activity, 
  Download, 
  FileText, 
  BarChart3,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  Star,
  MapPin,
  Phone,
  Mail
} from "lucide-react";

interface OperationsData {
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

export default function CEOOperationsDashboard() {
  const { toast } = useToast();
  const [selectedTimeRange, setSelectedTimeRange] = useState('30d');

  // Fetch operations data
  const { data: operationsData, isLoading } = useQuery<OperationsData>({
    queryKey: ["/admin/operations-report"],
    queryFn: () => apiFetch("/admin/operations-report"),
  });

  // Export handlers
  const handleExportBookingsPDF = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBaseUrl}/admin/export/bookings/pdf`, {
        method: 'GET',
        credentials: 'include', // Include session cookies
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
      a.download = 'bookings-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Bookings report exported as PDF",
      });
    } catch (error) {
      console.error('Bookings PDF Export Error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export bookings PDF",
        variant: "destructive",
      });
    }
  };

  const handleExportOperationsPDF = async () => {
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiBaseUrl}/admin/export/operations-report/pdf`, {
        method: 'GET',
        credentials: 'include', // Include session cookies
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
      a.download = 'operations-report.pdf';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Operations report exported as PDF",
      });
    } catch (error) {
      console.error('Operations PDF Export Error:', error);
      toast({
        title: "Export Error",
        description: "Failed to export operations PDF",
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">CEO Operations Dashboard</h2>
          <p className="text-gray-600">Comprehensive business intelligence and operational insights</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExportBookingsPDF} variant="outline" size="sm">
            <FileText className="h-4 w-4 mr-2" />
            Export Bookings PDF
          </Button>
          <Button onClick={handleExportOperationsPDF} variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Export Operations PDF
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationsData?.summary.totalRevenue || 0} MAD</div>
            <p className="text-xs text-muted-foreground">
              Average: {operationsData?.summary.averageBookingValue.toFixed(2) || 0} MAD per booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationsData?.summary.totalBookings || 0}</div>
            <p className="text-xs text-muted-foreground">
              Across {operationsData?.summary.totalActivities || 0} activities
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{operationsData?.summary.averageRating.toFixed(1) || 0}/5</div>
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
            <div className="text-2xl font-bold">{operationsData?.summary.totalActivities || 0}</div>
            <p className="text-xs text-muted-foreground">
              Available for booking
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Activity Performance</TabsTrigger>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="insights">Business Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Activity Performance Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {operationsData?.activityPerformance.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-moroccan-blue text-white rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{activity.name}</p>
                        <p className="text-sm text-gray-500">
                          {activity.bookings} bookings • {activity.popularity.toFixed(1)}% of total
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg">{activity.revenue} MAD</p>
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm">{activity.rating.toFixed(1)}/5</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Performance Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {operationsData?.monthlyTrends.slice(-6).map((month, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{month.month}</p>
                      <p className="text-sm text-gray-500">Monthly performance</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{month.bookings} bookings</p>
                      <p className="text-sm text-gray-500">{month.revenue} MAD revenue</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Business Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Strong customer satisfaction</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Revenue growth potential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Diverse activity portfolio</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    <span className="text-sm">Optimize booking times</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Expand customer base</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">Consider new locations</span>
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
