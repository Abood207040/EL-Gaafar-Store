// src/components/admin/AdminSidebar.jsx
import { useLocalization } from '../../i18n/Localization.jsx';

const navItems = [
  { id: 'admin-dashboard', labelKey: 'adminDashboard', icon: 'DB' },
  { id: 'admin-products', labelKey: 'adminProducts', icon: 'PR' },
  { id: 'admin-product-form', labelKey: 'addProduct', icon: '+' },
  { id: 'admin-catalog', labelKey: 'adminCatalog', icon: 'CB' },
  { id: 'admin-orders', labelKey: 'adminOrders', icon: 'OR' },
  { id: 'admin-inventory', labelKey: 'inventory', icon: 'ST' },
  { id: 'admin-customers', labelKey: 'customers', icon: 'CU' },
];

export default function AdminSidebar({ currentPage, navigate }) {
  const { t } = useLocalization();

  return (
    <aside className="admin-sidebar" aria-label="Admin navigation">
      {/* Admin Brand */}
      <div className="admin-brand">
        <div className="admin-brand-icon" aria-hidden="true">
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill="#F67113" />
            <path d="M8 16 C8 11 12 8 16 8 C20 8 24 11 24 16" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
            <circle cx="16" cy="18" r="4" fill="#fff" opacity="0.9"/>
            <path d="M16 22 L16 26" stroke="#fff" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <span className="admin-brand-name">Al-Jafar</span>
          <span className="admin-brand-sub">{t('adminPanel')}</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="admin-nav" aria-label="Admin sections">
        {navItems.map(item => (
          <button
            key={item.id}
            className={`admin-nav-item ${currentPage === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.id)}
            aria-current={currentPage === item.id ? 'page' : undefined}
          >
            <span className="admin-nav-icon" aria-hidden="true">{item.icon}</span>
            {t(item.labelKey)}
          </button>
        ))}
      </nav>

      {/* Back to Store */}
      <div className="admin-sidebar-footer">
        <button
          className="admin-back-btn"
          onClick={() => navigate('shop')}
          aria-label="Back to storefront"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          {t('backToStore')}
        </button>
      </div>
    </aside>
  );
}
