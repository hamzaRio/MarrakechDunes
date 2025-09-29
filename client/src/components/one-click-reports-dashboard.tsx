import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Download, 
  FileText, 
  BarChart3, 
  PieChart, 
  Calendar, 
  Users, 
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Activity,
  Star,
  MapPin,
  MessageCircle
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  category: 'financial' | 'operational' | 'customer' | 'marketing';
  format: 'pdf' | 'csv' | 'excel';
  estimatedTime: string;
  dataPoints: number;
  lastGenerated?: string;
  isScheduled?: boolean;
  scheduleFrequency?: 'daily' | 'weekly' | 'monthly';
}

interface ReportData {
  templates: ReportTemplate[];
  recentReports: Array<{
    id: string;
    name: string;
    generatedAt: string;
    size: string;
    format: string;
  }>;
  scheduledReports: Array<{
    id: string;
    name: string;
    nextRun: string;
    frequency: string;
    status: 'active' | 'paused';
  }>;
}

export default function OneClickReportsDashboard() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isGenerating, setIsGenerating] = useState<string | null>(null);

  // Mock report templates data
  const { data: reportData, isLoading } = useQuery<ReportData>({
    queryKey: ["/admin/report-templates"],
    queryFn: async () => {
      return {
        templates: [
          {
            id: 'executive-summary',
            name: 'Executive Summary',
            description: 'High-level business metrics and KPIs for leadership',
            icon: <BarChart3 className="h-5 w-5" />,
            category: 'financial',
            format: 'pdf',
            estimatedTime: '30 seconds',
            dataPoints: 15,
            lastGenerated: '2024-01-15T10:30:00Z'
          },
          {
            id: 'booking-analytics',
            name: 'Booking Analytics',
            description: 'Detailed booking trends, conversion rates, and customer insights',
            icon: <Calendar className="h-5 w-5" />,
            category: 'operational',
            format: 'excel',
            estimatedTime: '45 seconds',
            dataPoints: 25,
            lastGenerated: '2024-01-14T15:20:00Z'
          },
          {
            id: 'revenue-report',
            name: 'Revenue Report',
            description: 'Financial performance, payment tracking, and revenue forecasts',
            icon: <DollarSign className="h-5 w-5" />,
            category: 'financial',
            format: 'pdf',
            estimatedTime: '20 seconds',
            dataPoints: 12,
            lastGenerated: '2024-01-15T09:15:00Z'
          },
          {
            id: 'customer-satisfaction',
            name: 'Customer Satisfaction',
            description: 'Reviews, ratings, feedback analysis, and customer journey insights',
            icon: <Star className="h-5 w-5" />,
            category: 'customer',
            format: 'pdf',
            estimatedTime: '35 seconds',
            dataPoints: 18,
            lastGenerated: '2024-01-13T14:45:00Z'
          },
          {
            id: 'activity-performance',
            name: 'Activity Performance',
            description: 'Individual activity metrics, popularity rankings, and optimization insights',
            icon: <Activity className="h-5 w-5" />,
            category: 'operational',
            format: 'excel',
            estimatedTime: '40 seconds',
            dataPoints: 22,
            lastGenerated: '2024-01-12T11:30:00Z'
          },
          {
            id: 'whatsapp-analytics',
            name: 'WhatsApp Analytics',
            description: 'Communication metrics, response times, and customer engagement',
            icon: <MessageCircle className="h-5 w-5" />,
            category: 'marketing',
            format: 'csv',
            estimatedTime: '25 seconds',
            dataPoints: 10,
            lastGenerated: '2024-01-11T16:20:00Z'
          },
          {
            id: 'operational-efficiency',
            name: 'Operational Efficiency',
            description: 'System performance, uptime, and resource utilization metrics',
            icon: <TrendingUp className="h-5 w-5" />,
            category: 'operational',
            format: 'pdf',
            estimatedTime: '30 seconds',
            dataPoints: 14,
            lastGenerated: '2024-01-10T13:15:00Z'
          },
          {
            id: 'geographic-insights',
            name: 'Geographic Insights',
            description: 'Customer location analysis, popular destinations, and regional trends',
            icon: <MapPin className="h-5 w-5" />,
            category: 'marketing',
            format: 'excel',
            estimatedTime: '35 seconds',
            dataPoints: 16,
            lastGenerated: '2024-01-09T10:45:00Z'
          }
        ],
        recentReports: [
          {
            id: '1',
            name: 'Executive Summary - January 2024',
            generatedAt: '2024-01-15T10:30:00Z',
            size: '2.3 MB',
            format: 'PDF'
          },
          {
            id: '2',
            name: 'Booking Analytics - Week 2',
            generatedAt: '2024-01-14T15:20:00Z',
            size: '1.8 MB',
            format: 'Excel'
          },
          {
            id: '3',
            name: 'Revenue Report - January',
            generatedAt: '2024-01-15T09:15:00Z',
            size: '1.5 MB',
            format: 'PDF'
          }
        ],
        scheduledReports: [
          {
            id: '1',
            name: 'Daily Booking Summary',
            nextRun: '2024-01-16T08:00:00Z',
            frequency: 'Daily',
            status: 'active'
          },
          {
            id: '2',
            name: 'Weekly Revenue Report',
            nextRun: '2024-01-21T09:00:00Z',
            frequency: 'Weekly',
            status: 'active'
          },
          {
            id: '3',
            name: 'Monthly Executive Summary',
            nextRun: '2024-02-01T10:00:00Z',
            frequency: 'Monthly',
            status: 'paused'
          }
        ]
      };
    }
  });

  const handleGenerateReport = async (templateId: string) => {
    setIsGenerating(templateId);
    
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // In production, this would call the actual API
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'https://marrakechdunes-sppy.onrender.com/api';
      const response = await fetch(`${apiBaseUrl}/admin/export/${templateId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${templateId}-report.${reportData?.templates.find(t => t.id === templateId)?.format || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Report Generated",
        description: "Your report has been downloaded successfully",
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Failed to generate report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(null);
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial': return 'bg-green-100 text-green-800';
      case 'operational': return 'bg-blue-100 text-blue-800';
      case 'customer': return 'bg-purple-100 text-purple-800';
      case 'marketing': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4 text-red-500" />;
      case 'excel': return <BarChart3 className="h-4 w-4 text-green-500" />;
      case 'csv': return <PieChart className="h-4 w-4 text-blue-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-blue"></div>
      </div>
    );
  }

  const filteredTemplates = reportData?.templates.filter(template => 
    selectedCategory === 'all' || template.category === selectedCategory
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">One-Click Reports</h2>
          <p className="text-gray-600">Generate comprehensive business reports instantly</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="financial">Financial</SelectItem>
              <SelectItem value="operational">Operational</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Report Templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    {template.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <Badge className={getCategoryColor(template.category)}>
                      {template.category}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {getFormatIcon(template.format)}
                  <span className="text-xs text-gray-500 uppercase">{template.format}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Data Points:</span>
                  <span className="font-medium">{template.dataPoints}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">Est. Time:</span>
                  <span className="font-medium">{template.estimatedTime}</span>
                </div>
                {template.lastGenerated && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Last Generated:</span>
                    <span className="font-medium">
                      {new Date(template.lastGenerated).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              
              <Button 
                onClick={() => handleGenerateReport(template.id)}
                disabled={isGenerating === template.id}
                className="w-full"
                size="sm"
              >
                {isGenerating === template.id ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Generating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Generate Report
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Reports & Scheduled Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Recent Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData?.recentReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getFormatIcon(report.format.toLowerCase())}
                    <div>
                      <p className="font-medium text-sm">{report.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(report.generatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">{report.size}</p>
                    <Badge variant="outline" className="text-xs">
                      {report.format}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Scheduled Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-500" />
              Scheduled Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reportData?.scheduledReports.map((report) => (
                <div key={report.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{report.name}</p>
                    <p className="text-xs text-gray-500">
                      Next: {new Date(report.nextRun).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={report.status === 'active' ? 'default' : 'secondary'}>
                      {report.status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{report.frequency}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Report
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Share Report
            </Button>
            <Button variant="outline" size="sm">
              <BarChart3 className="h-4 w-4 mr-2" />
              Custom Report
            </Button>
            <Button variant="outline" size="sm">
              <CheckCircle className="h-4 w-4 mr-2" />
              Report Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
