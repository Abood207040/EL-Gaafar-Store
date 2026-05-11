// src/pages/admin/AdminDashboardPage.jsx
import { useEffect, useMemo, useState } from 'react';
import { ORDER_STATUSES, STOCK_STATUSES } from '../../constants/domain.js';
import { OrderStatusBadge, StockBadge } from '../../components/ui/StatusBadge.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';
import { getAdminOrders } from '../../services/adminOrdersService.js';
import { listAdminProducts } from '../../services/productsService.js';

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="stat-card card">
      <div className="stat-card-body">
        <div className="stat-icon" style={{ background: `${color}22`, color }}>
          {icon}
        </div>
        <div>
          <p className="stat-label">{label}</p>
          <p className="stat-value">{value}</p>
          {sub && <p className="stat-sub">{sub}</p>}
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage({ navigate }) {
  const { t, productName } = useLocalization();
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let ignore = false;
    const loadDashboard = async () => {
      setLoading(true);
      setError('');
      try {
        const [ordersRows, productsRows] = await Promise.all([getAdminOrders(), listAdminProducts()]);
        if (!ignore) {
          setOrders(ordersRows);
          setProducts(productsRows);
        }
      } catch (fetchError) {
        if (!ignore) {
          setError(fetchError.message || t('productsLoadFailed'));
          setOrders([]);
          setProducts([]);
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadDashboard();
    return () => {
      ignore = true;
    };
  }, [t]);

  const lowStockProducts = useMemo(
    () =>
      products.filter(
        (product) =>
          product.stockStatus === STOCK_STATUSES.LOW_STOCK ||
          product.stockStatus === STOCK_STATUSES.OUT_OF_STOCK
      ),
    [products]
  );

  const totalSales = useMemo(
    () =>
      orders
        .filter((order) => order.status === ORDER_STATUSES.DELIVERED)
        .reduce((sum, order) => sum + order.total, 0),
    [orders]
  );

  const pendingOrders = useMemo(
    () => orders.filter((order) => order.status === ORDER_STATUSES.PENDING).length,
    [orders]
  );

  return (
    <div className="admin-page animate-fadeIn">
      {error ? (
        <p style={{ color: 'var(--danger)', marginBottom: '0.75rem', fontSize: '0.875rem' }}>{error}</p>
      ) : null}
      <div className="admin-stats-grid">
        <StatCard
          label={t('totalSales')}
          value={loading ? '...' : `EGP ${totalSales.toFixed(2)}`}
          icon="EGP"
          color="#F67113"
          sub={t('deliveredOrders')}
        />
        <StatCard
          label={t('totalOrders')}
          value={loading ? '...' : orders.length}
          icon="OR"
          color="#0EA5E9"
          sub={t('deliveryAndPickup')}
        />
        <StatCard
          label={t('pendingOrders')}
          value={loading ? '...' : pendingOrders}
          icon="PD"
          color="#F97316"
          sub={t('awaitingConfirmation')}
        />
        <StatCard
          label={t('lowStockItems')}
          value={loading ? '...' : lowStockProducts.length}
          icon="ST"
          color="#DC2626"
          sub={t('needRestocking')}
        />
      </div>

      <div className="admin-dashboard-grid">
        <div className="card">
          <div className="card-header">
            <h2 style={{ fontSize: '1rem' }}>{t('recentOrders')}</h2>
            <button className="btn btn-outline btn-sm" onClick={() => navigate('admin-orders')}>
              {t('viewAll')}
            </button>
          </div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>{t('adminOrders')}</th>
                  <th>{t('customer')}</th>
                  <th>{t('total')}</th>
                  <th>{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {(orders.slice(0, 5)).map((order) => (
                  <tr key={order.id} style={{ cursor: 'pointer' }} onClick={() => navigate('admin-orders')}>
                    <td><span className="sku-text">#{order.orderNumber || order.id}</span></td>
                    <td>
                      <p style={{ fontWeight: 500 }}>{order.customer?.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{order.customer?.phone}</p>
                    </td>
                    <td>EGP {order.total.toFixed(2)}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                  </tr>
                ))}
                {!loading && orders.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', color: 'var(--muted)', padding: '1rem' }}>
                      {t('noOrdersFound')}
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="card">
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('stockAlerts')}</h2>
              <button className="btn btn-outline btn-sm" onClick={() => navigate('admin-inventory')}>
                {t('inventory')}
              </button>
            </div>
            <div className="card-body" style={{ padding: '0.75rem' }}>
              {lowStockProducts.length === 0 ? (
                <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '1rem' }}>{t('wellStocked')}</p>
              ) : (
                lowStockProducts.slice(0, 6).map((product) => (
                  <div key={product.id} className="alert-item">
                    <div>
                      <p className="alert-item-name">{productName(product)}</p>
                      <p className="alert-item-sku">{product.sku}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{product.stock}</span>
                      <StockBadge status={product.stockStatus} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card" style={{ marginTop: '1.25rem' }}>
            <div className="card-header">
              <h2 style={{ fontSize: '1rem' }}>{t('quickActions')}</h2>
            </div>
            <div className="card-body">
              <div className="quick-actions">
                <button className="quick-action-btn" onClick={() => navigate('admin-product-form')}>
                  <span>+</span> {t('addProduct')}
                </button>
                <button className="quick-action-btn" onClick={() => navigate('admin-orders')}>
                  <span>OR</span> {t('viewOrders')}
                </button>
                <button className="quick-action-btn" onClick={() => navigate('admin-inventory')}>
                  <span>ST</span> {t('inventory')}
                </button>
                <button className="quick-action-btn" onClick={() => navigate('admin-customers')}>
                  <span>CU</span> {t('customers')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
