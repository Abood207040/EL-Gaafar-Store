// src/pages/MyOrdersPage.jsx
import { useState } from 'react';
import { orders, ORDER_STATUSES } from '../data/orders.js';
import { OrderStatusBadge } from '../components/ui/StatusBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useLocalization } from '../i18n/Localization.jsx';

const STATUS_FILTERS = ['All', ...Object.values(ORDER_STATUSES)];

export default function MyOrdersPage({ navigate }) {
  const { t, translateOrderStatus, translateFulfillment, productName } = useLocalization();
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const filtered = orders.filter(o => {
    const matchStatus = statusFilter === 'All' || o.status === statusFilter;
    const matchSearch = !search.trim() ||
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.customer.name.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

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

        {/* Search & Filter */}
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
              onChange={e => setSearch(e.target.value)}
              aria-label={t('searchOrders')}
            />
          </div>

          <div className="status-filter-tabs" role="tablist" aria-label={t('orderStatus')}>
            {STATUS_FILTERS.map(s => (
              <button
                key={s}
                role="tab"
                aria-selected={statusFilter === s}
                className={`status-tab ${statusFilter === s ? 'active' : ''}`}
                onClick={() => setStatusFilter(s)}
              >
                {s === 'All' ? t('allCategories') : translateOrderStatus(s)}
              </button>
            ))}
          </div>
        </div>

        {/* Orders List */}
        {filtered.length === 0 ? (
          <EmptyState
            icon="📋"
            title={t('noOrdersFound')}
            description={search || statusFilter !== 'All' ? t('noOrdersDescription') : t('noOrdersYet')}
            actionLabel={t('browseProducts')}
            onAction={() => navigate('shop')}
          />
        ) : (
          <div className="orders-list">
            {filtered.map(order => (
              <div key={order.id} className="order-card card animate-fadeIn">
                <div className="order-card-header">
                  <div className="order-card-id">
                    <span className="sku-text">#{order.id}</span>
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
                  {/* Items Preview */}
                  <div className="order-items-preview">
                    {order.items.slice(0, 3).map((item, i) => (
                      <div key={i} className="order-item-thumb">
                        <img src={item.product.image} alt={productName(item.product)} />
                        <span className="order-item-qty">×{item.qty}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <span className="order-more-items">{t('moreItems', order.items.length - 3)}</span>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="order-card-summary">
                    <div>
                      <p className="order-customer-name">{order.customer.name}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>
                        {order.items.length} {order.items.length === 1 ? t('item') : t('items')} · {t('cashOnDeliveryOnly')}
                      </p>
                    </div>
                    <div className="order-card-total">
                      <span className="order-total-label">{t('total')}</span>
                      <span className="order-total-amount">SAR {order.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="order-card-footer">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('order-details', order)}
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
