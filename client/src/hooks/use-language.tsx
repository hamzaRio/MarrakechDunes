import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import i18n from "../i18n";
type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  changeLanguage: (lang: Language) => void;
  t: <T = string>(key: string, options?: Record<string, unknown>) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('marrakech-language') as Language | null;
      return stored || 'fr';
    } catch {
      return 'fr';
    }
  });

  useEffect(() => {
    i18n.changeLanguage(language);
    try { localStorage.setItem('marrakech-language', language); } catch {}
    document.dir = 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    i18n.changeLanguage(lang);
    localStorage.setItem('i18nextLng', lang);
  };

  const t = useMemo(() => {
    return <T = string>(key: string, options?: Record<string, unknown>): T => {
      const translation = i18n.t(key, options);
      
      // If translation is missing (returns the key), log for debugging and return key
      if (translation === key && (!options || !Object.prototype.hasOwnProperty.call(options, "defaultValue"))) {
        if (import.meta.env.MODE === 'development') {
          console.warn(`Missing translation for key: ${key}`);
        }
        
        // Return the key itself to make missing translations obvious
        return key as unknown as T;
      }
      
      return translation as T;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}