import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

import { bn, en } from './locales';

export type Language = 'bn' | 'en';

/** Bangla by default when the device is set to Bangla; a saved choice always wins. */
export function resolveLanguage(saved: string | null, deviceLanguageCode: string | null): Language {
  if (saved === 'bn' || saved === 'en') return saved;
  return deviceLanguageCode === 'bn' ? 'bn' : 'en';
}

const i18n = createInstance();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, bn: { translation: bn } },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
