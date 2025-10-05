import { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }

  const t = (key: string, params: { [key: string]: string } = {}) => {
    const translationValue =
      context.translations[key] ??
      context.fallbackTranslations?.[key] ??
      key;
    let translation = translationValue;
    Object.keys(params).forEach(param => {
      translation = translation.replace(`{${param}}`, params[param]);
    });
    return translation;
  };

  return { ...context, t };
};
