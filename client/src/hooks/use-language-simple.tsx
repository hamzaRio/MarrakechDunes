import { createContext, useContext, useState, ReactNode } from "react";

type Language = 'en' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  changeLanguage: (lang: Language) => void;
  t: <T = string>(key: string, options?: Record<string, unknown>) => T;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Simple translations object
const translations = {
  en: {
    'common.bookNow': 'Book Now',
    'common.learnMore': 'Learn More',
    'common.contact': 'Contact',
    'common.home': 'Home',
    'common.activities': 'Activities',
    'common.reviews': 'Reviews',
    'common.admin': 'Admin',
    'home.title': 'Discover Marrakech',
    'home.subtitle': 'Unforgettable experiences in the Red City',
    'activities.title': 'Our Activities',
    'booking.title': 'Book Your Adventure',
    'admin.title': 'Admin Dashboard'
  },
  fr: {
    'common.bookNow': 'Réserver',
    'common.learnMore': 'En savoir plus',
    'common.contact': 'Contact',
    'common.home': 'Accueil',
    'common.activities': 'Activités',
    'common.reviews': 'Avis',
    'common.admin': 'Admin',
    'home.title': 'Découvrez Marrakech',
    'home.subtitle': 'Expériences inoubliables dans la Ville Rouge',
    'activities.title': 'Nos Activités',
    'booking.title': 'Réservez Votre Aventure',
    'admin.title': 'Tableau de Bord Admin'
  }
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

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem('marrakech-language', lang);
    } catch {}
    document.dir = 'ltr';
    document.documentElement.lang = lang;
  };

  const t = <T = string>(key: string, options?: Record<string, unknown>): T => {
    const translation = translations[language][key as keyof typeof translations[typeof language]];
    
    if (!translation) {
      if (import.meta.env.MODE === 'development') {
        console.warn(`Missing translation for key: ${key}`);
      }
      return key as unknown as T;
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
