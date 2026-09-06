import { useEffect, useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import ProductCard from '../products/ProductCard.jsx';
import EmptyState from '../ui/EmptyState.jsx';
import { getFeaturedProducts } from '../../services/productsService.js';

export default function FeaturedProducts({ onAddToCart, navigate }) {
  const { t } = useLocalization();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchFeatured = async () => {
      try {
        setLoading(true);
        const data = await getFeaturedProducts(8);
        if (!ignore) setProducts(data);
      } catch (err) {
        if (!ignore) setError(err.message || 'Failed to load featured products');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchFeatured();
    return () => { ignore = true; };
  }, []);

  if (loading) {
    return (
      <section className="featured-section bg-light">
        <div className="container">
          <EmptyState icon="..." title={t('loadingProducts')} description={t('loadingProducts')} />
        </div>
      </section>
    );
  }

  if (error || products.length === 0) {
    return null; // Gracefully hide if no products or error
  }

  return (
    <section className="featured-section bg-light" aria-label={t('featuredProductsTitle')}>
      <div className="container">
        <div className="section-header">
          <h2 className="section-title">{t('featuredProductsTitle')}</h2>
          <button className="btn btn-ghost" onClick={() => navigate('shop')}>
            {t('shopAllProducts')} &rarr;
          </button>
        </div>
        <div className="product-grid">
          {products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
              onViewDetails={() => navigate('product-details', { id: product.id })}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
