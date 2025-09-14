import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';

void i18n
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    lng: (() => {
      try {
        return (localStorage.getItem('marrakech-language') as 'fr' | 'en') || 'fr';
      } catch {
        return 'fr';
      }
    })(),
    fallbackLng: 'fr',
    interpolation: { escapeValue: false },
    returnNull: false,
    returnEmptyString: false,
  });

export default i18n;


