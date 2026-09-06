// src/pages/OrderDetailsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { OrderStatusBadge } from '../components/ui/StatusBadge.jsx';
import OrderTimeline from '../components/ui/OrderTimeline.jsx';
import { FULFILLMENT } from '../constants/domain.js';
import { STORE_INFO } from '../constants/store.js';
import { useLocalization } from '../i18n/Localization.jsx';
import { getOrderById, cancelOrder } from '../services/ordersService.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useParams } from 'react-router-dom';

export default function OrderDetailsPage({ order, navigate }) {
  const { id } = useParams();
  const { t, isArabic, productName, productAltName, formatCurrency, translateFulfillment, parseRpcError } = useLocalization();
  const [currentOrder, setCurrentOrder] = useState(order || null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const orderId = useMemo(() => {
    if (id) return id;
    if (!order) return null;
    if (typeof order === 'string' || typeof order === 'number') return order;
    return order.orderNumber || order.id || null;
  }, [order, id]);

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

  const handleCancelOrder = async () => {
    if (!currentOrder || cancelling) return;
    if (!window.confirm(isArabic ? 'هل أنت متأكد من إلغاء هذا الطلب؟' : 'Are you sure you want to cancel this order?')) return;
    
    setCancelling(true);
    try {
      await cancelOrder(currentOrder.orderNumber, currentOrder.customer?.phone, currentOrder.customer?.email);
      const fresh = await getOrderById(orderId);
      setCurrentOrder(fresh);
    } catch (error) {
      alert(parseRpcError(error));
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
        <p style={{ color: 'var(--text-secondary)' }}>{t('loadingProducts')}</p>
      </div>
    );
  }

  if (!currentOrder) {
    return (
      <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
        <EmptyState
          icon={
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          }
          title={t('orderNotFound')}
          description={loadError || t('orderNotFound')}
          actionLabel={t('backToOrders')}
          onAction={() => navigate('my-orders')}
        />
      </div>
    );
  }

  const isPickup = currentOrder.fulfillment === FULFILLMENT.PICKUP;
  const whatsappMsg = encodeURIComponent(
    isArabic
      ? `مرحباً مؤسسة الجعفر بأسوان، أود الاستفسار عن طلبي رقم: #${currentOrder.orderNumber || currentOrder.id}`
      : `Hello Al-Jafar Store Aswan, I am inquiring about order: #${currentOrder.orderNumber || currentOrder.id}`
  );

  return (
    <div className="order-details-page animate-fadeIn">
      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '1.5rem' }}>
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('home')}>{t('home')}</button>
          </div>
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('my-orders')}>{t('myOrders')}</button>
          </div>
          <div className="breadcrumb-item">
            <span className="breadcrumb-current">#{currentOrder.orderNumber || currentOrder.id}</span>
          </div>
        </nav>

        {/* Page Header */}
        <div className="section-header" style={{ marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
              <h1 className="section-title" style={{ margin: 0 }}>
                {isArabic ? 'تفاصيل الطلب' : 'Order Details'} <span style={{ color: 'var(--primary)', fontFamily: 'monospace' }}>#{currentOrder.orderNumber || currentOrder.id}</span>
              </h1>
              <OrderStatusBadge status={currentOrder.status} />
            </div>
            <p className="section-subtitle" style={{ margin: 0 }}>
              📅 {t('placedOn', currentOrder.date)} • {isPickup ? '🏪 ' : '🚚 '}{translateFulfillment(currentOrder.fulfillment)}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm print-hide" onClick={handlePrint}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              <span>{isArabic ? 'طباعة الإيصال' : 'Print Receipt'}</span>
            </button>
            <button className="btn btn-primary btn-sm print-hide" onClick={() => navigate('shop')}>
              <span>{t('continueShopping')}</span>
            </button>
          </div>
        </div>

        {/* Details Grid */}
        <div className="order-details-layout">
          {/* Main Column */}
          <div className="order-details-main" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Timeline */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t('orderStatus')}</h2>
              </div>
              <div className="card-body">
                <OrderTimeline timeline={currentOrder.timeline} fulfillment={currentOrder.fulfillment} />
              </div>
            </div>

            {/* Ordered Items Table / List */}
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t('itemsOrdered')}</h2>
                <span className="badge badge-muted">
                  {currentOrder.items.length} {currentOrder.items.length === 1 ? t('item') : t('items')}
                </span>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                {/* Desktop Table View */}
                <div className="table-responsive">
                  <table className="table" style={{ margin: 0 }}>
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
                            <div className="cart-product" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                              <div className="cart-product-img" style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', background: '#fff', padding: '4px', flexShrink: 0 }}>
                                <img src={item.product.image} alt={productName(item.product)} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                              </div>
                              <div>
                                <p className="cart-product-name" style={{ fontWeight: 700, margin: '0 0 0.2rem', fontSize: '0.95rem' }}>{productName(item.product)}</p>
                                <p className="cart-product-name-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'} style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                                  {productAltName(item.product)}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td><span className="sku-text" style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{item.product.sku || '--'}</span></td>
                          <td>{formatCurrency(item.unitPrice)}</td>
                          <td><span className="badge badge-muted">x{item.qty}</span></td>
                          <td><strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(item.unitPrice * item.qty)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t('orderSummary')}</h2>
              </div>
              <div className="card-body">
                <div className="summary-rows" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>{t('subtotal')}</span>
                    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatCurrency(currentOrder.subtotal)}</span>
                  </div>
                  <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>{isPickup ? (isArabic ? 'استلام من المعرض' : 'Showroom Pickup') : t('deliveryFee')}</span>
                    <span style={{ fontWeight: 600, color: isPickup ? 'var(--primary)' : currentOrder.delivery?.requiresManualQuote ? '#D97706' : 'var(--text-primary)' }}>
                      {isPickup
                        ? (isArabic ? 'مجاناً' : t('freePickup'))
                        : currentOrder.delivery?.requiresManualQuote
                        ? (isArabic ? 'سيتم تأكيدها من فريقنا' : 'To be confirmed by team')
                        : formatCurrency(currentOrder.logistics)}
                    </span>
                  </div>
                  <div className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                    <span>{isArabic ? 'ضريبة القيمة المضافة' : 'VAT'}</span>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{t('vatIncluded')}</span>
                  </div>
                  <hr className="divider" style={{ margin: '0.5rem 0', borderColor: 'var(--border-light)' }} />
                  <div className="summary-row summary-total" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '1.15rem' }}>
                      {!isPickup && currentOrder.delivery?.requiresManualQuote ? (isArabic ? 'الإجمالي المبدئي' : 'Provisional Total') : t('total')}
                    </strong>
                    <strong style={{ fontSize: '1.4rem', color: 'var(--accent)', fontWeight: 800 }}>
                      {formatCurrency(currentOrder.total)}
                    </strong>
                  </div>
                  {!isPickup && currentOrder.delivery?.requiresManualQuote && (
                    <p style={{ fontSize: '0.75rem', color: '#D97706', margin: '0.35rem 0 0 0' }}>
                      * {isArabic ? 'المبلغ أعلاه لا يشمل رسوم التوصيل الخاصة حتى تأكيدها من فريق العمل.' : 'Total excludes Special delivery fee until confirmed by staff.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="order-details-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Fulfillment Location Info */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
                  {isPickup ? (isArabic ? '📍 استلام من المعرض بأسوان' : '📍 Aswan Showroom Pickup') : (isArabic ? '🚚 عنوان التوصيل' : '🚚 Delivery Address')}
                </h2>
              </div>
              <div className="card-body">
                {isPickup ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '1.25rem' }}>🏢</span>
                      <div>
                        <strong style={{ display: 'block', color: 'var(--text-primary)' }}>{STORE_INFO.nameAr}</strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{STORE_INFO.name}</span>
                      </div>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                      📍 {STORE_INFO.addressAr}
                    </p>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
                      🕒 {STORE_INFO.hoursAr}
                    </p>
                    <a
                      href={STORE_INFO.mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm w-full"
                      style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none' }}
                    >
                      <span>📍 {isArabic ? 'عرض الموقع على خرائط جوجل' : 'View on Google Maps'}</span>
                    </a>
                  </div>
                ) : (
                  <div className="delivery-details-mini" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text-primary)' }}>
                      {currentOrder.address?.street || (isArabic ? 'العنوان محدد هاتفياً' : 'Address confirmed by phone')}
                    </p>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {currentOrder.delivery?.areaName || currentOrder.address?.area ? `${currentOrder.delivery?.areaName || currentOrder.address.area}, ` : ''}
                      {currentOrder.delivery?.governorateName || currentOrder.address?.city || ''}
                    </p>
                    {currentOrder.delivery?.deliveryClass && (
                      <div style={{ marginTop: '0.25rem' }}>
                        <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
                          🚚 {isArabic ? 'فئة الشحن:' : 'Delivery Class:'} {currentOrder.delivery.deliveryClass.toUpperCase()}
                        </span>
                      </div>
                    )}
                    {currentOrder.address?.notes && (
                      <div style={{ padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <strong>{t('notes')}:</strong> {currentOrder.address.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Customer Card */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t('customer')}</h2>
              </div>
              <div className="card-body">
                <p style={{ margin: '0 0 0.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  👤 {currentOrder.customer?.name}
                </p>
                <p style={{ margin: '0 0 0.35rem', color: 'var(--text-secondary)', fontSize: '0.875rem', direction: 'ltr', textAlign: isArabic ? 'right' : 'left' }}>
                  📞 {currentOrder.customer?.phone}
                </p>
                {currentOrder.customer?.email && (
                  <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    ✉️ {currentOrder.customer.email}
                  </p>
                )}
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>{t('payment')}</h2>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 'var(--radius-sm)' }}>
                  <span style={{ fontSize: '1.5rem' }}>💵</span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: '#166534' }}>{t('cashOnDeliveryOnly')}</strong>
                    <span style={{ fontSize: '0.8rem', color: '#15803D' }}>
                      {isArabic ? 'الدفع نقداً بعد فحص ومعاينة البضاعة' : 'Pay cash upon item inspection'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}?text=${whatsappMsg}`}
              className="btn btn-wa w-full print-hide"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none', justifyContent: 'center' }}
            >
              <span>💬 {isArabic ? 'متابعة عبر واتساب' : 'WhatsApp Support'}</span>
            </a>

            {(currentOrder.status === 'pending' || currentOrder.status === 'confirmed') && (
              <button
                className="btn btn-outline w-full print-hide"
                style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? t('saving') : (isArabic ? 'إلغاء الطلب' : 'Cancel Order')}
              </button>
            )}

            <button
              className="btn btn-outline w-full print-hide"
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
