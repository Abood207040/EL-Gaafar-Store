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

export async function updateOrderStatus(orderId, status, notes = null) {
  // Normalize checking against domain constants or lowercase variants
  const validStatuses = Object.values(ORDER_STATUSES).map(s => s.toLowerCase());
  const inputLower = String(status || '').toLowerCase().trim();
  
  if (!validStatuses.includes(inputLower) && !Object.values(ORDER_STATUSES).includes(status)) {
    throw new Error('Invalid order status.');
  }

  // Attempt authoritative RPC with atomic inventory handling
  const { data, error } = await supabase.rpc('admin_update_order_status', {
    p_order_id: orderId,
    p_new_status: status,
    p_notes: notes
  });

  if (error) {
    // If RPC is missing in local environment, fallback with warning
    if (error.code === 'PGRST202' || error.message?.includes('function public.admin_update_order_status')) {
      console.warn('admin_update_order_status RPC not detected in DB, falling back to direct table update.');
      const { error: directError } = await supabase
        .from(ORDERS_TABLE)
        .update({ status: inputLower })
        .eq('id', orderId);
      if (directError) throw withAdminRlsError(directError);
      return { order_id: orderId, status: inputLower };
    }
    throw new Error(error.message || 'Failed to update order status.');
  }

  return data;
}
