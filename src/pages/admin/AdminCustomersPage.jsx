// src/pages/admin/AdminCustomersPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getAdminCustomers, getCustomerStats } from '../../services/adminCustomersService.js';

export default function AdminCustomersPage() {
  const { t, customerStatus } = useLocalization();
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState({ total: 0, newThisMonth: 0, active: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    let ignore = false;
    const loadCustomers = async () => {
      setLoading(true);
      setError('');
      try {
        const [rows, statsData] = await Promise.all([getAdminCustomers(), getCustomerStats()]);
        if (!ignore) {
          setCustomers(rows);
          setStats(statsData);
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

  const filtered = useMemo(
    () =>
      customers.filter((customer) => {
        const q = search.toLowerCase();
        return (
          !q ||
          customer.name.toLowerCase().includes(q) ||
          customer.phone.toLowerCase().includes(q) ||
          customer.email.toLowerCase().includes(q)
        );
      }),
    [customers, search]
  );

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
          <span className="stat-mini-value" style={{ color: 'var(--accent)' }}>{stats.active}</span>
        </div>
      </div>

      <div className="admin-page-toolbar" style={{ marginTop: '1.5rem' }}>
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={t('searchCustomers')}
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
                <th>{t('lastOrder')}</th>
                <th>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('loadingProducts')}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('noCustomersFound')}
                  </td>
                </tr>
              ) : (
                paginated.map((customer) => (
                  <tr key={customer.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="customer-avatar" aria-hidden="true">
                          {(customer.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }}>{customer.name || t('noValue')}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{customer.id}</p>
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
                    <td style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                      {customer.lastOrderDate || t('noValue')}
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label={t('customersPagination')}>
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label={t('previousPage')}
          >
            {'<'}
          </button>
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((p) => (
            <button
              key={p}
              className={`page-btn ${page === p ? 'active' : ''}`}
              onClick={() => setPage(p)}
              aria-label={t('pageNumber', p)}
            >
              {p}
            </button>
          ))}
          <button
            className="page-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label={t('nextPage')}
          >
            {'>'}
          </button>
        </nav>
      )}
    </div>
  );
}
