import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function AdminLoginPage({ navigate }) {
  const { t } = useLocalization();
  const { signInWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithPassword({ email, password });
      navigate('admin-dashboard');
    } catch (authError) {
      setError(authError.message || t('adminLoginFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page animate-fadeIn">
      <div className="container-sm">
        <div className="admin-auth-card card">
          <div className="card-header">
            <h1 style={{ fontSize: '1.1rem' }}>{t('adminLoginTitle')}</h1>
          </div>
          <form className="card-body" onSubmit={onSubmit}>
            <p style={{ marginBottom: '1rem', color: 'var(--muted)' }}>
              {t('adminLoginSubtitle')}
            </p>
            <div className="form-group">
              <label htmlFor="admin-email" className="form-label">{t('email')}</label>
              <input
                id="admin-email"
                className="input"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group" style={{ marginTop: '0.9rem' }}>
              <label htmlFor="admin-password" className="form-label">{t('password')}</label>
              <input
                id="admin-password"
                className="input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error ? (
              <p style={{ marginTop: '0.9rem', color: 'var(--danger)', fontSize: '0.875rem' }}>{error}</p>
            ) : null}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? t('signingIn') : t('signIn')}
              </button>
              <button type="button" className="btn btn-outline" onClick={() => navigate('shop')}>
                {t('backToStore')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
