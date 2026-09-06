// src/components/products/ProductCard.jsx
import { useState } from 'react';
import { StockBadge } from '../ui/StatusBadge.jsx';
import { STOCK_STATUSES } from '../../constants/domain.js';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function ProductCard({ product, onAddToCart, onViewDetails }) {
  const { isArabic, t, translateCategory, productName, productAltName } = useLocalization();
  const [added, setAdded] = useState(false);
  const outOfStock = product.stockStatus === STOCK_STATUSES.OUT_OF_STOCK;
  const altName = productAltName(product);

  const handleAddToCartClick = (e) => {
    e.stopPropagation();
    if (outOfStock) return;
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
    }, 1400);
  };

  return (
    <article className="product-card animate-fadeIn">
      {/* Image Container with Featured Tag & Quick Action */}
      <div 
        className="product-card-img" 
        onClick={() => onViewDetails(product)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter') onViewDetails(product); }}
        aria-label={`${t('viewDetails')} ${productName(product)}`}
      >
        <img 
          src={product.image} 
          alt={productName(product)} 
          loading="lazy" 
          onError={(e) => { e.target.src = '/images/transparentlogo.png'; }}
        />
        {product.featured && (
          <span className="product-featured-tag">
            ★ {t('featured')}
          </span>
        )}
        <div className="product-card-overlay">
          <span className="product-view-hint">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            {isArabic ? 'معاينة المواصفات' : 'Quick View'}
          </span>
        </div>
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
        <p className="product-name-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'}>
          {altName}
        </p>

        <div className="product-brand">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          <span>{product.brand}</span>
        </div>

        <div className="product-footer">
          <div className="product-price">
            <span className="price-currency">{isArabic ? 'ج.م' : 'EGP'}</span>
            <span className="price-amount">{Number(product.price).toFixed(0)}</span>
            <span className="price-decimal">.{((Number(product.price) % 1) * 100).toFixed(0).padStart(2, '0')}</span>
          </div>

          <div className="product-actions">
            <button
              className="btn btn-outline btn-sm product-specs-btn"
              onClick={() => onViewDetails(product)}
              aria-label={`${t('specs')} ${productName(product)}`}
            >
              {t('specs')}
            </button>
            {outOfStock ? (
              <button 
                className="btn btn-sm product-disabled-btn" 
                disabled 
                style={{ background: '#F1F5F9', color: '#94A3B8', border: '1px solid #E2E8F0', cursor: 'not-allowed' }}
              >
                {t('unavailable')}
              </button>
            ) : (
              <button
                className={`btn btn-sm product-add-btn ${added ? 'btn-success added-pulse' : 'btn-primary'}`}
                onClick={handleAddToCartClick}
                aria-label={`${t('addToCart')} ${productName(product)}`}
              >
                {added ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                    <span>{isArabic ? 'تمت الإضافة' : 'Added'}</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                    <span>{t('addToCart')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

