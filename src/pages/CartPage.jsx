// src/pages/CartPage.jsx
import { useState, useEffect } from 'react';
import EmptyState from '../components/ui/EmptyState.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import { StockBadge } from '../components/ui/StatusBadge.jsx';
import { FULFILLMENT, getDominantDeliveryClass } from '../constants/domain.js';
import { useLocalization } from '../i18n/Localization.jsx';

export default function CartPage({ cartItems, onUpdateQty, onRemove, navigate }) {
  const { t, isArabic, productName, productAltName } = useLocalization();

  const hasUndeliverableItems = cartItems.some((item) => item.product.isDeliveryAvailable === false);
  const dominantClass = getDominantDeliveryClass(cartItems);

  const [fulfillment, setFulfillment] = useState(() =>
    hasUndeliverableItems ? FULFILLMENT.PICKUP : FULFILLMENT.DELIVERY
  );

  useEffect(() => {
    if (hasUndeliverableItems && fulfillment === FULFILLMENT.DELIVERY) {
      setFulfillment(FULFILLMENT.PICKUP);
    }
  }, [hasUndeliverableItems, fulfillment]);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const isSpecial = dominantClass?.code === 'special';

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <EmptyState
          icon="..."
          title={t('emptyCartTitle')}
          description={t('emptyCartDescription')}
          actionLabel={t('browseProducts')}
          onAction={() => navigate('shop')}
        />
      </div>
    );
  }

  return (
    <div className="cart-page animate-fadeIn" style={{ paddingTop: '2rem', paddingBottom: '5rem' }}>
      <div className="container">
        <div className="section-header">
          <div>
            <h1 className="section-title">{t('shoppingCart')}</h1>
            <p className="section-subtitle">
              {cartItems.length} {cartItems.length === 1 ? t('item') : t('items')} {isArabic ? 'في سلة مشترياتك' : 'in your cart'}
            </p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('shop')}>
            ← {t('continueShopping')}
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            {/* Desktop Table View */}
            <div className="card cart-table-card">
              <div className="table-wrapper">
                <table className="table cart-table">
                  <thead>
                    <tr>
                      <th>{t('product')}</th>
                      <th>SKU</th>
                      <th>{t('status')}</th>
                      <th>{t('unitPrice')}</th>
                      <th>{t('quantity')}</th>
                      <th>{t('subtotal')}</th>
                      <th aria-label="Remove" />
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => (
                      <tr key={item.product.id} className="cart-row">
                        <td>
                          <div className="cart-product">
                            <div className="cart-product-img" onClick={() => navigate('product-details', { id: item.product.id })}>
                              <img src={item.product.image} alt={productName(item.product)} onError={(e) => { e.target.src = '/images/transparentlogo.png'; }} />
                            </div>
                            <div>
                              <button 
                                className="cart-product-title-btn"
                                onClick={() => navigate('product-details', { id: item.product.id })}
                              >
                                {productName(item.product)}
                              </button>
                              <p className="cart-product-name-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'}>
                                {productAltName(item.product)}
                              </p>
                              <span className="cart-item-brand">{item.product.brand}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="sku-text">{item.product.sku}</span>
                        </td>
                        <td>
                          <StockBadge status={item.product.stockStatus} />
                        </td>
                        <td>
                          <span className="price-tag">{isArabic ? `${Number(item.product.price).toFixed(0)} ج.م` : `EGP ${item.product.price.toFixed(2)}`}</span>
                        </td>
                        <td>
                          <QuantityStepper
                            value={item.qty}
                            onChange={(qty) => onUpdateQty(item.product.id, qty)}
                            max={item.product.stock}
                            onLimitReached={(maxVal) => {
                              const msg = isArabic 
                                ? `الحد الأقصى المتاح هو ${maxVal}. إذا كنت بحاجة إلى المزيد، يرجى التواصل معنا عبر واتساب.`
                                : `The maximum available is ${maxVal}. If you need more, please contact us on WhatsApp.`;
                              window.alert(msg);
                            }}
                          />
                        </td>
                        <td>
                          <span className="price-tag strong">
                            {isArabic ? `${Number(item.product.price * item.qty).toFixed(0)} ج.م` : `EGP ${(item.product.price * item.qty).toFixed(2)}`}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-icon cart-remove-btn"
                            onClick={() => onRemove(item.product.id)}
                            aria-label={`${t('removeItem')} ${productName(item.product)}`}
                            title={t('removeItem')}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View (shown below 768px) */}
            <div className="cart-mobile-list">
              {cartItems.map((item) => (
                <div key={item.product.id} className="cart-mobile-card card animate-fadeIn">
                  <div className="cart-mobile-card-top">
                    <img 
                      src={item.product.image} 
                      alt={productName(item.product)} 
                      className="cart-mobile-img"
                      onError={(e) => { e.target.src = '/images/transparentlogo.png'; }}
                    />
                    <div className="cart-mobile-info">
                      <div className="cart-mobile-header">
                        <strong className="cart-mobile-title">{productName(item.product)}</strong>
                        <button
                          className="cart-mobile-remove"
                          onClick={() => onRemove(item.product.id)}
                          aria-label={t('removeItem')}
                        >
                          ✕
                        </button>
                      </div>
                      <p className="cart-product-name-ar arabic-text">{productAltName(item.product)}</p>
                      <div className="cart-mobile-meta">
                        <span className="cart-item-brand">{item.product.brand}</span>
                        <span className="sku-text">{item.product.sku}</span>
                      </div>
                    </div>
                  </div>

                  <div className="cart-mobile-card-bottom">
                    <QuantityStepper
                      value={item.qty}
                      onChange={(qty) => onUpdateQty(item.product.id, qty)}
                      max={item.product.stock}
                    />
                    <div className="cart-mobile-price">
                      <span className="cart-mobile-price-lbl">{t('subtotal')}:</span>
                      <strong>
                        {isArabic ? `${Number(item.product.price * item.qty).toFixed(0)} ج.م` : `EGP ${(item.product.price * item.qty).toFixed(2)}`}
                      </strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="cart-summary" aria-label="Order summary">
            <div className="card cart-summary-card">
              <div className="card-header">
                <h2 style={{ fontSize: '1.1rem', margin: 0 }}>{t('orderSummary')}</h2>
              </div>
              <div className="card-body">
                {/* Fulfillment Selection */}
                {hasUndeliverableItems && (
                  <div style={{ padding: '0.75rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', fontSize: '0.82rem', marginBottom: '1rem', lineHeight: 1.4 }}>
                    ⚠️ <strong>{isArabic ? 'تنبيه استلام من المعرض فقط:' : 'Showroom Pickup Only:'}</strong><br />
                    {isArabic ? 'توجد منتجات في السلة مخصصة للاستلام من المعرض فقط ولا تدعم خدمة التوصيل.' : 'Some items in your cart are available for showroom pickup only and cannot be delivered.'}
                  </div>
                )}

                <div className="fulfillment-options" role="group" aria-label="Fulfillment method">
                  <p className="form-label" style={{ marginBottom: '0.65rem', fontWeight: 700 }}>
                    {isArabic ? 'طريقة الاستلام والتوصيل' : t('deliveryOrPickup')}
                  </p>
                  {Object.values(FULFILLMENT).map((option) => {
                    const isDeliveryOption = option === FULFILLMENT.DELIVERY;
                    const isDisabled = isDeliveryOption && hasUndeliverableItems;

                    return (
                      <label
                        key={option}
                        className={`fulfillment-option ${fulfillment === option ? 'selected' : ''}`}
                        style={isDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      >
                        <input
                          type="radio"
                          name="fulfillment-cart"
                          value={option}
                          disabled={isDisabled}
                          checked={fulfillment === option}
                          onChange={() => !isDisabled && setFulfillment(option)}
                        />
                        <div className="fulfillment-icon" aria-hidden="true">
                          {isDeliveryOption ? (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                          ) : (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                          )}
                        </div>
                        <div className="fulfillment-text">
                          <strong>{isDeliveryOption ? (isArabic ? 'شحن وتوصيل للعميل' : 'Customer Delivery') : (isArabic ? 'استلام من معرضنا' : 'Showroom Pickup')}</strong>
                          <p style={{ fontSize: '0.78rem', color: 'var(--muted)', margin: 0 }}>
                            {isDeliveryOption
                              ? (isArabic ? 'توصيل جغرافي حسب المحافظة والمنطقة' : 'Calculated by governorate & area')
                              : (isArabic ? 'استلام فوري مجاني ومعاينة بالمعرض' : t('pickupHint'))}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {fulfillment === FULFILLMENT.DELIVERY && (
                  <div style={{ padding: '0.65rem 0.85rem', background: 'var(--bg-subtle, #f8fafc)', borderRadius: '6px', marginTop: '0.75rem', fontSize: '0.82rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--muted)' }}>{isArabic ? 'فئة شحن السلة السائدة:' : 'Dominant Delivery Class:'}</span>
                    <strong style={{ color: 'var(--primary)' }}>
                      {isArabic ? dominantClass.nameAr : dominantClass.nameEn}
                    </strong>
                  </div>
                )}

                <hr className="divider" />

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>{t('subtotal')}</span>
                    <strong>{isArabic ? `${Number(subtotal).toFixed(0)} ج.م` : `EGP ${subtotal.toFixed(2)}`}</strong>
                  </div>

                  <div className="summary-row">
                    <span>{fulfillment === FULFILLMENT.DELIVERY ? (isArabic ? 'رسوم التوصيل' : t('deliveryFee')) : (isArabic ? 'الاستلام من المعرض' : t('pickupFromShop'))}</span>
                    <span>
                      {fulfillment === FULFILLMENT.DELIVERY ? (
                        isSpecial ? (
                          <span style={{ color: '#D97706', fontWeight: 600, fontSize: '0.82rem' }}>
                            {isArabic ? 'سيتم تأكيدها من فريقنا' : 'To be confirmed by team'}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>
                            {isArabic ? 'تُحسب بالخطوة التالية' : 'Calculated at checkout'}
                          </span>
                        )
                      ) : (
                        <strong style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{isArabic ? 'مجاناً' : t('freePickup')}</strong>
                      )}
                    </span>
                  </div>

                  <div className="summary-row">
                    <span>{isArabic ? 'ضريبة القيمة المضافة' : 'VAT (15%)'}</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>{t('vatIncluded')}</span>
                  </div>
                  
                  <hr className="divider" />
                  
                  <div className="summary-row summary-total">
                    <strong>{isSpecial && fulfillment === FULFILLMENT.DELIVERY ? (isArabic ? 'الإجمالي المبدئي' : 'Provisional Total') : t('total')}</strong>
                    <strong style={{ color: 'var(--accent)', fontSize: '1.45rem' }}>
                      {isArabic ? `${Number(subtotal).toFixed(0)} ج.م` : `EGP ${subtotal.toFixed(2)}`}
                    </strong>
                  </div>

                  {isSpecial && fulfillment === FULFILLMENT.DELIVERY && (
                    <p style={{ fontSize: '0.75rem', color: '#D97706', margin: '0.35rem 0 0 0', lineHeight: 1.3 }}>
                      ℹ️ {isArabic
                        ? 'المبلغ الإجمالي أعلاه لا يشمل رسوم التوصيل لفئة الشحن الخاصة (Special). سيتم تأكيد القيمة الإجمالية النهائية بعد مراجعة فريق العمل.'
                        : 'Total above excludes delivery fee for Special delivery class. Final total will be confirmed by our team.'}
                    </p>
                  )}
                </div>

                <div className="payment-note" style={{ marginTop: '1rem' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                  <span>{isArabic ? 'الدفع نقداً عند الاستلام والمعاينة' : t('cashOnDeliveryOnly')}</span>
                </div>

                <button
                  className="btn btn-primary w-full btn-lg"
                  onClick={() => navigate('checkout', { fulfillment })}
                  style={{ marginTop: '1.25rem', height: '52px', fontSize: '1.05rem', fontWeight: 800 }}
                >
                  <span>{t('proceedCheckout')}</span>
                  <span style={{ margin: '0 0.5rem' }}>→</span>
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
