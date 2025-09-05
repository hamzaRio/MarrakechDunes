import { useState, useEffect } from 'react';
import { translations } from '@/lib/translations';

export function useLanguage() {
  const [language, setLanguage] = useState<'en' | 'fr'>('en');

  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as 'en' | 'fr';
    if (savedLanguage && translations[savedLanguage]) {
      setLanguage(savedLanguage);
    }
  }, []);

  const changeLanguage = (newLanguage: 'en' | 'fr') => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language];
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        break;
      }
    }
    
    // Return the value if it's a string, otherwise return the key as fallback
    return typeof value === 'string' ? value : key;
  };

  return {
    language,
    changeLanguage,
    t
  };
}