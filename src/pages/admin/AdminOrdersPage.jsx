// src/pages/admin/AdminOrdersPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { FULFILLMENT, ORDER_STATUSES } from '../../constants/domain.js';
import { OrderStatusBadge } from '../../components/ui/StatusBadge.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getAdminOrders, updateOrderStatus } from '../../services/adminOrdersService.js';

const STATUS_FILTERS = ['All', ...Object.values(ORDER_STATUSES)];
const FULFILLMENT_FILTERS = ['All', ...Object.values(FULFILLMENT)];

export default function AdminOrdersPage({ navigate }) {
  const { t, isArabic, translateOrderStatus, translateFulfillment } = useLocalization();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fulfillmentFilter, setFulfillmentFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [sortBy, setSortBy] = useState('date-desc');
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const result = orders.filter((order) => {
      const matchStatus = statusFilter === 'All' || order.status === statusFilter;
      const matchFulfillment =
        fulfillmentFilter === 'All' || order.fulfillment === fulfillmentFilter;
      
      const orderNum = String(order.orderNumber || '').toLowerCase();
      const orderId = String(order.id || '').toLowerCase();
      const custId = String(order.customer?.id || '').toLowerCase();
      const custName = String(order.customer?.name || '').toLowerCase();
      const custPhone = String(order.customer?.phone || '').toLowerCase();
      const custEmail = String(order.customer?.email || '').toLowerCase();
      const dateStr = String(order.date || '').toLowerCase();
      const isoDate = (order.createdAt || order.date || '').slice(0, 10);

      const matchSearch =
        !q ||
        orderNum.includes(q) ||
        orderId.includes(q) ||
        custId.includes(q) ||
        custName.includes(q) ||
        custPhone.includes(q) ||
        custEmail.includes(q) ||
        dateStr.includes(q) ||
        isoDate.includes(q);

      const matchDate = !dateFilter || isoDate === dateFilter;

      return matchStatus && matchFulfillment && matchSearch && matchDate;
    });

    result.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date);
      }
      if (sortBy === 'date-asc') {
        return new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date);
      }
      if (sortBy === 'total-desc') {
        return Number(b.total || 0) - Number(a.total || 0);
      }
      if (sortBy === 'total-asc') {
        return Number(a.total || 0) - Number(b.total || 0);
      }
      if (sortBy === 'name-asc') {
        const nameA = a.customer?.name || (isArabic ? 'ي' : 'z');
        const nameB = b.customer?.name || (isArabic ? 'ي' : 'z');
        return nameA.localeCompare(nameB);
      }
      if (sortBy === 'name-desc') {
        const nameA = a.customer?.name || (isArabic ? 'أ' : 'a');
        const nameB = b.customer?.name || (isArabic ? 'أ' : 'a');
        return nameB.localeCompare(nameA);
      }
      return 0;
    });

    return result;
  }, [orders, statusFilter, fulfillmentFilter, search, dateFilter, sortBy, isArabic]);

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
      <div className="admin-page-toolbar" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="input-group" style={{ minWidth: 260, flex: 1 }}>
          <span className="input-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={isArabic ? 'بحث برقم الطلب، اسم العميل، المعرف، الهاتف، أو التاريخ...' : 'Search by order #, customer name, ID, phone, or date...'}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label={t('searchOrders')}
          />
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <input
            type="date"
            className="input"
            style={{ width: 'auto', minWidth: 150 }}
            value={dateFilter}
            onChange={(e) => {
              setDateFilter(e.target.value);
              setPage(1);
            }}
            title={isArabic ? 'تصفية حسب التاريخ' : 'Filter by date'}
          />
          {dateFilter && (
            <button
              type="button"
              className="btn btn-outline btn-sm"
              style={{ padding: '0.35rem 0.6rem' }}
              onClick={() => {
                setDateFilter('');
                setPage(1);
              }}
              title={isArabic ? 'إلغاء تصفية التاريخ' : 'Clear date'}
            >
              ✕
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <select
          className="select"
          style={{ width: 'auto', minWidth: 170 }}
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          aria-label={isArabic ? 'الترتيب' : 'Sort by'}
        >
          <option value="date-desc">{isArabic ? 'الأحدث أولاً' : 'Date: Newest First'}</option>
          <option value="date-asc">{isArabic ? 'الأقدم أولاً' : 'Date: Oldest First'}</option>
          <option value="total-desc">{isArabic ? 'الأعلى قيمة' : 'Total: High to Low'}</option>
          <option value="total-asc">{isArabic ? 'الأقل قيمة' : 'Total: Low to High'}</option>
          <option value="name-asc">{isArabic ? 'اسم العميل (أ - ي)' : 'Customer: A to Z'}</option>
          <option value="name-desc">{isArabic ? 'اسم العميل (ي - أ)' : 'Customer: Z to A'}</option>
        </select>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <select
            className="select"
            style={{ width: 'auto', minWidth: 150 }}
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
            style={{ width: 'auto', minWidth: 160 }}
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
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>
                          {order.customer?.name || (isArabic ? 'عميل غير مسجل' : 'Guest / Unregistered')}
                        </span>
                        {order.customer?.id && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                            ID: #{String(order.customer.id).slice(0, 8)}
                          </span>
                        )}
                      </div>
                    </td>
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
