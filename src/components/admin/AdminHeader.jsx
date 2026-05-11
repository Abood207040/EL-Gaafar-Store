// src/components/admin/AdminHeader.jsx
import { useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import { useAuth } from '../../hooks/useAuth.jsx';

export default function AdminHeader({ title, subtitle, navigate }) {
  const { t } = useLocalization();
  const { signOut } = useAuth();
  const [search, setSearch] = useState('');

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate('admin-login');
    }
  };

  return (
    <header className="admin-header" role="banner">
      <div className="admin-header-left">
        <h1 className="admin-page-title">{title}</h1>
        {subtitle && <p className="admin-page-subtitle">{subtitle}</p>}
      </div>
      <div className="admin-header-right">
        <div className="admin-search input-group">
          <span className="input-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={t('search')}
            value={search}
            onChange={e => setSearch(e.target.value)}
            aria-label="Admin global search"
          />
        </div>
        <div className="admin-profile" aria-label="Admin profile">
          <div className="admin-avatar" aria-hidden="true">A</div>
          <div className="admin-profile-info">
            <span className="admin-profile-name">{t('adminUser')}</span>
            <span className="admin-profile-role">{t('storeManager')}</span>
          </div>
          <button type="button" className="btn btn-outline btn-sm" onClick={handleSignOut}>
            {t('signOut')}
          </button>
        </div>
      </div>
    </header>
  );
}
