// src/pages/admin/AdminInventoryPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { STOCK_STATUSES } from '../../constants/domain.js';
import { StockBadge } from '../../components/ui/StatusBadge.jsx';
import useCatalogOptions from '../../hooks/useCatalogOptions.js';
import { useLocalization } from '../../i18n/Localization.jsx';
import { listAdminProducts } from '../../services/productsService.js';

const LOW_STOCK_THRESHOLD = 20;

export default function AdminInventoryPage() {
  const { categories } = useCatalogOptions();
  const { t, translateCategory, productName } = useLocalization();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryTab, setCategoryTab] = useState('All');
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  useEffect(() => {
    let ignore = false;
    const loadInventory = async () => {
      setLoading(true);
      setError('');
      try {
        const rows = await listAdminProducts();
        if (!ignore) setItems(rows);
      } catch (fetchError) {
        if (!ignore) setError(fetchError.message || t('productsLoadFailed'));
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadInventory();
    return () => {
      ignore = true;
    };
  }, [t]);

  const inventoryItems = useMemo(
    () => items.map((item) => ({ ...item, lowStockThreshold: LOW_STOCK_THRESHOLD })),
    [items]
  );

  const alerts = useMemo(
    () =>
      inventoryItems.filter(
        (item) =>
          item.stockStatus === STOCK_STATUSES.LOW_STOCK ||
          item.stockStatus === STOCK_STATUSES.OUT_OF_STOCK
      ),
    [inventoryItems]
  );

  const totalInventoryValue = useMemo(
    () => inventoryItems.reduce((sum, item) => sum + item.price * item.stock, 0),
    [inventoryItems]
  );

  const filtered = useMemo(
    () =>
      inventoryItems.filter((item) => {
        const q = search.toLowerCase();
        const matchSearch =
          !q || item.nameEn.toLowerCase().includes(q) || item.sku.toLowerCase().includes(q);
        const matchCat = categoryTab === 'All' || item.category === categoryTab;
        return matchSearch && matchCat;
      }),
    [categoryTab, inventoryItems, search]
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="admin-page animate-fadeIn">
      <div className="inventory-stats">
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('totalSkuAlerts')}</span>
          <span className="stat-mini-value" style={{ color: 'var(--danger)' }}>{alerts.length}</span>
        </div>
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('pendingRestocks')}</span>
          <span className="stat-mini-value" style={{ color: 'var(--warning)' }}>
            {alerts.filter((item) => item.stockStatus === STOCK_STATUSES.OUT_OF_STOCK).length}
          </span>
        </div>
        <div className="card stat-mini">
          <span className="stat-mini-label">{t('totalInventoryValue')}</span>
          <span className="stat-mini-value">
            EGP {totalInventoryValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {alerts.length > 0 && (
        <div className="card inventory-alerts-panel" style={{ marginTop: '1.25rem' }}>
          <div className="card-header" style={{ background: '#FFF7ED', borderBottomColor: '#FED7AA' }}>
            <h2 style={{ fontSize: '1rem', color: '#C2410C' }}>
              {t('inventoryAlerts', alerts.length)}
            </h2>
          </div>
          <div className="card-body">
            <div className="alerts-grid">
              {alerts.map((item) => (
                <div
                  key={item.id}
                  className={`alert-chip ${item.stockStatus === STOCK_STATUSES.OUT_OF_STOCK ? 'critical' : 'low'}`}
                >
                  <div className="alert-chip-img">
                    <img src={item.image} alt={productName(item)} />
                  </div>
                  <div className="alert-chip-info">
                    <p className="alert-chip-name">{productName(item)}</p>
                    <p className="alert-chip-sku">{item.sku}</p>
                  </div>
                  <div className="alert-chip-right">
                    <StockBadge status={item.stockStatus} />
                    <span className="alert-chip-stock">{item.stock} {t('units')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            aria-label={t('searchInventory')}
          />
        </div>
      </div>

      <div className="admin-tabs" role="tablist" aria-label={t('category')}>
        {categories.map((cat) => (
          <button
            key={cat}
            role="tab"
            aria-selected={categoryTab === cat}
            className={`admin-tab ${categoryTab === cat ? 'active' : ''}`}
            onClick={() => {
              setCategoryTab(cat);
              setPage(1);
            }}
          >
            {cat === 'All' ? t('allCategories') : translateCategory(cat)}
          </button>
        ))}
      </div>

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
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {t('loadingProducts')}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--muted)', padding: '2.5rem' }}>
                    {error || t('noItemsFound')}
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr
                    key={item.id}
                    className={
                      item.stockStatus === STOCK_STATUSES.OUT_OF_STOCK
                        ? 'row-critical'
                        : item.stockStatus === STOCK_STATUSES.LOW_STOCK
                          ? 'row-warning'
                          : ''
                    }
                  >
                    <td>
                      <div className="admin-product-thumb">
                        <img src={item.image} alt={productName(item)} />
                      </div>
                    </td>
                    <td><span className="sku-text">{item.sku}</span></td>
                    <td>
                      <p style={{ fontWeight: 600 }}>{productName(item)}</p>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--muted)' }}>{item.brand}</p>
                    </td>
                    <td><span className="badge badge-muted">{translateCategory(item.category)}</span></td>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          color:
                            item.stock === 0
                              ? 'var(--danger)'
                              : item.stock < LOW_STOCK_THRESHOLD
                                ? 'var(--warning)'
                                : 'var(--success)',
                        }}
                      >
                        {item.stock}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{item.lowStockThreshold}</td>
                    <td><StockBadge status={item.stockStatus} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <nav className="pagination" aria-label={t('inventoryPagination')}>
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
