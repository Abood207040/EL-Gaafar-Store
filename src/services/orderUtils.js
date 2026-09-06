import { RLS_PERMISSION_ERROR } from '../constants/domain.js';

/**
 * Shared Supabase select fragment for orders with related customers + items.
 * Used by both ordersService.js and adminOrdersService.js.
 */
export function baseOrderSelect() {
  return `
    id,
    customer_id,
    order_number,
    customer_name,
    customer_phone,
    customer_email,
    fulfillment_type,
    status,
    city,
    area,
    street_address,
    notes,
    subtotal,
    logistics_fee,
    tax,
    total,
    payment_method,
    delivery_governorate_id,
    delivery_governorate_name,
    delivery_area_id,
    delivery_area_name,
    delivery_class,
    delivery_requires_manual_quote,
    created_at,
    customers:customer_id (
      id,
      full_name,
      phone,
      email
    ),
    order_items (
      id,
      order_id,
      product_id,
      product_name,
      sku,
      qty,
      unit_price,
      line_total,
      created_at
    )
  `;
}

/**
 * Wraps a Supabase error, replacing a PostgreSQL RLS permission error (42501)
 * with a friendlier message. Used by admin service functions.
 */
export function withAdminRlsError(error) {
  if (!error) return null;
  if (error.code === '42501') {
    return new Error(RLS_PERMISSION_ERROR);
  }
  return error;
}
