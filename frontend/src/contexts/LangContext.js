import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import API_URL from '../api';

const LanguageContext = createContext();

const LANGUAGES = {
    'en': { name: 'English', flag: '🇬🇧' },
    'fr': { name: 'Français', flag: '🇫🇷' },
    'es': { name: 'Español', flag: '🇪🇸' },
    'de': { name: 'Deutsch', flag: '🇩🇪' },
    'hi': { name: 'हिन्दी', flag: '🇮🇳' }
};

const TRANSLATIONS = {
    'en': {
        'welcome': 'Welcome to BookMyHotel',
        'search_hotels': 'Search Hotels',
        'login': 'Login',
        'register': 'Register',
        'logout': 'Logout',
        'home': 'Home',
        'hotels': 'Hotels',
        'contact': 'Contact',
        'my_bookings': 'My Bookings',
        'dashboard': 'Dashboard',
        'manage_hotels': 'Manage Hotels',
        'promotions': 'Promotions',
        'messages': 'Messages',
        'welcome_back': 'Welcome back',
        'book_now': 'Book Now',
        'view_details': 'View Details',
        'no_hotels': 'No hotels found',
        'loading': 'Loading...'
    },
    'fr': {
        'welcome': 'Bienvenue à BookMyHotel',
        'search_hotels': 'Rechercher des hôtels',
        'login': 'Se connecter',
        'register': "S'inscrire",
        'logout': 'Se déconnecter',
        'home': 'Accueil',
        'hotels': 'Hôtels',
        'contact': 'Contact',
        'my_bookings': 'Mes réservations',
        'dashboard': 'Tableau de bord',
        'manage_hotels': 'Gérer les hôtels',
        'promotions': 'Promotions',
        'messages': 'Messages',
        'welcome_back': 'Bon retour',
        'book_now': 'Réserver maintenant',
        'view_details': 'Voir les détails',
        'no_hotels': 'Aucun hôtel trouvé',
        'loading': 'Chargement...'
    }
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState(LANGUAGES);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    setLanguage(savedLang);
  }, []);

  useEffect(() => {
    if (language) {
      // Use local translations first
      const localTrans = TRANSLATIONS[language] || TRANSLATIONS['en'];
      setTranslations(localTrans);
      localStorage.setItem('language', language);
      
      // Try to fetch from backend (optional)
      const fetchTranslations = async () => {
        try {
          const response = await axios.get(`${API_URL}/api/translations/${language}`);
          if (response.data && Object.keys(response.data).length > 0) {
            setTranslations(response.data);
          }
        } catch (error) {
          // Use local translations if fetch fails
          console.log('Using local translations');
        }
      };
      fetchTranslations();
      setLoading(false);
    }
  }, [language]);

  const changeLanguage = (lang) => {
    setLanguage(lang);
  };

  const t = (key) => {
    return translations[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ 
      language, 
      languages, 
      translations, 
      changeLanguage, 
      t, 
      loading 
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;