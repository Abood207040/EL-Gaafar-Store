import { useState, useEffect, useRef } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';
import { supabase } from '../../services/authService.js';
import placeholderImg from '../../assets/main-image.png';

export default function Navbar({ currentPage, navigate, cartCount = 0 }) {
  const { t, language, toggleLanguage } = useLocalization();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  // Handle outside click to close dropdown
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
        return;
      }
      
      const { data, error } = await supabase
        .from('products')
        .select('id, name_en, name_ar, image_url, description_en, description_ar, price')
        .eq('is_active', true)
        .or(`name_en.ilike.%${q}%,name_ar.ilike.%${q}%,sku.ilike.%${q}%`)
        .limit(5);
      
      if (!error && data) {
        setSearchResults(data);
      }
    };
    
    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const handleSelectProduct = (product) => {
    navigate('product-details', { id: product.id });
    setSearchQuery('');
    setSearchResults([]);
  };

  const navLinks = [
    { id: 'home', label: t('home') },
    { id: 'shop', label: t('shop') },
    { id: 'categories', label: t('categories') },
    { id: 'my-orders', label: t('myOrders') },
    { id: 'contact', label: t('contactUs') },
  ];

  return (
    <header className="navbar" role="banner">
      <div className="navbar-inner">
        <button className="navbar-brand" onClick={() => navigate('home')} aria-label={t('goToShop')}>
          <div className="brand-icon" aria-hidden="true" style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/images/transparentlogo.png" 
              alt="Ga3for" 
              style={{ height: '45px', width: 'auto', objectFit: 'contain', maxHeight: '100%', maxWidth: '140px' }} 
            />
          </div>
        </button>

        <nav className="navbar-nav" aria-label={t('mainNavigation')}>
          {navLinks.map((link) => (
            <button
              key={link.id}
              className={`nav-link ${currentPage === link.id ? 'active' : ''}`}
              onClick={() => navigate(link.id)}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <form 
          className="navbar-search" 
          ref={searchRef}
          style={{ position: 'relative' }}
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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              type="search"
              className="search-input"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={(e) => {
                if (searchQuery.length >= 2) setSearchQuery(e.target.value);
              }}
              aria-label={t('search')}
            />
          </div>
          
          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="search-autocomplete-dropdown" style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: 'var(--radius-md)',
              marginTop: '0.5rem',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              zIndex: 50,
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {searchResults.map(product => {
                const name = language === 'ar' && product.name_ar ? product.name_ar : product.name_en;
                const desc = language === 'ar' && product.description_ar ? product.description_ar : product.description_en;
                
                return (
                  <div 
                    key={product.id}
                    onClick={() => handleSelectProduct(product)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '0.75rem',
                      borderBottom: '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'background 0.2s ease',
                      gap: '0.75rem',
                      background: '#ffffff'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                    onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
                  >
                    <img 
                      src={product.image_url || placeholderImg} 
                      alt={name} 
                      style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    />
                    <div style={{ flex: 1, overflow: 'hidden', textAlign: language === 'ar' ? 'right' : 'left' }}>
                      <div style={{ fontWeight: '600', fontSize: '0.875rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#0f172a' }}>
                        {name}
                      </div>
                      {desc && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                          {desc}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div 
                onClick={() => {
                  navigate('shop', { q: searchQuery.trim() });
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                style={{
                  padding: '0.75rem',
                  textAlign: 'center',
                  fontSize: '0.875rem',
                  color: 'var(--primary-color)',
                  cursor: 'pointer',
                  fontWeight: '600',
                  background: '#ffffff',
                  borderTop: '1px solid #e2e8f0'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = '#f8fafc'}
                onMouseOut={(e) => e.currentTarget.style.background = '#ffffff'}
              >
                {language === 'ar' ? 'عرض كل النتائج' : 'View all results'}
              </div>
            </div>
          )}
        </form>

        <div className="navbar-actions">
          <button className="lang-toggle btn btn-ghost btn-sm" title={t('toggleLanguage')} onClick={toggleLanguage}>
            {language === 'ar' ? 'EN' : 'AR'}
          </button>

          <button className="navbar-icon-btn" onClick={() => navigate('cart')} aria-label={t('cartItems', cartCount)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            {cartCount > 0 && <span className="cart-badge" aria-hidden="true">{cartCount}</span>}
          </button>

          <button 
            className="navbar-icon-btn" 
            aria-label={t('account')} 
            onClick={() => navigate(user ? 'account' : 'login')}
            style={!user ? { width: 'auto', padding: '0 0.75rem', borderRadius: 'var(--radius-full)' } : {}}
          >
            {user ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ) : (
              <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>
                {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
              </span>
            )}
          </button>

          <button
            className="hamburger"
            onClick={() => setMenuOpen((prev) => !prev)}
            aria-label={t('mobileNavigation')}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="mobile-menu animate-fadeIn" role="navigation" aria-label={t('mobileNavigation')}>
          {navLinks.map((link) => (
            <button
              key={link.id}
              className={`mobile-nav-link ${currentPage === link.id ? 'active' : ''}`}
              onClick={() => {
                navigate(link.id);
                setMenuOpen(false);
              }}
            >
              {link.label}
            </button>
          ))}

          {/* Language toggle — accessible from mobile menu */}
          <button
            className="mobile-nav-link mobile-lang-toggle"
            onClick={() => { toggleLanguage(); setMenuOpen(false); }}
          >
            {language === 'ar' ? '🌐 English' : '🌐 العربية'}
          </button>


        </div>
      )}
    </header>
  );
}
