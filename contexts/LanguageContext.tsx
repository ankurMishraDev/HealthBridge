"use client";
import { createContext, useState, useEffect, ReactNode, FC } from 'react';

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  translations: Record<string, string>;
  fallbackTranslations: Record<string, string>;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export const LanguageProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('curez_language') || 'en';
    }
    return 'en';
  });
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [fallbackTranslations, setFallbackTranslations] = useState<
    Record<string, string>
  >({});

  useEffect(() => {
    const loadFallbackTranslations = async () => {
      try {
        const enTranslations = await import(`../locales/en.json`);
        setFallbackTranslations(enTranslations.default);
        setTranslations(enTranslations.default);
      } catch (error) {
        console.error('Could not load default English translations', error);
      }
    };

    loadFallbackTranslations();
  }, []);

  useEffect(() => {
    const loadTranslations = async () => {
      if (Object.keys(fallbackTranslations).length === 0) {
        return;
      }

      if (language === 'en') {
        setTranslations(fallbackTranslations);
        return;
      }

      try {
        const newTranslations = await import(`../locales/${language}.json`);
        setTranslations(newTranslations.default);
      } catch (error) {
        console.error(`Could not load translations for ${language}`, error);
        // Fallback to English if the selected language file is not found
        setTranslations(fallbackTranslations);
      }
    };

    loadTranslations();
  }, [language, fallbackTranslations]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('curez_language', language);
    }
  }, [language]);

  const value = {
    language,
    setLanguage,
    translations,
    fallbackTranslations,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};
