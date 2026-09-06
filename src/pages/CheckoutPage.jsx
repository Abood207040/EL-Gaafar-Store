// src/pages/CheckoutPage.jsx
import { useState, useEffect, useMemo } from 'react';
import { FULFILLMENT, PAYMENT_METHODS, getDominantDeliveryClass } from '../constants/domain.js';
import { STORE_INFO } from '../constants/store.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import { useLocalization } from '../i18n/Localization.jsx';
import { createOrder } from '../services/ordersService.js';
import { getGovernorates, getAreasByGovernorate, resolveCheckoutDeliveryRate } from '../services/deliveryService.js';
import { useLocation } from 'react-router-dom';

export default function CheckoutPage({ cartItems, navigate, onPlaceOrder, initialFulfillment }) {
  const { state } = useLocation();
  const { t, isArabic, productName, translateFulfillment, parseRpcError } = useLocalization();

  const dominantClass = useMemo(() => getDominantDeliveryClass(cartItems), [cartItems]);
  const hasUndeliverableItems = useMemo(
    () => cartItems.some((item) => item.product.isDeliveryAvailable === false),
    [cartItems]
  );

  const [step, setStep] = useState(0);
  const [fulfillment, setFulfillment] = useState(() =>
    hasUndeliverableItems ? FULFILLMENT.PICKUP : initialFulfillment || state?.fulfillment || FULFILLMENT.DELIVERY
  );

  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    street: '',
    notes: '',
  });

  // Geographic selection state
  const [governorates, setGovernorates] = useState([]);
  const [selectedGovId, setSelectedGovId] = useState('');
  const [areas, setAreas] = useState([]);
  const [selectedAreaId, setSelectedAreaId] = useState('');

  // Rate resolution state
  const [loadingRate, setLoadingRate] = useState(false);
  const [rateResult, setRateResult] = useState({
    available: false,
    price: 0,
    requiresManualQuote: false,
    messageKey: '',
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load active governorates
  useEffect(() => {
    let ignore = false;
    getGovernorates(false)
      .then((data) => {
        if (!ignore) {
          setGovernorates(data);
          if (data.length > 0 && !selectedGovId) {
            setSelectedGovId(data[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load governorates:', err));
    return () => {
      ignore = true;
    };
  }, []);

  // Load active areas when governorate changes
  useEffect(() => {
    if (!selectedGovId) {
      setAreas([]);
      setSelectedAreaId('');
      setRateResult({ available: false, price: 0, requiresManualQuote: false, messageKey: '' });
      return;
    }

    let ignore = false;
    getAreasByGovernorate(selectedGovId, false)
      .then((data) => {
        if (!ignore) {
          setAreas(data);
          if (data.length > 0) {
            setSelectedAreaId(data[0].id);
          } else {
            setSelectedAreaId('');
            setRateResult({ available: false, price: 0, requiresManualQuote: false, messageKey: 'DELIVERY_NOT_AVAILABLE' });
          }
        }
      })
      .catch((err) => console.error('Failed to load areas:', err));

    return () => {
      ignore = true;
    };
  }, [selectedGovId]);

  // Resolve delivery rate when area or governorate changes
  useEffect(() => {
    if (fulfillment !== FULFILLMENT.DELIVERY || !selectedGovId || !selectedAreaId) {
      setRateResult({ available: false, price: 0, requiresManualQuote: false, messageKey: '' });
      return;
    }

    let ignore = false;
    setLoadingRate(true);
    resolveCheckoutDeliveryRate(selectedGovId, selectedAreaId, dominantClass.code)
      .then((res) => {
        if (!ignore) {
          setRateResult(res);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error('Rate resolution error:', err);
          setRateResult({ available: false, price: 0, requiresManualQuote: false, messageKey: 'DELIVERY_NOT_AVAILABLE' });
        }
      })
      .finally(() => {
        if (!ignore) setLoadingRate(false);
      });

    return () => {
      ignore = true;
    };
  }, [fulfillment, selectedGovId, selectedAreaId, dominantClass.code]);

  // Selected object helpers
  const selectedGov = useMemo(() => governorates.find((g) => g.id === selectedGovId), [governorates, selectedGovId]);
  const selectedArea = useMemo(() => areas.find((a) => a.id === selectedAreaId), [areas, selectedAreaId]);

  // Calculations
  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const isDelivery = fulfillment === FULFILLMENT.DELIVERY;
  const isSpecial = dominantClass?.code === 'special' || rateResult.requiresManualQuote;
  const deliveryFee = isDelivery ? (isSpecial ? 0 : rateResult.price) : 0;
  const total = isSpecial ? subtotal : subtotal + deliveryFee;

  const steps = [t('customerInformation'), t('deliveryOrPickup'), t('cashOnDelivery')];
  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  // Validation
  const deliveryAddressComplete = Boolean(
    selectedGovId &&
    selectedAreaId &&
    form.street.trim() &&
    rateResult.available
  );

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitError('');
    setSubmitting(true);

    try {
      const order = await createOrder(
        {
          customer: {
            fullName: form.fullName.trim(),
            phone: form.phone.trim(),
            email: form.email.trim() || null,
            city: selectedGov ? selectedGov.nameEn : '',
            area: selectedArea ? selectedArea.nameEn : '',
            address: form.street.trim(),
          },
          fulfillmentType: fulfillment,
          governorateId: isDelivery ? selectedGovId : null,
          areaId: isDelivery ? selectedAreaId : null,
          city: isDelivery && selectedGov ? selectedGov.nameEn : null,
          area: isDelivery && selectedArea ? selectedArea.nameEn : null,
          streetAddress: isDelivery ? form.street.trim() : null,
          notes: form.notes.trim() || null,
          subtotal,
          logisticsFee: deliveryFee,
          tax: 0,
          total,
          paymentMethod: PAYMENT_METHODS.COD,
        },
        cartItems
      );

      if (onPlaceOrder) onPlaceOrder(order);
      navigate('order-success', { order });
    } catch (error) {
      setSubmitError(parseRpcError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <EmptyState
          icon="..."
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
          <div className="checkout-main">
            {/* Step Indicator */}
            <div className="step-indicator" role="list" aria-label="Checkout steps">
              {steps.map((label, index) => (
                <div key={label} role="listitem" className={`step-item ${step === index ? 'active' : ''} ${step > index ? 'done' : ''}`}>
                  <div className="step-number" aria-hidden="true">
                    {step > index ? (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                    ) : index + 1}
                  </div>
                  <span className="step-label">{label}</span>
                  {index < steps.length - 1 && <div className="step-connector" aria-hidden="true" />}
                </div>
              ))}
            </div>

            {/* STEP 0: CUSTOMER INFORMATION */}
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
                        placeholder={isArabic ? 'مثال: محمد الجعفر' : 'e.g. Mohammed Al-Jafar'}
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
                        placeholder="+20 10X XXX XXXX"
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
                      placeholder="name@email.com"
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

            {/* STEP 1: FULFILLMENT & GEOGRAPHIC DELIVERY */}
            {step === 1 && (
              <div className="card animate-fadeIn" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                  <h2 style={{ fontSize: '1rem' }}>{t('deliveryOrPickup')}</h2>
                </div>
                <div className="card-body">
                  {hasUndeliverableItems && (
                    <div style={{ padding: '0.75rem 1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                      ⚠️ <strong>{isArabic ? 'تنبيه استلام من المعرض فقط:' : 'Showroom Pickup Only:'}</strong><br />
                      {isArabic
                        ? 'توجد منتجات في السلة مخصصة للاستلام من المعرض فقط ولا تدعم التوصيل.'
                        : 'Your cart contains items that are available for showroom pickup only.'}
                    </div>
                  )}

                  <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                    <p className="form-label">{t('receiveQuestion')}</p>
                    <div className="fulfillment-options">
                      {Object.values(FULFILLMENT).map((option) => {
                        const isDeliveryOpt = option === FULFILLMENT.DELIVERY;
                        const isOptDisabled = isDeliveryOpt && hasUndeliverableItems;

                        return (
                          <label
                            key={option}
                            className={`fulfillment-option ${fulfillment === option ? 'selected' : ''}`}
                            style={isOptDisabled ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                          >
                            <input
                              type="radio"
                              name="fulfillment"
                              value={option}
                              disabled={isOptDisabled}
                              checked={fulfillment === option}
                              onChange={() => !isOptDisabled && setFulfillment(option)}
                            />
                            <div className="fulfillment-icon" aria-hidden="true">
                              {isDeliveryOpt ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                              ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                              )}
                            </div>
                            <div>
                              <strong>{translateFulfillment(option)}</strong>
                              <p style={{ fontSize: '0.8125rem', color: 'var(--muted)', marginTop: '0.1rem' }}>
                                {isDeliveryOpt
                                  ? (isArabic ? 'توصيل حسب المحافظة والمنطقة وفئة الشحن' : 'Delivery calculated by area & delivery class')
                                  : (isArabic ? 'استلام مجاني ومعاينة بالمعرض' : t('pickupHint'))}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* DELIVERY SECTION */}
                  {fulfillment === FULFILLMENT.DELIVERY && (
                    <div className="animate-fadeIn">
                      <div className="form-row">
                        {/* Governorate Select */}
                        <div className="form-group">
                          <label htmlFor="govSelect" className="form-label">
                            {isArabic ? 'المحافظة' : 'Governorate'} <span aria-hidden="true">*</span>
                          </label>
                          <select
                            id="govSelect"
                            className="input"
                            value={selectedGovId}
                            onChange={(e) => setSelectedGovId(e.target.value)}
                            required
                          >
                            {governorates.length === 0 ? (
                              <option value="">{isArabic ? 'لا توجد محافظات متاحة حالياً' : 'No active governorates'}</option>
                            ) : (
                              governorates.map((g) => (
                                <option key={g.id} value={g.id}>
                                  {isArabic ? g.nameAr : g.nameEn}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        {/* Area Select */}
                        <div className="form-group">
                          <label htmlFor="areaSelect" className="form-label">
                            {isArabic ? 'المنطقة / المركز' : 'Area / District'} <span aria-hidden="true">*</span>
                          </label>
                          <select
                            id="areaSelect"
                            className="input"
                            value={selectedAreaId}
                            onChange={(e) => setSelectedAreaId(e.target.value)}
                            disabled={!selectedGovId || areas.length === 0}
                            required
                          >
                            {areas.length === 0 ? (
                              <option value="">{isArabic ? 'لا توجد مناطق متاحة لهذه المحافظة' : 'No areas available'}</option>
                            ) : (
                              areas.map((a) => (
                                <option key={a.id} value={a.id}>
                                  {isArabic ? a.nameAr : a.nameEn}
                                </option>
                              ))
                            )}
                          </select>
                        </div>
                      </div>

                      {/* Delivery Rate Status Feedback */}
                      {selectedGovId && selectedAreaId && (
                        <div
                          style={{
                            padding: '1rem',
                            borderRadius: '8px',
                            background: loadingRate
                              ? 'var(--bg-subtle, #f8fafc)'
                              : rateResult.available
                              ? (isSpecial ? '#FFFBEB' : '#ECFDF5')
                              : '#FEF2F2',
                            border: `1px solid ${
                              loadingRate
                                ? 'var(--line)'
                                : rateResult.available
                                ? (isSpecial ? '#FDE68A' : '#A7F3D0')
                                : '#FECACA'
                            }`,
                            margin: '1rem 0',
                          }}
                        >
                          {loadingRate ? (
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--muted)' }}>
                              ⏳ {isArabic ? 'جاري حساب تكلفة التوصيل لمنطقتك...' : 'Calculating delivery fee for your area...'}
                            </p>
                          ) : !rateResult.available ? (
                            <div>
                              <strong style={{ color: '#991B1B', display: 'block' }}>
                                🚫 {isArabic ? 'التوصيل غير متاح حاليًا لهذه المنطقة.' : 'Delivery is not currently available for this area.'}
                              </strong>
                              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8rem', color: '#991B1B' }}>
                                {isArabic
                                  ? 'لم يتم تحديد تسعيرة توصيل لهذه المنطقة بعد. يمكنك اختيار الاستلام من المعرض أو التواصل مع فريقنا.'
                                  : 'No active delivery rate configured for this area. You may choose Showroom Pickup or contact support.'}
                              </p>
                            </div>
                          ) : isSpecial ? (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <strong>📦 {isArabic ? 'فئة التوصيل:' : 'Delivery Class:'} {isArabic ? dominantClass.nameAr : dominantClass.nameEn}</strong>
                                <span className="badge badge-warning">{isArabic ? 'عرض سعر يدوي' : 'Manual Quote'}</span>
                              </div>
                              <p style={{ margin: '0.4rem 0 0 0', fontSize: '0.85rem', color: '#92400E' }}>
                                🚚 {isArabic ? 'رسوم التوصيل: سيتم تأكيدها من فريقنا' : 'Delivery fee: To be confirmed by our team'}
                              </p>
                              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.78rem', color: '#B45309' }}>
                                {isArabic
                                  ? 'نظراً لاحتواء طلبك على منتجات ذات متطلبات شحن خاصة، سيقوم فريق خدمة العملاء بالتواصل معك لتأكيد الموعد ورسوم التوصيل.'
                                  : 'Because this order contains items requiring special handling, our team will contact you to confirm final logistics.'}
                              </p>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <span style={{ fontSize: '0.85rem', color: 'var(--muted)', display: 'block' }}>
                                  {isArabic ? 'فئة شحن الطلب:' : 'Cart Delivery Class:'} <strong>{isArabic ? dominantClass.nameAr : dominantClass.nameEn}</strong>
                                </span>
                                <strong style={{ fontSize: '1.05rem', color: '#065F46' }}>
                                  ✓ {isArabic ? `رسوم التوصيل: ${rateResult.price} ج.م` : `Delivery Fee: EGP ${rateResult.price.toFixed(2)}`}
                                </strong>
                              </div>
                              <span className="badge badge-success">{isArabic ? 'تسعير مؤكد' : 'Fixed Rate'}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Detailed Street Address */}
                      <div className="form-group">
                        <label htmlFor="street" className="form-label">{t('streetAddress')} <span aria-hidden="true">*</span></label>
                        <input
                          id="street"
                          className="input"
                          placeholder={isArabic ? 'اسم الشارع، رقم العمارة أو علامة مميزة' : 'Building number, street, or landmark'}
                          value={form.street}
                          onChange={set('street')}
                          required
                        />
                      </div>

                      {/* Delivery Notes */}
                      <div className="form-group">
                        <label htmlFor="notes" className="form-label">{t('deliveryNotes')} <span className="form-hint-inline">({t('optional')})</span></label>
                        <textarea
                          id="notes"
                          className="textarea"
                          placeholder={isArabic ? 'ملاحظات إضافية (موعد مفضل، تعليمات للمندوب)...' : 'Additional delivery notes or preferred time...'}
                          value={form.notes}
                          onChange={set('notes')}
                        />
                      </div>
                    </div>
                  )}

                  {/* SHOWROOM PICKUP SECTION */}
                  {fulfillment === FULFILLMENT.PICKUP && (
                    <div className="pickup-info-card animate-fadeIn">
                      <div className="pickup-info-icon" aria-hidden="true">
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l1.5-5h15L21 9" /><path d="M5 9v10h14V9" /><path d="M9 19v-6h6v6" /><path d="M3 9h18" /></svg>
                      </div>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.25rem' }}>{STORE_INFO.name}</h3>
                      <p className="pickup-info-ar arabic-text" lang="ar" dir="rtl" style={{ color: 'var(--accent)', fontWeight: 700, margin: '0 0 1rem' }}>
                        {STORE_INFO.nameAr}
                      </p>
                      <div className="pickup-details">
                        <div className="pickup-row">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span>{isArabic ? STORE_INFO.addressAr || STORE_INFO.address : STORE_INFO.address}</span>
                        </div>
                        <div className="pickup-row">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.44 2 2 0 0 1 3.59 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          <a href={`tel:${STORE_INFO.phone}`} style={{ color: 'inherit', textDecoration: 'none', fontWeight: 600 }}>
                            {STORE_INFO.phone}
                          </a>
                        </div>
                        <div className="pickup-row" style={{ whiteSpace: 'pre-line' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          <span>{isArabic ? STORE_INFO.hoursAr || STORE_INFO.hours : STORE_INFO.hours}</span>
                        </div>
                      </div>

                      <div style={{ marginTop: '1.25rem' }}>
                        <a
                          href={STORE_INFO.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-outline btn-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>
                          <span>{isArabic ? 'فتح موقع المعرض على الخريطة' : 'Open in Google Maps'}</span>
                        </a>
                      </div>

                      <p className="pickup-note" style={{ marginTop: '1rem' }}>
                        {t('pickupReadyPhone', form.phone || (isArabic ? 'رقم هاتفك' : 'your phone'))}
                      </p>
                    </div>
                  )}
                </div>

                <div className="card-footer" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" onClick={() => setStep(0)}>{t('back')}</button>
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep(2)}
                    disabled={isDelivery && !deliveryAddressComplete}
                  >
                    {t('continue')}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: REVIEW & CONFIRM (CASH ON DELIVERY) */}
            {step === 2 && (
              <div className="card animate-fadeIn" style={{ marginTop: '1.5rem' }}>
                <div className="card-header">
                  <h2 style={{ fontSize: '1rem' }}>{t('cashOnDelivery')}</h2>
                </div>
                <div className="card-body">
                  <div className="payment-method-card selected">
                    <div className="payment-icon" aria-hidden="true">EGP</div>
                    <div>
                      <strong>{t('cashOnDeliveryOnly')}</strong>
                      <p style={{ fontSize: '0.875rem', color: 'var(--muted)', marginTop: '0.25rem' }}>
                        {t('payCashDescription')}
                      </p>
                    </div>
                    <span className="badge badge-success" style={{ marginInlineStart: 'auto', flexShrink: 0 }}>{t('selected')}</span>
                  </div>

                  {isDelivery && isSpecial && (
                    <div style={{ padding: '0.85rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px', color: '#92400E', marginTop: '1rem', fontSize: '0.85rem' }}>
                      ℹ️ <strong>{isArabic ? 'ملاحظة تسعير التوصيل:' : 'Notice on Delivery Fee:'}</strong>{' '}
                      {isArabic
                        ? 'طلبك يحتوي على منتجات تحتاج تسعير شحن خاص. المبلغ الإجمالي أدناه هو قيمة المنتجات فقط، وسيتم إبلاغك بتكلفة التوصيل النهائية عند الاتصال.'
                        : 'Your order includes items requiring special delivery quote. The total below reflects products only, and final delivery fee will be confirmed via phone.'}
                    </div>
                  )}

                  <p className="payment-note" style={{ marginTop: '1rem' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                    {t('codOnlyLong')}
                  </p>

                  {submitError ? (
                    <p style={{ marginTop: '0.75rem', color: 'var(--danger)', fontSize: '0.875rem' }}>{submitError}</p>
                  ) : null}
                </div>
                <div className="card-footer" style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn btn-outline" onClick={() => setStep(1)} disabled={submitting}>{t('back')}</button>
                  <button className="btn btn-success btn-lg" onClick={handleConfirm} disabled={submitting} style={{ flex: 1 }}>
                    {submitting ? t('saving') : t('confirmOrder')}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* SUMMARY SIDEBAR */}
          <aside className="checkout-summary" aria-label={t('orderSummary')}>
            <div className="card" style={{ position: 'sticky', top: 'calc(var(--navbar-height) + 1rem)' }}>
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('orderSummary')}</h2>
              </div>
              <div className="card-body">
                <div className="manifest-items">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="manifest-item">
                      <div className="manifest-img">
                        <img src={item.product.image} alt={productName(item.product)} />
                        <span className="manifest-qty" aria-label={`Quantity: ${item.qty}`}>{item.qty}</span>
                      </div>
                      <div className="manifest-info">
                        <p className="manifest-name">{productName(item.product)}</p>
                        <p className="manifest-sku">{item.product.sku}</p>
                      </div>
                      <span className="manifest-price">{isArabic ? `${Number(item.product.price * item.qty).toFixed(0)} ج.م` : `EGP ${(item.product.price * item.qty).toFixed(2)}`}</span>
                    </div>
                  ))}
                </div>

                <hr className="divider" />

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>{t('subtotal')}</span>
                    <span>{isArabic ? `${Number(subtotal).toFixed(0)} ج.م` : `EGP ${subtotal.toFixed(2)}`}</span>
                  </div>

                  <div className="summary-row">
                    <span>{isDelivery ? (isArabic ? 'رسوم التوصيل' : t('deliveryFee')) : (isArabic ? 'الاستلام من المعرض' : t('pickupFromShop'))}</span>
                    <span>
                      {isDelivery ? (
                        isSpecial ? (
                          <strong style={{ color: '#D97706', fontSize: '0.8rem' }}>
                            {isArabic ? 'سيتم تأكيدها' : 'To be confirmed'}
                          </strong>
                        ) : rateResult.available ? (
                          <span>{isArabic ? `${Number(rateResult.price).toFixed(0)} ج.م` : `EGP ${rateResult.price.toFixed(2)}`}</span>
                        ) : (
                          <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{isArabic ? 'غير محدد' : 'Pending area'}</span>
                        )
                      ) : (
                        <strong style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{isArabic ? 'مجاناً' : t('free')}</strong>
                      )}
                    </span>
                  </div>

                  {isDelivery && (
                    <div className="summary-row" style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                      <span>{isArabic ? 'فئة الشحن السائدة' : 'Dominant Class'}</span>
                      <span>{isArabic ? dominantClass.nameAr : dominantClass.nameEn}</span>
                    </div>
                  )}

                  <hr className="divider" />

                  <div className="summary-row summary-total">
                    <strong>{isDelivery && isSpecial ? (isArabic ? 'الإجمالي المبدئي' : 'Provisional Total') : t('totalInclVat')}</strong>
                    <strong style={{ color: 'var(--accent)', fontSize: '1.45rem' }}>
                      {isArabic ? `${Number(total).toFixed(0)} ج.م` : `EGP ${total.toFixed(2)}`}
                    </strong>
                  </div>

                  {isDelivery && isSpecial && (
                    <p style={{ fontSize: '0.72rem', color: '#D97706', margin: '0.25rem 0 0 0' }}>
                      * {isArabic ? 'لا يشمل رسوم التوصيل الخاصة حتى تأكيدها من فريق العمل' : 'Excludes Special delivery fee until confirmed by staff'}
                    </p>
                  )}
                </div>

                <div className="payment-note" style={{ marginTop: '1rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                  <span>{t('cashOnDeliveryOnly')}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
