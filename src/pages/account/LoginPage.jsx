import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function LoginPage({ navigate }) {
  const { t, isArabic } = useLocalization();
  const { signInWithPassword } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.message || (isArabic ? 'فشل تسجيل الدخول' : 'Login failed'));
      setLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn" style={{ 
      minHeight: 'calc(100vh - 80px)', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '2rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '440px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.5)'
      }}>
        
        {/* Header Section */}
        <div style={{ padding: '2.5rem 2.5rem 1.5rem', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-light, #e0f2fe)', color: 'var(--primary, #0ea5e9)', marginBottom: '1.5rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>
            {isArabic ? 'مرحباً بعودتك' : 'Welcome Back'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
            {isArabic ? 'قم بتسجيل الدخول للوصول إلى حسابك' : 'Sign in to access your account'}
          </p>
        </div>

        {/* Form Section */}
        <div style={{ padding: '0 2.5rem 2.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                {t('email')}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', color: '#94a3b8' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                </span>
                <input 
                  type="email" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                  placeholder={isArabic ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
                  style={{ 
                    width: '100%', padding: isArabic ? '0.75rem 3rem 0.75rem 1rem' : '0.75rem 1rem 0.75rem 3rem',
                    background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px',
                    fontSize: '1rem', color: '#0f172a', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)'; e.target.style.background = '#ffffff'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                {isArabic ? 'كلمة المرور' : 'Password'}
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', color: '#94a3b8' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </span>
                <input 
                  type="password" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  placeholder={isArabic ? 'أدخل كلمة المرور' : 'Enter your password'}
                  style={{ 
                    width: '100%', padding: isArabic ? '0.75rem 3rem 0.75rem 1rem' : '0.75rem 1rem 0.75rem 3rem',
                    background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px',
                    fontSize: '1rem', color: '#0f172a', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
                  }}
                  onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)'; e.target.style.background = '#ffffff'; }}
                  onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
                />
              </div>
            </div>
            
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', color: '#b91c1c', fontSize: '0.875rem', fontWeight: 500 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              disabled={loading}
              style={{
                marginTop: '0.5rem',
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                background: 'var(--primary)',
                border: 'none',
                borderRadius: '12px',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                transition: 'all 0.2s',
                opacity: loading ? 0.8 : 1
              }}
              onMouseOver={(e) => { if(!loading) { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 6px 16px rgba(14, 165, 233, 0.4)'; } }}
              onMouseOut={(e) => { if(!loading) { e.target.style.transform = 'none'; e.target.style.boxShadow = '0 4px 12px rgba(14, 165, 233, 0.3)'; } }}
            >
              {loading ? t('saving') : (isArabic ? 'تسجيل الدخول' : 'Sign In')}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.95rem' }}>
              {isArabic ? 'ليس لديك حساب؟' : 'Don\'t have an account?'}
            </span>
            <button 
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, 
                fontSize: '0.95rem', cursor: 'pointer', padding: '0 0.5rem', textDecoration: 'none'
              }}
              onClick={() => navigate('register')}
              onMouseOver={e => e.target.style.textDecoration = 'underline'}
              onMouseOut={e => e.target.style.textDecoration = 'none'}
            >
              {isArabic ? 'سجل الآن' : 'Register here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
