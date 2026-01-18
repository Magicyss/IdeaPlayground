import { createContext, useContext, useState, useEffect } from 'react';
import { translations, getBrowserLanguage } from './translations';

const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    // Check localStorage first
    const saved = localStorage.getItem('language');
    if (saved) return saved;
    // Otherwise detect browser language
    return getBrowserLanguage();
  });

  useEffect(() => {
    // Save language preference
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key, replacements = {}) => {
    let text = translations[language]?.[key] || translations['en'][key] || key;
    
    // Replace placeholders like {count}, {current}, {total}
    Object.keys(replacements).forEach(placeholder => {
      text = text.replace(`{${placeholder}}`, replacements[placeholder]);
    });
    
    return text;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
