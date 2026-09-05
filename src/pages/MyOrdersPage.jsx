// src/pages/MyOrdersPage.jsx
import { useEffect, useState } from 'react';
import { OrderStatusBadge } from '../components/ui/StatusBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useLocalization } from '../i18n/Localization.jsx';
import { trackOrder } from '../services/ordersService.js';
import { useLocation } from 'react-router-dom';


export default function MyOrdersPage({ navigate, initialLookup = '' }) {
  const { state } = useLocation();
  const { t, translateFulfillment, productName, isArabic } = useLocalization();
  const [orderNumber, setOrderNumber] = useState(initialLookup || state?.lookup || '');
  const [contact, setContact] = useState('');
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [lookupDone, setLookupDone] = useState(false);

  const lookupHint = isArabic
    ? 'رقم الهاتف أو البريد الإلكتروني'
    : 'Phone or Email';
  const orderNumberHint = isArabic ? 'رقم الطلب (مثال: AJ-...)' : 'Order Number (e.g. AJ-...)';
  const lookupAction = isArabic ? 'تتبع الطلب' : 'Track Order';

  const runLookup = async () => {
    const num = orderNumber.trim();
    const contactVal = contact.trim();
    if (!num || !contactVal) return;

    setLoading(true);
    setLoadError('');
    setLookupDone(true);

    try {
      const order = await trackOrder(num, contactVal);
      if (order) {
        setOrders([order]);
      } else {
        setLoadError(isArabic ? 'لم يتم العثور على طلب مطابق.' : 'No matching order found.');
        setOrders([]);
      }
    } catch (error) {
      setLoadError(error.message || (isArabic ? 'تعذر تحميل الطلبات.' : 'Could not load orders.'));
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If initialLookup is provided, it's just the order number, we still need contact.
    // So we don't automatically run lookup unless both are somehow provided.
  }, []);

  const filtered = orders;

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

        <div className="orders-toolbar" style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: 1, minWidth: '200px', maxWidth: 300 }}>
            <span className="input-icon" aria-hidden="true">#</span>
            <input
              className="input"
              type="text"
              placeholder={orderNumberHint}
              value={orderNumber}
              onChange={(event) => setOrderNumber(event.target.value)}
              aria-label={orderNumberHint}
            />
          </div>
          <div className="input-group" style={{ flex: 1, minWidth: '200px', maxWidth: 300 }}>
            <span className="input-icon" aria-hidden="true">@</span>
            <input
              className="input"
              type="text"
              placeholder={lookupHint}
              value={contact}
              onChange={(event) => setContact(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') runLookup();
              }}
              aria-label={lookupHint}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={runLookup} disabled={loading || !orderNumber.trim() || !contact.trim()}>
            {loading ? t('saving') : lookupAction}
          </button>
        </div>

        {loadError ? (
          <p style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{loadError}</p>
        ) : null}



        {!lookupDone && orders.length === 0 ? (
          <EmptyState icon="..." title={isArabic ? 'ابحث عن طلبك' : 'Track your order'} description={isArabic ? 'الرجاء إدخال رقم الطلب ورقم الهاتف/البريد الإلكتروني.' : 'Please enter your order number and phone/email.'} />
        ) : loading ? (
          <EmptyState icon="..." title={t('loadingProducts')} description={t('loadingProducts')} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="..."
            title={t('noOrdersFound')}
            description={t('noOrdersYet')}
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
