import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import i18n, { type Language, resolveLanguage } from '@/i18n';

const LANGUAGE_KEY = 'preferences.language';
const ONBOARDED_KEY = 'preferences.onboarded';

type Preferences = {
  /** False until saved choices are read, so the splash can stay up. */
  ready: boolean;
  language: Language;
  onboarded: boolean;
  setLanguage: (language: Language) => void;
  completeOnboarding: () => void;
};

const PreferencesContext = createContext<Preferences | null>(null);

export function PreferencesProvider({ children }: PropsWithChildren) {
  const [ready, setReady] = useState(false);
  const [language, setLanguageState] = useState<Language>('en');
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    (async () => {
      let saved: [string | null, string | null] = [null, null];
      try {
        const [[, lang], [, done]] = await AsyncStorage.multiGet([LANGUAGE_KEY, ONBOARDED_KEY]);
        saved = [lang, done];
      } catch {
        // Unreadable storage behaves like a first launch.
      }
      const resolved = resolveLanguage(saved[0], getLocales()[0]?.languageCode ?? null);
      await i18n.changeLanguage(resolved);
      setLanguageState(resolved);
      setOnboarded(saved[1] === '1');
      setReady(true);
    })();
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    i18n.changeLanguage(next);
    AsyncStorage.setItem(LANGUAGE_KEY, next).catch(() => {});
  }, []);

  const completeOnboarding = useCallback(() => {
    setOnboarded(true);
    AsyncStorage.multiSet([
      [ONBOARDED_KEY, '1'],
      [LANGUAGE_KEY, language],
    ]).catch(() => {});
  }, [language]);

  const value = useMemo(
    () => ({ ready, language, onboarded, setLanguage, completeOnboarding }),
    [ready, language, onboarded, setLanguage, completeOnboarding],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error('usePreferences must be used inside PreferencesProvider');
  return value;
}
