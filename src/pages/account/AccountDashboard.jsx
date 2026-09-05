import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getCustomerActivity } from '../../services/customerAccountService.js';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { OrderStatusBadge } from '../../components/ui/StatusBadge.jsx';

export default function AccountDashboard({ navigate }) {
  const { t, isArabic } = useLocalization();
  const { user, customerProfile, signOut, loading: authLoading } = useAuth();
  
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user && !authLoading) {
      navigate('login');
      return;
    }
    
    if (user && customerProfile) {
      let ignore = false;
      const load = async () => {
        setLoading(true);
        try {
          const data = await getCustomerActivity();
          if (!ignore) setActivity(data);
        } catch {
          if (!ignore) setError(isArabic ? 'فشل تحميل الطلبات' : 'Failed to load activity');
        } finally {
          if (!ignore) setLoading(false);
        }
      };
      load();
      return () => { ignore = true; };
    }
  }, [user, customerProfile, authLoading, navigate, isArabic]);

  if (authLoading || loading) {
    return (
      <div className="container animate-fadeIn" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <EmptyState icon="..." title={t('loadingProducts')} description={t('loadingProducts')} />
      </div>
    );
  }

  if (!user) return null; // handled by useEffect redirect

  const totalSpent = activity.reduce((sum, act) => sum + (Number(act.total) || 0), 0);
  const onlineOrders = activity.filter(a => a.type === 'online').length;
  const offlineSales = activity.filter(a => a.type === 'offline').length;

  return (
    <div className="container animate-fadeIn" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      <div className="section-header">
        <div>
          <h1 className="section-title">{isArabic ? 'حسابي' : 'My Account'}</h1>
          <p className="section-subtitle">{isArabic ? 'مرحباً، ' : 'Welcome, '}{customerProfile?.full_name || user.email}</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => { signOut(); navigate('home'); }}>
          {isArabic ? 'تسجيل الخروج' : 'Sign Out'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '2rem' }}>
        
        {/* Profile Card */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.125rem' }}>{isArabic ? 'المعلومات الشخصية' : 'Personal Information'}</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{t('customerName')}</span>
                <p style={{ fontWeight: 500 }}>{customerProfile?.full_name || '--'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{t('email')}</span>
                <p style={{ fontWeight: 500 }}>{user.email || '--'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{t('phone')}</span>
                <p style={{ fontWeight: 500 }}>{customerProfile?.phone || '--'}</p>
              </div>
              <div>
                <span style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{t('location')}</span>
                <p style={{ fontWeight: 500 }}>
                  {customerProfile?.city || ''} {customerProfile?.area ? `- ${customerProfile.area}` : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Card */}
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1.125rem' }}>{isArabic ? 'ملخص المشتريات' : 'Purchase Summary'}</h2>
          </div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--muted)' }}>{isArabic ? 'إجمالي المشتريات' : 'Total Spent'}</span>
                <strong style={{ fontSize: '1.125rem' }}>EGP {totalSpent.toFixed(2)}</strong>
              </div>
              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{isArabic ? 'طلبات الأونلاين' : 'Online Orders'}</span>
                <strong>{onlineOrders}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{isArabic ? 'مشتريات المتجر' : 'Store Purchases'}</span>
                <strong>{offlineSales}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified History */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <div className="card-header">
          <h2 style={{ fontSize: '1.125rem' }}>{isArabic ? 'سجل المشتريات' : 'Purchase History'}</h2>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {error ? (
            <p style={{ padding: '1.5rem', color: 'var(--danger)' }}>{error}</p>
          ) : activity.length === 0 ? (
            <EmptyState icon="..." title={t('noOrdersFound')} description={t('noOrdersYet')} />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('date')}</th>
                  <th>{isArabic ? 'النوع' : 'Type'}</th>
                  <th>{isArabic ? 'الرقم المرجعي' : 'Reference'}</th>
                  <th>{t('status')}</th>
                  <th>{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {activity.map(act => (
                  <tr key={act.id}>
                    <td>{new Date(act.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${act.type === 'online' ? 'badge-primary' : 'badge-muted'}`}>
                        {act.type === 'online' ? (isArabic ? 'أونلاين' : 'Online') : (isArabic ? 'المتجر' : 'In-Store')}
                      </span>
                    </td>
                    <td>
                      {act.type === 'online' ? (
                        <button className="btn-link" onClick={() => navigate('order-details', { id: act.id })}>
                          #{act.order_number}
                        </button>
                      ) : (
                        `#${act.sale_number}`
                      )}
                    </td>
                    <td>
                      {act.type === 'online' ? (
                        <OrderStatusBadge status={act.status} />
                      ) : (
                        <span className="badge badge-success">{isArabic ? 'مكتمل' : 'Completed'}</span>
                      )}
                    </td>
                    <td><strong>EGP {Number(act.total).toFixed(2)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
