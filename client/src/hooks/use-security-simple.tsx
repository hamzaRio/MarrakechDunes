import { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface SecurityContextType {
  isSecure: boolean;
  checkSecurity: () => void;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: ReactNode }) {
  const [isSecure, setIsSecure] = useState(() => {
    // Simple HTTPS check
    return window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  });

  const checkSecurity = () => {
    const secure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsSecure(secure);
  };

  useEffect(() => {
    checkSecurity();
  }, []);

  return (
    <SecurityContext.Provider value={{ isSecure, checkSecurity }}>
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
