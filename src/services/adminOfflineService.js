import { supabase } from './authService.js';
import { selectProductsQuery, normalizeProduct } from './productsService.js';

export async function listOfflineProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(selectProductsQuery())
    .eq('available_offline', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch offline products:', error);
    throw new Error('Failed to load POS products.');
  }

  return (data || []).map(normalizeProduct);
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

  const { data: newSaleId, error } = await supabase.rpc('create_offline_sale', payload);

  if (error) {
    console.error('RPC POS Error:', error);
    throw new Error(error.message || 'Failed to complete offline sale.');
  }

  return newSaleId;
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
      total,
      total_paid,
      remaining_balance,
      payment_status,
      created_at,
      customers ( full_name, phone )
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
  const { data, error } = await supabase
    .from('offline_sales')
    .select(`
      id,
      sale_number,
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
        id, product_id, product_name, sku, qty, unit_price, line_subtotal, discount_type, discount_value, discount_amount, line_total
      ),
      offline_sale_payments (
        id, amount, payment_method, notes, created_at
      ),
      customers ( full_name, phone )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch offline sales:', error);
    throw new Error('Failed to load offline sales.');
  }

  return data || [];
}

// --- Shift Management ---
export async function getCurrentShift() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('store_shifts')
    .select('*')
    .eq('opened_by', user.id)
    .eq('status', 'open')
    .order('opened_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) throw error;
  return data || null;
}

export async function openShift(startingCash, notes) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('store_shifts')
    .insert({
      opened_by: user.id,
      starting_cash: Number(startingCash) || 0,
      notes: notes || ''
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function closeShift(shiftId, endingCash, expectedCash, notes) {
  const { data, error } = await supabase
    .from('store_shifts')
    .update({
      closed_at: new Date().toISOString(),
      ending_cash: Number(endingCash) || 0,
      expected_cash: Number(expectedCash) || 0,
      status: 'closed',
      notes: notes || ''
    })
    .eq('id', shiftId)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- Held Sales ---
export async function holdSale(customerId, cart, notes) {
  const { data: { user } } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from('pos_held_sales')
    .insert({
      staff_id: user.id,
      customer_id: customerId,
      cart_json: cart,
      notes: notes || ''
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

// --- Returns ---
export async function processOfflineReturn(saleId, amountRefunded, reason, items) {
  const payload = {
    p_sale_id: saleId,
    p_amount_refunded: Number(amountRefunded),
    p_reason: reason || '',
    p_items: items // [{product_id, qty, restock}]
  };
  const { data, error } = await supabase.rpc('process_offline_return', payload);
  if (error) throw new Error(error.message || 'Failed to process return');
  return data;
}
