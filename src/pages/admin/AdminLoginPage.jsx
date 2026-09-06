import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function AdminLoginPage({ navigate }) {
  const { t, isArabic } = useLocalization();
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
    <div className="animate-fadeIn" style={{ 
      minHeight: 'calc(100vh - 80px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(30, 41, 59, 0.7)',
        backdropFilter: 'blur(16px)',
        borderRadius: '24px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255,255,255,0.1) inset',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.05)'
      }}>
        
        {/* Header Section */}
        <div style={{ padding: '2.5rem 2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', marginBottom: '1.5rem', boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>
            {t('adminLoginTitle') || (isArabic ? 'بوابة الإدارة' : 'Admin Portal')}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '1rem', margin: 0 }}>
            {t('adminLoginSubtitle') || (isArabic ? 'الرجاء تسجيل الدخول للوصول إلى لوحة التحكم' : 'Please sign in to access the dashboard')}
          </p>
        </div>

        {/* Form Section */}
        <div style={{ padding: '0 2.5rem 2.5rem' }}>
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div>
              <label htmlFor="admin-email" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                {t('email')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', color: '#64748b' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input 
                  id="admin-email"
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  autoComplete="email"
                  style={{ 
                    width: '100%', padding: isArabic ? '0.75rem 3rem 0.75rem 1rem' : '0.75rem 1rem 0.75rem 3rem',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: '12px',
                    fontSize: '1rem', color: '#f8fafc', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; e.target.style.background = 'rgba(15, 23, 42, 0.9)'; }}
                  onBlur={e => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(15, 23, 42, 0.6)'; }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#cbd5e1', marginBottom: '0.5rem' }}>
                {t('password')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', color: '#64748b' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input 
                  id="admin-password"
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  autoComplete="current-password"
                  style={{ 
                    width: '100%', padding: isArabic ? '0.75rem 3rem 0.75rem 1rem' : '0.75rem 1rem 0.75rem 3rem',
                    background: 'rgba(15, 23, 42, 0.6)', border: '1px solid #334155', borderRadius: '12px',
                    fontSize: '1rem', color: '#f8fafc', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = '#38bdf8'; e.target.style.boxShadow = '0 0 0 3px rgba(56, 189, 248, 0.15)'; e.target.style.background = 'rgba(15, 23, 42, 0.9)'; }}
                  onBlur={e => { e.target.style.borderColor = '#334155'; e.target.style.boxShadow = 'none'; e.target.style.background = 'rgba(15, 23, 42, 0.6)'; }}
                />
              </div>
            </div>
            
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#fca5a5', fontSize: '0.875rem', fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {error}
              </div>
            )}
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button 
                type="submit" 
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#0f172a',
                  background: '#38bdf8',
                  border: 'none',
                  borderRadius: '12px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.2)',
                  transition: 'all 0.2s',
                  opacity: loading ? 0.8 : 1
                }}
                onMouseOver={(e) => { if(!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(56, 189, 248, 0.3)'; e.target.style.background = '#7dd3fc'; } }}
                onMouseOut={(e) => { if(!loading) { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 12px rgba(56, 189, 248, 0.2)'; e.target.style.background = '#38bdf8'; } }}
              >
                {loading ? t('signingIn') : t('signIn')}
              </button>


              
              <button 
                type="button" 
                onClick={() => navigate('shop')}
                style={{
                  width: '100%',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontWeight: 600,
                  color: '#cbd5e1',
                  background: 'transparent',
                  border: '1px solid #475569',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.target.style.background = 'rgba(71, 85, 105, 0.2)'; e.target.style.color = '#f8fafc'; }}
                onMouseOut={(e) => { e.target.style.background = 'transparent'; e.target.style.color = '#cbd5e1'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isArabic ? 'rotate(180deg)' : 'none' }}><path d="m15 18-6-6 6-6"/></svg>
                {t('backToStore')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
