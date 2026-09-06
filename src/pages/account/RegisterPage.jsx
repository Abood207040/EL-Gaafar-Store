import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import { registerCustomerProfile } from '../../services/authService.js';

const InputField = ({ label, type = "text", value, onChange, required, placeholder, icon, isArabic, rightAction }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
      {label} {required && <span style={{ color: 'var(--danger)' }}>*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      {icon && (
        <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', color: '#94A3B8', display: 'flex', alignItems: 'center' }}>
          {icon}
        </span>
      )}
      <input 
        type={type} 
        value={value} 
        onChange={onChange} 
        required={required} 
        placeholder={placeholder}
        style={{ 
          width: '100%',
          padding: icon
            ? (rightAction ? '0.75rem 3rem' : (isArabic ? '0.75rem 3rem 0.75rem 1rem' : '0.75rem 1rem 0.75rem 3rem'))
            : (rightAction ? (isArabic ? '0.75rem 3rem 0.75rem 1rem' : '0.75rem 1rem 0.75rem 3rem') : '0.75rem 1rem'),
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
      {rightAction && (
        <div style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? '1rem' : 'auto', right: isArabic ? 'auto' : '1rem', display: 'flex', alignItems: 'center' }}>
          {rightAction}
        </div>
      )}
    </div>
  </div>
);

export default function RegisterPage({ navigate }) {
  const { t, isArabic, parseRpcError } = useLocalization();
  const { signUpWithPassword } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    city: 'أسوان',
    area: '',
    address: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password || !formData.full_name || !formData.phone) {
      setError(isArabic ? 'الرجاء إدخال جميع الحقول المطلوبة' : 'Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Create Auth User
      await signUpWithPassword({ email: formData.email, password: formData.password });
      
      // 2. Create Customer Profile
      await registerCustomerProfile(formData);
      
      navigate('account');
    } catch (err) {
      setError(parseRpcError(err));
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
      background: 'radial-gradient(circle at 50% 10%, rgba(14, 165, 233, 0.08), transparent 60%), linear-gradient(180deg, #F8FAFC 0%, var(--bg) 100%)',
      padding: '3rem 1rem'
    }}>
      <div style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-xl)',
        boxShadow: '0 25px 50px -12px rgba(13, 26, 34, 0.12)',
        width: '100%',
        maxWidth: '620px',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }}>
        {/* Top Gradient */}
        <div style={{ height: '5px', background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}></div>
        
        {/* Header Section */}
        <div style={{ padding: '2.5rem 2.5rem 1.5rem', textAlign: 'center', borderBottom: '1px solid var(--border-light)' }}>
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
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" x2="19" y1="8" y2="14"/>
              <line x1="22" x2="16" y1="11" y2="11"/>
            </svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem', letterSpacing: '-0.02em' }}>
            {isArabic ? 'إنشاء حساب جديد' : 'Create an Account'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', margin: 0 }}>
            {isArabic ? 'انضم إلى عملاء مؤسسة الجعفر للأدوات الصحية في أسوان' : 'Join Al-Jafar Sanitary Store family in Aswan'}
          </p>
        </div>

        {/* Form Section */}
        <div style={{ padding: '2rem 2.5rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <InputField 
                label={isArabic ? 'الاسم بالكامل' : 'Full Name'} 
                value={formData.full_name} 
                onChange={e => setFormData({ ...formData, full_name: e.target.value })} 
                required 
                placeholder={isArabic ? 'مثال: أحمد عبد الله' : 'e.g. John Doe'}
                isArabic={isArabic}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              />
              <InputField 
                label={t('phone')} 
                type="tel"
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                required 
                placeholder="01012345678"
                isArabic={isArabic}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <InputField 
                label={t('email')} 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                required 
                placeholder="name@example.com"
                isArabic={isArabic}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
              />
              <InputField 
                label={isArabic ? 'كلمة المرور' : 'Password'} 
                type={showPassword ? 'text' : 'password'} 
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                required 
                placeholder="••••••••"
                isArabic={isArabic}
                icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                rightAction={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
                  >
                    {showPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                }
              />
            </div>
            
            <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)' }}>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontWeight: 700, margin: '0 0 0.5rem' }}>
                📍 {isArabic ? 'عنوان التوصيل في أسوان (اختياري)' : 'Delivery Address in Aswan (Optional)'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <InputField 
                  label={isArabic ? 'المركز / المدينة' : 'City / Center'} 
                  value={formData.city} 
                  onChange={e => setFormData({ ...formData, city: e.target.value })} 
                  placeholder={isArabic ? 'أسوان، كوم أمبو، دراو، إدفو...' : 'Aswan, Kom Ombo, Edfu...'}
                  isArabic={isArabic}
                />
                <InputField 
                  label={isArabic ? 'المنطقة / الحي' : 'Area / District'} 
                  value={formData.area} 
                  onChange={e => setFormData({ ...formData, area: e.target.value })} 
                  placeholder={isArabic ? 'المحمودية، الكورنيش، السيل...' : 'Neighborhood'}
                  isArabic={isArabic}
                />
              </div>

              <InputField 
                label={isArabic ? 'الشارع وعلامة مميزة' : 'Street & Landmark'} 
                value={formData.address} 
                onChange={e => setFormData({ ...formData, address: e.target.value })} 
                placeholder={isArabic ? 'اسم الشارع، رقم العقار أو أقرب معلم' : 'Street name, building or nearby landmark'}
                isArabic={isArabic}
              />
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
                isArabic ? 'إنشاء الحساب' : 'Create Account'
              )}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                {isArabic ? 'لديك حساب بالفعل؟' : 'Already have an account?'}{' '}
              </span>
              <button 
                style={{ 
                  background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, 
                  fontSize: '0.95rem', cursor: 'pointer', padding: '0 0.25rem', textDecoration: 'underline'
                }}
                onClick={() => navigate('login')}
              >
                {isArabic ? 'سجل دخولك هنا' : 'Sign in here'}
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
