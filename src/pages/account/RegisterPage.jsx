import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import { registerCustomerProfile } from '../../services/authService.js';

const InputField = ({ label, type = "text", value, onChange, required, placeholder, icon, isArabic }) => (
  <div>
    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
      {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
    </label>
    <div style={{ position: 'relative' }}>
      {icon && (
        <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', left: isArabic ? 'auto' : '1rem', right: isArabic ? '1rem' : 'auto', color: '#94a3b8' }}>
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
          width: '100%', padding: icon ? (isArabic ? '0.75rem 3rem 0.75rem 1rem' : '0.75rem 1rem 0.75rem 3rem') : '0.75rem 1rem',
          background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '12px',
          fontSize: '1rem', color: '#0f172a', outline: 'none', transition: 'all 0.2s', boxSizing: 'border-box'
        }}
        onFocus={e => { e.target.style.borderColor = 'var(--primary)'; e.target.style.boxShadow = '0 0 0 3px rgba(14, 165, 233, 0.1)'; e.target.style.background = '#ffffff'; }}
        onBlur={e => { e.target.style.borderColor = '#cbd5e1'; e.target.style.boxShadow = 'none'; e.target.style.background = '#f8fafc'; }}
      />
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
    city: '',
    area: '',
    address: ''
  });
  
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
      background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
      padding: '3rem 1rem'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(10px)',
        borderRadius: '24px',
        boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.1), 0 10px 20px -5px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '600px',
        overflow: 'hidden',
        border: '1px solid rgba(255, 255, 255, 0.5)'
      }}>
        
        {/* Header Section */}
        <div style={{ padding: '2.5rem 2.5rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '16px', background: 'var(--primary-light, #e0f2fe)', color: 'var(--primary, #0ea5e9)', marginBottom: '1.5rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>
            {isArabic ? 'إنشاء حساب جديد' : 'Create an Account'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', margin: 0 }}>
            {isArabic ? 'انضم إلينا للاستمتاع بتجربة تسوق فريدة' : 'Join us to enjoy a seamless shopping experience'}
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
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              />
              <InputField 
                label={t('phone')} 
                type="tel"
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                required 
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <InputField 
                label={t('email')} 
                type="email"
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                required 
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>}
              />
              <InputField 
                label={isArabic ? 'كلمة المرور' : 'Password'} 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({ ...formData, password: e.target.value })} 
                required 
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
              />
            </div>
            
            <hr style={{ border: 'none', borderTop: '1px dashed #cbd5e1', margin: '0.5rem 0' }} />
            <p style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600, margin: 0 }}>
              {isArabic ? 'معلومات التوصيل (اختياري)' : 'Delivery Information (Optional)'}
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <InputField 
                label={isArabic ? 'المدينة / المحافظة' : 'City / Governorate'} 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>}
              />
              <InputField 
                label={isArabic ? 'المنطقة' : 'Area / Neighborhood'} 
                value={formData.area} 
                onChange={e => setFormData({ ...formData, area: e.target.value })} 
                icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>}
              />
            </div>

            <InputField 
              label={isArabic ? 'العنوان بالتفصيل' : 'Detailed Address'} 
              value={formData.address} 
              onChange={e => setFormData({ ...formData, address: e.target.value })} 
            />
            
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
                marginTop: '1rem',
                width: '100%',
                padding: '1.25rem',
                fontSize: '1.1rem',
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
              {loading ? t('saving') : (isArabic ? 'إنشاء حساب' : 'Create Account')}
            </button>
          </form>
          
          <div style={{ marginTop: '2rem', textAlign: 'center', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
            <span style={{ color: '#64748b', fontSize: '0.95rem' }}>
              {isArabic ? 'لديك حساب بالفعل؟' : 'Already have an account?'}
            </span>
            <button 
              style={{ 
                background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 700, 
                fontSize: '0.95rem', cursor: 'pointer', padding: '0 0.5rem', textDecoration: 'none'
              }}
              onClick={() => navigate('login')}
              onMouseOver={e => e.target.style.textDecoration = 'underline'}
              onMouseOut={e => e.target.style.textDecoration = 'none'}
            >
              {isArabic ? 'تسجيل الدخول' : 'Sign in here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
