// src/pages/ProductDetailsPage.jsx
import { useState } from 'react';
import { getRelatedProducts } from '../data/products.js';
import { StockBadge } from '../components/ui/StatusBadge.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import ProductCard from '../components/products/ProductCard.jsx';
import { STOCK_STATUSES } from '../data/products.js';
import { STORE_INFO } from '../data/orders.js';
import { useLocalization } from '../i18n/Localization.jsx';

export default function ProductDetailsPage({ product, navigate, onAddToCart }) {
  const {
    t,
    isArabic,
    translateCategory,
    translateStock,
    translateSpecLabel,
    translateSpecValue,
    productName,
    productAltName,
    productDescription,
  } = useLocalization();
  const [qty, setQty] = useState(1);
  const related = getRelatedProducts(product);
  const outOfStock = product.stockStatus === STOCK_STATUSES.OUT_OF_STOCK;

  const specRows = [
    ['Size', product.specs?.size],
    ['Material', product.specs?.material],
    ['Usage', product.specs?.usage],
    ['Color', product.specs?.color],
    ['Pressure Rating', product.specs?.pressureRating],
    ['Warranty', product.specs?.warranty],
  ].filter(([, val]) => val);

  return (
    <div className="pdp-page animate-fadeIn">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('shop')}>{t('shop')}</button>
          </div>
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('shop')}>{translateCategory(product.category)}</button>
          </div>
          <div className="breadcrumb-item">
            <span className="breadcrumb-current">{productName(product)}</span>
          </div>
        </nav>

        {/* Product Main */}
        <div className="pdp-main">
          {/* Image */}
          <div className="pdp-image-panel">
            <div className="pdp-image-frame">
              <img src={product.image} alt={productName(product)} />
            </div>
            <div className="pdp-thumbnails" aria-label={t('productImages')}>
              {[1, 2, 3].map(i => (
                <div key={i} className={`pdp-thumb ${i === 1 ? 'active' : ''}`}>
                  <img src={product.image} alt={`${productName(product)} ${i}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="pdp-details-panel">
            <div className="pdp-badges">
              <span className="badge badge-muted">{translateCategory(product.category)}</span>
              <StockBadge status={product.stockStatus} />
            </div>

            <h1 className="pdp-title">{productName(product)}</h1>
            <p className="pdp-title-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'}>{productAltName(product)}</p>

            <div className="pdp-meta-row">
              <div className="pdp-meta-item">
                <span className="pdp-meta-label">{t('brand')}</span>
                <span className="pdp-meta-value">{product.brand}</span>
              </div>
              <div className="pdp-meta-item">
                <span className="pdp-meta-label">SKU</span>
                <span className="pdp-meta-value sku-text">{product.sku}</span>
              </div>
              <div className="pdp-meta-item">
                <span className="pdp-meta-label">{t('status')}</span>
                <span className="pdp-meta-value">{product.stock > 0 ? `${product.stock} ${t('items')}` : translateStock(STOCK_STATUSES.OUT_OF_STOCK)}</span>
              </div>
            </div>

            <div className="pdp-price">
              <span className="pdp-price-currency">SAR</span>
              <span className="pdp-price-amount">{product.price.toFixed(2)}</span>
            </div>

            {/* Qty + Cart */}
            {!outOfStock && (
              <div className="pdp-cart-row">
                <div>
                  <label className="form-label" id="qty-label">{t('quantity')}</label>
                  <QuantityStepper
                    value={qty}
                    onChange={setQty}
                    max={product.stock}
                    aria-labelledby="qty-label"
                  />
                </div>
                <button
                  className="btn btn-primary btn-lg pdp-add-btn"
                  onClick={() => onAddToCart(product, qty)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  {t('addToCart')}
                </button>
              </div>
            )}
            {outOfStock && (
              <div className="pdp-out-of-stock">
                <span className="badge badge-danger">{t('outOfStockLong')}</span>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  {t('restockContact')}
                </p>
              </div>
            )}

            {/* WhatsApp Inquiry */}
            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}?text=Hello, I'd like to inquire about: ${product.nameEn} (SKU: ${product.sku})`}
              className="btn btn-outline whatsapp-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('whatsappInquiry')} ${productName(product)}`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#25D366' }}>
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              {t('whatsappInquiry')}
            </a>
          </div>
        </div>

        {/* Tabs: Description & Specs */}
        <div className="pdp-info">
          <div className="pdp-info-col">
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('productDescription')}</h2>
              </div>
              <div className="card-body">
                <p style={{ lineHeight: 1.8 }}>{productDescription(product)}</p>
              </div>
            </div>
          </div>

          <div className="pdp-info-col">
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('technicalSpecifications')}</h2>
              </div>
              <div className="card-body" style={{ padding: 0 }}>
                <table className="table specs-table">
                  <tbody>
                    {specRows.map(([key, val]) => (
                      <tr key={key}>
                        <th style={{ fontWeight: 600, width: '40%', background: '#F8FAFC' }}>{translateSpecLabel(key)}</th>
                        <td>{translateSpecValue(val)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <section className="pdp-related" aria-label="Related products">
            <div className="section-header">
              <h2 className="section-title">{t('relatedProducts')}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('shop')}>
                {t('viewAll')}
              </button>
            </div>
            <div className="product-grid product-grid-4">
              {related.map(p => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  onViewDetails={() => navigate('product-details', p)}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
