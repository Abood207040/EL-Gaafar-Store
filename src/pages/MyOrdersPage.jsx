// src/pages/MyOrdersPage.jsx
import { useEffect, useState } from 'react';
import { OrderStatusBadge } from '../components/ui/StatusBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useLocalization } from '../i18n/Localization.jsx';
import { trackOrder } from '../services/ordersService.js';
import { STORE_INFO } from '../constants/store.js';
import { FULFILLMENT } from '../constants/domain.js';
import { useLocation } from 'react-router-dom';

export default function MyOrdersPage({ navigate, initialLookup = '' }) {
  const { state } = useLocation();
  const { t, translateFulfillment, productName, formatCurrency, isArabic } = useLocalization();
  
  // Smart initial state parsing from navigation
  const incomingLookup = initialLookup || state?.lookup || '';
  const isIncomingContact = incomingLookup.includes('@') || /^[0-9+\s-]{8,}$/.test(incomingLookup.trim());
  
  const [orderNumber, setOrderNumber] = useState(isIncomingContact ? '' : incomingLookup);
  const [contact, setContact] = useState(isIncomingContact ? incomingLookup : (state?.contact || ''));
  
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [lookupDone, setLookupDone] = useState(false);

  const lookupHint = isArabic
    ? 'رقم الهاتف المسجل أو البريد الإلكتروني'
    : 'Registered Phone or Email';
  const orderNumberHint = isArabic ? 'رقم الطلب (مثال: AJ-...)' : 'Order Number (e.g. AJ-...)';

  const runLookup = async (e) => {
    if (e) e.preventDefault();
    const num = orderNumber.trim();
    const contactVal = contact.trim();
    if (!num || !contactVal) {
      setLoadError(isArabic ? 'يرجى إدخال كل من رقم الطلب ورقم الهاتف/البريد.' : 'Please enter both Order Number and Phone/Email.');
      return;
    }

    setLoading(true);
    setLoadError('');
    setLookupDone(true);

    try {
      const order = await trackOrder(num, contactVal);
      if (order) {
        setOrders([order]);
      } else {
        setLoadError(isArabic ? 'لم يتم العثور على طلب مطابق للبيانات المدخلة. تأكد من صحة رقم الطلب والهاتف.' : 'No matching order found. Please verify the order number and contact details.');
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
    // If both orderNumber and contact were provided via navigation, run lookup automatically
    if (orderNumber && contact) {
      runLookup();
    }
  }, []);

  return (
    <div className="my-orders-page animate-fadeIn">
      <div className="container" style={{ paddingTop: '2.5rem', paddingBottom: '4rem' }}>
        {/* Header */}
        <div className="section-header" style={{ marginBottom: '2rem' }}>
          <div>
            <div className="badge-aswan" style={{ display: 'inline-block', marginBottom: '0.5rem' }}>
              📍 {isArabic ? 'خدمة عملاء فرع أسوان' : 'Aswan Customer Support'}
            </div>
            <h1 className="section-title">{t('myOrdersTitle')}</h1>
            <p className="section-subtitle">{t('myOrdersSubtitle')}</p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('shop')}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span>{t('newOrder')}</span>
          </button>
        </div>

        {/* Lookup Card */}
        <div className="orders-lookup-card card" style={{ marginBottom: '2.5rem', padding: '2rem' }}>
          <div style={{ marginBottom: '1.25rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              {isArabic ? '🔍 تتبع حالة طلبك لحظة بلحظة' : '🔍 Track Your Order Status'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.35rem', margin: 0 }}>
              {isArabic
                ? 'أدخل رقم طلبك مع رقم الهاتف أو البريد الذي استخدمته عند إتمام الطلب لمعرفة حالة الشحن والتجهيز.'
                : 'Enter your order number along with your contact info to check live dispatch and fulfillment status.'}
            </p>
          </div>

          <form onSubmit={runLookup} className="orders-lookup-form" style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="input-group" style={{ flex: '1 1 240px' }}>
              <span className="input-icon" aria-hidden="true" style={{ color: 'var(--primary)', fontWeight: 700 }}>#</span>
              <input
                className="input"
                type="text"
                placeholder={orderNumberHint}
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                aria-label={orderNumberHint}
                required
              />
            </div>
            
            <div className="input-group" style={{ flex: '1 1 260px' }}>
              <span className="input-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                </svg>
              </span>
              <input
                className="input"
                type="text"
                placeholder={lookupHint}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                aria-label={lookupHint}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !orderNumber.trim() || !contact.trim()}
              style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              {loading ? (
                <>
                  <span className="spinner-mini" aria-hidden="true"></span>
                  <span>{t('saving')}</span>
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                  <span>{isArabic ? 'تتبع الطلب' : 'Track Order'}</span>
                </>
              )}
            </button>
          </form>

          {loadError && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', color: '#DC2626', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{loadError}</span>
            </div>
          )}

          {/* Quick Help Tip */}
          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            <span>
              💡 {isArabic ? 'فقدت رقم الطلب؟ تواصل معنا مباشرة عبر واتساب وسيقوم فريقنا بمساعدتك:' : 'Lost your order number? Contact our Aswan support directly:'}
            </span>
            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(isArabic ? 'مرحباً، أود الاستفسار عن طلبي برقم هاتفي المسجل' : 'Hello, I want to inquire about my order using my phone number')}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#16A34A', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', textDecoration: 'none' }}
            >
              💬 {isArabic ? 'مساعدة واتساب الفورية' : 'WhatsApp Support'}
            </a>
          </div>
        </div>

        {/* Results Area */}
        {!lookupDone && orders.length === 0 ? (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center', background: 'var(--card)' }}>
            <div style={{ width: '60px', height: '60px', margin: '0 auto 1rem', borderRadius: '50%', background: 'rgba(14, 165, 233, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
              {isArabic ? 'جاهز لتتبع طلبك' : 'Ready to Track'}
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '440px', margin: '0 auto' }}>
              {isArabic ? 'قم بكتابة رقم الطلب ورقم هاتفك في الحقول أعلاه واضغط على "تتبع الطلب".' : 'Please enter your order reference number and contact info above to view live progress.'}
            </p>
          </div>
        ) : loading ? (
          <div className="card" style={{ padding: '3rem 2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1rem' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>{t('loadingProducts')}</p>
          </div>
        ) : orders.length === 0 ? (
          <EmptyState
            icon={
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m15 9-6 6"></path>
                <path d="m9 9 6 6"></path>
              </svg>
            }
            title={t('noOrdersFound')}
            description={loadError || t('noOrdersYet')}
            actionLabel={t('browseProducts')}
            onAction={() => navigate('shop')}
          />
        ) : (
          <div className="orders-list" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {orders.map((order) => (
              <div key={order.id} className="order-card card animate-fadeIn" style={{ overflow: 'hidden' }}>
                <div className="order-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', padding: '1.25rem 1.5rem', background: '#F8FAFC', borderBottom: '1px solid var(--border)' }}>
                  <div className="order-card-id" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'monospace' }}>
                      #{order.orderNumber || order.id}
                    </span>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <div className="order-card-meta" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="order-date" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      📅 {order.date}
                    </span>
                    <span className="order-fulfillment badge badge-muted" style={{ fontWeight: 600 }}>
                      {order.fulfillment === FULFILLMENT.PICKUP ? '🏪 ' : '🚚 '}
                      {translateFulfillment(order.fulfillment)}
                    </span>
                  </div>
                </div>

                <div className="order-card-body" style={{ padding: '1.5rem' }}>
                  {/* Items Preview */}
                  <div className="order-items-preview" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
                    {order.items.slice(0, 4).map((item) => (
                      <div
                        key={item.id || `${order.id}-${item.productId}`}
                        className="order-item-thumb"
                        style={{ position: 'relative', width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflow: 'hidden', background: '#fff' }}
                      >
                        <img
                          src={item.product.image}
                          alt={productName(item.product)}
                          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '4px' }}
                        />
                        <span
                          className="order-item-qty"
                          style={{ position: 'absolute', bottom: '2px', right: '2px', background: 'rgba(13, 26, 34, 0.85)', color: '#fff', fontSize: '0.65rem', fontWeight: 700, padding: '1px 5px', borderRadius: '4px' }}
                        >
                          x{item.qty}
                        </span>
                      </div>
                    ))}
                    {order.items.length > 4 && (
                      <span className="order-more-items" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, padding: '0.5rem 0.75rem', background: 'var(--bg)', borderRadius: 'var(--radius-sm)' }}>
                        +{order.items.length - 4} {isArabic ? 'منتجات إضافية' : 'more items'}
                      </span>
                    )}
                  </div>

                  <div className="order-card-summary" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
                    <div>
                      <p style={{ fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 0.25rem' }}>{order.customer.name}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {order.items.length} {order.items.length === 1 ? t('item') : t('items')} • {t('cashOnDeliveryOnly')}
                      </p>
                    </div>
                    <div className="order-card-total" style={{ textAlign: 'end' }}>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('total')}</span>
                      <strong style={{ fontSize: '1.3rem', color: 'var(--accent)', fontWeight: 800 }}>
                        {formatCurrency(order.total)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="order-card-footer" style={{ padding: '1rem 1.5rem', background: '#FAFAFA', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {order.fulfillment === FULFILLMENT.PICKUP
                      ? (isArabic ? '📍 الاستلام من معرض الجعفر بأسوان' : '📍 Pickup at Al-Jafar Aswan Showroom')
                      : (isArabic ? `🚚 التوصيل إلى: ${order.address?.city || 'أسوان'}` : `🚚 Delivering to: ${order.address?.city || 'Aswan'}`)}
                  </span>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('order-details', { order })}
                    style={{ fontWeight: 700 }}
                  >
                    <span>{t('viewDetails')}</span>
                    <span aria-hidden="true">{isArabic ? '←' : '→'}</span>
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
