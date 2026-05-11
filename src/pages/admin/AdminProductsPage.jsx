// src/pages/admin/AdminProductsPage.jsx
import { useState } from 'react';
import { products } from '../../data/products.js';
import { StockBadge } from '../../components/ui/StatusBadge.jsx';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';

export default function AdminProductsPage({ navigate }) {
  const { categories } = useCatalogOptions();
  const { t, translateCategory, productName, productAltName } = useLocalization();
  const [search, setSearch] = useState('');
  const [categoryTab, setCategoryTab] = useState('All');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      p.nameEn.toLowerCase().includes(q) ||
      p.nameAr.includes(q) ||
      p.sku.toLowerCase().includes(q);
    const matchCat = categoryTab === 'All' || p.category === categoryTab;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-page-toolbar">
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={t('searchByNameSku')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label={t('searchProducts')}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-outline btn-sm">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
            {t('advancedFilter')}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('admin-catalog')}>
            {t('manageCategoriesBrands')}
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => navigate('admin-product-form')}>
            + {t('addProduct')}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="admin-tabs" role="tablist" aria-label={t('category')}>
        {categories.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={categoryTab === cat}
            className={`admin-tab ${categoryTab === cat ? 'active' : ''}`}
            onClick={() => { setCategoryTab(cat); setPage(1); }}
          >
            {cat === 'All' ? t('allCategories') : translateCategory(cat)}
          </button>
        ))}
      </div>

      {/* Table */}
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
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('noProductsFound')}
                  </td>
                </tr>
              ) : (
                paginated.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="admin-product-thumb">
                        <img src={p.image} alt={productName(p)} />
                      </div>
                    </td>
                    <td>
                      <p style={{ fontWeight: 600 }}>{productName(p)}</p>
                      <p className="arabic-text" lang="ar" dir="rtl" style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{productAltName(p)}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted-light)' }}>{p.brand}</p>
                    </td>
                    <td><span className="sku-text">{p.sku}</span></td>
                    <td><span className="badge badge-muted">{translateCategory(p.category)}</span></td>
                    <td><strong>{p.price.toFixed(2)}</strong></td>
                    <td>{p.stock}</td>
                    <td><StockBadge status={p.stockStatus} /></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-outline btn-sm" aria-label={`${t('view')} ${productName(p)}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                          {t('view')}
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          aria-label={`${t('edit')} ${productName(p)}`}
                          onClick={() => navigate('admin-product-form')}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          {t('edit')}
                        </button>
                        <button className="btn btn-danger btn-sm" aria-label={`${t('delete')} ${productName(p)}`}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="pagination" aria-label={t('productsPagination')}>
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label={t('previousPage')}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`page-btn ${page === p ? 'active' : ''}`}
              onClick={() => setPage(p)}
              aria-label={t('pageNumber', p)}
              aria-current={page === p ? 'page' : undefined}
            >{p}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label={t('nextPage')}>›</button>
        </nav>
      )}
    </div>
  );
}
