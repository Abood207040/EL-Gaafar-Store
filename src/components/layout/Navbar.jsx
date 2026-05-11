// src/components/layout/Navbar.jsx
import { useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function Navbar({ currentPage, navigate, cartCount = 0 }) {
  const { t, language, toggleLanguage } = useLocalization();
  const [menuOpen, setMenuOpen] = useState(false);

  const navLinks = [
    { id: 'shop', label: t('shop') },
    { id: 'cart', label: t('cart') },
    { id: 'my-orders', label: t('myOrders') },
  ];

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        {/* Logo */}
        <button
          className="navbar-brand"
          onClick={() => navigate('shop')}
          aria-label={t('goToShop')}
        >
          <div className="brand-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="16" fill="#F67113" />
              <path d="M8 16 C8 11 12 8 16 8 C20 8 24 11 24 16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
              <circle cx="16" cy="18" r="4" fill="#fff" opacity="0.9"/>
              <path d="M16 22 L16 26" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className="brand-text">
            <span className="brand-en">Al-Jafar Store</span>
            <span className="brand-ar arabic-text" lang="ar" dir="rtl">متجر الجعفر</span>
          </div>
        </button>

        {/* Desktop Nav */}
        <nav className="navbar-nav" aria-label={t('mainNavigation')}>
          {navLinks.map(link => (
            <button
              key={link.id}
              className={`nav-link ${currentPage === link.id ? 'active' : ''}`}
              onClick={() => navigate(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Actions */}
        <div className="navbar-actions">
          {/* EN/AR toggle placeholder */}
          <button
            className="lang-toggle btn btn-ghost btn-sm"
            title={t('toggleLanguage')}
            onClick={toggleLanguage}
          >
            {language === 'ar' ? 'EN' : 'AR'}
          </button>

          {/* Cart */}
          <button
            className="navbar-icon-btn"
            onClick={() => navigate('cart')}
            aria-label={t('cartItems', cartCount)}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="cart-badge" aria-hidden="true">{cartCount}</span>
            )}
          </button>

          {/* Account */}
          <button
            className="navbar-icon-btn"
            aria-label={t('account')}
            onClick={() => navigate('my-orders')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>

          {/* Admin Link */}
          <button
            className={`btn btn-dark btn-sm ${currentPage?.startsWith('admin') ? 'btn-primary' : ''}`}
            onClick={() => navigate('admin-dashboard')}
          >
            {t('admin')}
          </button>

          {/* Hamburger */}
          <button
            className="hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={t('mobileNavigation')}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu animate-fadeIn" role="navigation" aria-label={t('mobileNavigation')}>
          {navLinks.map(link => (
            <button
              key={link.id}
              className={`mobile-nav-link ${currentPage === link.id ? 'active' : ''}`}
              onClick={() => { navigate(link.id); setMenuOpen(false); }}
            >
              {link.label}
            </button>
          ))}
          <button
            className="mobile-nav-link"
            onClick={() => { navigate('admin-dashboard'); setMenuOpen(false); }}
          >
            {t('adminPanel')}
          </button>
        </div>
      )}
    </header>
  );
}
