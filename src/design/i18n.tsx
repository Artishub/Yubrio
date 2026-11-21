import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { german } from '@/design/de';

export type Language = 'de' | 'en';
export type Translate = (text: string) => string;
const languageKey = 'roomhop.language';

// The code is written in English. `t('Open a room')` returns the text for the chosen language:
// English as written, or the German from `src/design/de`. German entries are either an exact
// match or a pattern for texts that contain a value, such as "3 selected".
export function translate(language: Language, text: string) {
  if (language === 'en') return text;
  const exact = german.exact[text];
  if (exact !== undefined) return exact;
  for (const [pattern, replacement] of german.patterns) {
    if (pattern.test(text)) return text.replace(pattern, replacement);
  }
  return text;
}

type LanguageValue = { language: Language; setLanguage: (language: Language) => void; t: Translate };
const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('de');

  useEffect(() => {
    void AsyncStorage.getItem(languageKey)
      .then((saved) => {
        if (saved === 'de' || saved === 'en') setLanguageState(saved);
      })
      .catch(() => undefined);
  }, []);

  const value = useMemo<LanguageValue>(
    () => ({
      language,
      setLanguage: (next) => {
        setLanguageState(next);
        void AsyncStorage.setItem(languageKey, next).catch(() => undefined);
      },
      t: (text) => translate(language, text),
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const value = useContext(LanguageContext);
  if (!value) throw new Error('useLanguage must be used inside LanguageProvider');
  return value;
}

export function useT() {
  return useLanguage().t;
}
