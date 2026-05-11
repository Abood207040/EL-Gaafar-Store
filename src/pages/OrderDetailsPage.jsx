// src/pages/OrderDetailsPage.jsx
import { OrderStatusBadge } from '../components/ui/StatusBadge.jsx';
import OrderTimeline from '../components/ui/OrderTimeline.jsx';
import { FULFILLMENT, STORE_INFO } from '../data/orders.js';
import { useLocalization } from '../i18n/Localization.jsx';

export default function OrderDetailsPage({ order, navigate }) {
  const { t, isArabic, productName, productAltName } = useLocalization();

  if (!order) {
    return (
      <div className="container" style={{ paddingTop: '3rem', textAlign: 'center' }}>
        <p style={{ color: 'var(--muted)' }}>{t('orderNotFound')}</p>
        <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('my-orders')}>
          {t('backToOrders')}
        </button>
      </div>
    );
  }

  const isPickup = order.fulfillment === FULFILLMENT.PICKUP;

  return (
    <div className="order-details-page animate-fadeIn">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('my-orders')}>{t('myOrders')}</button>
          </div>
          <div className="breadcrumb-item">
            <span className="breadcrumb-current">#{order.id}</span>
          </div>
        </nav>

        {/* Header */}
        <div className="section-header">
          <div>
            <h1 className="section-title">{t('adminOrders')} #{order.id}</h1>
            <p className="section-subtitle">{t('placedOn', order.date)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>

        <div className="order-details-layout">
          {/* Left */}
          <div className="order-details-main">
            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('orderStatus')}</h2>
              </div>
              <div className="card-body">
                <OrderTimeline timeline={order.timeline} fulfillment={order.fulfillment} />
              </div>
            </div>

            {/* Product List */}
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
                    {order.items.map((item, i) => (
                      <tr key={i}>
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
                        <td>SAR {item.unitPrice.toFixed(2)}</td>
                        <td>×{item.qty}</td>
                        <td><strong>SAR {(item.unitPrice * item.qty).toFixed(2)}</strong></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Accounting Summary */}
            <div className="card" style={{ marginTop: '1.25rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('orderSummary')}</h2>
              </div>
              <div className="card-body">
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>{t('subtotal')}</span>
                    <span>SAR {order.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{isPickup ? t('pickupFromShop') : t('deliveryFee')}</span>
                    <span>{order.logistics > 0 ? `SAR ${order.logistics.toFixed(2)}` : t('freePickup')}</span>
                  </div>
                  <div className="summary-row">
                    <span>VAT</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>{t('vatIncluded')}</span>
                  </div>
                  <hr className="divider" />
                  <div className="summary-row summary-total">
                    <strong>{t('total')}</strong>
                    <strong>SAR {order.total.toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Info Cards */}
          <div className="order-details-sidebar">
            {/* Delivery / Pickup Card */}
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
                    <p style={{ marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      📍 {STORE_INFO.address}
                    </p>
                    <p style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                      📞 {STORE_INFO.phone}
                    </p>
                    <p style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem', whiteSpace: 'pre-line' }}>
                      🕐 {STORE_INFO.hours}
                    </p>
                  </div>
                ) : (
                  <div className="delivery-details-mini">
                    <p>{order.address?.street}</p>
                    <p>{order.address?.area}, {order.address?.city}</p>
                    {order.address?.notes && (
                      <p style={{ marginTop: '0.5rem', color: 'var(--muted)', fontSize: '0.875rem' }}>
                        {t('notes')}: {order.address.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer */}
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('customer')}</h2>
              </div>
              <div className="card-body">
                <p><strong>{order.customer.name}</strong></p>
                <p style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>📞 {order.customer.phone}</p>
                {order.customer.email && (
                  <p style={{ marginTop: '0.25rem', color: 'var(--muted)', fontSize: '0.875rem' }}>✉ {order.customer.email}</p>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="card" style={{ marginTop: '1rem' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('payment')}</h2>
              </div>
              <div className="card-body">
                <div className="payment-method-card" style={{ padding: '0.75rem', background: '#F8FAFC' }}>
                  <span style={{ fontSize: '1.25rem' }}>💵</span>
                  <span><strong>{t('cashOnDeliveryOnly')}</strong></span>
                </div>
              </div>
            </div>

            {/* Contact Store */}
            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}?text=Hello, I'm inquiring about my order: ${order.id}`}
              className="btn btn-outline w-full"
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginTop: '1rem', textDecoration: 'none' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#25D366' }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
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
