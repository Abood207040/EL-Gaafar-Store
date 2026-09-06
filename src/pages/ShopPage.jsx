// src/pages/ShopPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { STOCK_STATUSES } from '../constants/domain.js';
import ProductCard from '../components/products/ProductCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import useCatalogOptions from '../hooks/useCatalogOptions.js';
import { useLocalization } from '../i18n/Localization.jsx';
import { listStoreProducts } from '../services/productsService.js';

const ITEMS_PER_PAGE = 8;

export default function ShopPage({ onAddToCart, navigate }) {
  const { categories, brands, catalogWarnings } = useCatalogOptions();
  const { t, isArabic, translateCategory, translateStock } = useLocalization();
  const [searchParams, setSearchParams] = useSearchParams();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Read filters from URL
  const search = searchParams.get('q') || '';
  const selectedCategory = searchParams.get('category') || 'All';
  const selectedBrand = searchParams.get('brand') || 'All';
  const priceMin = searchParams.get('min') || '';
  const priceMax = searchParams.get('max') || '';
  const sort = searchParams.get('sort') || 'default';
  const page = parseInt(searchParams.get('page') || '1', 10);
  
  // Availability is still local state for simplicity unless we want comma-separated URL
  const [availability, setAvailability] = useState([]);

  // Helper to update URL params
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value === '' || value === 'All' || value === 'default' || (key === 'page' && value === 1)) {
      newParams.delete(key);
    } else {
      newParams.set(key, value);
    }
    // Reset page to 1 when changing any filter except page
    if (key !== 'page') {
      newParams.delete('page');
    }
    setSearchParams(newParams);
  };

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
    setSearchParams(new URLSearchParams());
    setAvailability([]);
  };

  const toggleAvailability = (val) => {
    setAvailability((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
    updateFilter('page', 1);
  };

  const hasActiveFilters = Boolean(
    search.trim() ||
    selectedCategory !== 'All' ||
    selectedBrand !== 'All' ||
    priceMin !== '' ||
    priceMax !== '' ||
    availability.length > 0
  );

  return (
    <div className="shop-page animate-fadeIn" style={{ paddingTop: '1.5rem', paddingBottom: '4rem' }}>
      {/* Shop Modern Header Banner */}
      <div className="container" style={{ marginBottom: '1.75rem' }}>
        <div className="shop-header-card">
          <div className="shop-header-content">
            <span className="shop-header-kicker">
              {isArabic ? 'معرض ومؤسسة الجعفر • أسوان، مصر' : 'Al-Jafar Store • Aswan, Egypt'}
            </span>
            <h1 className="shop-header-title">
              {isArabic ? 'كتالوج مستلزمات السباكة والأدوات الصحية' : 'Sanitary Ware & Plumbing Tools Catalog'}
            </h1>
            <p className="shop-header-desc">
              {isArabic 
                ? 'تصفح أحدث الخلاطات، المحابس، أطقم الحمامات والمواسير بأعلى مواصفات الجودة والضمان في أسوان.' 
                : 'Browse high-quality faucets, mixers, valves, and bathroom fixtures with certified quality and warranty in Aswan.'}
            </p>
          </div>
          <div className="shop-header-metrics">
            <div className="shop-metric-pill">
              <span className="metric-val">{products.length}</span>
              <span className="metric-lbl">{isArabic ? 'منتج متوفر' : 'Products'}</span>
            </div>
            <div className="shop-metric-pill">
              <span className="metric-val">{categories.length - 1}</span>
              <span className="metric-lbl">{isArabic ? 'أقسام رئيسية' : 'Categories'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="shop-layout">
          {/* Mobile Overlay */}
          {filtersOpen && (
            <div className="sidebar-backdrop" onClick={() => setFiltersOpen(false)} />
          )}

          {/* Sidebar */}
          <aside className={`shop-sidebar ${filtersOpen ? 'open' : ''}`} aria-label="Shop filters">
            <div className="sidebar-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="12" y1="18" x2="12" y2="18"/></svg>
                <h2 className="sidebar-title" style={{ margin: 0 }}>{t('filters')}</h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {hasActiveFilters && (
                  <button className="btn btn-ghost btn-sm" onClick={resetFilters}>{t('clearAll')}</button>
                )}
                {filtersOpen && (
                  <button className="sidebar-close-btn" onClick={() => setFiltersOpen(false)}>✕</button>
                )}
              </div>
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
                    onChange={() => updateFilter('category', cat)}
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
                    onChange={() => updateFilter('brand', brand)}
                  />
                  <span>{brand === 'All' ? t('allBrands') : brand}</span>
                </label>
              ))}
            </div>

            <div className="filter-group">
              <h3 className="filter-label">{t('priceRange')} ({isArabic ? 'ج.م' : 'EGP'})</h3>
              <div className="price-range-inputs">
                <input
                  className="input"
                  type="number"
                  placeholder={t('min')}
                  value={priceMin}
                  min="0"
                  onChange={(event) => updateFilter('min', event.target.value)}
                  aria-label="Minimum price"
                />
                <span className="price-range-sep">-</span>
                <input
                  className="input"
                  type="number"
                  placeholder={t('max')}
                  value={priceMax}
                  min="0"
                  onChange={(event) => updateFilter('max', event.target.value)}
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

            {filtersOpen && (
              <button 
                className="btn btn-primary w-full" 
                style={{ marginTop: '1.5rem' }} 
                onClick={() => setFiltersOpen(false)}
              >
                {isArabic ? 'تطبيق الفلاتر وتصفح النتائج' : 'Apply Filters'}
              </button>
            )}
          </aside>

          <main className="shop-main" id="main-content">
            {/* Toolbar */}
            <div className="shop-toolbar">
              <div className="input-group shop-search">
                <span className="input-icon" aria-hidden="true">
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input
                  className="input"
                  type="search"
                  placeholder={t('searchProducts')}
                  value={search}
                  onChange={(event) => updateFilter('q', event.target.value)}
                  aria-label={t('searchProducts')}
                />
                {search && (
                  <button 
                    type="button" 
                    className="search-toolbar-clear" 
                    onClick={() => updateFilter('q', '')}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="toolbar-right">
                <span className="results-count">
                  <strong>{filtered.length}</strong> {filtered.length === 1 ? t('item') : t('items')}
                </span>
                <select
                  className="select sort-select"
                  value={sort}
                  onChange={(event) => updateFilter('sort', event.target.value)}
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
                  <span>{t('filters')}</span>
                  {hasActiveFilters && <span className="active-filter-badge-dot" />}
                </button>
              </div>
            </div>

            {/* Category Quick Pill Tabs */}
            <div className="category-tabs" role="tablist" aria-label={t('category')}>
              {categories.map((cat) => (
                <button
                  key={cat}
                  role="tab"
                  aria-selected={selectedCategory === cat}
                  className={`category-tab ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => updateFilter('category', cat)}
                >
                  {cat === 'All' ? t('allCategories') : translateCategory(cat)}
                </button>
              ))}
            </div>

            {/* Active Filter Chips Strip */}
            {hasActiveFilters && (
              <div className="active-filters-strip animate-fadeIn">
                <span className="active-filters-title">{isArabic ? 'الفلاتر النشطة:' : 'Active Filters:'}</span>
                
                {search.trim() && (
                  <span className="filter-chip">
                    <span>{isArabic ? 'بحث:' : 'Search:'} "{search}"</span>
                    <button onClick={() => updateFilter('q', '')} aria-label="Remove search filter">✕</button>
                  </span>
                )}

                {selectedCategory !== 'All' && (
                  <span className="filter-chip">
                    <span>{isArabic ? 'القسم:' : 'Category:'} {translateCategory(selectedCategory)}</span>
                    <button onClick={() => updateFilter('category', 'All')} aria-label="Remove category filter">✕</button>
                  </span>
                )}

                {selectedBrand !== 'All' && (
                  <span className="filter-chip">
                    <span>{isArabic ? 'الماركة:' : 'Brand:'} {selectedBrand}</span>
                    <button onClick={() => updateFilter('brand', 'All')} aria-label="Remove brand filter">✕</button>
                  </span>
                )}

                {(priceMin !== '' || priceMax !== '') && (
                  <span className="filter-chip">
                    <span>
                      {isArabic ? 'السعر:' : 'Price:'} {priceMin || 0} - {priceMax || '∞'} {isArabic ? 'ج.م' : 'EGP'}
                    </span>
                    <button onClick={() => { updateFilter('min', ''); updateFilter('max', ''); }} aria-label="Remove price filter">✕</button>
                  </span>
                )}

                {availability.map((opt) => (
                  <span key={opt} className="filter-chip">
                    <span>{translateStock(opt)}</span>
                    <button onClick={() => toggleAvailability(opt)} aria-label={`Remove ${opt} filter`}>✕</button>
                  </span>
                ))}

                <button className="clear-all-chip-btn" onClick={resetFilters}>
                  {isArabic ? 'مسح الكل' : 'Clear All'}
                </button>
              </div>
            )}


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
                  onClick={() => updateFilter('page', Math.max(1, page - 1))}
                  disabled={page === 1}
                  aria-label={t('previousPage')}
                >
                  {'<'}
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`page-btn ${page === p ? 'active' : ''}`}
                    onClick={() => updateFilter('page', p)}
                    aria-label={t('pageNumber', p)}
                    aria-current={page === p ? 'page' : undefined}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="page-btn"
                  onClick={() => updateFilter('page', Math.min(totalPages, page + 1))}
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
