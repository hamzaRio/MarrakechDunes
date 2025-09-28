import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  Server, 
  Database, 
  Globe, 
  Clock, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface PerformanceMetrics {
  responseTime: number;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
  activeUsers: number;
  requestsPerMinute: number;
  errorRate: number;
  databaseConnections: number;
  cacheHitRate: number;
  lastUpdated: string;
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical';
  services: {
    api: 'up' | 'down' | 'degraded';
    database: 'up' | 'down' | 'degraded';
    cache: 'up' | 'down' | 'degraded';
    storage: 'up' | 'down' | 'degraded';
  };
  alerts: Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: string;
  }>;
}

export default function PerformanceMonitor() {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch performance metrics
  const { data: metrics, refetch: refetchMetrics } = useQuery<PerformanceMetrics>({
    queryKey: ["/analytics/performance"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch system health
  const { data: health, refetch: refetchHealth } = useQuery<SystemHealth>({
    queryKey: ["/analytics/health"],
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchMetrics(), refetchHealth()]);
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      case 'degraded': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'up': return <CheckCircle className="h-4 w-4" />;
      case 'down': return <XCircle className="h-4 w-4" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getHealthBadgeColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-gray-600">Real-time system performance and health metrics</p>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      {health && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
              <Badge className={getHealthBadgeColor(health.status)}>
                {health.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(health.services).map(([service, status]) => (
                <div key={service} className="flex items-center gap-2 p-3 border rounded-lg">
                  {getStatusIcon(status)}
                  <div>
                    <p className="font-medium capitalize">{service}</p>
                    <p className={`text-sm ${getStatusColor(status)}`}>
                      {status.toUpperCase()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Response Time */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.responseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                Average API response time
              </p>
            </CardContent>
          </Card>

          {/* Uptime */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Uptime</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.uptime}%</div>
              <p className="text-xs text-muted-foreground">
                System availability
              </p>
            </CardContent>
          </Card>

          {/* Active Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeUsers}</div>
              <p className="text-xs text-muted-foreground">
                Currently online
              </p>
            </CardContent>
          </Card>

          {/* Memory Usage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.memoryUsage}%</div>
              <p className="text-xs text-muted-foreground">
                Server memory utilization
              </p>
            </CardContent>
          </Card>

          {/* CPU Usage */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.cpuUsage}%</div>
              <p className="text-xs text-muted-foreground">
                Server CPU utilization
              </p>
            </CardContent>
          </Card>

          {/* Error Rate */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.errorRate}%</div>
              <p className="text-xs text-muted-foreground">
                Request error percentage
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Alerts */}
      {health?.alerts && health.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 p-3 border rounded-lg">
                  <div className={`mt-1 ${
                    alert.type === 'error' ? 'text-red-500' : 
                    alert.type === 'warning' ? 'text-yellow-500' : 
                    'text-blue-500'
                  }`}>
                    {alert.type === 'error' ? <XCircle className="h-4 w-4" /> :
                     alert.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                     <CheckCircle className="h-4 w-4" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm text-gray-500">{alert.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
