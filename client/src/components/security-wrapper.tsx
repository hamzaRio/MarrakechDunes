import { useEffect, useState, ReactNode } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  Wifi
} from 'lucide-react';
import { useSecurity } from '@/hooks/use-security';
import { useToast } from '@/hooks/use-toast';

interface SecurityWrapperProps {
  children: ReactNode;
  requireSecureConnection?: boolean;
  showSecurityStatus?: boolean;
  enableThreatDetection?: boolean;
  logPageView?: boolean;
}

export default function SecurityWrapper({
  children,
  requireSecureConnection = false,
  showSecurityStatus = false,
  enableThreatDetection = true,
  logPageView = true
}: SecurityWrapperProps) {
  const { 
    isSecureConnection, 
    securityLevel, 
    rateLimitRemaining,
    logSecurityEvent 
  } = useSecurity();
  const { toast } = useToast();
  
  const [securityThreats, setSecurityThreats] = useState<string[]>([]);
  const [showSecurityPanel, setShowSecurityPanel] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Log page view for security audit
  useEffect(() => {
    if (logPageView) {
      logSecurityEvent('page_view', {
        path: window.location.pathname,
        referrer: document.referrer,
        timestamp: new Date().toISOString()
      });
    }
  }, [logSecurityEvent, logPageView]);

  // Monitor for suspicious activity
  useEffect(() => {
    if (!enableThreatDetection) return;
    
    // Disable threat detection in development mode
    if (process.env.NODE_ENV === 'development') {
      return;
    }

    const detectThreats = () => {
      const threats: string[] = [];

      // Check for multiple rapid clicks (potential bot activity)
      let clickCount = 0;
      const clickHandler = () => {
        clickCount++;
        if (clickCount > 20) { // More than 20 clicks per second
          threats.push('Rapid clicking detected - potential bot activity');
          logSecurityEvent('threat_detected', { type: 'rapid_clicking', count: clickCount });
        }
      };

      // Check for console access (potential script injection)
      const originalConsole = console.log;
      console.log = (...args) => {
        if (args.some(arg => typeof arg === 'string' && arg.includes('script'))) {
          threats.push('Console script activity detected');
          logSecurityEvent('threat_detected', { type: 'console_script_access' });
        }
        originalConsole.apply(console, args);
      };

      // Check for developer tools - disabled in development
      let devtools = false;
      setInterval(() => {
        if (window.outerHeight - window.innerHeight > 200 || 
            window.outerWidth - window.innerWidth > 200) {
          if (!devtools) {
            devtools = true;
            threats.push('Developer tools opened');
            logSecurityEvent('threat_detected', { type: 'devtools_opened' });
          }
        } else {
          devtools = false;
        }
      }, 1000);

      document.addEventListener('click', clickHandler);
      setSecurityThreats(threats);

      return () => {
        document.removeEventListener('click', clickHandler);
        console.log = originalConsole;
      };
    };

    const cleanup = detectThreats();
    return cleanup;
  }, [enableThreatDetection, logSecurityEvent]);

  // Monitor connection attempts
  useEffect(() => {
    const monitorConnections = () => {
      const attempts = connectionAttempts + 1;
      setConnectionAttempts(attempts);

      if (attempts > 5) {
        logSecurityEvent('suspicious_connection_attempts', { count: attempts });
        toast({
          title: "Security Alert",
          description: "Multiple connection attempts detected",
          variant: "destructive",
        });
      }
    };

    window.addEventListener('focus', monitorConnections);
    return () => window.removeEventListener('focus', monitorConnections);
  }, [connectionAttempts, logSecurityEvent, toast]);

  // Block access if secure connection required but not available
  if (requireSecureConnection && !isSecureConnection) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <ShieldAlert className="w-6 h-6 mr-2" />
              Secure Connection Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="border-red-200 bg-red-50">
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-red-800">
                This page requires a secure HTTPS connection. Please access this site using HTTPS.
              </AlertDescription>
            </Alert>
            <div className="mt-4 space-y-2">
              <p className="text-sm text-red-600">Security measures:</p>
              <ul className="text-xs text-red-600 space-y-1">
                <li>• SSL/TLS encryption required</li>
                <li>• Data transmission protection</li>
                <li>• Session security enforcement</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getSecurityLevelColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSecurityIcon = (level: string) => {
    switch (level) {
      case 'high': return <ShieldCheck className="w-4 h-4" />;
      case 'medium': return <Shield className="w-4 h-4" />;
      case 'low': return <ShieldAlert className="w-4 h-4" />;
      default: return <Shield className="w-4 h-4" />;
    }
  };

  return (
    <div className="relative">
      {/* Security Status Bar - Hidden but monitoring continues */}
      {false && showSecurityStatus && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center space-x-4">
              <Badge className={`${getSecurityLevelColor(securityLevel)} border-0`}>
                {getSecurityIcon(securityLevel)}
                <span className="ml-1">Security: {securityLevel.toUpperCase()}</span>
              </Badge>
              
              <div className="flex items-center space-x-2">
                {isSecureConnection ? (
                  <div className="flex items-center text-green-600">
                    <Lock className="w-4 h-4 mr-1" />
                    <span className="text-xs">Secure</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <Unlock className="w-4 h-4 mr-1" />
                    <span className="text-xs">Insecure</span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Wifi className="w-4 h-4 text-blue-600" />
                <span className="text-xs text-gray-600">
                  Rate limit: {rateLimitRemaining}/100
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSecurityPanel(!showSecurityPanel)}
              className="text-xs"
            >
              {showSecurityPanel ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              <span className="ml-1">Security Panel</span>
            </Button>
          </div>
        </div>
      )}

      {/* Security Panel - Hidden but monitoring continues */}
      {false && showSecurityPanel && (
        <div className="bg-white border-b border-gray-200 px-4 py-4">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-blue-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center text-blue-700">
                    <Shield className="w-4 h-4 mr-2" />
                    Connection Security
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span>Protocol:</span>
                    <Badge variant={isSecureConnection ? "default" : "destructive"}>
                      {window.location.protocol.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Encryption:</span>
                    <span className={isSecureConnection ? "text-green-600" : "text-red-600"}>
                      {isSecureConnection ? "TLS/SSL" : "None"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Security Level:</span>
                    <Badge className={getSecurityLevelColor(securityLevel)}>
                      {securityLevel.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center text-yellow-700">
                    <Clock className="w-4 h-4 mr-2" />
                    Rate Limiting
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  <div className="flex justify-between">
                    <span>Requests Remaining:</span>
                    <span className={rateLimitRemaining < 20 ? "text-red-600" : "text-green-600"}>
                      {rateLimitRemaining}/100
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        rateLimitRemaining < 20 ? 'bg-red-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${rateLimitRemaining}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between">
                    <span>Reset Time:</span>
                    <span className="text-gray-600">1 minute</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center text-red-700">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Threat Detection
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-xs space-y-2">
                  {securityThreats.length > 0 ? (
                    <div className="space-y-1">
                      {securityThreats.slice(0, 3).map((threat, index) => (
                        <div key={index} className="text-red-600 text-xs">
                          • {threat}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span>No threats detected</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Connection Attempts:</span>
                    <span className={connectionAttempts > 3 ? "text-red-600" : "text-green-600"}>
                      {connectionAttempts}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* Security Alerts - Hidden but monitoring continues */}
      {false && securityThreats.length > 0 && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2">
          <div className="max-w-7xl mx-auto">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {securityThreats.length} security threat(s) detected. Please review your activity.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="relative">
        {children}
      </div>
    </div>
  );
}