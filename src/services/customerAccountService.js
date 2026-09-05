import { supabase } from './authService.js';

export async function getCustomerActivity() {
  const [ordersResult, offlineSalesResult] = await Promise.all([
    supabase.from('orders').select('*').order('created_at', { ascending: false }),
    supabase.from('offline_sales').select('*').order('created_at', { ascending: false })
  ]);

  if (ordersResult.error) throw ordersResult.error;
  if (offlineSalesResult.error) throw offlineSalesResult.error;

  const orders = (ordersResult.data || []).map(o => ({ ...o, type: 'online' }));
  const offline = (offlineSalesResult.data || []).map(s => ({ ...s, type: 'offline' }));

  return [...orders, ...offline].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
}
