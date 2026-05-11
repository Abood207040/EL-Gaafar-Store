// src/pages/admin/AdminCustomersPage.jsx
import { useState } from 'react';
import { customers, customerStats } from '../../data/customers.js';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function AdminCustomersPage() {
  const { t, customerStatus } = useLocalization();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filtered = customers.filter(c => {
    const q = search.toLowerCase();
    return !q ||
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.email.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="admin-page animate-fadeIn">
      {/* Stats */}
      <div className="customer-stats">
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('totalCustomers')}</span>
          <span className="stat-mini-value">{customerStats.total}</span>
        </div>
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('newThisMonth')}</span>
          <span className="stat-mini-value" style={{ color: 'var(--success)' }}>{customerStats.newThisMonth}</span>
        </div>
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('activeCustomers')}</span>
          <span className="stat-mini-value" style={{ color: 'var(--accent)' }}>{customerStats.active}</span>
        </div>
      </div>

      {/* Toolbar */}
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
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label={t('searchCustomers')}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            {t('export')}
          </button>
          <button className="btn btn-primary btn-sm">
            + {t('addCustomer')}
          </button>
        </div>
      </div>

      {/* Table */}
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
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('noCustomersFound')}
                  </td>
                </tr>
              ) : (
                paginated.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div className="customer-avatar" aria-hidden="true">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: 600 }}>{c.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{c.id}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{c.phone}</td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{c.email || t('noValue')}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      <span>{c.area}</span><br />
                      <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>{c.city}</span>
                    </td>
                    <td>
                      <strong>{c.totalOrders}</strong>
                      {c.totalSpent > 0 && (
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          SAR {c.totalSpent.toFixed(2)}
                        </p>
                      )}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
                      {c.lastOrderDate || t('noValue')}
                    </td>
                    <td>
                      <span className={`badge ${
                        c.status === 'Active' ? 'badge-success' :
                        c.status === 'New' ? 'badge-info' :
                        'badge-muted'
                      }`}>
                        {customerStatus(c.status)}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-sm">{t('view')}</button>
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
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label={t('previousPage')}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)} aria-label={t('pageNumber', p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label={t('nextPage')}>›</button>
        </nav>
      )}
    </div>
  );
}
