import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function AdminAccessDeniedPage({ navigate, message }) {
  const { t } = useLocalization();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
    } finally {
      navigate('admin-login');
    }
  };

  return (
    <div className="admin-auth-page animate-fadeIn">
      <div className="container-sm">
        <div className="admin-auth-card card">
          <div className="card-header">
            <h1 style={{ fontSize: '1.1rem' }}>{t('accessDeniedTitle')}</h1>
          </div>
          <div className="card-body">
            <p style={{ color: 'var(--muted)' }}>{message || t('accessDeniedSubtitle')}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="button" className="btn btn-outline" onClick={() => navigate('shop')}>
                {t('backToStore')}
              </button>
              <button type="button" className="btn btn-danger" onClick={handleSignOut}>
                {t('signOut')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
