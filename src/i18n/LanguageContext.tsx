import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react';
import { en } from './translations/en';
import { et } from './translations/et';
import type { Language, Translations } from './types';

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  translations: Translations;
};

const translationsByLanguage: Record<Language, Translations> = {
  et,
  en,
};

const LANGUAGE_STORAGE_KEY = 'family-tree-language';
const LanguageContext = createContext<LanguageContextValue | null>(null);

function getInitialLanguage(): Language {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

    return storedLanguage === 'en' || storedLanguage === 'et' ? storedLanguage : 'et';
  } catch {
    return 'et';
  }
}

export function LanguageProvider({ children }: PropsWithChildren) {
  const [language, setLanguage] = useState<Language>(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = en.landing.title;

    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // Keep the in-memory language when storage is unavailable.
    }
  }, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      translations: translationsByLanguage[language],
    }),
    [language],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
}

export function useLanguage() {
  const value = useContext(LanguageContext);

  if (!value) {
    throw new Error('useLanguage must be used within LanguageProvider.');
  }

  return value;
}
