import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function LoginPage({ navigate }) {
  const { t, isArabic } = useLocalization();
  const { signInWithPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(isArabic ? 'الرجاء إدخال البريد الإلكتروني وكلمة المرور' : 'Please enter email and password');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const result = await signInWithPassword({ email, password });
      if (result.isAdmin) {
        navigate('admin-dashboard');
      } else {
        navigate('account');
      }
    } catch (err) {
      setError(err.message || (isArabic ? 'فشل تسجيل الدخول. يرجى التحقق من صحة البيانات.' : 'Login failed. Please check your credentials.'));
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ 
      minHeight: 'calc(100vh - 80px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'radial-gradient(circle at 50% 10%, rgba(14, 165, 233, 0.08), transparent 60%), linear-gradient(180deg, #F8FAFC 0%, var(--bg) 100%)',
      padding: '2.5rem 1rem'
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 50px -12px rgba(13, 26, 34, 0.12)',
        width: '100%',
        maxWidth: '460px',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        {/* Decorative Top Accent */}
        <div style={{ height: '5px', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}></div>
        
        {/* Header Section */}
        <div style={{ padding: '2.5rem 2.5rem 1.25rem', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'rgba(14, 165, 233, 0.1)',
            color: 'var(--primary)',
            marginBottom: '1.25rem'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" x2="3" y1="12" y2="12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            {isArabic ? 'تسجيل الدخول' : 'Sign In'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0, lineHeight: 1.5 }}>
            {isArabic ? 'أهلاً بك في مؤسسة الجعفر للأدوات الصحية بأسوان' : 'Welcome to Al-Jafar Sanitary Store'}
          </p>
        </div>

        {/* Form Section */}
        <div style={{ padding: '1rem 2.5rem 2.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {t('email')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder={isArabic ? 'name@example.com' : 'Enter your email'}
                  style={{ 
                    width: '100%',
                    padding: isArabic ? '0.75rem 3rem 0.75rem 1rem' : '0.75rem 1rem 0.75rem 3rem',
                    background: '#F8FAFC',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.15)'; e.target.style.background = '#FFFFFF'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                </span>
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder={isArabic ? '••••••••' : 'Enter your password'}
                  style={{ 
                    width: '100%',
                    padding: isArabic ? '0.75rem 3rem 0.75rem 3rem' : '0.75rem 3rem 0.75rem 3rem',
                    background: '#F8FAFC',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: '0.95rem',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    transition: 'all 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.15)'; e.target.style.background = '#FFFFFF'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.boxShadow = 'none'; e.target.style.background = '#F8FAFC'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    left: isArabic ? '1rem' : 'auto',
                    right: isArabic ? 'auto' : '1rem',
                    background: 'none',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title={showPassword ? (isArabic ? 'إخفاء' : 'Hide') : (isArabic ? 'إظهار' : 'Show')}
                >
                  {showPassword ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  )}
                </button>
              </div>
            </div>
            
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', color: '#DC2626', fontSize: '0.875rem', fontWeight: 500 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                <span>{error}</span>
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              className="btn btn-primary"
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '0.9rem',
                fontSize: '1rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-md)',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.3)'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-mini" aria-hidden="true"></span>
                  <span>{t('saving')}</span>
                </>
              ) : (
                isArabic ? 'تسجيل الدخول' : 'Sign In'
              )}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {isArabic ? 'ليس لديك حساب؟' : "Don't have an account?"}{' '}
              </span>
              <button 
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, 
                  fontSize: '0.95rem', cursor: 'pointer', padding: '0 0.25rem', textDecoration: 'underline'
                }}
                onClick={() => navigate('register')}
              >
                {isArabic ? 'سجل حسابك الآن' : 'Register here'}
              </button>
            </div>

            <button
              onClick={() => navigate('home')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.35rem'
              }}
            >
              <span>{isArabic ? '← العودة للصفحة الرئيسية' : '← Back to Store'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
