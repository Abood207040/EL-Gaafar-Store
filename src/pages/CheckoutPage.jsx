// src/pages/CheckoutPage.jsx
import { useState } from 'react';
import { FULFILLMENT, STORE_INFO } from '../data/orders.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useLocalization } from '../i18n/Localization.jsx';

const DELIVERY_FEE = 25.0;

export default function CheckoutPage({ cartItems, navigate, onPlaceOrder, initialFulfillment }) {
  const {
    t,
    isArabic,
    productName,
    translateFulfillment,
  } = useLocalization();
  const [step, setStep] = useState(0);
  const [fulfillment, setFulfillment] = useState(initialFulfillment || FULFILLMENT.DELIVERY);
  const [form, setForm] = useState({
    fullName: '', phone: '', email: '',
    street: '', city: '', area: '', notes: '',
  });

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const deliveryFee = fulfillment === FULFILLMENT.DELIVERY ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;
  const steps = [t('customerInformation'), t('deliveryOrPickup'), t('cashOnDelivery')];

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

  const deliveryAddressComplete = Boolean(
    form.city.trim() && form.area.trim() && form.street.trim()
  );

  const handleConfirm = () => {
    if (onPlaceOrder) onPlaceOrder();
    navigate('order-success');
  };

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <EmptyState
          icon="🧾"
          title={t('checkoutNeedsItems')}
          description={t('addProductsBeforeCheckout')}
          actionLabel={t('browseProducts')}
          onAction={() => navigate('shop')}
        />
      </div>
    );
  }

  return (
    <div className="checkout-page animate-fadeIn">
      <div className="container">
        <div className="section-header checkout-heading">
          <div>
            <h1 className="section-title">{t('checkout')}</h1>
            <p className="section-subtitle">{t('checkoutSubtitle')}</p>
          </div>
          <span className="badge badge-dark">{t('codOnly')}</span>
        </div>

        <div className="checkout-layout">
          {/* Left: Steps */}
          <div className="checkout-main">
            {/* Step Indicators */}
            <div className="step-indicator" role="list" aria-label="Checkout steps">
              {steps.map((s, i) => (
                <div key={s} role="listitem" className={`step-item ${step === i ? 'active' : ''} ${step > i ? 'done' : ''}`}>
                  <div className="step-number" aria-hidden="true">
                    {step > i ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    ) : i + 1}
                  </div>
                  <span className="step-label">{s}</span>
                  {i < steps.length - 1 && <div className="step-connector" aria-hidden="true" />}
                </div>
              ))}
            </div>

            {/* Step 0: Customer Info */}
            {step === 0 && (
              <div className="card animate-fadeIn" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                  <h2 style={{ fontSize: '1rem' }}>{t('customerInformation')}</h2>
                </div>
                <div className="card-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="full-name" className="form-label">{t('fullName')} <span aria-hidden="true">*</span></label>
                      <input
                        id="full-name"
                        className="input"
                        type="text"
                        placeholder={isArabic ? 'مثال: محمد الجعفر' : 'e.g. Mohammed Al-Rashid'}
                        value={form.fullName}
                        onChange={set('fullName')}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone" className="form-label">{t('phoneNumber')} <span aria-hidden="true">*</span></label>
                      <input
                        id="phone"
                        className="input"
                        type="tel"
                        placeholder="+966 5X XXX XXXX"
                        value={form.phone}
                        onChange={set('phone')}
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">{t('email')} <span className="form-hint-inline">({t('optional')})</span></label>
                    <input
                      id="email"
                      className="input"
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={set('email')}
                    />
                  </div>
                </div>
                <div className="card-footer">
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep(1)}
                    disabled={!form.fullName.trim() || !form.phone.trim()}
                  >
                    {t('continue')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 1: Delivery or Pickup */}
            {step === 1 && (
              <div className="card animate-fadeIn" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                  <h2 style={{ fontSize: '1rem' }}>{t('deliveryOrPickup')}</h2>
                </div>
                <div className="card-body">
                  {/* Fulfillment Selector */}
                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <p className="form-label">{t('receiveQuestion')}</p>
                    <div className="fulfillment-options">
                      {Object.values(FULFILLMENT).map(opt => (
                        <label key={opt} className={`fulfillment-option ${fulfillment === opt ? 'selected' : ''}`}>
                          <input
                            type="radio"
                            name="fulfillment"
                            value={opt}
                            checked={fulfillment === opt}
                            onChange={() => setFulfillment(opt)}
                          />
                          <div className="fulfillment-icon" aria-hidden="true">
                            {opt === FULFILLMENT.DELIVERY ? (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                            ) : (
                              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                            )}
                          </div>
                          <div>
                            <strong>{translateFulfillment(opt)}</strong>
                            <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                              {opt === FULFILLMENT.DELIVERY
                                ? t('deliveryHint')
                                : t('pickupHint')
                              }
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Delivery Fields */}
                  {fulfillment === FULFILLMENT.DELIVERY && (
                    <div className="animate-fadeIn">
                      <p className="checkout-method-note">
                        {t('deliveryRequiresAddress')}
                      </p>
                      <div className="form-row">
                        <div className="form-group">
                          <label htmlFor="city" className="form-label">{t('city')} <span aria-hidden="true">*</span></label>
                          <input id="city" className="input" placeholder={isArabic ? 'مثال: الرياض' : 'e.g. Riyadh'} value={form.city} onChange={set('city')} required />
                        </div>
                        <div className="form-group">
                          <label htmlFor="area" className="form-label">{t('areaDistrict')} <span aria-hidden="true">*</span></label>
                          <input id="area" className="input" placeholder={isArabic ? 'مثال: حي الملز' : 'e.g. Al-Malaz'} value={form.area} onChange={set('area')} required />
                        </div>
                      </div>
                      <div className="form-group">
                        <label htmlFor="street" className="form-label">{t('streetAddress')} <span aria-hidden="true">*</span></label>
                        <input id="street" className="input" placeholder={isArabic ? 'رقم المبنى واسم الشارع' : 'Building No., Street Name'} value={form.street} onChange={set('street')} required />
                      </div>
                      <div className="form-group">
                        <label htmlFor="notes" className="form-label">{t('deliveryNotes')} <span className="form-hint-inline">({t('optional')})</span></label>
                        <textarea id="notes" className="textarea" placeholder={isArabic ? 'اتصل قبل التوصيل، اترك الطلب عند الاستقبال...' : 'Leave at reception, call before delivery, etc.'} value={form.notes} onChange={set('notes')} />
                      </div>
                    </div>
                  )}

                  {/* Pickup Info */}
                  {fulfillment === FULFILLMENT.PICKUP && (
                    <div className="pickup-info-card animate-fadeIn">
                      <div className="pickup-info-icon" aria-hidden="true">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l1.5-5h15L21 9"/><path d="M5 9v10h14V9"/><path d="M9 19v-6h6v6"/><path d="M3 9h18"/></svg>
                      </div>
                      <h3>{STORE_INFO.name}</h3>
                      <p className="pickup-info-ar arabic-text" lang="ar" dir="rtl">{STORE_INFO.nameAr}</p>
                      <div className="pickup-details">
                        <div className="pickup-row">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          {STORE_INFO.address}
                        </div>
                        <div className="pickup-row">
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          {STORE_INFO.phone}
                        </div>
                        <div className="pickup-row" style={{ whiteSpace: 'pre-line' }}>
                          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {STORE_INFO.hours}
                        </div>
                      </div>
                      <p className="pickup-note">
                        {t('pickupReadyPhone', form.phone)}
                      </p>
                    </div>
                  )}
                </div>
                <div className="card-footer" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" onClick={() => setStep(0)}>{t('back')}</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep(2)}
                    disabled={
                      fulfillment === FULFILLMENT.DELIVERY &&
                      !deliveryAddressComplete
                    }
                  >
                    {t('continue')}
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Payment */}
            {step === 2 && (
              <div className="card animate-fadeIn" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                  <h2 style={{ fontSize: '1rem' }}>{t('cashOnDelivery')}</h2>
                </div>
                <div className="card-body">
                  <div className="payment-method-card selected">
                    <div className="payment-icon" aria-hidden="true">SAR</div>
                    <div>
                      <strong>{t('cashOnDeliveryOnly')}</strong>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                        {t('payCashDescription')}
                      </p>
                    </div>
                    <span className="badge badge-success" style={{ marginInlineStart: 'auto', flexShrink: 0 }}>{t('selected')}</span>
                  </div>
                  <p className="payment-note" style={{ marginTop: '1rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {t('codOnlyLong')}
                  </p>
                </div>
                <div className="card-footer" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" onClick={() => setStep(1)}>{t('back')}</button>
                  <button
                    className="btn btn-success btn-lg"
                    onClick={handleConfirm}
                    style={{ flex: 1 }}
                  >
                    {t('confirmOrder')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Right: Order Manifest */}
          <aside className="checkout-summary" aria-label={t('orderSummary')}>
            <div className="card" style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1rem)' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('orderSummary')}</h2>
              </div>
              <div className="card-body">
                <div className="manifest-items">
                  {cartItems.map(item => (
                    <div key={item.product.id} className="manifest-item">
                      <div className="manifest-img">
                        <img src={item.product.image} alt={productName(item.product)} />
                        <span className="manifest-qty" aria-label={`Quantity: ${item.qty}`}>{item.qty}</span>
                      </div>
                      <div className="manifest-info">
                        <p className="manifest-name">{productName(item.product)}</p>
                        <p className="manifest-sku">{item.product.sku}</p>
                      </div>
                      <span className="manifest-price">SAR {(item.product.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <hr className="divider" />
                <div className="summary-rows">
                  <div className="summary-row">
                    <span>{t('subtotal')}</span>
                    <span>SAR {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{fulfillment === FULFILLMENT.DELIVERY ? t('deliveryFee') : t('pickupFromShop')}</span>
                    <span>
                      {fulfillment === FULFILLMENT.DELIVERY
                        ? `SAR ${deliveryFee.toFixed(2)}`
                        : t('free')
                      }
                    </span>
                  </div>
                  <hr className="divider" />
                  <div className="summary-row summary-total">
                    <strong>{t('totalInclVat')}</strong>
                    <strong>SAR {total.toFixed(2)}</strong>
                  </div>
                </div>
                <div className="payment-note" style={{ marginTop: '1rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
                  {t('cashOnDeliveryOnly')}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
