import { RLS_PERMISSION_ERROR } from '../constants/domain.js';
import { supabase } from './authService.js';

const CUSTOMERS_TABLE = 'customers';
const ORDERS_TABLE = 'orders';

function withAdminRlsError(error) {
  if (!error) return null;
  if (error.code === '42501') {
    return new Error(RLS_PERMISSION_ERROR);
  }
  return error;
}

export async function getAdminCustomers() {
  const { data: customers, error } = await supabase
    .from(CUSTOMERS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw withAdminRlsError(error);

  const customerIds = (customers || []).map((item) => item.id);
  let orders = [];
  if (customerIds.length) {
    const ordersResult = await supabase
      .from(ORDERS_TABLE)
      .select('id, customer_id, total, created_at, status')
      .in('customer_id', customerIds);
    if (ordersResult.error) throw withAdminRlsError(ordersResult.error);
    orders = ordersResult.data || [];
  }

  const byCustomer = new Map();
  for (const customer of customers || []) {
    byCustomer.set(customer.id, []);
  }
  for (const order of orders) {
    if (!byCustomer.has(order.customer_id)) continue;
    byCustomer.get(order.customer_id).push(order);
  }

  return (customers || []).map((customer) => {
    const list = byCustomer.get(customer.id) || [];
    const totalOrders = list.length;
    const totalSpent = list.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const sorted = [...list].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const lastOrderDate = sorted[0]?.created_at
      ? new Date(sorted[0].created_at).toISOString().slice(0, 10)
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
