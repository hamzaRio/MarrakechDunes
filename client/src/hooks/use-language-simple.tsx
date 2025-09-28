import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  changeLanguage: (lang: Language) => void;
  t: (key: string, options?: Record<string, unknown>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translation function (returns key if no translation)
const simpleT = (key: string, options?: Record<string, unknown>): string => {
  // In a simplified setup, you might have a basic object for translations
  // For now, we just return the key, optionally with interpolation
  let translated = key;
  if (options) {
    for (const [k, v] of Object.entries(options)) {
      translated = translated.replace(`{{${k}}}`, String(v));
    }
  }
  if (import.meta.env.MODE === 'development') {
    console.warn(`Missing translation for key: ${key}`);
  }
  return translated;
};

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
    try { localStorage.setItem('marrakech-language', language); } catch {}
    document.dir = 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('i18nextLng', lang); // Keep for consistency if needed elsewhere
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, changeLanguage, t: simpleT }}>
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
