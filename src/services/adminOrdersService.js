import { ORDER_STATUSES } from '../constants/domain.js';
import { supabase } from './authService.js';
import { normalizeOrder } from './ordersService.js';
import { baseOrderSelect, withAdminRlsError } from './orderUtils.js';

const ORDERS_TABLE = 'orders';

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
