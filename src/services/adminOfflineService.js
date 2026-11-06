import { supabase } from './authService.js';
import { selectProductsQuery, normalizeProduct, listAdminProducts } from './productsService.js';

export async function listOfflineProducts() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(selectProductsQuery())
      .eq('available_offline', true)
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(normalizeProduct);
    }
  } catch (err) {
    console.warn('Failed to fetch offline products from DB, trying general products:', err);
  }

  try {
    const adminProds = await listAdminProducts();
    if (adminProds && adminProds.length > 0) return adminProds;
  } catch {
    // fallback
  }

  return [];
}

export async function createOfflineSale(cartItems, paymentMethod = 'cash', customerId = null, invoiceDiscountType = 'fixed', invoiceDiscountValue = 0, amountPaid = 0, notes = '') {
  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty.');
  }

  const items = cartItems.map(item => ({
    product_id: item.product.id,
    qty: Number(item.qty || 1),
    discount_type: item.discountType || 'fixed',
    discount_value: Number(item.discountValue || 0)
  }));

  const payload = {
    p_items: items,
    p_payment_method: paymentMethod,
    p_invoice_discount_type: invoiceDiscountType,
    p_invoice_discount_value: Number(invoiceDiscountValue) || 0,
    p_amount_paid: Number(amountPaid) || 0,
    p_notes: notes,
    p_customer_id: customerId
  };

  const { data: newSaleData, error } = await supabase.rpc('create_offline_sale', payload);

  if (error) {
    console.error('RPC POS Error:', error);
    throw new Error(error.message || 'Failed to complete offline sale.');
  }

  return newSaleData;
}

export async function recordOfflineSalePayment(saleId, amount, paymentMethod, notes = '') {
  const payload = {
    p_sale_id: saleId,
    p_amount: Number(amount),
    p_payment_method: paymentMethod,
    p_notes: notes
  };

  const { data, error } = await supabase.rpc('record_offline_sale_payment', payload);

  if (error) {
    console.error('RPC Payment Error:', error);
    throw new Error(error.message || 'Failed to record payment.');
  }

  return data;
}

export async function listCustomerDebts() {
  const { data, error } = await supabase
    .from('offline_sales')
    .select(`
      id,
      sale_number,
      customer_id,
      subtotal,
      discount_amount,
      total,
      total_paid,
      remaining_balance,
      payment_status,
      created_at,
      customers ( id, full_name, phone, phone_normalized ),
      offline_sale_items (
        id, product_id, product_name, sku, qty, unit_price, line_subtotal, discount_type, discount_value, discount_amount, line_total, returned_qty
      ),
      offline_sale_payments (
        id, amount, payment_method, notes, created_at
      )
    `)
    .gt('remaining_balance', 0)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch customer debts:', error);
    throw new Error('Failed to load customer debts.');
  }

  return data || [];
}

export async function listOfflineSales() {
  // Query sales with nested lines, payments, customer, and staff
  let query = supabase
    .from('offline_sales')
    .select(`
      id,
      sale_number,
      staff_id,
      subtotal,
      tax,
      total,
      discount_type,
      discount_value,
      discount_amount,
      payment_method,
      payment_status,
      total_paid,
      remaining_balance,
      created_at,
      offline_sale_items (
        id, product_id, product_name, sku, qty, unit_price, line_subtotal, discount_type, discount_value, discount_amount, line_total, returned_qty
      ),
      offline_sale_payments (
        id, amount, payment_method, notes, created_at
      ),
      customers ( id, full_name, phone, phone_normalized ),
      profiles ( id, full_name )
    `)
    .order('created_at', { ascending: false });

  let { data, error } = await query;

  if (error && error.message?.includes('profiles')) {
    // Fallback if profiles relationship is not yet recognized
    const fallback = await supabase
      .from('offline_sales')
      .select(`
        id,
        sale_number,
        staff_id,
        subtotal,
        tax,
        total,
        discount_type,
        discount_value,
        discount_amount,
        payment_method,
        payment_status,
        total_paid,
        remaining_balance,
        created_at,
        offline_sale_items (
          id, product_id, product_name, sku, qty, unit_price, line_subtotal, discount_type, discount_value, discount_amount, line_total, returned_qty
        ),
        offline_sale_payments (
          id, amount, payment_method, notes, created_at
        ),
        customers ( id, full_name, phone, phone_normalized )
      `)
      .order('created_at', { ascending: false });

    if (fallback.error) throw new Error(fallback.error.message || 'Failed to load offline sales.');
    return fallback.data || [];
  }

  if (error) {
    console.error('Failed to fetch offline sales:', error);
    throw new Error('Failed to load offline sales.');
  }

  return data || [];
}

// --- Shift Management ---
export async function getCurrentShift() {
  const { data, error } = await supabase
    .from('store_shifts')
    .select('*')
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('Failed to fetch current shift:', error);
    return null;
  }
  return data;
}

export async function openShift(startingCash = 0, notes = '') {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('User not authenticated.');

  const { data, error } = await supabase
    .from('store_shifts')
    .insert({
      opened_by: userId,
      starting_cash: Number(startingCash) || 0,
      notes,
      status: 'open'
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function closeShift(shiftId, endingCash = 0, expectedCash = 0, notes = '') {
  const { data, error } = await supabase
    .from('store_shifts')
    .update({
      ending_cash: Number(endingCash) || 0,
      expected_cash: Number(expectedCash) || 0,
      closed_at: new Date().toISOString(),
      status: 'closed',
      notes
    })
    .eq('id', shiftId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- Held Sales ---
export async function holdSale(cartItems, customerId = null, notes = '') {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) throw new Error('User not authenticated.');

  const { data, error } = await supabase
    .from('pos_held_sales')
    .insert({
      staff_id: userId,
      customer_id: customerId,
      cart_json: cartItems,
      notes
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function listHeldSales() {
  const { data, error } = await supabase
    .from('pos_held_sales')
    .select('*, customers(full_name)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function deleteHeldSale(id) {
  const { error } = await supabase.from('pos_held_sales').delete().eq('id', id);
  if (error) throw error;
}

// --- Authoritative Returns ---
export async function processOfflineReturn(saleId, items, reason = '', refundMethod = 'cash') {
  // Items shape: [{ sale_item_id, qty, restock }]
  const payload = {
    p_sale_id: saleId,
    p_items: items,
    p_reason: reason || null,
    p_refund_method: refundMethod || 'cash'
  };

  const { data, error } = await supabase.rpc('process_offline_return', payload);
  if (error) {
    console.error('RPC Return Error:', error);
    throw new Error(error.message || 'Failed to process return.');
  }
  return data;
}
