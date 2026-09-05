import { supabase } from './authService.js';
import { withAdminRlsError } from './orderUtils.js';

const CUSTOMERS_TABLE = 'customers';
const ORDERS_TABLE = 'orders';


export async function getAdminCustomers() {
  const { data: customers, error } = await supabase
    .from(CUSTOMERS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw withAdminRlsError(error);

  const customerIds = (customers || []).map((item) => item.id);
  let orders = [];
  let offlineSales = [];
  if (customerIds.length) {
    const ordersResult = await supabase
      .from(ORDERS_TABLE)
      .select('id, customer_id, total, created_at, status')
      .in('customer_id', customerIds);
    if (ordersResult.error) throw withAdminRlsError(ordersResult.error);
    orders = ordersResult.data || [];

    const offlineResult = await supabase
      .from('offline_sales')
      .select('id, customer_id, total, created_at')
      .in('customer_id', customerIds);
    if (offlineResult.error) throw withAdminRlsError(offlineResult.error);
    offlineSales = offlineResult.data || [];
  }

  const byCustomer = new Map();
  for (const customer of customers || []) {
    byCustomer.set(customer.id, { orders: [], offline: [] });
  }
  for (const order of orders) {
    if (!byCustomer.has(order.customer_id)) continue;
    byCustomer.get(order.customer_id).orders.push(order);
  }
  for (const sale of offlineSales) {
    if (!byCustomer.has(sale.customer_id)) continue;
    byCustomer.get(sale.customer_id).offline.push(sale);
  }

  return (customers || []).map((customer) => {
    const custData = byCustomer.get(customer.id) || { orders: [], offline: [] };
    const totalOrders = custData.orders.length + custData.offline.length;
    const totalSpentOnline = custData.orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const totalSpentOffline = custData.offline.reduce((sum, sale) => sum + Number(sale.total || 0), 0);
    const totalSpent = totalSpentOnline + totalSpentOffline;
    
    const allActivity = [...custData.orders, ...custData.offline].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const lastOrderDate = allActivity[0]?.created_at
      ? new Date(allActivity[0].created_at).toISOString().slice(0, 10)
      : '';

    const recentCutoff = new Date();
    recentCutoff.setMonth(recentCutoff.getMonth() - 1);
    const created = customer.created_at ? new Date(customer.created_at) : null;
    const isNew = created && created >= recentCutoff;

    return {
      id: customer.id,
      createdAt: customer.created_at || '',
      name: customer.full_name || '',
      phone: customer.phone || '',
      email: customer.email || '',
      city: customer.city || '',
      area: customer.area || '',
      totalOrders,
      totalSpent,
      lastOrderDate,
      status: totalOrders > 0 ? 'Active' : (isNew ? 'New' : 'Inactive'),
    };
  });
}

export async function getCustomerStats() {
  const customers = await getAdminCustomers();
  const now = new Date();
  const monthAgo = new Date(now);
  monthAgo.setMonth(monthAgo.getMonth() - 1);

  const newThisMonth = customers.filter((customer) => {
    const created = customer.createdAt ? new Date(customer.createdAt) : null;
    return created && created >= monthAgo;
  }).length;

  return {
    total: customers.length,
    newThisMonth,
    active: customers.filter((customer) => customer.status === 'Active').length,
  };
}

export async function createCustomer(payload) {
  const { data, error } = await supabase
    .from(CUSTOMERS_TABLE)
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}
