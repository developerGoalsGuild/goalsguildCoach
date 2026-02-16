'use client';

import { createContext, useContext, useMemo, useState, useEffect } from 'react';

// Carregar traduções
import ptBR from '../../messages/pt-BR.json';
import enUS from '../../messages/en-US.json';

// Dicionário de traduções
const translations = {
  'pt-BR': ptBR,
  'en-US': enUS
};

const I18nContext = createContext(null);

/**
 * Provider de i18n reativo.
 */
export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('pt-BR');

  useEffect(() => {
    const savedLocale = localStorage.getItem('locale');
    if (savedLocale && translations[savedLocale]) {
      setLocaleState(savedLocale);
      return;
    }

    const browserLang = navigator.language || navigator.userLanguage;
    if (browserLang?.toLowerCase().startsWith('en')) {
      setLocaleState('en-US');
    }
  }, []);

  const setLocale = (newLocale) => {
    if (!translations[newLocale]) return;
    setLocaleState(newLocale);
    localStorage.setItem('locale', newLocale);
  };

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      translations: translations[locale] || translations['pt-BR'],
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook para usar tradução
 * @param {string} namespace - Namespace da tradução (ex: 'nav', 'home', 'coach')
 * @returns {function} Função de tradução
 * 
 * @example
 * const t = useTranslations('nav');
 * <h1>{t('home')}</h1>
 */
export function useTranslations(namespace) {
  const context = useContext(I18nContext);
  const activeTranslations = context?.translations || translations['pt-BR'];
  const namespaceTranslations = activeTranslations[namespace] || {};

  const t = (key) => {
    const keys = key.split('.');
    let value = namespaceTranslations;
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return t;
}

/**
 * Hook para acessar informações do locale
 * @returns {object} { locale, setLocale, translations }
 */
export function useLocale() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      locale: 'pt-BR',
      setLocale: () => {},
      translations: translations['pt-BR'],
    };
  }
  return context;
}
