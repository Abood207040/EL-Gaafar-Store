// src/pages/admin/AdminProductsPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { StockBadge } from '../../components/ui/StatusBadge.jsx';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';
import { deactivateAdminProduct, listAdminProducts } from '../../services/productsService.js';

export default function AdminProductsPage({ navigate }) {
  const { categories } = useCatalogOptions();
  const { t, translateCategory, productName, productAltName } = useLocalization();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryTab, setCategoryTab] = useState('All');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    let ignore = false;
    const loadProducts = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await listAdminProducts();
        if (!ignore) setItems(data);
      } catch (fetchError) {
        if (!ignore) setError(fetchError.message || t('productsLoadFailed'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      ignore = true;
    };
  }, [t]);

  const handleDelete = async (product) => {
    const confirmed = window.confirm(t('confirmDeleteProduct', productName(product)));
    if (!confirmed) return;

    try {
      await deactivateAdminProduct(product.id);
      setItems((prev) => prev.map((item) => (item.id === product.id ? { ...item, active: false } : item)));
    } catch (deleteError) {
      window.alert(deleteError.message || t('deleteProductFailed'));
    }
  };

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return items.filter((product) => {
      const matchSearch =
        !q ||
        product.nameEn.toLowerCase().includes(q) ||
        product.nameAr.toLowerCase().includes(q) ||
        product.sku.toLowerCase().includes(q);
      const matchCat = categoryTab === 'All' || product.category === categoryTab;
      return matchSearch && matchCat;
    });
  }, [categoryTab, items, search]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-page-toolbar">
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={t('searchByNameSku')}
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label={t('searchProducts')}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('admin-catalog')}>
            {t('manageCategoriesBrands')}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('admin-product-form')}>
            + {t('addProduct')}
          </button>
        </div>
      </div>

      {error ? (
        <p style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{error}</p>
      ) : null}

      <div className="admin-tabs" role="tablist" aria-label={t('category')}>
        {categories.map((category) => (
          <button
            key={category}
            role="tab"
            aria-selected={categoryTab === category}
            className={`admin-tab ${categoryTab === category ? 'active' : ''}`}
            onClick={() => {
              setCategoryTab(category);
              setPage(1);
            }}
          >
            {category === 'All' ? t('allCategories') : translateCategory(category)}
          </button>
        ))}
      </div>

      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('image')}</th>
                <th>{t('productName')}</th>
                <th>{t('sku')}</th>
                <th>{t('category')}</th>
                <th>{t('priceSar')}</th>
                <th>{t('stock')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('loadingProducts')}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('noProductsFound')}
                  </td>
                </tr>
              ) : (
                paginated.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-product-thumb">
                        <img src={product.image} alt={productName(product)} />
                      </div>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600 }}>{productName(product)}</p>
                      <p className="arabic-text" lang="ar" dir="rtl" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{productAltName(product)}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted-light)' }}>{product.brand}</p>
                      {product.active === false ? (
                        <span className="badge badge-muted" style={{ marginTop: '0.35rem' }}>
                          {t('unavailable')}
                        </span>
                      ) : null}
                    </td>
                    <td><span className="sku-text">{product.sku}</span></td>
                    <td><span className="badge badge-muted">{translateCategory(product.category)}</span></td>
                    <td><strong>EGP {product.price.toFixed(2)}</strong></td>
                    <td>{product.stock}</td>
                    <td><StockBadge status={product.stockStatus} /></td>
                    <td>
                      <div className="action-btns">
                        <button
                          className="btn btn-outline btn-sm"
                          aria-label={`${t('edit')} ${productName(product)}`}
                          onClick={() => navigate('admin-product-form', { product })}
                        >
                          {t('edit')}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          aria-label={`${t('delete')} ${productName(product)}`}
                          onClick={() => handleDelete(product)}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
          {Array.from({ length: totalPages }, (_, index) => index + 1).map((p) => (
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
    </div>
  );
}
