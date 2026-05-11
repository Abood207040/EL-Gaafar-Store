// src/pages/admin/AdminDashboardPage.jsx
import { orders, ORDER_STATUSES } from '../../data/orders.js';
import { products, STOCK_STATUSES } from '../../data/products.js';
import { OrderStatusBadge } from '../../components/ui/StatusBadge.jsx';
import { StockBadge } from '../../components/ui/StatusBadge.jsx';
import { useLocalization } from '../../i18n/Localization.jsx';

const lowStockProducts = products.filter(
  p => p.stockStatus === STOCK_STATUSES.LOW_STOCK || p.stockStatus === STOCK_STATUSES.OUT_OF_STOCK
);

const totalSales = orders
  .filter(o => o.status === ORDER_STATUSES.DELIVERED)
  .reduce((sum, o) => sum + o.total, 0);

const pendingOrders = orders.filter(o => o.status === ORDER_STATUSES.PENDING).length;

function StatCard({ label, value, icon, color, sub }) {
  return (
    <div className="stat-card card">
      <div className="stat-card-body">
        <div className="stat-icon" style={{ background: color + '22', color }}>
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

  return (
    <div className="admin-page animate-fadeIn">
      <div className="admin-stats-grid">
        <StatCard
          label={t('totalSales')}
          value={`SAR ${totalSales.toFixed(2)}`}
          icon="SAR"
          color="#F67113"
          sub={t('deliveredOrders')}
        />
        <StatCard
          label={t('totalOrders')}
          value={orders.length}
          icon="ORD"
          color="#0EA5E9"
          sub={t('deliveryAndPickup')}
        />
        <StatCard
          label={t('pendingOrders')}
          value={pendingOrders}
          icon="NEW"
          color="#F97316"
          sub={t('awaitingConfirmation')}
        />
        <StatCard
          label={t('lowStockItems')}
          value={lowStockProducts.length}
          icon="LOW"
          color="#DC2626"
          sub={t('needRestocking')}
        />
      </div>

      <div className="admin-dashboard-grid">
        {/* Recent Orders */}
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
                {orders.slice(0, 5).map(o => (
                  <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate('admin-orders')}>
                    <td><span className="sku-text">#{o.id}</span></td>
                    <td>
                      <p style={{ fontWeight: 500 }}>{o.customer.name}</p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>{o.customer.phone}</p>
                    </td>
                    <td>SAR {o.total.toFixed(2)}</td>
                    <td><OrderStatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div>
          {/* Stock Alerts */}
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
                lowStockProducts.map(p => (
                  <div key={p.id} className="alert-item">
                    <div>
                      <p className="alert-item-name">{productName(p)}</p>
                      <p className="alert-item-sku">{p.sku}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{p.stock}</span>
                      <StockBadge status={p.stockStatus} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
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
