import { createContext, useContext, ReactNode } from 'react';

interface SecurityContext {
  isSecureConnection: boolean;
  logSecurityEvent: (event: string, details?: any) => void;
}

const SecurityContext = createContext<SecurityContext | null>(null);

export function SecurityProvider({ children }: { children: ReactNode }) {
  // Simple security check - just HTTPS detection
  const isSecureConnection = window.location.protocol === 'https:' || 
                             window.location.hostname === 'localhost' ||
                             window.location.hostname === '127.0.0.1';

  // Simplified logging - just console in dev, nothing in production
  const logSecurityEvent = (event: string, details?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SECURITY] ${event}`, details);
    }
  };

  return (
    <SecurityContext.Provider value={{
      isSecureConnection,
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
