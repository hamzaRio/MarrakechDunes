import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface SecurityContext {
  isSecureConnection: boolean;
  sessionTimeout: number;
  lastActivity: Date;
  securityLevel: 'low' | 'medium' | 'high';
  rateLimitRemaining: number;
  enableSecurityWarnings: boolean;
  logSecurityEvent: (event: string, details?: any) => void;
}

const SecurityContext = createContext<SecurityContext | null>(null);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [isSecureConnection, setIsSecureConnection] = useState(false);
  const [sessionTimeout] = useState(24 * 60 * 60 * 1000); // 24 hours
  const [lastActivity, setLastActivity] = useState(new Date());
  const [securityLevel] = useState<'low' | 'medium' | 'high'>('high');
  const [rateLimitRemaining, setRateLimitRemaining] = useState(100);
  const [enableSecurityWarnings] = useState(true);

  // Check if connection is secure
  useEffect(() => {
    const isSecure = window.location.protocol === 'https:' || 
                     window.location.hostname === 'localhost' ||
                     window.location.hostname === '127.0.0.1';
    setIsSecureConnection(isSecure);

    if (!isSecure && window.location.hostname !== 'localhost') {
      toast({
        title: "Security Warning",
        description: "This connection is not secure. Please use HTTPS.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Track user activity for session management
  useEffect(() => {
    const updateActivity = () => {
      setLastActivity(new Date());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity, true);
      });
    };
  }, []);

  // Monitor rate limit headers from API responses
  useEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      const response = await originalFetch(...args);
      const remaining = response.headers.get('X-RateLimit-Remaining');
      if (remaining) {
        setRateLimitRemaining(parseInt(remaining));
        if (parseInt(remaining) < 10) {
          toast({
            title: "Rate Limit Warning",
            description: `Only ${remaining} requests remaining this minute`,
            variant: "destructive",
          });
        }
      }
      return response;
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [toast]);

  // Security event logging
  const logSecurityEvent = (event: string, details?: any) => {
    // Skip all security logging in development mode
    if (process.env.NODE_ENV === 'development') {
      return;
    }
    
    console.log(`[SECURITY] ${event}`, {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      details
    });

    // Send to server for audit logging in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/security-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          details,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(console.error);
    }
  };

  // Session timeout warning
  useEffect(() => {
    const checkSessionTimeout = () => {
      const timeSinceActivity = Date.now() - lastActivity.getTime();
      const timeUntilTimeout = sessionTimeout - timeSinceActivity;

      if (timeUntilTimeout < 5 * 60 * 1000 && timeUntilTimeout > 0) { // 5 minutes warning
        toast({
          title: "Session Expiring Soon",
          description: "Your session will expire in 5 minutes. Please save your work.",
          variant: "destructive",
        });
      }
    };

    const interval = setInterval(checkSessionTimeout, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [lastActivity, sessionTimeout, toast]);

  return (
    <SecurityContext.Provider value={{
      isSecureConnection,
      sessionTimeout,
      lastActivity,
      securityLevel,
      rateLimitRemaining,
      enableSecurityWarnings,
      logSecurityEvent
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (!context) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}