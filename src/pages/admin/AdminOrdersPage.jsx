// src/pages/admin/AdminOrdersPage.jsx
import { useState } from 'react';
import { orders, ORDER_STATUSES, FULFILLMENT } from '../../data/orders.js';
import { OrderStatusBadge } from '../../components/ui/StatusBadge.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

const STATUS_FILTERS = ['All', ...Object.values(ORDER_STATUSES)];
const FULFILLMENT_FILTERS = ['All', ...Object.values(FULFILLMENT)];

export default function AdminOrdersPage() {
  const { t, translateOrderStatus, translateFulfillment } = useLocalization();
  const [statusFilter, setStatusFilter] = useState('All');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchFulfillment = fulfillmentFilter === 'All' || o.fulfillment === fulfillmentFilter;
    const q = search.toLowerCase();
    const matchSearch = !q ||
      o.id.toLowerCase().includes(q) ||
      o.customer.name.toLowerCase().includes(q) ||
      o.customer.phone.includes(q);
    return matchStatus && matchFulfillment && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-page-toolbar">
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={t('searchOrdersCustomers')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label={t('searchOrders')}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ width: 'auto', minWidth: 160 }}
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            aria-label={t('status')}
          >
            {STATUS_FILTERS.map(s => (
              <option key={s} value={s}>{s === 'All' ? t('allStatuses') : translateOrderStatus(s)}</option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 'auto', minWidth: 180 }}
            value={fulfillmentFilter}
            onChange={e => { setFulfillmentFilter(e.target.value); setPage(1); }}
            aria-label={t('fulfillment')}
          >
            {FULFILLMENT_FILTERS.map(f => (
              <option key={f} value={f}>{f === 'All' ? t('allFulfillment') : translateFulfillment(f)}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('orderId')}</th>
                <th>{t('customer')}</th>
                <th>{t('phone')}</th>
                <th>{t('fulfillment')}</th>
                <th>{t('date')}</th>
                <th>{t('amount')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('noOrdersFound')}
                  </td>
                </tr>
              ) : (
                paginated.map(o => (
                  <tr key={o.id}>
                    <td><span className="sku-text">#{o.id}</span></td>
                    <td><span style={{ fontWeight: 500 }}>{o.customer.name}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{o.customer.phone}</td>
                    <td>
                      <span className="badge badge-muted">
                        {translateFulfillment(o.fulfillment)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{o.date}</td>
                    <td><strong>SAR {o.total.toFixed(2)}</strong></td>
                    <td>
                      <OrderStatusBadge status={o.status} />
                    </td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-outline btn-sm">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          {t('view')}
                        </button>
                        <select
                          className="select"
                          defaultValue=""
                          style={{ fontSize: '0.8125rem', padding: '0.3rem 0.5rem', minWidth: 130 }}
                          aria-label={`${t('changeStatus')} ${o.id}`}
                        >
                          <option value="" disabled>{t('changeStatus')}</option>
                          {Object.values(ORDER_STATUSES).map(s => (
                            <option key={s} value={s}>{translateOrderStatus(s)}</option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label={t('ordersPagination')}>
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
