import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import en from './locales/en.json';
import am from './locales/am.json';
import ar from './locales/ar.json';
import fr from './locales/fr.json';

const resources = {
  en: {
    translation: en,
  },
  am: {
    translation: am,
  },
  ar: { translation: ar },
  fr: { translation: fr },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // default language
    fallbackLng: 'en',
    debug: __DEV__,
    compatibilityJSON: 'v3',

    interpolation: {
      escapeValue: false, // React already does escaping
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;