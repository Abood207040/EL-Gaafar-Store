// src/components/home/PopularProducts.jsx
import { useEffect, useMemo, useState } from 'react';
import { useLocalization } from '../../i18n/Localization.jsx';
import ProductCard from '../products/ProductCard.jsx';
import { getPopularProducts } from '../../services/productsService.js';
import { STOCK_STATUSES } from '../../constants/domain.js';

// Fallback high-demand sanitary ware & plumbing products when database is empty
const DEFAULT_POPULAR_PRODUCTS = [
  {
    id: 'popular-p1',
    nameEn: 'High Pressure UPVC Pipe 4 Inch',
    nameAr: 'ماسورة UPVC ضغط عالي 4 بوصة',
    category: 'Pipes',
    categoryAr: 'مواسير',
    brand: 'الشريف',
    sku: 'UPVC-4IN-HP',
    price: 340,
    stock: 50,
    stockStatus: STOCK_STATUSES.IN_STOCK,
    image: '/images/transparentlogo.png',
    featured: true,
  },
  {
    id: 'popular-p2',
    nameEn: 'Premium Brass Ball Valve 1 Inch',
    nameAr: 'محبس بلية نحاس إيطالي 1 بوصة',
    category: 'Valves',
    categoryAr: 'محابس وصمامات',
    brand: 'ايطالي',
    sku: 'VALVE-BRASS-1IN',
    price: 285,
    stock: 35,
    stockStatus: STOCK_STATUSES.IN_STOCK,
    image: '/images/transparentlogo.png',
    featured: true,
  },
  {
    id: 'popular-p3',
    nameEn: 'Kitchen Sink Mixer Tap Chrome',
    nameAr: 'خلاط مطبخ شجرة كروم استانلس',
    category: 'Mixers',
    categoryAr: 'خلاطات',
    brand: 'ساريكس',
    sku: 'MIX-KIT-CHROME',
    price: 1250,
    stock: 18,
    stockStatus: STOCK_STATUSES.IN_STOCK,
    image: '/images/transparentlogo.png',
    featured: true,
  },
  {
    id: 'popular-p4',
    nameEn: 'Bathroom Shower Mixer Set',
    nameAr: 'طقم خلاط دوش حمام كامل بالسماعة',
    category: 'Mixers',
    categoryAr: 'خلاطات',
    brand: 'ساريكس',
    sku: 'MIX-SHOWER-SET',
    price: 1650,
    stock: 12,
    stockStatus: STOCK_STATUSES.IN_STOCK,
    image: '/images/transparentlogo.png',
    featured: true,
  },
  {
    id: 'popular-p5',
    nameEn: 'PPR Thermal Pipe 32mm PN20',
    nameAr: 'ماسورة بولي حراري 32 مم PN20',
    category: 'Pipes',
    categoryAr: 'مواسير',
    brand: 'باننجر',
    sku: 'PPR-32MM-PN20',
    price: 195,
    stock: 80,
    stockStatus: STOCK_STATUSES.IN_STOCK,
    image: '/images/transparentlogo.png',
    featured: true,
  },
  {
    id: 'popular-p6',
    nameEn: 'Multi-Jet Water Meter 3/4 Inch',
    nameAr: 'عداد مياه متعدد النفاثات 3/4 بوصة',
    category: 'Sanitary Ware',
    categoryAr: 'أدوات صحية',
    brand: 'أكوا',
    sku: 'WM-34-MJ',
    price: 890,
    stock: 15,
    stockStatus: STOCK_STATUSES.IN_STOCK,
    image: '/images/transparentlogo.png',
    featured: true,
  },
  {
    id: 'popular-p7',
    nameEn: 'Automatic Water Pump Control',
    nameAr: 'فلوماك أوتوماتيك مضخة مياه إلكتروني',
    category: 'Plumbing Tools',
    categoryAr: 'عدة سباكة',
    brand: 'كالبيدا',
    sku: 'ELEC-PUMP-CTRL',
    price: 740,
    stock: 22,
    stockStatus: STOCK_STATUSES.IN_STOCK,
    image: '/images/transparentlogo.png',
    featured: true,
  },
  {
    id: 'popular-p8',
    nameEn: 'Flexible Stainless Steel Water Hose 50cm',
    nameAr: 'وصلة سخان استانلس ستيل مرنة 50 سم',
    category: 'Fittings',
    categoryAr: 'وصلات',
    brand: 'الشريف',
    sku: 'FLEX-SS-50CM',
    price: 95,
    stock: 120,
    stockStatus: STOCK_STATUSES.IN_STOCK,
    image: '/images/transparentlogo.png',
    featured: true,
  },
];

export default function PopularProducts({ onAddToCart, navigate }) {
  const { t, isArabic, translateCategory } = useLocalization();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    let ignore = false;
    const fetchPopular = async () => {
      try {
        setLoading(true);
        const data = await getPopularProducts(8);
        if (!ignore) {
          if (Array.isArray(data) && data.length > 0) {
            setProducts(data);
          } else {
            // If DB currently has 0 products, populate with realistic default popular products
            setProducts(DEFAULT_POPULAR_PRODUCTS);
          }
        }
      } catch (err) {
        console.warn('Failed to load popular products from Supabase, using defaults:', err);
        if (!ignore) {
          setProducts(DEFAULT_POPULAR_PRODUCTS);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    fetchPopular();
    return () => {
      ignore = true;
    };
  }, []);

  // Compute available category filters from the products
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

        {/* Category Filter Tabs / Pills */}
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

        {/* Product Grid */}
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
        ) : filteredProducts.length === 0 ? (
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

