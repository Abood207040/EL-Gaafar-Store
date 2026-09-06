// src/pages/OrderSuccessPage.jsx
import { useState } from 'react';
import { useLocalization } from '../i18n/Localization.jsx';
import { STORE_INFO } from '../constants/store.js';
import { FULFILLMENT } from '../constants/domain.js';

export default function OrderSuccessPage({ navigate, order }) {
  const { t, isArabic, formatCurrency, translateFulfillment } = useLocalization();
  const [copied, setCopied] = useState(false);

  const orderNum = order?.orderNumber || '';
  const isPickup = order?.fulfillment === FULFILLMENT.PICKUP;

  const handleCopy = () => {
    if (!orderNum) return;
    navigator.clipboard?.writeText(String(orderNum));
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const whatsappMsg = encodeURIComponent(
    isArabic
      ? `مرحباً مؤسسة الجعفر للأدوات الصحية، أود الاستفسار عن طلبي رقم: #${orderNum}`
      : `Hello Al-Jafar Store, I would like to inquire about my order #${orderNum}`
  );

  return (
    <div className="order-success-page animate-fadeIn">
      <div className="order-success-container">
        {/* Main Success Card */}
        <div className="order-success-card">
          <div className="success-icon-badge" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="42" height="42" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          </div>

          <div className="success-header">
            <span className="success-eyebrow">
              {isArabic ? 'تهانينا! تم تسجيل طلبك' : 'Congratulations! Order Placed'}
            </span>
            <h1>{t('orderPlacedTitle')}</h1>
            <p className="success-msg">
              {t('orderPlacedMessage')}
            </p>
          </div>

          {orderNum && (
            <div className="order-number-banner">
              <div className="order-number-info">
                <span className="order-number-label">
                  {isArabic ? 'رقم الطلب للرجوع إليه:' : 'Your Order Reference Number:'}
                </span>
                <span className="order-number-val">#{orderNum}</span>
              </div>
              <button
                type="button"
                className={`order-copy-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title={isArabic ? 'نسخ رقم الطلب' : 'Copy order number'}
              >
                {copied ? (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                    <span>{isArabic ? 'تم النسخ!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                    </svg>
                    <span>{isArabic ? 'نسخ الرقم' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Quick Order Breakdown Recap */}
          {order && (
            <div className="success-recap-grid">
              <div className="recap-item">
                <span className="recap-label">{isArabic ? 'طريقة الاستلام' : 'Fulfillment'}</span>
                <span className="recap-val highlight">
                  {isPickup ? (
                    <>🏪 {translateFulfillment ? translateFulfillment(FULFILLMENT.PICKUP) : 'استلام من المعرض'}</>
                  ) : (
                    <>🚚 {translateFulfillment ? translateFulfillment(FULFILLMENT.DELIVERY) : 'توصيل لباب المنزل'}</>
                  )}
                </span>
              </div>

              {order.total !== undefined && (
                <div className="recap-item">
                  <span className="recap-label">{isArabic ? 'إجمالي الفاتورة' : 'Total Amount'}</span>
                  <span className="recap-val price-val">
                    {formatCurrency(order.total)}
                  </span>
                </div>
              )}

              <div className="recap-item">
                <span className="recap-label">{isArabic ? 'طريقة الدفع' : 'Payment Method'}</span>
                <span className="recap-val">
                  💵 {isArabic ? 'الدفع نقداً عند المعاينة والاستلام' : 'Cash On Delivery / Inspection'}
                </span>
              </div>

              {order.customer?.phone && (
                <div className="recap-item">
                  <span className="recap-label">{isArabic ? 'هاتف العميل للتأكيد' : 'Contact Phone'}</span>
                  <span className="recap-val ltr-num" dir="ltr">{order.customer.phone}</span>
                </div>
              )}
            </div>
          )}

          {/* Next Steps Visual Timeline */}
          <div className="success-next-steps">
            <h3 className="steps-title">
              {isArabic ? 'ماذا سيحدث بعد ذلك؟' : 'What Happens Next?'}
            </h3>
            <div className="steps-flow">
              <div className="flow-step">
                <div className="flow-num">1</div>
                <div className="flow-content">
                  <h4>{isArabic ? 'اتصال التأكيد الهاتفي' : 'Order Verification'}</h4>
                  <p>{isArabic ? 'سيتصل بك فريق المتجر هاتفياً لمراجعة الطلب وعنوان الاستلام والتوقيت المناسب.' : 'Our Aswan branch will call you shortly to confirm order details and timing.'}</p>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-num">2</div>
                <div className="flow-content">
                  <h4>{isArabic ? 'تجهيز وتغليف الطلب' : 'Order Preparation'}</h4>
                  <p>{isArabic ? 'يتم فحص وتغليف الأدوات الصحية بأمان من مستودعاتنا في أسوان.' : 'Your plumbing items are inspected and safely packaged at our warehouse.'}</p>
                </div>
              </div>

              <div className="flow-step">
                <div className="flow-num">3</div>
                <div className="flow-content">
                  <h4>{isArabic ? 'المعاينة والدفع عند الاستلام' : 'Inspection & Payment'}</h4>
                  <p>
                    {isPickup
                      ? (isArabic ? 'تفضل بزيارة معرضنا في أسوان، عاين بضاعتك وادفع نقدياً.' : 'Visit our Aswan showroom, inspect your items, and pay cash upon pickup.')
                      : (isArabic ? 'يصل مندوبنا لباب بيتك، يحق لك معاينة كافة القطع قبل دفع أي مبلغ.' : 'Our courier arrives at your door; inspect every item before paying COD.')}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Direct WhatsApp Contact Bar */}
          <div className="success-whatsapp-card">
            <div className="wa-icon">💬</div>
            <div className="wa-text">
              <h4>{isArabic ? 'هل ترغب بمتابعة طلبك فورياً عبر واتساب؟' : 'Need instant support on WhatsApp?'}</h4>
              <p>{isArabic ? 'فريق خدمة عملاء الجعفر بأسوان متاح للرد على استفساراتك' : 'Our Aswan customer support is ready to assist you anytime.'}</p>
            </div>
            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}?text=${whatsappMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-wa"
            >
              <span>{isArabic ? 'محادثة واتساب' : 'Chat WhatsApp'}</span>
            </a>
          </div>

          {/* Action Buttons */}
          <div className="success-actions">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('my-orders', { lookup: order?.customer?.phone || order?.customer?.email || '' })}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 17H5a2 2 0 0 0-2 2 2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm12-2h-4a2 2 0 0 0-2 2 2 2 0 0 0 2 2h4a2 2 0 0 0 2-2zm-6-8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v3m10 0H2m12 0h8v8h-8z" />
              </svg>
              <span>{t('viewMyOrders')}</span>
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('shop')}>
              <span>{t('continueShopping')}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
