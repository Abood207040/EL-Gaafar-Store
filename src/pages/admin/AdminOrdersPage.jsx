// src/pages/admin/AdminOrdersPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { FULFILLMENT, ORDER_STATUSES } from '../../constants/domain.js';
import { OrderStatusBadge } from '../../components/ui/StatusBadge.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getAdminOrders, updateOrderStatus } from '../../services/adminOrdersService.js';

const STATUS_FILTERS = ['All', ...Object.values(ORDER_STATUSES)];
const FULFILLMENT_FILTERS = ['All', ...Object.values(FULFILLMENT)];

export default function AdminOrdersPage({ navigate }) {
  const { t, translateOrderStatus, translateFulfillment } = useLocalization();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const rows = await getAdminOrders();
      setOrders(rows);
    } catch (fetchError) {
      setError(fetchError.message || t('noOrdersFound'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const matchStatus = statusFilter === 'All' || order.status === statusFilter;
        const matchFulfillment =
          fulfillmentFilter === 'All' || order.fulfillment === fulfillmentFilter;
        const q = search.toLowerCase();
        const matchSearch =
          !q ||
          String(order.orderNumber || order.id).toLowerCase().includes(q) ||
          String(order.customer?.name || '').toLowerCase().includes(q) ||
          String(order.customer?.phone || '').toLowerCase().includes(q);
        return matchStatus && matchFulfillment && matchSearch;
      }),
    [fulfillmentFilter, orders, search, statusFilter]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleStatusChange = async (orderId, status) => {
    if (!status) return;
    setUpdatingOrderId(orderId);
    setError('');
    try {
      await updateOrderStatus(orderId, status);
      await loadOrders();
    } catch (updateError) {
      setError(updateError.message || t('saveProductFailed'));
    } finally {
      setUpdatingOrderId('');
    }
  };

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
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label={t('searchOrders')}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ width: 'auto', minWidth: 160 }}
            value={statusFilter}
            onChange={(event) => {
              setStatusFilter(event.target.value);
              setPage(1);
            }}
            aria-label={t('status')}
          >
            {STATUS_FILTERS.map((status) => (
              <option key={status} value={status}>
                {status === 'All' ? t('allStatuses') : translateOrderStatus(status)}
              </option>
            ))}
          </select>
          <select
            className="select"
            style={{ width: 'auto', minWidth: 180 }}
            value={fulfillmentFilter}
            onChange={(event) => {
              setFulfillmentFilter(event.target.value);
              setPage(1);
            }}
            aria-label={t('fulfillment')}
          >
            {FULFILLMENT_FILTERS.map((fulfillment) => (
              <option key={fulfillment} value={fulfillment}>
                {fulfillment === 'All' ? t('allFulfillment') : translateFulfillment(fulfillment)}
              </option>
            ))}
          </select>
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
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('loadingProducts')}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('noOrdersFound')}
                  </td>
                </tr>
              ) : (
                paginated.map((order) => (
                  <tr key={order.id}>
                    <td><span className="sku-text">#{order.orderNumber || order.id}</span></td>
                    <td><span style={{ fontWeight: 500 }}>{order.customer?.name}</span></td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{order.customer?.phone}</td>
                    <td>
                      <span className="badge badge-muted">
                        {translateFulfillment(order.fulfillment)}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)', fontSize: '0.875rem' }}>{order.date}</td>
                    <td><strong>EGP {order.total.toFixed(2)}</strong></td>
                    <td>
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => navigate('order-details', { order })}
                        >
                          {t('view')}
                        </button>
                        <select
                          className="select"
                          value={order.status}
                          style={{ fontSize: '0.8125rem', padding: '0.3rem 0.5rem', minWidth: 150 }}
                          onChange={(event) => handleStatusChange(order.id, event.target.value)}
                          disabled={updatingOrderId === order.id}
                          aria-label={`${t('changeStatus')} ${order.orderNumber || order.id}`}
                        >
                          {Object.values(ORDER_STATUSES).map((status) => (
                            <option key={status} value={status}>{translateOrderStatus(status)}</option>
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
