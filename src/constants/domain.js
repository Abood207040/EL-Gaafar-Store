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

export const DELIVERY_CLASSES = {
  SMALL: {
    code: 'small',
    rank: 1,
    nameEn: 'Small',
    nameAr: 'صغير',
  },
  MEDIUM: {
    code: 'medium',
    rank: 2,
    nameEn: 'Medium',
    nameAr: 'متوسط',
  },
  LARGE: {
    code: 'large',
    rank: 3,
    nameEn: 'Large',
    nameAr: 'كبير',
  },
  OVERSIZED: {
    code: 'oversized',
    rank: 4,
    nameEn: 'Oversized',
    nameAr: 'ضخم',
  },
  SPECIAL: {
    code: 'special',
    rank: 5,
    nameEn: 'Special',
    nameAr: 'خاص',
    requiresManualQuote: true,
  },
};

export const DELIVERY_CLASS_LIST = [
  DELIVERY_CLASSES.SMALL,
  DELIVERY_CLASSES.MEDIUM,
  DELIVERY_CLASSES.LARGE,
  DELIVERY_CLASSES.OVERSIZED,
  DELIVERY_CLASSES.SPECIAL,
];

export function getDeliveryClassConfig(code) {
  if (!code) return null;
  const normalized = String(code).toLowerCase().trim();
  return (
    DELIVERY_CLASS_LIST.find((c) => c.code === normalized) || {
      code: normalized,
      rank: 2,
      nameEn: code,
      nameAr: code,
    }
  );
}

/**
 * Calculates dominant delivery class from cart items.
 * Highest ranking delivery class in cart wins.
 * Any item with class 'special' triggers rank 5 (Special).
 */
export function getDominantDeliveryClass(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return DELIVERY_CLASSES.MEDIUM;
  }

  let dominant = null;
  let maxRank = 0;

  for (const item of items) {
    const rawClass = item?.product?.deliveryClass || item?.product?.delivery_class;
    if (!rawClass) continue;
    const config = getDeliveryClassConfig(rawClass);
    if (config && config.rank > maxRank) {
      maxRank = config.rank;
      dominant = config;
    }
  }

  return dominant || DELIVERY_CLASSES.MEDIUM;
}
