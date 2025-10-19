import { createContext, useContext, useState, ReactNode } from "react";
import enTranslations from '../locales/en.json';
import frTranslations from '../locales/fr.json';

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  changeLanguage: (lang: Language) => void;
  t: <T = string>(key: string, options?: Record<string, unknown>) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Full translations object
const translations = {
  en: enTranslations,
  fr: frTranslations
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage for saved language preference
    try {
      const saved = localStorage.getItem('marrakech-language');
      if (saved === 'en' || saved === 'fr') {
        return saved;
      }
    } catch {}
    
    // Default to French for Morocco-based business
    return 'fr';
  });

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('marrakech-language', lang);
    } catch {}
    document.dir = 'ltr';
    document.documentElement.lang = lang;
  };

  const t = <T = string>(key: string, options?: Record<string, unknown>): T => {
    // Handle nested keys like 'nav.home' or 'activities.title'
    const keys = key.split('.');
    let translation: any = translations[language];
    
    for (const k of keys) {
      if (translation && typeof translation === 'object' && k in translation) {
        translation = translation[k];
      } else {
        if (import.meta.env.MODE === 'development') {
          console.warn(`Missing translation for key: ${key}`);
        }
        return key as unknown as T;
      }
    }
    
    return translation as T;
  };

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
