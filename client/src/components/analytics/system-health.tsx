import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Server, 
  Database, 
  Globe, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  Zap,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface SystemHealth {
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    uptime: number;
    lastCheck: string;
  };
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    cache: ServiceStatus;
    storage: ServiceStatus;
    cdn: ServiceStatus;
    monitoring: ServiceStatus;
  };
  resources: {
    cpu: ResourceUsage;
    memory: ResourceUsage;
    disk: ResourceUsage;
    network: NetworkUsage;
  };
  alerts: Alert[];
  incidents: Incident[];
}

interface ServiceStatus {
  status: 'up' | 'down' | 'degraded';
  responseTime: number;
  uptime: number;
  lastError?: string;
  lastChecked: string;
}

interface ResourceUsage {
  current: number;
  max: number;
  average: number;
  trend: 'up' | 'down' | 'stable';
}

interface NetworkUsage {
  bandwidth: {
    incoming: number;
    outgoing: number;
  };
  latency: number;
  packetLoss: number;
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface Incident {
  id: string;
  title: string;
  status: 'open' | 'investigating' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  startTime: string;
  endTime?: string;
  description: string;
  affectedServices: string[];
}

export default function SystemHealth() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch system health data
  const { data: health, refetch, isLoading } = useQuery<SystemHealth>({
    queryKey: ["/analytics/system-health"],
    refetchInterval: autoRefresh ? 10000 : false, // Auto-refresh every 10 seconds
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
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

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
          <h2 className="text-2xl font-bold text-gray-900">System Health</h2>
          <p className="text-gray-600">Real-time system monitoring and health status</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Zap className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </Button>
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
      </div>

      {/* Overall Health Status */}
      {health && (
        <Alert className={health.overall.status === 'healthy' ? 'border-green-200 bg-green-50' : 
                          health.overall.status === 'warning' ? 'border-yellow-200 bg-yellow-50' : 
                          'border-red-200 bg-red-50'}>
          <div className="flex items-center gap-2">
            {health.overall.status === 'healthy' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
             health.overall.status === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-600" /> :
             <XCircle className="h-4 w-4 text-red-600" />}
            <div>
              <h3 className="font-semibold">
                System Status: {health.overall.status.toUpperCase()}
              </h3>
              <p className="text-sm">
                Uptime: {health.overall.uptime}% | Last Check: {health.overall.lastCheck}
              </p>
            </div>
          </div>
        </Alert>
      )}

      {/* Services Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Services Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {health?.services && Object.entries(health.services).map(([service, status]) => (
              <div key={service} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(status.status)}
                  <div>
                    <p className="font-medium capitalize">{service}</p>
                    <p className={`text-sm ${getStatusColor(status.status)}`}>
                      {status.status.toUpperCase()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{status.responseTime}ms</div>
                  <div className="text-xs text-gray-500">{status.uptime}% uptime</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resource Usage */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* CPU Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.resources?.cpu?.current || 0}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  (health?.resources?.cpu?.current || 0) > 80 ? 'bg-red-500' :
                  (health?.resources?.cpu?.current || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${health?.resources?.cpu?.current || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Avg: {health?.resources?.cpu?.average || 0}%
            </p>
          </CardContent>
        </Card>

        {/* Memory Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.resources?.memory?.current || 0}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  (health?.resources?.memory?.current || 0) > 80 ? 'bg-red-500' :
                  (health?.resources?.memory?.current || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${health?.resources?.memory?.current || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {health?.resources?.memory?.current || 0}GB / {health?.resources?.memory?.max || 0}GB
            </p>
          </CardContent>
        </Card>

        {/* Disk Usage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Disk Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.resources?.disk?.current || 0}%</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className={`h-2 rounded-full ${
                  (health?.resources?.disk?.current || 0) > 80 ? 'bg-red-500' :
                  (health?.resources?.disk?.current || 0) > 60 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${health?.resources?.disk?.current || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {health?.resources?.disk?.current || 0}GB / {health?.resources?.disk?.max || 0}GB
            </p>
          </CardContent>
        </Card>

        {/* Network Latency */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Network Latency</CardTitle>
            <Network className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{health?.resources?.network?.latency || 0}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Packet Loss: {health?.resources?.network?.packetLoss || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      {health?.alerts && health.alerts.filter(alert => !alert.resolved).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {health.alerts.filter(alert => !alert.resolved).slice(0, 5).map((alert) => (
                <Alert key={alert.id} className={
                  alert.type === 'critical' ? 'border-red-200 bg-red-50' :
                  alert.type === 'error' ? 'border-red-200 bg-red-50' :
                  alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                  'border-blue-200 bg-blue-50'
                }>
                  <div className="flex items-start gap-3">
                    {alert.type === 'critical' ? <XCircle className="h-4 w-4 text-red-600 mt-0.5" /> :
                     alert.type === 'error' ? <XCircle className="h-4 w-4 text-red-600 mt-0.5" /> :
                     alert.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" /> :
                     <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />}
                    <div className="flex-1">
                      <h4 className="font-medium">{alert.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                    </div>
                  </div>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Incidents */}
      {health?.incidents && health.incidents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {health.incidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{incident.title}</h4>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">
                        {incident.status.toUpperCase()}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Started: {incident.startTime}</span>
                      {incident.endTime && <span>Ended: {incident.endTime}</span>}
                      <span>Services: {incident.affectedServices.join(', ')}</span>
                    </div>
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
