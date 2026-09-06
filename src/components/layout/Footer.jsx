// src/components/layout/Footer.jsx
import { STORE_INFO } from '../../constants/store.js';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function Footer({ navigate }) {
  const { t, translateCategory, isArabic } = useLocalization();
  const footerCategories = ['Mixers', 'Faucets', 'Valves', 'Pipes', 'Sanitary Ware', 'Plumbing Tools'];

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        {/* Top Trust Features Strip */}
        <div className="footer-trust-strip">
          <div className="footer-trust-item">
            <div className="footer-trust-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            </div>
            <div>
              <strong>{isArabic ? 'معرضنا في أسوان' : 'Showroom in Aswan'}</strong>
              <p>{isArabic ? 'زيارة واستلام مباشر من المحل' : 'Visit & direct store pickup'}</p>
            </div>
          </div>
          <div className="footer-trust-item">
            <div className="footer-trust-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            </div>
            <div>
              <strong>{isArabic ? 'توصيل داخل أسوان' : 'Delivery Across Aswan'}</strong>
              <p>{isArabic ? 'شحن سريع لباب المنزل أو موقع العمل' : 'Fast delivery to home or site'}</p>
            </div>
          </div>
          <div className="footer-trust-item">
            <div className="footer-trust-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <div>
              <strong>{isArabic ? 'الدفع عند الاستلام' : 'Cash on Delivery'}</strong>
              <p>{isArabic ? 'عاين وافحص منتجاتك قبل الدفع' : 'Inspect goods before payment'}</p>
            </div>
          </div>
          <div className="footer-trust-item">
            <div className="footer-trust-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div>
              <strong>{isArabic ? 'ضمان وجودة أصلية' : 'Genuine Quality Guaranteed'}</strong>
              <p>{isArabic ? 'منتجات سباكة وأدوات صحية موثوقة' : 'Certified plumbing & sanitary tools'}</p>
            </div>
          </div>
        </div>

        {/* Main Footer Grid */}
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand">
            <div className="footer-logo">
              <img 
                src="/images/Ga3for-logo.png" 
                alt="Al-Jafar Store" 
                className="footer-logo-img"
              />
            </div>
            <p className="footer-brand-title">
              {isArabic ? 'مؤسسة الجعفر للأدوات الصحية والسباكة' : 'Al-Jafar Sanitary Ware & Plumbing Tools'}
            </p>
            <p className="footer-desc">
              {isArabic 
                ? 'وجهتكم المعتمدة الأولى في أسوان لكافة مستلزمات السباكة، أطقم الحمامات، الخلاطات والمحابس بأعلى معايير الجودة وبأفضل الأسعار.' 
                : 'Your trusted plumbing and sanitary partner in Aswan. High quality mixers, valves, pipes and bathroom fittings at competitive prices.'}
            </p>

            {/* Live Store Status */}
            <div className="footer-live-status">
              <span className="live-status-dot" />
              <span>{isArabic ? 'المعرض مفتوح للزيارة والطلب' : 'Showroom Open Today'}</span>
            </div>
          </div>

          {/* Catalog Categories */}
          <div className="footer-col">
            <h4 className="footer-heading">{isArabic ? 'أقسام المنتجات' : 'Popular Categories'}</h4>
            <ul className="footer-links">
              {footerCategories.map(cat => (
                <li key={cat}>
                  <button onClick={() => navigate('shop', { category: cat })} className="footer-link">
                    <span className="footer-link-bullet">›</span>
                    {translateCategory(cat)}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">{isArabic ? 'روابط سريعة' : 'Quick Links'}</h4>
            <ul className="footer-links">
              <li>
                <button onClick={() => navigate('shop')} className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  {t('shop')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('categories')} className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  {t('categories')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('cart')} className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  {t('cart')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('my-orders')} className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  {t('myOrders')}
                </button>
              </li>
              <li>
                <button onClick={() => navigate('contact')} className="footer-link">
                  <span className="footer-link-bullet">›</span>
                  {t('contactUs')}
                </button>
              </li>
            </ul>
          </div>

          {/* Store Info & Contact */}
          <div className="footer-col">
            <h4 className="footer-heading">{isArabic ? 'تواصل معنا في أسوان' : 'Contact in Aswan'}</h4>
            <ul className="footer-contact-list">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{isArabic ? STORE_INFO.addressAr || STORE_INFO.address : STORE_INFO.address}</span>
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                <a href={`tel:${STORE_INFO.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                  {STORE_INFO.phone}
                </a>
              </li>
              <li style={{ whiteSpace: 'pre-line' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                <span>{isArabic ? STORE_INFO.hoursAr || STORE_INFO.hours : STORE_INFO.hours}</span>
              </li>
            </ul>

            {/* Action Buttons for Location & WhatsApp */}
            <div className="footer-action-buttons">
              <a 
                href={STORE_INFO.mapsUrl}
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-action-btn maps-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                <span>{isArabic ? 'موقع المعرض على الخريطة' : 'Showroom Location'}</span>
              </a>
              <a 
                href={`https://wa.me/${STORE_INFO.whatsapp}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-action-btn wa-btn"
              >
                <span>💬</span>
                <span>{isArabic ? 'مراسلة عبر واتساب' : 'WhatsApp Us'}</span>
              </a>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} {isArabic ? 'متجر الجعفر للأدوات الصحية' : 'Al-Jafar Sanitary Ware Store'}. {t('allRightsReserved')}</p>
          <div className="footer-badges">
            <span className="footer-pill-badge">{isArabic ? 'أسوان، مصر' : 'Aswan, Egypt'}</span>
            <span className="footer-pill-badge accent">{isArabic ? 'الدفع نقدياً عند الاستلام' : 'Cash on Delivery'}</span>
            <span className="footer-pill-badge">{isArabic ? 'استلام مجاني من المحل' : 'Free Showroom Pickup'}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

