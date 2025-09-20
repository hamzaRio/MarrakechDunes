import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import fr from './locales/fr.json';
import en from './locales/en.json';

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en','fr'],
    ns: ['common','home','activities','booking','reviews','admin'],
    defaultNS: 'common',
    resources: {
      fr: { translation: fr },
      en: { translation: en }
    },
    interpolation: { escapeValue: false },
    detection: { order: ['querystring','localStorage','navigator'] },
    returnNull: false,
    returnEmptyString: false,
    defaultValue: (key: string) => key, // Return key if translation missing
  });

export default i18n;


