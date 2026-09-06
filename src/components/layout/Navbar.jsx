import { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { supabase } from '../../services/authService.js';
import placeholderImg from '../../assets/main-image.png';

export default function Navbar({ currentPage, navigate, cartCount = 0 }) {
  const { t, language, toggleLanguage, isArabic } = useLocalization();
  const { user, customerProfile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  // Close mobile menu on escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchResults([]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle outside click to close search dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle live search
  useEffect(() => {
    const fetchResults = async () => {
      const q = searchQuery.trim();
      if (q.length < 2) {
        setSearchResults([]);
        setSearchLoading(false);
        return;
      }
      
      setSearchLoading(true);
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name_en, name_ar, image_url, description_en, description_ar, price, category')
          .eq('is_active', true)
          .or(`name_en.ilike.%${q}%,name_ar.ilike.%${q}%,sku.ilike.%${q}%`)
          .limit(6);
        
        if (!error && data) {
          setSearchResults(data);
        }
      } catch {
        // search failure handled silently
      } finally {
        setSearchLoading(false);
      }
    };
    
    const debounceTimer = setTimeout(fetchResults, 280);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelectProduct = (product) => {
    navigate('product-details', { id: product.id });
    setSearchQuery('');
    setSearchResults([]);
  };

  const navLinks = [
    { 
      id: 'home', 
      label: t('home'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    { 
      id: 'shop', 
      label: t('shop'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      )
    },
    { 
      id: 'categories', 
      label: t('categories'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      )
    },
    { 
      id: 'my-orders', 
      label: t('myOrders'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
        </svg>
      )
    },
    { 
      id: 'contact', 
      label: t('contactUs'),
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      )
    },
  ];

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        {/* Brand Logo */}
        <button className="navbar-brand" onClick={() => navigate('home')} aria-label={t('goToShop')}>
          <div className="brand-icon" aria-hidden="true">
            <img 
              src="/images/transparentlogo.png" 
              alt="Al-Jafar Store" 
              className="navbar-brand-img"
              style={{ height: '46px', width: 'auto', objectFit: 'contain', maxHeight: '100%', maxWidth: '145px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} 
            />
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="navbar-nav" aria-label={t('mainNavigation')}>
          {navLinks.map((link) => {
            const isActive = currentPage === link.id;
            return (
              <button
                key={link.id}
                className={`nav-link ${isActive ? 'active' : ''}`}
                onClick={() => navigate(link.id)}
              >
                <span>{link.label}</span>
                {isActive && <span className="nav-link-indicator" />}
              </button>
            );
          })}
        </nav>

        {/* Live Search Bar */}
        <form 
          className="navbar-search" 
          ref={searchRef}
          onSubmit={(e) => {
            e.preventDefault();
            if (searchQuery.trim()) {
              navigate('shop', { q: searchQuery.trim() });
              setSearchQuery('');
              setSearchResults([]);
            }
          }}
        >
          <div className="search-input-wrapper">
            <span className="search-icon" aria-hidden="true">
              {searchLoading ? (
                <div className="search-spinner" />
              ) : (
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              )}
            </span>
            <input
              type="search"
              className="search-input"
              placeholder={isArabic ? 'ابحث عن خلاط، محبس، ماسورة، عدة سباكة...' : 'Search faucets, valves, pipes, tools...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                if (searchQuery.length >= 2) setSearchQuery(e.target.value);
              }}
              aria-label={t('search')}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="search-clear-btn"
                onClick={() => { setSearchQuery(''); setSearchResults([]); }}
                aria-label="Clear search"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Autocomplete Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="search-autocomplete-dropdown animate-fadeIn">
              <div className="search-dropdown-header">
                <span>{isArabic ? 'المنتجات المطابقة' : 'Matching Products'}</span>
                <span className="search-results-count">{searchResults.length}</span>
              </div>
              <div className="search-dropdown-list">
                {searchResults.map((product) => {
                  const name = language === 'ar' && product.name_ar ? product.name_ar : product.name_en;
                  const desc = language === 'ar' && product.description_ar ? product.description_ar : product.description_en;
                  
                  return (
                    <div 
                      key={product.id}
                      className="search-dropdown-item"
                      onClick={() => handleSelectProduct(product)}
                    >
                      <img 
                        src={product.image_url || placeholderImg} 
                        alt={name} 
                        className="search-item-img"
                        onError={(e) => { e.target.src = placeholderImg; }}
                      />
                      <div className="search-item-info">
                        <div className="search-item-title">{name}</div>
                        {desc && <div className="search-item-desc">{desc}</div>}
                      </div>
                      <div className="search-item-price">
                        {product.price ? `${Number(product.price).toFixed(0)} ج.م` : ''}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button 
                type="button"
                className="search-dropdown-footer"
                onClick={() => {
                  navigate('shop', { q: searchQuery.trim() });
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                <span>{isArabic ? `عرض كافة النتائج لـ "${searchQuery}"` : `View all results for "${searchQuery}"`}</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d={isArabic ? "M19 12H5M12 19l-7-7 7-7" : "M5 12h14M12 5l7 7-7 7"} />
                </svg>
              </button>
            </div>
          )}
        </form>

        {/* Action Controls */}
        <div className="navbar-actions">
          {/* Language Toggle */}
          <button 
            className="lang-toggle-btn" 
            title={t('toggleLanguage')} 
            onClick={toggleLanguage}
            aria-label="Toggle language"
          >
            <span className="lang-code">{language === 'ar' ? 'EN' : 'عربي'}</span>
          </button>

          {/* Cart Icon Button */}
          <button 
            className={`navbar-icon-btn cart-btn ${cartCount > 0 ? 'has-items' : ''}`} 
            onClick={() => navigate('cart')} 
            aria-label={t('cartItems', cartCount)}
            title={t('cart')}
          >
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && (
              <span className="cart-badge animate-scaleIn" aria-hidden="true">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </button>

          {/* Account / Sign-In Button */}
          <button 
            className={`navbar-account-btn ${user ? 'is-logged-in' : 'is-guest'}`}
            aria-label={t('account')} 
            onClick={() => navigate(user ? 'account' : 'login')}
            title={user ? (isArabic ? 'حسابي' : 'My Account') : (isArabic ? 'تسجيل الدخول' : 'Sign In')}
          >
            {user ? (
              <>
                <span className="account-avatar">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <span className="account-name">
                  {customerProfile?.full_name ? customerProfile.full_name.split(' ')[0] : (isArabic ? 'حسابي' : 'Account')}
                </span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/>
                </svg>
                <span>{isArabic ? 'دخول' : 'Sign In'}</span>
              </>
            )}
          </button>

          {/* Hamburger Mobile Toggle */}
          <button
            className={`hamburger ${menuOpen ? 'open' : ''}`}
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={t('mobileNavigation')}
            aria-expanded={menuOpen}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Modern Mobile Slide-Down Drawer */}
      {menuOpen && (
        <div className="mobile-drawer-overlay animate-fadeIn" onClick={() => setMenuOpen(false)}>
          <div 
            className="mobile-drawer animate-slideDown" 
            role="navigation" 
            aria-label={t('mobileNavigation')}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-drawer-header">
              <img 
                src="/images/transparentlogo.png" 
                alt="Al-Jafar Store" 
                style={{ height: '36px', width: 'auto', objectFit: 'contain' }} 
              />
              <button 
                className="mobile-drawer-close" 
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            <div className="mobile-drawer-links">
              {navLinks.map((link) => {
                const isActive = currentPage === link.id;
                return (
                  <button
                    key={link.id}
                    className={`mobile-nav-link ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      navigate(link.id);
                      setMenuOpen(false);
                    }}
                  >
                    <span className="mobile-link-icon">{link.icon}</span>
                    <span className="mobile-link-text">{link.label}</span>
                    {isActive && <span className="mobile-active-dot" />}
                  </button>
                );
              })}
            </div>

            <div className="mobile-drawer-footer">
              {/* Account Quick Button */}
              <button
                className="mobile-user-btn"
                onClick={() => {
                  navigate(user ? 'account' : 'login');
                  setMenuOpen(false);
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span>{user ? (customerProfile?.full_name || (isArabic ? 'الملف الشخصي' : 'My Account')) : (isArabic ? 'تسجيل الدخول / إنشاء حساب' : 'Sign In / Register')}</span>
              </button>

              {/* Language Switch */}
              <button
                className="mobile-lang-btn"
                onClick={() => { toggleLanguage(); setMenuOpen(false); }}
              >
                <span className="lang-globe">🌐</span>
                <span>{language === 'ar' ? 'English Version' : 'النسخة العربية'}</span>
              </button>

              {/* Quick Contact Badge */}
              <a 
                href="https://wa.me/201121334488" 
                target="_blank" 
                rel="noopener noreferrer"
                className="mobile-whatsapp-btn"
              >
                <span>💬 {isArabic ? 'واتساب المتجر المباشر' : 'Direct WhatsApp'}</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>أسوان، مصر</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

