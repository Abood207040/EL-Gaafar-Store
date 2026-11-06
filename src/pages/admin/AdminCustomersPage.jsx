// src/pages/admin/AdminCustomersPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getAdminCustomers, computeCustomerStats } from '../../services/adminCustomersService.js';
import CustomerDetailsModal from '../../components/admin/CustomerDetailsModal.jsx';

export default function AdminCustomersPage() {
  const { t, customerStatus, isArabic } = useLocalization();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, newThisMonth: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    let ignore = false;
    const loadCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const rows = await getAdminCustomers();
        if (!ignore) {
          setCustomers(rows);
          setStats(computeCustomerStats(rows));
        }
      } catch (fetchError) {
        if (!ignore) {
          setError(fetchError.message || t('noCustomersFound'));
          setCustomers([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadCustomers();
    return () => {
      ignore = true;
    };
  }, [t]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return customers;
    return customers.filter((customer) => {
      return (
        customer.name.toLowerCase().includes(q) ||
        customer.phone.toLowerCase().includes(q) ||
        (customer.phoneNormalized && customer.phoneNormalized.includes(q)) ||
        customer.email.toLowerCase().includes(q) ||
        (customer.area && customer.area.toLowerCase().includes(q)) ||
        (customer.city && customer.city.toLowerCase().includes(q))
      );
    });
  }, [customers, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="admin-page animate-fadeIn">
      <div className="customer-stats">
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('totalCustomers')}</span>
          <span className="stat-mini-value">{stats.total}</span>
        </div>
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('newThisMonth')}</span>
          <span className="stat-mini-value" style={{ color: 'var(--success)' }}>{stats.newThisMonth}</span>
        </div>
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('activeCustomers')}</span>
          <span className="stat-mini-value" style={{ color: 'var(--primary)' }}>{stats.active}</span>
        </div>
      </div>

      <div className="admin-controls" style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="search-box" style={{ maxWidth: '400px', flex: 1 }}>
          <span className="search-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={isArabic ? 'بحث بالاسم، رقم الهاتف، أو البريد الإلكتروني...' : 'Search by name, phone, or email...'}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label={t('searchCustomers')}
          />
        </div>
      </div>

      {error ? (
        <p style={{ color: 'var(--danger)', marginTop: '0.75rem', fontSize: '0.875rem' }}>{error}</p>
      ) : null}

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('customerName')}</th>
                <th>{t('phone')}</th>
                <th>{t('email')}</th>
                <th>{t('location')}</th>
                <th>{t('totalCustomerOrders')}</th>
                <th>{isArabic ? 'إجمالي المديونية' : 'Debt'}</th>
                <th>{t('status')}</th>
                <th>{t('actions') || 'Actions'}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('loadingProducts')}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('noCustomersFound')}
                  </td>
                </tr>
              ) : (
                paginated.map((customer) => (
                  <tr 
                    key={customer.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedCustomerId(customer.id)}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="customer-avatar" aria-hidden="true">
                          {(customer.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }}>{customer.name || t('noValue')}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{customer.id.substring(0, 8)}...</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{customer.phone || t('noValue')}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{customer.email || t('noValue')}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      <span>{customer.area || t('noValue')}</span><br />
                      <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>{customer.city || t('noValue')}</span>
                    </td>
                    <td>
                      <strong>{customer.totalOrders}</strong>
                      {customer.totalSpent > 0 && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          EGP {customer.totalSpent.toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td>
                      {customer.totalDebt > 0 ? (
                        <span style={{ color: 'var(--danger)', fontWeight: 'bold' }}>
                          EGP {customer.totalDebt.toFixed(2)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--success)' }}>0.00</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          customer.status === 'Active'
                            ? 'badge-success'
                            : customer.status === 'New'
                              ? 'badge-info'
                              : 'badge-muted'
                        }`}
                      >
                        {customerStatus(customer.status)}
                      </span>
                    </td>
                    <td>
                      <button 
                        type="button" 
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedCustomerId(customer.id);
                        }}
                      >
                        {isArabic ? 'عرض التفاصيل' : 'Details'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="pagination" style={{ padding: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-sm btn-outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t('prevPage')}
            </button>
            <span style={{ display: 'flex', alignItems: 'center', fontSize: '0.875rem', color: 'var(--muted)' }}>
              {t('pageOf', page, totalPages)}
            </span>
            <button
              className="btn btn-sm btn-outline"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              {t('nextPage')}
            </button>
          </div>
        ) : null}
      </div>

      {selectedCustomerId && (
        <CustomerDetailsModal
          customerId={selectedCustomerId}
          onClose={() => setSelectedCustomerId(null)}
        />
      )}
    </div>
  );
}
