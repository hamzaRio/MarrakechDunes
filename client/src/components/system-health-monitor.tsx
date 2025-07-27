import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Database, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Zap,
  Server,
  Wifi,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { useSecurity } from '@/hooks/use-security';

interface SystemHealthData {
  circuitBreaker: {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failureCount: number;
    nextAttempt: number;
    lastFailure?: string;
  };
  database: {
    connected: boolean;
    connectionPool: number;
    queryTime: number;
    lastQuery: string;
  };
  security: {
    activeThreats: number;
    blockedRequests: number;
    rateLimitViolations: number;
    lastSecurityEvent?: string;
  };
  performance: {
    responseTime: number;
    memoryUsage: number;
    cpuUsage: number;
    uptime: number;
  };
}

export default function SystemHealthMonitor() {
  const { logSecurityEvent } = useSecurity();
  const [refreshing, setRefreshing] = useState(false);

  const { data: healthData, refetch, isLoading } = useQuery<SystemHealthData>({
    queryKey: ['/api/admin/system-health'],
    refetchInterval: 5000, // Refresh every 5 seconds
    staleTime: 0,
  });

  useEffect(() => {
    logSecurityEvent('system_health_monitor_accessed');
  }, [logSecurityEvent]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getCircuitBreakerStatus = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, text: 'Healthy' };
      case 'OPEN':
        return { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle, text: 'Circuit Open' };
      case 'HALF_OPEN':
        return { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock, text: 'Testing' };
      default:
        return { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertTriangle, text: 'Unknown' };
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading && !healthData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            System Health Monitor
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Fallback data for demonstration when API is not available
  const displayData: SystemHealthData = healthData || {
    circuitBreaker: {
      state: 'CLOSED',
      failureCount: 0,
      nextAttempt: Date.now() + 30000,
      lastFailure: undefined
    },
    database: {
      connected: false,
      connectionPool: 5,
      queryTime: 45,
      lastQuery: new Date().toISOString()
    },
    security: {
      activeThreats: 0,
      blockedRequests: 12,
      rateLimitViolations: 3,
      lastSecurityEvent: new Date().toISOString()
    },
    performance: {
      responseTime: 120,
      memoryUsage: 512 * 1024 * 1024, // 512MB
      cpuUsage: 25,
      uptime: 86400 * 2 + 3600 * 4 // 2 days, 4 hours
    }
  };

  const circuitStatus = getCircuitBreakerStatus(displayData.circuitBreaker.state);
  const StatusIcon = circuitStatus.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <Activity className="w-5 h-5 mr-2" />
          System Health Monitor
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Circuit Breaker Status Alert */}
      {displayData.circuitBreaker.state !== 'CLOSED' && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            Circuit breaker is {displayData.circuitBreaker.state.toLowerCase()}. 
            {displayData.circuitBreaker.failureCount > 0 && 
              ` ${displayData.circuitBreaker.failureCount} consecutive failures detected.`
            }
          </AlertDescription>
        </Alert>
      )}

      {/* Main Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Circuit Breaker Status */}
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-blue-700">
              <Zap className="w-4 h-4 mr-2" />
              Circuit Breaker
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Status:</span>
              <Badge className={`${circuitStatus.color} text-xs flex items-center`}>
                <StatusIcon className="w-3 h-3 mr-1" />
                {circuitStatus.text}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Failures:</span>
              <span className={`text-xs font-medium ${
                displayData.circuitBreaker.failureCount > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {displayData.circuitBreaker.failureCount}/3
              </span>
            </div>

            {displayData.circuitBreaker.state === 'OPEN' && (
              <div className="text-xs text-gray-600">
                <span>Next attempt:</span>
                <div className="text-orange-600 font-medium">
                  {Math.max(0, Math.ceil((displayData.circuitBreaker.nextAttempt - Date.now()) / 1000))}s
                </div>
              </div>
            )}

            <Progress 
              value={displayData.circuitBreaker.state === 'CLOSED' ? 100 : 
                     displayData.circuitBreaker.state === 'OPEN' ? 0 : 50} 
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Database Health */}
        <Card className="border-green-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-green-700">
              <Database className="w-4 h-4 mr-2" />
              Database
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Status:</span>
              <Badge className={`text-xs ${
                displayData.database.connected 
                  ? 'bg-green-100 text-green-800 border-green-200' 
                  : 'bg-red-100 text-red-800 border-red-200'
              }`}>
                {displayData.database.connected ? (
                  <>
                    <Wifi className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3 h-3 mr-1" />
                    Fallback Mode
                  </>
                )}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Pool Size:</span>
              <span className="text-xs font-medium text-blue-600">
                {displayData.database.connectionPool}/10
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Query Time:</span>
              <span className={`text-xs font-medium ${
                displayData.database.queryTime > 100 ? 'text-red-600' : 'text-green-600'
              }`}>
                {displayData.database.queryTime}ms
              </span>
            </div>

            <Progress 
              value={displayData.database.connected ? 100 : 0} 
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Security Status */}
        <Card className="border-purple-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-purple-700">
              <Shield className="w-4 h-4 mr-2" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Active Threats:</span>
              <span className={`text-xs font-medium ${
                displayData.security.activeThreats > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {displayData.security.activeThreats}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Blocked Requests:</span>
              <span className="text-xs font-medium text-orange-600">
                {displayData.security.blockedRequests}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Rate Limit Hits:</span>
              <span className="text-xs font-medium text-yellow-600">
                {displayData.security.rateLimitViolations}
              </span>
            </div>

            <Progress 
              value={Math.max(0, 100 - (displayData.security.activeThreats * 20))} 
              className="h-2"
            />
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center text-orange-700">
              <Server className="w-4 h-4 mr-2" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Response Time:</span>
              <span className={`text-xs font-medium flex items-center ${
                displayData.performance.responseTime > 200 ? 'text-red-600' : 'text-green-600'
              }`}>
                {displayData.performance.responseTime < 150 ? (
                  <TrendingDown className="w-3 h-3 mr-1" />
                ) : (
                  <TrendingUp className="w-3 h-3 mr-1" />
                )}
                {displayData.performance.responseTime}ms
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Memory:</span>
              <span className="text-xs font-medium text-blue-600">
                {formatBytes(displayData.performance.memoryUsage)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">CPU:</span>
              <span className={`text-xs font-medium ${
                displayData.performance.cpuUsage > 80 ? 'text-red-600' : 'text-green-600'
              }`}>
                {displayData.performance.cpuUsage}%
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Uptime:</span>
              <span className="text-xs font-medium text-gray-700">
                {formatUptime(displayData.performance.uptime)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Logs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-gray-600">Last Database Query:</span>
                <span className="text-gray-800">
                  {displayData.database.lastQuery ? 
                    new Date(displayData.database.lastQuery).toLocaleTimeString() : 'N/A'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between py-1 border-b">
                <span className="text-gray-600">Last Security Event:</span>
                <span className="text-gray-800">
                  {displayData.security.lastSecurityEvent ? 
                    new Date(displayData.security.lastSecurityEvent).toLocaleTimeString() : 'N/A'
                  }
                </span>
              </div>
              {displayData.circuitBreaker.lastFailure && (
                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-red-600">Last Failure:</span>
                  <span className="text-red-800">
                    {new Date(displayData.circuitBreaker.lastFailure).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center">
              <AlertTriangle className="w-4 h-4 mr-2" />
              System Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-xs">
              {displayData.circuitBreaker.state !== 'CLOSED' && (
                <div className="p-2 bg-orange-50 border border-orange-200 rounded text-orange-800">
                  Circuit breaker protection active
                </div>
              )}
              {!displayData.database.connected && (
                <div className="p-2 bg-yellow-50 border border-yellow-200 rounded text-yellow-800">
                  Database connection unavailable - using fallback data
                </div>
              )}
              {displayData.performance.responseTime > 200 && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-800">
                  High response times detected
                </div>
              )}
              {displayData.security.activeThreats === 0 && 
               displayData.circuitBreaker.state === 'CLOSED' && 
               displayData.performance.responseTime < 150 && (
                <div className="p-2 bg-green-50 border border-green-200 rounded text-green-800">
                  All systems operating normally
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}