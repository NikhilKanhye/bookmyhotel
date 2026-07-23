import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import HotelsPage from './pages/HotelsPage';
import HotelDetailPage from './pages/HotelDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminHotelsPage from './pages/AdminHotelsPage';
import AdminPromotionsPage from './pages/AdminPromotionsPage';
import AdminMessagesPage from './pages/AdminMessagesPage';
import ContactPage from './pages/ContactPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';
import RequestResetPage from './pages/RequestResetPage';
import ResetPasswordPage from './pages/ResetPasswordPage';

function AppContent() {
  const [userName, setUserName] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [loading, setLoading] = useState(false);
  const { language, languages, changeLanguage, t } = useLanguage();

  useEffect(() => {
    setIsLoggedIn(false);
    setUserName('');
    setUserRole('');
    setLoading(false);
  }, []);

  const handleLogin = (name, role, userId) => {
    localStorage.setItem('user_id', userId);
    localStorage.setItem('user_name', name);
    localStorage.setItem('user_role', role);
    setUserName(name);
    setIsLoggedIn(true);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_role');
    setUserName('');
    setIsLoggedIn(false);
    setUserRole('');
    window.location.href = '/';
  };

  const firstName = userName ? userName.split(' ')[0] : '';

  if (loading) {
    return <div className="text-center mt-5"><h3>{t('loading')}</h3></div>;
  }

  return (
    <Router>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
        <div className="container">
          <Link className="navbar-brand" to="/">BookMyHotel</Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav me-auto">
              <li className="nav-item"><Link className="nav-link" to="/">{t('home')}</Link></li>
              {(!isLoggedIn || (isLoggedIn && userRole !== 'admin')) && (
                <li className="nav-item"><Link className="nav-link" to="/hotels">{t('hotels')}</Link></li>
              )}
              {(!isLoggedIn || (isLoggedIn && userRole !== 'admin')) && (
                <li className="nav-item"><Link className="nav-link" to="/contact">{t('contact')}</Link></li>
              )}
              {isLoggedIn && userRole === 'admin' && (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/admin">{t('dashboard')}</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/admin/hotels">{t('manage_hotels')}</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/admin/promotions">{t('promotions')}</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/admin/messages">{t('messages')}</Link></li>
                </>
              )}
              {isLoggedIn && userRole !== 'admin' && (
                <li className="nav-item"><Link className="nav-link" to="/my-bookings">{t('my_bookings')}</Link></li>
              )}
            </ul>
            <ul className="navbar-nav ms-auto">
              {/* Language Selector */}
              <li className="nav-item dropdown">
                <button className="btn btn-outline-light btn-sm dropdown-toggle" data-bs-toggle="dropdown">
                  {languages[language]?.flag || '🌍'} {language.toUpperCase()}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  {Object.keys(languages).map((lang) => (
                    <li key={lang}>
                      <button 
                        className={`dropdown-item ${language === lang ? 'active' : ''}`}
                        onClick={() => changeLanguage(lang)}
                      >
                        {languages[lang]?.flag} {languages[lang]?.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              {isLoggedIn ? (
                <>
                  <li className="nav-item">
                    <span className="nav-link text-light">{t('welcome_back')}, {firstName}</span>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-danger btn-sm mt-1" onClick={handleLogout}>{t('logout')}</button>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/login">{t('login')}</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/register">{t('register')}</Link></li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>
      
      <div className="container mt-4">
        <Routes>
          <Route path="/" element={<h1>{t('welcome')}</h1>} />
          <Route path="/hotels" element={<HotelsPage />} />
          <Route path="/hotels/:hotelId" element={<HotelDetailPage />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/hotels" element={<AdminHotelsPage />} />
          <Route path="/admin/promotions" element={<AdminPromotionsPage />} />
          <Route path="/admin/messages" element={<AdminMessagesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancel" element={<PaymentCancelPage />} />
          <Route path="/request-reset" element={<RequestResetPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

export default App;