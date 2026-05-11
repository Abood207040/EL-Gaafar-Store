// src/components/products/ProductCard.jsx
import { StockBadge } from '../ui/StatusBadge.jsx';
import { STOCK_STATUSES } from '../../data/products.js';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function ProductCard({ product, onAddToCart, onViewDetails }) {
  const { isArabic, t, translateCategory, productName, productAltName } = useLocalization();
  const outOfStock = product.stockStatus === STOCK_STATUSES.OUT_OF_STOCK;
  const altName = productAltName(product);

  return (
    <article className="product-card animate-fadeIn">
      {/* Image */}
      <div className="product-card-img" onClick={() => onViewDetails(product)}>
        <img src={product.image} alt={productName(product)} loading="lazy" />
        {product.featured && (
          <span className="product-featured-tag">{t('featured')}</span>
        )}
      </div>

      {/* Body */}
      <div className="product-card-body">
        <div className="product-meta">
          <span className="product-category">{translateCategory(product.category)}</span>
          <StockBadge status={product.stockStatus} className="badge-sm" />
        </div>

        <button
          className="product-name-btn"
          onClick={() => onViewDetails(product)}
        >
          {productName(product)}
        </button>
        <p className="product-name-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'}>{altName}</p>

        <div className="product-brand">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          {product.brand}
        </div>

        <div className="product-footer">
          <div className="product-price">
            <span className="price-currency">SAR</span>
            <span className="price-amount">{product.price.toFixed(2)}</span>
          </div>

          <div className="product-actions">
            <button
              className="btn btn-outline btn-sm"
              onClick={() => onViewDetails(product)}
              aria-label={`${t('specs')} ${productName(product)}`}
            >
              {t('specs')}
            </button>
            {outOfStock ? (
              <button className="btn btn-sm" disabled style={{ background: '#F1F5F9', color: '#94A3B8', border: '1.5px solid #E2E8F0' }}>
                {t('unavailable')}
              </button>
            ) : (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onAddToCart(product)}
                aria-label={`${t('addToCart')} ${productName(product)}`}
              >
                {t('addToCart')}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
