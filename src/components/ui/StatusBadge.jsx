// src/components/ui/StatusBadge.jsx
import { ORDER_STATUSES, STOCK_STATUSES } from '../../constants/domain.js';
import { useLocalization } from '../../i18n/Localization.jsx';

const stockVariantMap = {
  [STOCK_STATUSES.IN_STOCK]: 'success',
  [STOCK_STATUSES.LOW_STOCK]: 'warning',
  [STOCK_STATUSES.OUT_OF_STOCK]: 'danger',
  [STOCK_STATUSES.SHIPS_IN_3]: 'info',
};

const orderVariantMap = {
  [ORDER_STATUSES.PENDING]: 'warning',
  [ORDER_STATUSES.CONFIRMED]: 'info',
  [ORDER_STATUSES.SHIPPED]: 'primary',
  [ORDER_STATUSES.READY_PICKUP]: 'success',
  [ORDER_STATUSES.DELIVERED]: 'success',
  [ORDER_STATUSES.CANCELLED]: 'danger',
};

const stockDot = {
  [STOCK_STATUSES.IN_STOCK]: '#16A34A',
  [STOCK_STATUSES.LOW_STOCK]: '#F97316',
  [STOCK_STATUSES.OUT_OF_STOCK]: '#DC2626',
  [STOCK_STATUSES.SHIPS_IN_3]: '#0EA5E9',
};

const statusClass = (status) =>
  String(status || '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

export function StockBadge({ status, className = '' }) {
  const { translateStock } = useLocalization();
  const variant = stockVariantMap[status] || 'muted';
  const dot = stockDot[status];
  return (
    <span className={`badge status-badge stock-status stock-${statusClass(status)} badge-${variant} ${className}`}>
      {dot && (
        <span
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: dot, display: 'inline-block', flexShrink: 0
          }}
          aria-hidden="true"
        />
      )}
      {translateStock(status)}
    </span>
  );
}

export function OrderStatusBadge({ status, className = '' }) {
  const { translateOrderStatus } = useLocalization();
  const variant = orderVariantMap[status] || 'muted';
  return (
    <span className={`badge status-badge order-status order-${statusClass(status)} badge-${variant} ${className}`}>
      {translateOrderStatus(status)}
    </span>
  );
}
