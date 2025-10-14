import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { logout } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/use-language';

interface AutoLogoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
}

export default function AutoLogout({ 
  timeoutMinutes = 5, 
  warningMinutes = 1 
}: AutoLogoutProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const timeoutRef = useRef<number>();
  const warningRef = useRef<number>();
  const lastActivityRef = useRef<number>(Date.now());

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      queryClient.invalidateQueries({ queryKey: ["/auth/user"] });
      toast({
        title: t('admin.sessionExpired'),
        description: t('admin.sessionExpiredDescription'),
        variant: 'destructive',
      });
    } catch (error) {
      console.error('Auto-logout error:', error);
      // Force logout even if API call fails
      window.location.href = '/admin/login';
    }
  }, [queryClient, toast, t]);

  const showWarning = useCallback(() => {
    toast({
      title: t('admin.sessionWarning'),
      description: t('admin.sessionWarningDescription', { minutes: warningMinutes }),
      variant: 'destructive',
      duration: (warningMinutes * 60 * 1000), // Show warning for remaining time
    });
  }, [toast, t, warningMinutes]);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timers
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);

    // Only set timers if user is admin/superadmin
    if (user && (user.role === 'admin' || user.role === 'superadmin')) {
      const timeoutMs = timeoutMinutes * 60 * 1000;
      const warningMs = (timeoutMinutes - warningMinutes) * 60 * 1000;

      // Set warning timer
      if (warningMinutes > 0 && warningMs > 0) {
        warningRef.current = setTimeout(showWarning, warningMs);
      }

      // Set logout timer
      timeoutRef.current = setTimeout(handleLogout, timeoutMs);
    }
  }, [user, timeoutMinutes, warningMinutes, handleLogout, showWarning]);

  // Activity detection
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return;
    }

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    const handleActivity = () => {
      const now = Date.now();
      // Only reset if significant time has passed (throttle to avoid too many resets)
      if (now - lastActivityRef.current > 30000) { // 30 seconds throttle
        resetTimer();
      }
    };

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Cleanup
    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (warningRef.current) clearTimeout(warningRef.current);
    };
  }, [user, resetTimer]);

  // Handle page visibility changes
  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden, don't reset timer
        return;
      } else {
        // Page is visible again, reset timer
        resetTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, resetTimer]);

  // This component doesn't render anything
  return null;
}
