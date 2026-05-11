// src/pages/CartPage.jsx
import { useState } from 'react';
import EmptyState from '../components/ui/EmptyState.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import { StockBadge } from '../components/ui/StatusBadge.jsx';
import { FULFILLMENT } from '../constants/domain.js';
import { useLocalization } from '../i18n/Localization.jsx';

const DELIVERY_FEE = 25;

export default function CartPage({ cartItems, onUpdateQty, onRemove, navigate }) {
  const { t, isArabic, productName, productAltName, translateFulfillment } = useLocalization();
  const [fulfillment, setFulfillment] = useState(FULFILLMENT.DELIVERY);

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.qty, 0);
  const deliveryFee = fulfillment === FULFILLMENT.DELIVERY ? DELIVERY_FEE : 0;
  const total = subtotal + deliveryFee;

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
    <div className="cart-page animate-fadeIn">
      <div className="container">
        <div className="section-header">
          <div>
            <h1 className="section-title">{t('shoppingCart')}</h1>
            <p className="section-subtitle">{cartItems.length} {cartItems.length === 1 ? t('item') : t('items')}</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('shop')}>
            {t('continueShopping')}
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-items">
            <div className="card">
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
                            <div className="cart-product-img">
                              <img src={item.product.image} alt={productName(item.product)} />
                            </div>
                            <div>
                              <p className="cart-product-name">{productName(item.product)}</p>
                              <p className="cart-product-name-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'}>{productAltName(item.product)}</p>
                              <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{item.product.brand}</p>
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
                          <span className="price-tag">EGP {item.product.price.toFixed(2)}</span>
                        </td>
                        <td>
                          <QuantityStepper
                            value={item.qty}
                            onChange={(qty) => onUpdateQty(item.product.id, qty)}
                            max={item.product.stock}
                          />
                        </td>
                        <td>
                          <span className="price-tag strong">EGP {(item.product.price * item.qty).toFixed(2)}</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-ghost btn-icon"
                            onClick={() => onRemove(item.product.id)}
                            aria-label={`${t('removeItem')} ${productName(item.product)}`}
                            title={t('removeItem')}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="cart-summary" aria-label="Order summary">
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('orderSummary')}</h2>
              </div>
              <div className="card-body">
                <div className="fulfillment-options" role="group" aria-label="Fulfillment method">
                  <p className="form-label" style={{ marginBottom: '0.5rem' }}>{t('deliveryOrPickup')}</p>
                  {Object.values(FULFILLMENT).map((option) => (
                    <label key={option} className={`fulfillment-option ${fulfillment === option ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="fulfillment-cart"
                        value={option}
                        checked={fulfillment === option}
                        onChange={() => setFulfillment(option)}
                      />
                      <div className="fulfillment-icon" aria-hidden="true">
                        {option === FULFILLMENT.DELIVERY ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                        )}
                      </div>
                      <div>
                        <strong>{translateFulfillment(option)}</strong>
                        <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                          {option === FULFILLMENT.DELIVERY ? t('deliveryHint') : t('pickupHint')}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>

                <hr className="divider" />

                <div className="summary-rows">
                  <div className="summary-row">
                    <span>{t('subtotal')}</span>
                    <span>EGP {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="summary-row">
                    <span>{fulfillment === FULFILLMENT.DELIVERY ? t('deliveryFee') : t('pickupFromShop')}</span>
                    <span>
                      {fulfillment === FULFILLMENT.DELIVERY
                        ? `EGP ${deliveryFee.toFixed(2)}`
                        : <em style={{ color: 'var(--success)', fontSize: '0.8125rem', fontStyle: 'normal' }}>{t('freePickup')}</em>}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span>VAT (15%)</span>
                    <span style={{ color: 'var(--muted)', fontSize: '0.8125rem' }}>{t('vatIncluded')}</span>
                  </div>
                  <hr className="divider" />
                  <div className="summary-row summary-total">
                    <strong>{t('total')}</strong>
                    <strong>EGP {total.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="payment-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" /></svg>
                  {t('cashOnDeliveryOnly')}
                </div>

                <button
                  className="btn btn-primary w-full btn-lg"
                  onClick={() => navigate('checkout', { fulfillment })}
                  style={{ marginTop: '1rem' }}
                >
                  {t('proceedCheckout')}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
