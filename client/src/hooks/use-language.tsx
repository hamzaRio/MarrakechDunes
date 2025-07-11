import { createContext, useContext, useState, ReactNode } from "react";
import { Language, getTranslation } from "@/lib/translations";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    // Detect browser language or use saved preference
    const saved = localStorage.getItem('marrakech-language') as Language;
    if (saved && ['en', 'fr', 'ar'].includes(saved)) {
      return saved;
    }
    
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('fr')) return 'fr';
    if (browserLang.startsWith('ar')) return 'ar';
    return 'en';
  });

  const handleSetLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('marrakech-language', lang);
    
    // Update document direction for Arabic
    document.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  };

  const t = (key: string) => getTranslation(language, key);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
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