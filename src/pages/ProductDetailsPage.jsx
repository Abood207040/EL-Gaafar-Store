// src/pages/ProductDetailsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { STOCK_STATUSES } from '../constants/domain.js';
import { STORE_INFO } from '../constants/store.js';
import { StockBadge } from '../components/ui/StatusBadge.jsx';
import QuantityStepper from '../components/ui/QuantityStepper.jsx';
import ProductCard from '../components/products/ProductCard.jsx';
import { useLocalization } from '../i18n/Localization.jsx';
import { getRelatedStoreProducts, getStoreProductById } from '../services/productsService.js';
import EmptyState from '../components/ui/EmptyState.jsx';

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
  const [item, setItem] = useState(product || null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  const productId = typeof product === 'string' ? product : (product?.id || product?.productId || null);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      if (!productId) {
        setItem(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const fresh = await getStoreProductById(productId);
        if (ignore) return;
        setItem(fresh);
        if (fresh?.id) {
          const relatedRows = await getRelatedStoreProducts({
            categoryId: fresh.categoryId,
            excludeId: fresh.id,
            limit: 4,
          });
          if (!ignore) setRelated(relatedRows);
        } else if (!ignore) {
          setRelated([]);
        }
      } catch (fetchError) {
        if (!ignore) {
          setError(fetchError.message || t('productsLoadFailed'));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    load();
    return () => {
      ignore = true;
    };
  }, [productId, t]);

  const current = useMemo(() => item, [item]);

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <EmptyState icon="..." title={t('loadingProducts')} description={t('loadingProducts')} />
      </div>
    );
  }

  if (!current) {
    return (
      <div className="container" style={{ paddingTop: '3rem', paddingBottom: '3rem' }}>
        <EmptyState
          icon="!"
          title={t('noProductsFound')}
          description={error || t('adjustFilters')}
          actionLabel={t('browseProducts')}
          onAction={() => navigate('shop')}
        />
      </div>
    );
  }

  const outOfStock = current.stockStatus === STOCK_STATUSES.OUT_OF_STOCK;
  const specRows = [
    ['Size', current.specs?.size],
    ['Material', current.specs?.material],
    ['Usage', current.specs?.usage],
    ['Color', current.specs?.color],
    ['Pressure Rating', current.specs?.pressureRating],
    ['Warranty', current.specs?.warranty],
  ].filter(([, val]) => val);

  return (
    <div className="pdp-page animate-fadeIn">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('shop')}>{t('shop')}</button>
          </div>
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('shop')}>{translateCategory(current.category)}</button>
          </div>
          <div className="breadcrumb-item">
            <span className="breadcrumb-current">{productName(current)}</span>
          </div>
        </nav>

        <div className="pdp-main">
          <div className="pdp-image-panel">
            <div className="pdp-image-frame">
              <img src={current.image} alt={productName(current)} />
            </div>
            <div className="pdp-thumbnails" aria-label={t('productImages')}>
              {[1, 2, 3].map((i) => (
                <div key={i} className={`pdp-thumb ${i === 1 ? 'active' : ''}`}>
                  <img src={current.image} alt={`${productName(current)} ${i}`} />
                </div>
              ))}
            </div>
          </div>

          <div className="pdp-details-panel">
            <div className="pdp-badges">
              <span className="badge badge-muted">{translateCategory(current.category)}</span>
              <StockBadge status={current.stockStatus} />
            </div>

            <h1 className="pdp-title">{productName(current)}</h1>
            <p className="pdp-title-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'}>{productAltName(current)}</p>

            <div className="pdp-meta-row">
              <div className="pdp-meta-item">
                <span className="pdp-meta-label">{t('brand')}</span>
                <span className="pdp-meta-value">{current.brand}</span>
              </div>
              <div className="pdp-meta-item">
                <span className="pdp-meta-label">SKU</span>
                <span className="pdp-meta-value sku-text">{current.sku}</span>
              </div>
              <div className="pdp-meta-item">
                <span className="pdp-meta-label">{t('status')}</span>
                <span className="pdp-meta-value">{current.stock > 0 ? `${current.stock} ${t('items')}` : translateStock(STOCK_STATUSES.OUT_OF_STOCK)}</span>
              </div>
            </div>

            <div className="pdp-price">
              <span className="pdp-price-currency">EGP</span>
              <span className="pdp-price-amount">{current.price.toFixed(2)}</span>
            </div>

            {!outOfStock ? (
              <div className="pdp-cart-row">
                <div>
                  <label className="form-label" id="qty-label">{t('quantity')}</label>
                  <QuantityStepper
                    value={qty}
                    onChange={setQty}
                    max={current.stock}
                    aria-labelledby="qty-label"
                  />
                </div>
                <button
                  className="btn btn-primary btn-lg pdp-add-btn"
                  onClick={() => onAddToCart(current, qty)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                  {t('addToCart')}
                </button>
              </div>
            ) : (
              <div className="pdp-out-of-stock">
                <span className="badge badge-danger">{t('outOfStockLong')}</span>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  {t('restockContact')}
                </p>
              </div>
            )}

            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}?text=Hello, I'd like to inquire about: ${current.nameEn} (SKU: ${current.sku})`}
              className="btn btn-outline whatsapp-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('whatsappInquiry')} ${productName(current)}`}
            >
              {t('whatsappInquiry')}
            </a>
          </div>
        </div>

        <div className="pdp-info">
          <div className="pdp-info-col">
            <div className="card">
              <div className="card-header">
                <h2 style={{ fontSize: '1rem' }}>{t('productDescription')}</h2>
              </div>
              <div className="card-body">
                <p style={{ lineHeight: 1.8 }}>{productDescription(current)}</p>
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

        {related.length > 0 && (
          <section className="pdp-related" aria-label="Related products">
            <div className="section-header">
              <h2 className="section-title">{t('relatedProducts')}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('shop')}>
                {t('viewAll')}
              </button>
            </div>
            <div className="product-grid product-grid-4">
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAddToCart={onAddToCart}
                  onViewDetails={() => navigate('product-details', { id: p.id })}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
