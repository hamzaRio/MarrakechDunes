import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en','fr'],
    // Remove namespace configuration since we're using a single flat structure
    resources: {
      fr: { 
        translation: fr,
        common: fr,
        home: fr,
        activities: fr,
        booking: fr,
        reviews: fr,
        admin: fr 
      },
      en: { 
        translation: en,
        common: en,
        home: en,
        activities: en,
        booking: en,
        reviews: en,
        admin: en 
      }
    },
    interpolation: { escapeValue: false },
    detection: { order: ['querystring','localStorage','navigator'] },
    returnNull: false,
    returnEmptyString: false,
    defaultValue: (key: string) => {
      console.warn(`Translation missing for key: ${key}`);
      return key; // Return key if translation missing
    },
    debug: import.meta.env.MODE === 'development' // Enable debug in development
  });

export default i18n;


