// src/components/layout/Footer.jsx
import { STORE_INFO } from '../../data/orders.js';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function Footer({ navigate }) {
  const { t, translateCategory } = useLocalization();
  const footerCategories = ['Faucets', 'Mixers', 'Pipes', 'Valves', 'Sanitary Ware', 'Plumbing Tools'];

  return (
    <footer className="footer" role="contentinfo">
      <div className="container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <svg width="36" height="36" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="16" fill="#F67113" />
                <path d="M8 16 C8 11 12 8 16 8 C20 8 24 11 24 16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
                <circle cx="16" cy="18" r="4" fill="#fff" opacity="0.9"/>
                <path d="M16 22 L16 26" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
              </svg>
              <div>
                <strong>Al-Jafar Store</strong>
                <span className="arabic-text" lang="ar" dir="rtl">متجر الجعفر</span>
              </div>
            </div>
            <p className="footer-tagline">
              {t('heroTitle')}<br />
              <span className="arabic-text" lang="ar" dir="rtl">أدوات السباكة والأدوات الصحية</span>
            </p>
            <p className="footer-desc">
              {t('heroSubtitle')}
            </p>
          </div>

          {/* Shop Links */}
          <div className="footer-col">
            <h4 className="footer-heading">{t('shop')}</h4>
            <ul className="footer-links">
              {footerCategories.map(cat => (
                <li key={cat}>
                  <button onClick={() => navigate('shop')} className="footer-link">{translateCategory(cat)}</button>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div className="footer-col">
            <h4 className="footer-heading">{t('account')}</h4>
            <ul className="footer-links">
              <li><button onClick={() => navigate('cart')} className="footer-link">{t('cart')}</button></li>
              <li><button onClick={() => navigate('my-orders')} className="footer-link">{t('myOrders')}</button></li>
              <li><button onClick={() => navigate('checkout')} className="footer-link">{t('checkout')}</button></li>
            </ul>
          </div>

          {/* Contact */}
          <div className="footer-col">
            <h4 className="footer-heading">{t('contact')}</h4>
            <ul className="footer-contact-list">
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {STORE_INFO.address}
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {STORE_INFO.phone}
              </li>
              <li style={{ whiteSpace: 'pre-line' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                {STORE_INFO.hours}
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Al-Jafar Store <span className="arabic-text" lang="ar" dir="rtl">متجر الجعفر</span>. {t('allRightsReserved')}</p>
          <p className="footer-payment">
            <span className="badge badge-dark">{t('cashOnDeliveryOnly')}</span>
            <span className="badge badge-muted">{t('deliveryFee').replace(' fee', '')}</span>
            <span className="badge badge-muted">{t('pickupFromShop')}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
