export const ORDER_STATUSES = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  READY_PICKUP: 'Ready for Pickup',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const FULFILLMENT = {
  DELIVERY: 'Delivery',
  PICKUP: 'Pickup from Shop',
};

export const STOCK_STATUSES = {
  IN_STOCK: 'In Stock',
  LOW_STOCK: 'Low Stock',
  OUT_OF_STOCK: 'Out of Stock',
  SHIPS_IN_3: 'Ships in 3 Days',
};

export const PAYMENT_METHODS = {
  COD: 'Cash on Delivery',
};

export const RLS_PERMISSION_ERROR =
  'Permission denied. Make sure you are logged in as admin and RLS policies are configured.';
