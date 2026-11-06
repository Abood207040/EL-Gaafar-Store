// src/components/home/PopularProducts.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import ProductCard from '../products/ProductCard.jsx';
import { getPopularProducts } from '../../services/productsService.js';

export default function PopularProducts({ onAddToCart, navigate }) {
  const { t, isArabic, translateCategory } = useLocalization();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    let ignore = false;
    const fetchPopular = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        // Authoritative database fetch from Supabase 'products' table
        const data = await getPopularProducts(8);
        if (!ignore) {
          setProducts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        console.error('Failed to load products from database:', err);
        if (!ignore) {
          setLoadError(err.message || 'Failed to load products');
          setProducts([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchPopular();
    return () => {
      ignore = true;
    };
  }, []);

  // Extract category filters strictly from real loaded database products
  const availableCategories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products by selected category
  const filteredProducts = useMemo(() => {
    if (selectedCategory === 'All') return products;
    return products.filter((p) => p.category === selectedCategory);
  }, [products, selectedCategory]);

  return (
    <section className="featured-section bg-light" id="popular-products" aria-label={t('popularProductsTitle')}>
      <div className="container">
        <div className="section-header" style={{ flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
          <div>
            <h2 className="section-title">{t('popularProductsTitle')}</h2>
            <p className="section-subtitle" style={{ color: 'var(--muted)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
              {t('popularProductsSubtitle')}
            </p>
          </div>
          <button className="btn btn-ghost" onClick={() => navigate('shop')}>
            {t('shopAllProducts')} &rarr;
          </button>
        </div>

        {/* Category Filter Pills (if multiple categories exist in database products) */}
        {availableCategories.length > 2 && (
          <div
            className="popular-category-pills"
            style={{
              display: 'flex',
              gap: '0.5rem',
              overflowX: 'auto',
              paddingBottom: '0.75rem',
              marginBottom: '1.75rem',
              scrollbarWidth: 'thin',
            }}
          >
            {availableCategories.map((cat) => {
              const isActive = selectedCategory === cat;
              const label = cat === 'All' ? (isArabic ? 'الكل' : 'All') : translateCategory(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  className={`btn btn-sm ${isActive ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    borderRadius: '2rem',
                    padding: '0.35rem 1rem',
                    fontSize: '0.875rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.2s ease',
                  }}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* Products Grid from Real Database */}
        {loading ? (
          <div className="product-grid">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="card"
                style={{ height: '320px', background: 'var(--surface)', opacity: 0.6 }}
              />
            ))}
          </div>
        ) : loadError ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              background: '#fff',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
            }}
          >
            <p style={{ color: 'var(--danger)', marginBottom: '1rem' }}>{loadError}</p>
            <button className="btn btn-outline btn-sm" onClick={() => window.location.reload()}>
              {isArabic ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '3rem 1rem',
              background: '#fff',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
            }}
          >
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>{t('noProductsFound')}</p>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('shop')}>
              {t('shopAllProducts')}
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '2.5rem 1rem',
              background: '#fff',
              borderRadius: 'var(--radius)',
              border: '1px dashed var(--border)',
            }}
          >
            <p style={{ color: 'var(--muted)', marginBottom: '1rem' }}>{t('noProductsFound')}</p>
            <button className="btn btn-outline btn-sm" onClick={() => setSelectedCategory('All')}>
              {isArabic ? 'عرض كل المنتجات' : 'Show All'}
            </button>
          </div>
        ) : (
          <div className="product-grid">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onAddToCart={onAddToCart}
                onViewDetails={() => navigate('product-details', { id: product.id })}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
