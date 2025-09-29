import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  LogOut, 
  Crown, 
  BarChart3, 
  Lightbulb, 
  Download,
  TrendingUp,
  Target,
  Award,
  Users,
  DollarSign,
  Star,
  Activity,
  Clock,
  CheckCircle
} from "lucide-react";
import { logout } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import SEOHead from "@/components/seo-head";
import ExecutiveSummaryDashboard from "@/components/executive-summary-dashboard";
import StrategicInsightsDashboard from "@/components/strategic-insights-dashboard";
import OneClickReportsDashboard from "@/components/one-click-reports-dashboard";

export default function CEOSimplifiedDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("executive");

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      try {
        await logout();
        toast({
          title: "Logged Out",
          description: "You have been successfully logged out.",
        });
      } catch (error) {
        console.error('Logout error:', error);
        toast({
          title: "Logout Error",
          description: "There was an issue logging out, but you will be redirected.",
          variant: "destructive",
        });
      }
    }
  };

  // Mock CEO-level metrics
  const ceoMetrics = {
    totalRevenue: 125000,
    monthlyGrowth: 15.2,
    customerSatisfaction: 4.7,
    marketPosition: "Leading",
    operationalEfficiency: 92,
    strategicInitiatives: 3
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOHead 
        title="CEO Dashboard - MarrakechDunes" 
        description="Executive dashboard for strategic decision making"
      />
      
      {/* Header */}
      <div className="bg-gradient-to-r from-moroccan-blue to-blue-800 text-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Crown className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">CEO Dashboard</h1>
                <p className="text-white/80">Strategic oversight and executive insights</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-white/20 text-white border-white/30">
                {user?.role === 'superadmin' ? 'CEO Access' : 'Executive Access'}
              </Badge>
              <Button onClick={handleLogout} variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Executive KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoMetrics.totalRevenue.toLocaleString()} MAD</div>
              <div className="flex items-center text-xs text-green-600">
                <TrendingUp className="h-3 w-3 mr-1" />
                +{ceoMetrics.monthlyGrowth}% this month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoMetrics.customerSatisfaction}/5</div>
              <p className="text-xs text-muted-foreground">Excellent</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Market Position</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{ceoMetrics.marketPosition}</div>
              <p className="text-xs text-muted-foreground">Industry leader</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoMetrics.operationalEfficiency}%</div>
              <p className="text-xs text-muted-foreground">Operational</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Initiatives</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ceoMetrics.strategicInitiatives}</div>
              <p className="text-xs text-muted-foreground">Active projects</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Status</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">Online</div>
              <p className="text-xs text-muted-foreground">All systems operational</p>
            </CardContent>
          </Card>
        </div>

        {/* CEO Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="executive" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Executive Summary
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Strategic Insights
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              One-Click Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="executive" className="space-y-4">
            <ExecutiveSummaryDashboard />
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <StrategicInsightsDashboard />
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <OneClickReportsDashboard />
          </TabsContent>
        </Tabs>

        {/* Quick CEO Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              CEO Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Team Management</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Financial Overview</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Target className="h-6 w-6" />
                <span className="text-sm">Strategic Planning</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Download className="h-6 w-6" />
                <span className="text-sm">Export All Data</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
