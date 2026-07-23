import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState({});

  useEffect(() => {
    // Load saved language preference
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
    fetchLanguages();
  }, []);

  useEffect(() => {
    if (language) {
      fetchTranslations(language);
      localStorage.setItem('language', language);
    }
  }, [language]);

  const fetchLanguages = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/languages');
      setLanguages(response.data);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchTranslations = async (lang) => {
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:5000/api/translations/${lang}`);
      setTranslations(response.data);
    } catch (error) {
      console.error('Error fetching translations:', error);
    }
    setLoading(false);
  };

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const t = (key) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, languages, translations, changeLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}