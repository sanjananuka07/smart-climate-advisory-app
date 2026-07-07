import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { translations, languageNames, type Language, type TranslationKey } from '../i18n/translations';

interface I18nContextValue {
  lang: Language;
  setLang: (l: Language) => void;
  t: (key: TranslationKey) => string;
  languageNames: Record<Language, { native: string; english: string }>;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const STORAGE_KEY = 'agromihira-lang';

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && ['en', 'te', 'hi', 'ta', 'kn', 'ml'].includes(saved)) {
      return saved as Language;
    }
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  const value: I18nContextValue = {
    lang,
    setLang: setLangState,
    t: (key) => translations[lang][key] ?? translations.en[key] ?? key,
    languageNames,
  };

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
