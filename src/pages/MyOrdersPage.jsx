// src/pages/MyOrdersPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { ORDER_STATUSES } from '../constants/domain.js';
import { OrderStatusBadge } from '../components/ui/StatusBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useLocalization } from '../i18n/Localization.jsx';
import { getCustomerOrders } from '../services/ordersService.js';

const STATUS_FILTERS = ['All', ...Object.values(ORDER_STATUSES)];

export default function MyOrdersPage({ navigate, initialLookup = '' }) {
  const { t, translateOrderStatus, translateFulfillment, productName, isArabic } = useLocalization();
  const [lookup, setLookup] = useState(initialLookup || '');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [lookupDone, setLookupDone] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const lookupHint = isArabic
    ? 'ادخل رقم الهاتف أو البريد الإلكتروني لعرض طلباتك'
    : 'Enter your phone or email to load your orders';
  const lookupAction = isArabic ? 'عرض الطلبات' : 'Load Orders';

  const runLookup = async () => {
    const value = lookup.trim();
    if (!value) return;

    setLoading(true);
    setLoadError('');
    setLookupDone(true);

    try {
      const rows = await getCustomerOrders(value);
      setOrders(rows);
    } catch (error) {
      setLoadError(error.message || (isArabic ? 'تعذر تحميل الطلبات.' : 'Could not load orders.'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!initialLookup) return;
    setLookup(initialLookup);
  }, [initialLookup]);

  useEffect(() => {
    if (!initialLookup) return;
    let ignore = false;
    const preload = async () => {
      setLoading(true);
      setLoadError('');
      setLookupDone(true);
      try {
        const rows = await getCustomerOrders(initialLookup);
        if (!ignore) setOrders(rows);
      } catch (error) {
        if (!ignore) {
          setLoadError(error.message || (isArabic ? 'تعذر تحميل الطلبات.' : 'Could not load orders.'));
          setOrders([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    preload();
    return () => {
      ignore = true;
    };
  }, [initialLookup, isArabic]);

  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        const matchStatus = statusFilter === 'All' || order.status === statusFilter;
        const q = search.trim().toLowerCase();
        const matchSearch =
          !q ||
          String(order.orderNumber || order.id).toLowerCase().includes(q) ||
          String(order.customer?.name || '').toLowerCase().includes(q);
        return matchStatus && matchSearch;
      }),
    [orders, search, statusFilter]
  );

  return (
    <div className="my-orders-page animate-fadeIn">
      <div className="container">
        <div className="section-header">
          <div>
            <h1 className="section-title">{t('myOrdersTitle')}</h1>
            <p className="section-subtitle">{t('myOrdersSubtitle')}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('shop')}>
            {t('newOrder')}
          </button>
        </div>

        <div className="orders-toolbar" style={{ marginBottom: '1rem' }}>
          <div className="input-group" style={{ maxWidth: 420 }}>
            <span className="input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              className="input"
              type="text"
              placeholder={lookupHint}
              value={lookup}
              onChange={(event) => setLookup(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') runLookup();
              }}
              aria-label={lookupHint}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={runLookup} disabled={loading || !lookup.trim()}>
            {loading ? t('saving') : lookupAction}
          </button>
        </div>

        {loadError ? (
          <p style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{loadError}</p>
        ) : null}

        <div className="orders-toolbar">
          <div className="input-group" style={{ maxWidth: 320 }}>
            <span className="input-icon" aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </span>
            <input
              className="input"
              type="search"
              placeholder={t('searchOrders')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label={t('searchOrders')}
            />
          </div>

          <div className="status-filter-tabs" role="tablist" aria-label={t('orderStatus')}>
            {STATUS_FILTERS.map((status) => (
              <button
                key={status}
                role="tab"
                aria-selected={statusFilter === status}
                className={`status-tab ${statusFilter === status ? 'active' : ''}`}
                onClick={() => setStatusFilter(status)}
              >
                {status === 'All' ? t('allStatuses') : translateOrderStatus(status)}
              </button>
            ))}
          </div>
        </div>

        {!lookupDone && orders.length === 0 ? (
          <EmptyState icon="..." title={isArabic ? 'ابحث عن طلباتك' : 'Find your orders'} description={lookupHint} />
        ) : loading ? (
          <EmptyState icon="..." title={t('loadingProducts')} description={t('loadingProducts')} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="..."
            title={t('noOrdersFound')}
            description={search || statusFilter !== 'All' ? t('noOrdersDescription') : t('noOrdersYet')}
            actionLabel={t('browseProducts')}
            onAction={() => navigate('shop')}
          />
        ) : (
          <div className="orders-list">
            {filtered.map((order) => (
              <div key={order.id} className="order-card card animate-fadeIn">
                <div className="order-card-header">
                  <div className="order-card-id">
                    <span className="sku-text">#{order.orderNumber || order.id}</span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="order-card-meta">
                    <span className="order-date">{order.date}</span>
                    <span className="order-fulfillment badge badge-muted">
                      {translateFulfillment(order.fulfillment)}
                    </span>
                  </div>
                </div>

                <div className="order-card-body">
                  <div className="order-items-preview">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id || `${order.id}-${item.productId}`} className="order-item-thumb">
                        <img src={item.product.image} alt={productName(item.product)} />
                        <span className="order-item-qty">x{item.qty}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="order-more-items">{t('moreItems', order.items.length - 3)}</span>
                    )}
                  </div>

                  <div className="order-card-summary">
                    <div>
                      <p className="order-customer-name">{order.customer.name}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                        {order.items.length} {order.items.length === 1 ? t('item') : t('items')} - {t('cashOnDeliveryOnly')}
                      </p>
                    </div>
                    <div className="order-card-total">
                      <span className="order-total-label">{t('total')}</span>
                      <span className="order-total-amount">EGP {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="order-card-footer">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('order-details', { order })}
                  >
                    {t('viewDetails')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
