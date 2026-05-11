// src/pages/OrderDetailsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { OrderStatusBadge } from '../components/ui/StatusBadge.jsx';
import OrderTimeline from '../components/ui/OrderTimeline.jsx';
import { FULFILLMENT } from '../constants/domain.js';
import { STORE_INFO } from '../constants/store.js';
import { useLocalization } from '../i18n/Localization.jsx';
import { getOrderById } from '../services/ordersService.js';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function OrderDetailsPage({ order, navigate }) {
  const { t, isArabic, productName, productAltName } = useLocalization();
  const [currentOrder, setCurrentOrder] = useState(order || null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  const orderId = useMemo(() => {
    if (!order) return null;
    if (typeof order === 'string' || typeof order === 'number') return order;
    return order.id || null;
  }, [order]);

  useEffect(() => {
    let ignore = false;
    if (!orderId) return undefined;

    const loadOrder = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const fresh = await getOrderById(orderId);
        if (!ignore) setCurrentOrder(fresh);
      } catch (error) {
        if (!ignore) {
          setLoadError(error.message || 'Could not load order details.');
          setCurrentOrder(null);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadOrder();
    return () => {
      ignore = true;
    };
  }, [orderId]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <EmptyState icon="..." title={t('loadingProducts')} description={t('loadingProducts')} />
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <EmptyState
          icon="..."
          title={t('orderNotFound')}
          description={loadError || t('orderNotFound')}
          actionLabel={t('backToOrders')}
          onAction={() => navigate('my-orders')}
        />
      </div>
    );
  }

  const isPickup = currentOrder.fulfillment === FULFILLMENT.PICKUP;

  return (
    <div className="order-details-page animate-fadeIn">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('my-orders')}>{t('myOrders')}</button>
          </div>
          <div className="breadcrumb-item">
            <span className="breadcrumb-current">#{currentOrder.orderNumber || currentOrder.id}</span>
          </div>
        </nav>

        <div className="section-header">
          <div>
            <h1 className="section-title">{t('adminOrders')} #{currentOrder.orderNumber || currentOrder.id}</h1>
            <p className="section-subtitle">{t('placedOn', currentOrder.date)}</p>
          </div>
          <OrderStatusBadge status={currentOrder.status} />
        </div>

        <div className="order-details-layout">
          <div className="order-details-main">
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('orderStatus')}</h2>
              </div>
              <div className="card-body">
                <OrderTimeline timeline={currentOrder.timeline} fulfillment={currentOrder.fulfillment} />
              </div>
            </div>

            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('itemsOrdered')}</h2>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('product')}</th>
                      <th>SKU</th>
                      <th>{t('unitPrice')}</th>
                      <th>{t('quantity')}</th>
                      <th>{t('subtotal')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentOrder.items.map((item) => (
                      <tr key={item.id || `${currentOrder.id}-${item.productId}`}>
                        <td>
                          <div className="cart-product">
                            <div className="cart-product-img">
                              <img src={item.product.image} alt={productName(item.product)} />
                            </div>
                            <div>
                              <p className="cart-product-name">{productName(item.product)}</p>
                              <p className="cart-product-name-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'}>{productAltName(item.product)}</p>
                            </div>
                          </div>
                        </td>
                        <td><span className="sku-text">{item.product.sku}</span></td>
                        <td>EGP {item.unitPrice.toFixed(2)}</td>
                        <td>x{item.qty}</td>
                        <td><strong>EGP {(item.unitPrice * item.qty).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('orderSummary')}</h2>
              </div>
              <div className="card-body">
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>{t('subtotal')}</span>
                    <span>EGP {currentOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{isPickup ? t('pickupFromShop') : t('deliveryFee')}</span>
                    <span>{currentOrder.logistics > 0 ? `EGP ${currentOrder.logistics.toFixed(2)}` : t('freePickup')}</span>
                  </div>
                  <div className="summary-row">
                    <span>VAT</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>{t('vatIncluded')}</span>
                  </div>
                  <hr className="divider" />
                  <div className="summary-row summary-total">
                    <strong>{t('total')}</strong>
                    <strong>EGP {currentOrder.total.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="order-details-sidebar">
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>
                  {isPickup ? t('pickupInformation') : t('deliveryAddress')}
                </h2>
              </div>
              <div className="card-body">
                {isPickup ? (
                  <div className="pickup-details-mini">
                    <p><strong>{STORE_INFO.name}</strong> <span className="arabic-text" lang="ar" dir="rtl">{STORE_INFO.nameAr}</span></p>
                    <p style={{ marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{STORE_INFO.address}</p>
                    <p style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{STORE_INFO.phone}</p>
                    <p style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>{STORE_INFO.hours}</p>
                  </div>
                ) : (
                  <div className="delivery-details-mini">
                    <p>{currentOrder.address?.street}</p>
                    <p>{currentOrder.address?.area}, {currentOrder.address?.city}</p>
                    {currentOrder.address?.notes && (
                      <p style={{ marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                        {t('notes')}: {currentOrder.address.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('customer')}</h2>
              </div>
              <div className="card-body">
                <p><strong>{currentOrder.customer.name}</strong></p>
                <p style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{currentOrder.customer.phone}</p>
                {currentOrder.customer.email && (
                  <p style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>{currentOrder.customer.email}</p>
                )}
              </div>
            </div>

            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('payment')}</h2>
              </div>
              <div className="card-body">
                <div className="payment-method-card" style={{ padding: '0.75rem', background: '#F8FAFC' }}>
                  <span><strong>{t('cashOnDeliveryOnly')}</strong></span>
                </div>
              </div>
            </div>

            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}?text=Hello, I'm inquiring about my order: ${currentOrder.orderNumber || currentOrder.id}`}
              className="btn btn-outline w-full"
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: '1rem', textDecoration: 'none' }}
            >
              {t('contactStoreWhatsapp')}
            </a>

            <button
              className="btn btn-outline w-full"
              style={{ marginTop: '0.75rem' }}
              onClick={() => navigate('my-orders')}
            >
              {t('backToOrders')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
