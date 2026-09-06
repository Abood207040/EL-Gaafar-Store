import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getCustomerActivity, saveCustomerProfile } from '../../services/customerAccountService.js';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { OrderStatusBadge } from '../../components/ui/StatusBadge.jsx';
import { STORE_INFO } from '../../constants/store.js';

export default function AccountDashboard({ navigate }) {
  const { t, isArabic, formatCurrency } = useLocalization();
  const { user, customerProfile, signOut, refreshCustomerProfile, loading: authLoading } = useAuth();
  
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'online', 'offline'
  
  // Profile Editing State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    phone: '',
    city: '',
    area: '',
    address: '',
  });

  // Populate form when customerProfile loads or changes
  useEffect(() => {
    if (customerProfile) {
      setProfileForm({
        full_name: customerProfile.full_name || '',
        phone: customerProfile.phone || '',
        city: customerProfile.city || '',
        area: customerProfile.area || '',
        address: customerProfile.address || '',
      });
    } else if (user) {
      setProfileForm((prev) => ({
        ...prev,
        full_name: prev.full_name || user.email?.split('@')[0] || '',
      }));
    }
  }, [customerProfile, user]);

  // Load Customer's Real Activity
  useEffect(() => {
    if (!user && !authLoading) {
      navigate('login');
      return;
    }
    
    if (user) {
      let ignore = false;
      const load = async () => {
        setLoading(true);
        setError('');
        try {
          const data = await getCustomerActivity(
            customerProfile?.id,
            user.email,
            customerProfile?.phone
          );
          if (!ignore) setActivity(data);
        } catch {
          if (!ignore) setError(isArabic ? 'فشل تحميل سجل الطلبات' : 'Failed to load order history');
        } finally {
          if (!ignore) setLoading(false);
        }
      };
      load();
      return () => { ignore = true; };
    }
  }, [user, customerProfile, authLoading, navigate, isArabic]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    setProfileSaving(true);
    setProfileError('');
    setProfileSuccess('');

    try {
      await saveCustomerProfile(user, profileForm);
      await refreshCustomerProfile();
      setProfileSuccess(isArabic ? '✓ تم تحديث بيانات الحساب بنجاح' : '✓ Profile updated successfully');
      setIsEditingProfile(false);
      setTimeout(() => setProfileSuccess(''), 4000);
    } catch (err) {
      setProfileError(err.message || (isArabic ? 'تعذر حفظ البيانات' : 'Failed to update profile'));
    } finally {
      setProfileSaving(false);
    }
  };

  if (authLoading || (loading && activity.length === 0)) {
    return (
      <div className="container animate-fadeIn" style={{ paddingTop: '5rem', paddingBottom: '5rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>{t('loadingProducts')}</p>
      </div>
    );
  }

  if (!user) return null; // handled by useEffect redirect

  // Dynamic calculations from customer's actual data
  const totalSpent = activity.reduce((sum, act) => sum + (Number(act.total) || 0), 0);
  const onlineOrders = activity.filter(a => a.type === 'online');
  const offlineSales = activity.filter(a => a.type === 'offline');

  // Filtered activity based on selected tab
  const filteredActivity = activity.filter(item => {
    if (activeTab === 'online') return item.type === 'online';
    if (activeTab === 'offline') return item.type === 'offline';
    return true;
  });

  const displayName = customerProfile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0];
  const avatarLetter = (displayName || 'A').charAt(0).toUpperCase();

  const whatsappMsg = encodeURIComponent(
    isArabic
      ? `مرحباً مؤسسة الجعفر للأدوات الصحية، أنا العميل: ${displayName} (${customerProfile?.phone || user.email}) أود الاستفسار عن حسابي وطلباتي.`
      : `Hello Al-Jafar Store, I am client: ${displayName} (${customerProfile?.phone || user.email}) inquiring about my account.`
  );

  return (
    <div className="account-dashboard-page animate-fadeIn" style={{ background: 'var(--bg)', minHeight: '85vh', paddingBottom: '5rem' }}>
      {/* Account Hero Banner */}
      <div style={{ background: 'linear-gradient(135deg, #0D1A22 0%, #172E3B 100%)', color: '#FFFFFF', padding: '3.5rem 0 2.5rem' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0EA5E9 0%, #0284C7 100%)',
                color: '#FFFFFF',
                fontSize: '1.85rem',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 20px rgba(14, 165, 233, 0.4)',
                border: '2px solid rgba(255, 255, 255, 0.2)'
              }}>
                {avatarLetter}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', background: 'rgba(14, 165, 233, 0.2)', color: '#38BDF8', border: '1px solid rgba(14, 165, 233, 0.3)' }}>
                    📍 {isArabic ? 'عميل مسجل لدى مؤسسة الجعفر' : 'Verified Client'}
                  </span>
                </div>
                <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.25rem', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
                  {displayName}
                </h1>
                <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.9rem' }}>
                  {user.email} {customerProfile?.phone ? `• ${customerProfile.phone}` : ''}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => navigate('shop')}
                style={{ background: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}
              >
                <span>{isArabic ? 'تصفح المتجر' : 'Browse Shop'}</span>
              </button>
              <button
                className="btn btn-sm"
                onClick={() => { signOut(); navigate('home'); }}
                style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#FCA5A5' }}
              >
                <span>{isArabic ? 'تسجيل الخروج' : 'Sign Out'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ marginTop: '-1.5rem' }}>
        {profileSuccess && (
          <div style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 'var(--radius-md)', color: '#065F46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)' }}>
            <span>{profileSuccess}</span>
          </div>
        )}

        {/* Real KPI Metrics Strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(246, 113, 19, 0.1)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
              💳
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                {isArabic ? 'إجمالي المشتريات الفعلية' : 'Total Spent'}
              </span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--accent)', fontWeight: 800 }}>
                {formatCurrency(totalSpent)}
              </strong>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(14, 165, 233, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
              📦
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                {isArabic ? 'طلبات الأونلاين' : 'Online Orders'}
              </span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                {onlineOrders.length}
              </strong>
            </div>
          </div>

          <div className="card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.05)' }}>
            <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.1)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
              🏬
            </div>
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
                {isArabic ? 'فواتير معرض أسوان' : 'Showroom Invoices'}
              </span>
              <strong style={{ fontSize: '1.35rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                {offlineSales.length}
              </strong>
            </div>
          </div>
        </div>

        {/* 2-Column Info & Profile Editing */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          
          {/* Profile Card with Live Edit Functionality */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
                  {isArabic ? 'المعلومات الشخصية' : 'Personal Information'}
                </h2>
                <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>
                  {customerProfile?.status === 'suspended' ? (isArabic ? 'معلق' : 'Suspended') : (isArabic ? 'نشط' : 'Active')}
                </span>
              </div>

              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setIsEditingProfile(!isEditingProfile);
                  setProfileError('');
                }}
                style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
              >
                {isEditingProfile ? (isArabic ? 'إلغاء' : 'Cancel') : (isArabic ? '✏️ تعديل البيانات' : '✏️ Edit Profile')}
              </button>
            </div>

            <div className="card-body">
              {isEditingProfile ? (
                /* Edit Form */
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {t('customerName')}
                    </label>
                    <input
                      className="input"
                      type="text"
                      value={profileForm.full_name}
                      onChange={(e) => setProfileForm({ ...profileForm, full_name: e.target.value })}
                      required
                      placeholder={isArabic ? 'اسمك بالكامل' : 'Full Name'}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {t('phone')}
                    </label>
                    <input
                      className="input"
                      type="tel"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      placeholder="01012345678"
                      dir="ltr"
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        {isArabic ? 'المدينة / المركز' : 'City / Center'}
                      </label>
                      <input
                        className="input"
                        type="text"
                        value={profileForm.city}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        placeholder={isArabic ? 'أسوان، دراو، إدفو...' : 'Aswan, Edfu...'}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                        {isArabic ? 'المنطقة / الحي' : 'Area'}
                      </label>
                      <input
                        className="input"
                        type="text"
                        value={profileForm.area}
                        onChange={(e) => setProfileForm({ ...profileForm, area: e.target.value })}
                        placeholder={isArabic ? 'المحمودية، الكورنيش...' : 'District'}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>
                      {isArabic ? 'العنوان بالتفصيل' : 'Street Address'}
                    </label>
                    <input
                      className="input"
                      type="text"
                      value={profileForm.address}
                      onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                      placeholder={isArabic ? 'الشارع وعلامة مميزة' : 'Street & Landmark'}
                    />
                  </div>

                  {profileError && (
                    <p style={{ color: 'var(--danger)', fontSize: '0.85rem', margin: 0 }}>{profileError}</p>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="submit"
                      disabled={profileSaving}
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1 }}
                    >
                      {profileSaving ? t('saving') : (isArabic ? 'حفظ التعديلات' : 'Save Changes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="btn btn-outline btn-sm"
                    >
                      {isArabic ? 'إلغاء' : 'Cancel'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Readonly View */
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('customerName')}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{displayName || '--'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('email')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{user.email || '--'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.75rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('phone')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', direction: 'ltr' }}>
                      {customerProfile?.phone || (isArabic ? 'لم يسجل هاتف بعد' : 'No phone recorded')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{t('location')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)', textAlign: isArabic ? 'left' : 'right' }}>
                      {customerProfile?.city || customerProfile?.area || customerProfile?.address ? (
                        <>
                          📍 {[customerProfile.city, customerProfile.area, customerProfile.address].filter(Boolean).join(' - ')}
                        </>
                      ) : (
                        <button
                          className="btn-link"
                          onClick={() => setIsEditingProfile(true)}
                          style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer' }}
                        >
                          + {isArabic ? 'إضافة عنوان التوصيل' : 'Add delivery address'}
                        </button>
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Direct Support & Quick Actions */}
          <div className="card" style={{ background: 'linear-gradient(180deg, #F0FDF4 0%, #FFFFFF 100%)', border: '1px solid #BBF7D0' }}>
            <div className="card-header" style={{ background: 'transparent', borderBottom: '1px solid #DCFCE7' }}>
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#166534' }}>
                {isArabic ? 'مساعدة وخدمة العملاء' : 'Customer Support'}
              </h2>
            </div>
            <div className="card-body">
              <p style={{ color: '#15803D', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.25rem' }}>
                {isArabic
                  ? 'يسعدنا دائماً خدمتك والإجابة على أي استفسارات تخص مشترياتك أو طلبات الأدوات الصحية والسباكة في محافظة أسوان.'
                  : 'We are here to assist with any inquiries regarding your orders or plumbing supplies across Aswan.'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <a
                  href={`https://wa.me/${STORE_INFO.whatsapp}?text=${whatsappMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-wa"
                  style={{ justifyContent: 'center' }}
                >
                  <span>💬 {isArabic ? 'محادثة واتساب مباشرة' : 'Direct WhatsApp Support'}</span>
                </a>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('my-orders')}
                >
                  <span>🔍 {isArabic ? 'تتبع شحنة برقم الطلب' : 'Track an Order'}</span>
                </button>

                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => navigate('shop')}
                >
                  <span>🛍️ {isArabic ? 'طلب منتجات جديدة' : 'Order New Items'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Activity & History Table */}
        <div className="card">
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>
                {isArabic ? '📋 سجل المشتريات والطلبات' : '📋 Purchase History'}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {filteredActivity.length} {isArabic ? 'عملية مسجلة' : 'records found'}
              </span>
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', background: 'var(--bg)', padding: '4px', borderRadius: 'var(--radius-sm)' }}>
              <button
                className={`btn btn-sm ${activeTab === 'all' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('all')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              >
                {isArabic ? 'الكل' : 'All'} ({activity.length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'online' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('online')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              >
                {isArabic ? 'طلبات الأونلاين' : 'Online'} ({onlineOrders.length})
              </button>
              <button
                className={`btn btn-sm ${activeTab === 'offline' ? 'btn-primary' : 'btn-ghost'}`}
                onClick={() => setActiveTab('offline')}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.85rem' }}
              >
                {isArabic ? 'المعرض' : 'Showroom'} ({offlineSales.length})
              </button>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {error ? (
              <p style={{ padding: '2rem', color: 'var(--danger)', textAlign: 'center' }}>{error}</p>
            ) : filteredActivity.length === 0 ? (
              <div style={{ padding: '3rem 2rem' }}>
                <EmptyState
                  icon={
                    <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                      <line x1="8" y1="21" x2="16" y2="21"></line>
                      <line x1="12" y1="17" x2="12" y2="21"></line>
                    </svg>
                  }
                  title={isArabic ? 'لا توجد طلبات في هذا القسم' : 'No records found'}
                  description={isArabic ? 'لم يتم تسجيل أي فواتير أو طلبات في هذا التبويب حتى الآن.' : 'You have not placed any orders in this category yet.'}
                  actionLabel={t('browseProducts')}
                  onAction={() => navigate('shop')}
                />
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table" style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>{t('date')}</th>
                      <th>{isArabic ? 'نوع العملية' : 'Type'}</th>
                      <th>{isArabic ? 'الرقم المرجعي' : 'Reference'}</th>
                      <th>{t('status')}</th>
                      <th>{t('total')}</th>
                      <th>{isArabic ? 'الإجراء' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredActivity.map(act => (
                      <tr key={act.id}>
                        <td>📅 {new Date(act.created_at).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${act.type === 'online' ? 'badge-primary' : 'badge-muted'}`} style={{ fontWeight: 700 }}>
                            {act.type === 'online' ? (isArabic ? '🚚 أونلاين' : 'Online') : (isArabic ? '🏬 معرض أسوان' : 'Showroom')}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)' }}>
                            #{act.order_number || act.sale_number || act.id?.slice(0, 8)}
                          </span>
                        </td>
                        <td>
                          {act.type === 'online' ? (
                            <OrderStatusBadge status={act.status} />
                          ) : (
                            <span className="badge badge-success" style={{ background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0' }}>
                              ✓ {isArabic ? 'مكتمل' : 'Completed'}
                            </span>
                          )}
                        </td>
                        <td>
                          <strong style={{ color: 'var(--accent)', fontSize: '1rem' }}>
                            {formatCurrency(Number(act.total) || 0)}
                          </strong>
                        </td>
                        <td>
                          {act.type === 'online' ? (
                            <button
                              className="btn btn-outline btn-sm"
                              onClick={() => navigate('order-details', { order: act, id: act.id })}
                              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                            >
                              {t('viewDetails')}
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                              {isArabic ? 'فاتورة كاشير' : 'POS Receipt'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
