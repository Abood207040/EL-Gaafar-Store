// src/pages/ShopPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { STOCK_STATUSES } from '../constants/domain.js';
import ProductCard from '../components/products/ProductCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import heroImage from '../assets/main-image.png';
import useCatalogOptions from '../hooks/useCatalogOptions.js';
import { useLocalization } from '../i18n/Localization.jsx';
import { listStoreProducts } from '../services/productsService.js';

const ITEMS_PER_PAGE = 8;

export default function ShopPage({ onAddToCart, navigate }) {
  const { categories, brands, catalogWarnings } = useCatalogOptions();
  const { t, isArabic, translateCategory, translateStock } = useLocalization();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [availability, setAvailability] = useState([]);
  const [sort, setSort] = useState('default');
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  useEffect(() => {
    let ignore = false;
    const loadProducts = async () => {
      setLoading(true);
      setLoadError('');
      try {
        const rows = await listStoreProducts();
        if (!ignore) setProducts(rows);
      } catch (error) {
        if (!ignore) setLoadError(error.message || t('productsLoadFailed'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      ignore = true;
    };
  }, [t]);

  const availabilityOptions = Object.values(STOCK_STATUSES);

  const filtered = useMemo(() => {
    let list = [...products];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        p.nameEn.toLowerCase().includes(q) ||
        p.nameAr.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'All') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (selectedBrand !== 'All') {
      list = list.filter((p) => p.brand === selectedBrand);
    }
    if (priceMin !== '') list = list.filter((p) => p.price >= Number(priceMin));
    if (priceMax !== '') list = list.filter((p) => p.price <= Number(priceMax));
    if (availability.length) {
      list = list.filter((p) => availability.includes(p.stockStatus));
    }
    if (sort === 'price-asc') list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'name-asc') {
      list.sort((a, b) => {
        const nameA = isArabic ? a.nameAr : a.nameEn;
        const nameB = isArabic ? b.nameAr : b.nameEn;
        return nameA.localeCompare(nameB);
      });
    }
    return list;
  }, [availability, isArabic, priceMax, priceMin, products, search, selectedBrand, selectedCategory, sort]);

  const sortOptions = [
    { value: 'default', label: t('sortDefault') },
    { value: 'price-asc', label: t('priceLowHigh') },
    { value: 'price-desc', label: t('priceHighLow') },
    { value: 'name-asc', label: t('nameAZ') },
  ];

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const resetFilters = () => {
    setSearch('');
    setSelectedCategory('All');
    setSelectedBrand('All');
    setPriceMin('');
    setPriceMax('');
    setAvailability([]);
    setSort('default');
    setPage(1);
  };

  const toggleAvailability = (val) => {
    setAvailability((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
    setPage(1);
  };

  return (
    <div className="shop-page">
      <div className="shop-banner">
        <div className="container">
          <div className="shop-banner-inner">
            <div className="shop-banner-copy">
              <span className="shop-kicker">{t('plumbingEssentials')}</span>
              <h1>{t('heroTitle')}</h1>
              <p>{t('heroSubtitle')}</p>
              <div className="shop-banner-metrics" aria-label="Store highlights">
                <span>{t('productLines')}</span>
                <span>{t('codOnly')}</span>
                <span>{t('pickupFromShop')}</span>
              </div>
            </div>
            <div className="shop-banner-media" aria-hidden="true">
              <img src={heroImage} alt="" />
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="shop-layout">
          <aside className={`shop-sidebar ${filtersOpen ? 'open' : ''}`} aria-label="Shop filters">
            <div className="sidebar-header">
              <h2 className="sidebar-title">{t('filters')}</h2>
              <button className="btn btn-ghost btn-sm" onClick={resetFilters}>{t('clearAll')}</button>
            </div>
            {catalogWarnings.length > 0 ? (
              <p style={{ color: 'var(--danger)', fontSize: '0.8125rem', marginBottom: '0.75rem' }}>
                {catalogWarnings.join(' ')}
              </p>
            ) : null}

            <div className="filter-group">
              <h3 className="filter-label">{t('category')}</h3>
              {categories.map((cat) => (
                <label key={cat} className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    checked={selectedCategory === cat}
                    onChange={() => { setSelectedCategory(cat); setPage(1); }}
                  />
                  <span>{cat === 'All' ? t('allCategories') : translateCategory(cat)}</span>
                  <span className="filter-count">
                    {cat === 'All' ? products.length : products.filter((p) => p.category === cat).length}
                  </span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3 className="filter-label">{t('brand')}</h3>
              {brands.map((brand) => (
                <label key={brand} className="filter-option">
                  <input
                    type="radio"
                    name="brand"
                    checked={selectedBrand === brand}
                    onChange={() => { setSelectedBrand(brand); setPage(1); }}
                  />
                  <span>{brand === 'All' ? t('allBrands') : brand}</span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3 className="filter-label">{t('priceRange')}</h3>
              <div className="price-range-inputs">
                <input
                  className="input"
                  type="number"
                  placeholder={t('min')}
                  value={priceMin}
                  min="0"
                  onChange={(event) => { setPriceMin(event.target.value); setPage(1); }}
                  aria-label="Minimum price"
                />
                <span className="price-range-sep">-</span>
                <input
                  className="input"
                  type="number"
                  placeholder={t('max')}
                  value={priceMax}
                  min="0"
                  onChange={(event) => { setPriceMax(event.target.value); setPage(1); }}
                  aria-label="Maximum price"
                />
              </div>
            </div>

            <div className="filter-group">
              <h3 className="filter-label">{t('availability')}</h3>
              {availabilityOptions.map((opt) => (
                <label key={opt} className="filter-option">
                  <input
                    type="checkbox"
                    checked={availability.includes(opt)}
                    onChange={() => toggleAvailability(opt)}
                  />
                  <span>{translateStock(opt)}</span>
                </label>
              ))}
            </div>
          </aside>

          <main className="shop-main" id="main-content">
            <div className="shop-toolbar">
              <div className="input-group shop-search">
                <span className="input-icon" aria-hidden="true">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                  className="input"
                  type="search"
                  placeholder={t('searchProducts')}
                  value={search}
                  onChange={(event) => { setSearch(event.target.value); setPage(1); }}
                  aria-label={t('searchProducts')}
                />
              </div>

              <div className="toolbar-right">
                <span className="results-count">{t('products', filtered.length)}</span>
                <select
                  className="select sort-select"
                  value={sort}
                  onChange={(event) => { setSort(event.target.value); setPage(1); }}
                  aria-label={t('sortDefault')}
                >
                  {sortOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                <button
                  className="btn btn-outline btn-sm filter-toggle-btn"
                  onClick={() => setFiltersOpen(!filtersOpen)}
                  aria-expanded={filtersOpen}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
                  {t('filters')}
                </button>
              </div>
            </div>

            <div className="category-tabs" role="tablist" aria-label={t('category')}>
              {categories.slice(0, 7).map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => { setSelectedCategory(cat); setPage(1); }}
                >
                  {cat === 'All' ? t('allCategories') : translateCategory(cat)}
                </button>
              ))}
            </div>

            {loading ? (
              <EmptyState icon="..." title={t('loadingProducts')} description={t('loadingProducts')} />
            ) : paginated.length === 0 ? (
              <EmptyState
                icon="*"
                title={t('noProductsFound')}
                description={loadError || t('adjustFilters')}
                actionLabel={t('clearFilters')}
                onAction={resetFilters}
              />
            ) : (
              <div className="product-grid">
                {paginated.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onAddToCart={onAddToCart}
                    onViewDetails={() => navigate('product-details', { id: product.id })}
                  />
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <nav className="pagination" aria-label={t('productsPagination')}>
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label={t('previousPage')}
                >
                  {'<'}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`page-btn ${page === p ? 'active' : ''}`}
                    onClick={() => setPage(p)}
                    aria-label={t('pageNumber', p)}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label={t('nextPage')}
                >
                  {'>'}
                </button>
              </nav>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
