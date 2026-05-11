// src/pages/admin/AdminInventoryPage.jsx
import { useState } from 'react';
import { products, STOCK_STATUSES } from '../../data/products.js';
import { StockBadge } from '../../components/ui/StatusBadge.jsx';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';

const LOW_STOCK_THRESHOLD = 20;

const inventoryItems = products.map(p => ({
  ...p,
  lowStockThreshold: LOW_STOCK_THRESHOLD,
}));

const alerts = inventoryItems.filter(
  p => p.stockStatus === STOCK_STATUSES.LOW_STOCK || p.stockStatus === STOCK_STATUSES.OUT_OF_STOCK
);

const totalInventoryValue = products.reduce((sum, p) => sum + p.price * p.stock, 0);

export default function AdminInventoryPage() {
  const { categories } = useCatalogOptions();
  const { t, translateCategory, productName } = useLocalization();
  const [search, setSearch] = useState('');
  const [categoryTab, setCategoryTab] = useState('All');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const filtered = inventoryItems.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.nameEn.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchCat = categoryTab === 'All' || p.category === categoryTab;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="admin-page animate-fadeIn">
      {/* Stats */}
      <div className="inventory-stats">
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('totalSkuAlerts')}</span>
          <span className="stat-mini-value" style={{ color: 'var(--danger)' }}>{alerts.length}</span>
        </div>
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('pendingRestocks')}</span>
          <span className="stat-mini-value" style={{ color: 'var(--warning)' }}>
            {alerts.filter(a => a.stockStatus === STOCK_STATUSES.OUT_OF_STOCK).length}
          </span>
        </div>
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('totalInventoryValue')}</span>
          <span className="stat-mini-value">SAR {totalInventoryValue.toLocaleString('en-SA', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Alerts Panel */}
      {alerts.length > 0 && (
        <div className="card inventory-alerts-panel" style={{ marginTop: '1.25rem' }}>
          <div className="card-header" style={{ background: '#FFF7ED', borderBottomColor: '#FED7AA' }}>
            <h2 style={{ fontSize: '1rem', color: '#C2410C' }}>
              {t('inventoryAlerts', alerts.length)}
            </h2>
          </div>
          <div className="card-body">
            <div className="alerts-grid">
              {alerts.map(p => (
                <div
                  key={p.id}
                  className={`alert-chip ${p.stockStatus === STOCK_STATUSES.OUT_OF_STOCK ? 'critical' : 'low'}`}
                >
                  <div className="alert-chip-img">
                    <img src={p.image} alt={productName(p)} />
                  </div>
                  <div className="alert-chip-info">
                    <p className="alert-chip-name">{productName(p)}</p>
                    <p className="alert-chip-sku">{p.sku}</p>
                  </div>
                  <div className="alert-chip-right">
                    <StockBadge status={p.stockStatus} />
                    <span className="alert-chip-stock">{p.stock} {t('units')}</span>
                    <button className="btn btn-outline btn-sm">{t('restock')}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="admin-page-toolbar" style={{ marginTop: '1.5rem' }}>
        <div className="input-group" style={{ maxWidth: 320 }}>
          <span className="input-icon" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </span>
          <input
            className="input"
            type="search"
            placeholder={t('searchInventory')}
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            aria-label={t('searchInventory')}
          />
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

      {/* Inventory Table */}
      <div className="card" style={{ marginTop: '1rem' }}>
        <div className="table-wrapper" style={{ border: 'none' }}>
          <table className="table">
            <thead>
              <tr>
                <th>{t('image')}</th>
                <th>{t('sku')}</th>
                <th>{t('productName')}</th>
                <th>{t('category')}</th>
                <th>{t('stock')}</th>
                <th>{t('lowStockThreshold')}</th>
                <th>{t('status')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('noItemsFound')}
                  </td>
                </tr>
              ) : (
                paginated.map(p => (
                  <tr key={p.id} className={p.stockStatus === STOCK_STATUSES.OUT_OF_STOCK ? 'row-critical' : p.stockStatus === STOCK_STATUSES.LOW_STOCK ? 'row-warning' : ''}>
                    <td>
                      <div className="admin-product-thumb">
                        <img src={p.image} alt={productName(p)} />
                      </div>
                    </td>
                    <td><span className="sku-text">{p.sku}</span></td>
                    <td>
                      <p style={{ fontWeight: 600 }}>{productName(p)}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{p.brand}</p>
                    </td>
                    <td><span className="badge badge-muted">{translateCategory(p.category)}</span></td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: p.stock === 0 ? 'var(--danger)' : p.stock < LOW_STOCK_THRESHOLD ? 'var(--warning)' : 'var(--success)'
                      }}>
                        {p.stock}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{p.lowStockThreshold}</td>
                    <td><StockBadge status={p.stockStatus} /></td>
                    <td>
                      <div className="action-btns">
                        <button className="btn btn-outline btn-sm">{t('edit')}</button>
                        <button className="btn btn-primary btn-sm">{t('restock')}</button>
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
        <nav className="pagination" aria-label={t('inventoryPagination')}>
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} aria-label={t('previousPage')}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} className={`page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)} aria-label={t('pageNumber', p)}>{p}</button>
          ))}
          <button className="page-btn" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} aria-label={t('nextPage')}>›</button>
        </nav>
      )}
    </div>
  );
}
