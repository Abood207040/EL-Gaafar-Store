import { supabase } from './authService.js';

/**
 * Fetch online orders and offline showroom sales specifically for the current customer.
 * Uses customer ID, email, and phone to locate all their orders, while gracefully handling RLS.
 */
export async function getCustomerActivity(customerId, userEmail = '', userPhone = '') {
  let onlineOrders = [];
  let offlineSales = [];

  // 1. Fetch online orders
  try {
    const queries = [];

    if (customerId) {
      queries.push(
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
      );
    }

    if (userEmail) {
      queries.push(
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('customer_email', userEmail)
          .order('created_at', { ascending: false })
      );
    }

    if (userPhone) {
      queries.push(
        supabase
          .from('orders')
          .select('*, order_items(*)')
          .eq('customer_phone', userPhone)
          .order('created_at', { ascending: false })
      );
    }

    if (queries.length > 0) {
      const results = await Promise.all(queries);
      const map = new Map();
      for (const res of results) {
        if (!res.error && Array.isArray(res.data)) {
          for (const item of res.data) {
            map.set(item.id, item);
          }
        }
      }
      onlineOrders = Array.from(map.values()).map((o) => ({
        ...o,
        type: 'online',
        itemsCount: o.order_items?.length || 0,
      }));
    }
  } catch (err) {
    console.warn('[customerAccountService] Error fetching customer orders:', err);
  }

  // 2. Fetch offline showroom sales if customer has an ID (gracefully catch if RLS restricts)
  if (customerId) {
    try {
      const { data, error } = await supabase
        .from('offline_sales')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        offlineSales = data.map((s) => ({
          ...s,
          type: 'offline',
        }));
      }
    } catch {
      // offline_sales may be restricted to staff/admin role; safe to ignore for customer
    }
  }

  return [...onlineOrders, ...offlineSales].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );
}

/**
 * Updates an existing customer profile or creates one if missing.
 */
export async function saveCustomerProfile(user, form) {
  if (!user) throw new Error('User not authenticated');

  const payload = {
    full_name: form.full_name?.trim() || '',
    phone: form.phone?.trim() || '',
    city: form.city?.trim() || '',
    area: form.area?.trim() || '',
    address: form.address?.trim() || '',
    email: user.email || form.email?.trim() || '',
    auth_user_id: user.id,
    status: 'active',
  };

  // Check if customer row exists
  const { data: existing } = await supabase
    .from('customers')
    .select('id')
    .or(`auth_user_id.eq.${user.id},email.eq.${user.email}`)
    .maybeSingle();

  if (existing?.id) {
    const { data, error } = await supabase
      .from('customers')
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } else {
    // Insert new customer record
    const { data, error } = await supabase
      .from('customers')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
