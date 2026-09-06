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
import { useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.jsx';

export default function ProductDetailsPage({ product, navigate, onAddToCart }) {
  const { id } = useParams();
  const { isAdmin } = useAuth();
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

  const productId = id || (typeof product === 'string' ? product : (product?.id || product?.productId || null));

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
  const unavailableOnline = current.availableOnline === false;
  const cannotPurchase = outOfStock || unavailableOnline;
  
  const specRows = [
    ['Size', current.specs?.size],
    ['Material', current.specs?.material],
    ['Usage', current.specs?.usage],
    ['Color', current.specs?.color],
    ['Pressure Rating', current.specs?.pressureRating],
    ['Warranty', current.specs?.warranty],
  ].filter(([, val]) => val);

  const [added, setAdded] = useState(false);
  const [selectedImg, setSelectedImg] = useState(current?.image || '');

  // Keep selected image in sync if current changes
  useEffect(() => {
    if (current?.image) {
      setSelectedImg(current.image);
    }
  }, [current]);

  const galleryImages = useMemo(() => {
    if (Array.isArray(current.images) && current.images.length > 0) {
      return current.images;
    }
    if (Array.isArray(current.gallery) && current.gallery.length > 0) {
      return current.gallery;
    }
    return [current.image];
  }, [current]);

  const handleAddToCart = () => {
    onAddToCart(current, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  const whatsappMessage = isArabic
    ? `مرحباً متجر الجعفر، أود الاستفسار عن المنتج: ${current.nameAr || current.nameEn} (كود: ${current.sku}) بسعر ${current.price} ج.م`
    : `Hello Al-Jafar Store, I'd like to inquire about: ${current.nameEn} (SKU: ${current.sku}) priced at EGP ${current.price}`;

  return (
    <div className="pdp-page animate-fadeIn">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('shop')}>{t('shop')}</button>
          </div>
          <div className="breadcrumb-item">
            <button className="breadcrumb-link" onClick={() => navigate('shop', { category: current.category })}>
              {translateCategory(current.category)}
            </button>
          </div>
          <div className="breadcrumb-item">
            <span className="breadcrumb-current">{productName(current)}</span>
          </div>
        </nav>

        <div className="pdp-main">
          {/* Image Showcase Panel */}
          <div className="pdp-image-panel">
            <div className="pdp-image-frame">
              <img 
                src={selectedImg || current.image} 
                alt={productName(current)} 
                onError={(e) => { e.target.src = '/images/transparentlogo.png'; }}
              />
              {current.featured && (
                <span className="pdp-featured-tag">★ {t('featured')}</span>
              )}
            </div>

            {/* Render thumbnails only when multiple images exist */}
            {galleryImages.length > 1 && (
              <div className="pdp-thumbnails" aria-label={t('productImages')}>
                {galleryImages.map((imgUrl, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`pdp-thumb ${selectedImg === imgUrl ? 'active' : ''}`}
                    onClick={() => setSelectedImg(imgUrl)}
                    aria-label={`View image ${index + 1}`}
                  >
                    <img src={imgUrl} alt={`${productName(current)} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Panel */}
          <div className="pdp-details-panel">
            <div className="pdp-badges">
              <span className="badge badge-muted">{translateCategory(current.category)}</span>
              <StockBadge status={current.stockStatus} />
            </div>

            <h1 className="pdp-title">{productName(current)}</h1>
            <p className="pdp-title-ar arabic-text" lang={isArabic ? 'en' : 'ar'} dir={isArabic ? 'ltr' : 'rtl'}>
              {productAltName(current)}
            </p>

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
                <span className="pdp-meta-value">
                  {current.stock > 0 
                    ? (isAdmin ? `${current.stock} ${t('items')}` : translateStock(current.stockStatus)) 
                    : translateStock(STOCK_STATUSES.OUT_OF_STOCK)}
                </span>
              </div>
            </div>

            <div className="pdp-price">
              <span className="pdp-price-currency">{isArabic ? 'ج.م' : 'EGP'}</span>
              <span className="pdp-price-amount">{Number(current.price).toFixed(0)}</span>
              <span className="pdp-price-decimal">.{((Number(current.price) % 1) * 100).toFixed(0).padStart(2, '0')}</span>
            </div>

            {!cannotPurchase ? (
              <div className="pdp-cart-row">
                <div>
                  <label className="form-label" id="qty-label">{t('quantity')}</label>
                  <QuantityStepper
                    value={qty}
                    onChange={setQty}
                    max={current.stock}
                    aria-labelledby="qty-label"
                    onLimitReached={(maxVal) => {
                      const msg = isArabic 
                        ? `الحد الأقصى المتاح هو ${maxVal}. إذا كنت بحاجة إلى كميات أكبر لمشروعك، يرجى التواصل معنا عبر واتساب.`
                        : `The maximum available is ${maxVal}. If you need higher quantities for your project, please contact us on WhatsApp.`;
                      window.alert(msg);
                    }}
                  />
                </div>
                <button
                  className={`btn btn-lg pdp-add-btn ${added ? 'btn-success added-pulse' : 'btn-primary'}`}
                  onClick={handleAddToCart}
                >
                  {added ? (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>{isArabic ? 'تمت الإضافة للسلة ✓' : 'Added to Cart ✓'}</span>
                    </>
                  ) : (
                    <>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
                      <span>{t('addToCart')} ({qty})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="pdp-out-of-stock">
                <span className="badge badge-danger">
                  {unavailableOnline ? (isArabic ? 'غير متاح للبيع عبر الإنترنت' : 'Not available for online sale') : t('outOfStockLong')}
                </span>
                <p style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: 'var(--muted)' }}>
                  {unavailableOnline ? (isArabic ? 'هذا المنتج متاح فقط في مقر المتجر في أسوان.' : 'This product is only available in-store in Aswan.') : t('restockContact')}
                </p>
              </div>
            )}

            {/* Direct WhatsApp Action */}
            <a
              href={`https://wa.me/${STORE_INFO.whatsapp}?text=${encodeURIComponent(whatsappMessage)}`}
              className="btn btn-outline whatsapp-btn"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('whatsappInquiry')} ${productName(current)}`}
            >
              <span>💬</span>
              <span>{isArabic ? 'استفسار فوري عبر واتساب المتجر' : t('whatsappInquiry')}</span>
            </a>

            {/* Aswan Store Guarantees Card */}
            <div className="pdp-trust-card">
              <div className="pdp-trust-row">
                <div className="trust-icon-box">📍</div>
                <div>
                  <strong>{isArabic ? 'معرضنا في أسوان' : 'Aswan Showroom Pickup'}</strong>
                  <p>{isArabic ? 'إمكانية الاستلام الفوري والفحص داخل المعرض' : 'Direct pickup & showroom inspection'}</p>
                </div>
              </div>
              <div className="pdp-trust-row">
                <div className="trust-icon-box">🚚</div>
                <div>
                  <strong>{isArabic ? 'توصيل سريع لكافة مناطق أسوان' : 'Fast Delivery in Aswan'}</strong>
                  <p>{isArabic ? 'توصيل حتى باب المنزل أو موقع التشطيب' : 'Delivery to your door or project site'}</p>
                </div>
              </div>
              <div className="pdp-trust-row">
                <div className="trust-icon-box">💵</div>
                <div>
                  <strong>{isArabic ? 'الدفع عند الاستلام والمعاينة' : 'Cash on Delivery & Inspection'}</strong>
                  <p>{isArabic ? 'افحص المنتج وتأكد من سلامته قبل الدفع' : 'Inspect your items before paying'}</p>
                </div>
              </div>
            </div>
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
