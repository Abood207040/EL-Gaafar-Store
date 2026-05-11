import { ORDER_STATUSES, RLS_PERMISSION_ERROR } from '../constants/domain.js';
import { supabase } from './authService.js';
import { normalizeOrder } from './ordersService.js';

const ORDERS_TABLE = 'orders';

function baseOrderSelect() {
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

function withAdminRlsError(error) {
  if (!error) return null;
  if (error.code === '42501') {
    return new Error(RLS_PERMISSION_ERROR);
  }
  return error;
}

export async function getAdminOrders() {
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select(baseOrderSelect())
    .order('created_at', { ascending: false });

  if (error) throw withAdminRlsError(error);
  return (data || []).map(normalizeOrder);
}

export async function getAdminOrderById(orderId) {
  const { data, error } = await supabase
    .from(ORDERS_TABLE)
    .select(baseOrderSelect())
    .eq('id', orderId)
    .maybeSingle();

  if (error) throw withAdminRlsError(error);
  return data ? normalizeOrder(data) : null;
}

export async function updateOrderStatus(orderId, status) {
  if (!Object.values(ORDER_STATUSES).includes(status)) {
    throw new Error('Invalid order status.');
  }

  const { error } = await supabase
    .from(ORDERS_TABLE)
    .update({ status })
    .eq('id', orderId);

  if (error) throw withAdminRlsError(error);
}
