import placeholderImg from '../assets/main-image.png';
import { FULFILLMENT, ORDER_STATUSES, PAYMENT_METHODS } from '../constants/domain.js';
import { supabase } from './authService.js';
import { baseOrderSelect } from './orderUtils.js';

const ORDERS_TABLE = 'orders';

function mapOrderStatusTimeline(status, fulfillment, createdAt) {
  const stamp = createdAt ? new Date(createdAt).toISOString().slice(0, 10) : '';
  if (status === ORDER_STATUSES.CANCELLED) {
    return [
      { step: 'Placed', date: stamp, done: true },
      { step: 'Cancelled', date: stamp, done: true },
    ];
  }

  const deliveryTimeline = [
    'Placed',
    'Confirmed',
    'Shipped',
    'Delivered',
  ];
  const pickupTimeline = [
    'Placed',
    'Confirmed',
    'Ready for Pickup',
    'Delivered',
  ];

  const steps = fulfillment === FULFILLMENT.PICKUP ? pickupTimeline : deliveryTimeline;
  const statusIndex = {
    [ORDER_STATUSES.PENDING]: 0,
    [ORDER_STATUSES.CONFIRMED]: 1,
    [ORDER_STATUSES.SHIPPED]: 2,
    [ORDER_STATUSES.READY_PICKUP]: 2,
    [ORDER_STATUSES.DELIVERED]: 3,
  }[status] ?? 0;

  return steps.map((step, index) => ({
    step,
    date: index <= statusIndex ? stamp : '',
    done: index <= statusIndex,
  }));
}

function normalizeOrderItem(row) {
  return {
    id: row.id,
    productId: row.product_id,
    qty: Number(row.qty || 0),
    unitPrice: Number(row.unit_price || 0),
    lineTotal: Number(row.line_total || 0),
    product: {
      id: row.product_id,
      nameEn: row.product_name || '',
      nameAr: row.product_name || '',
      sku: row.sku || '',
      image: placeholderImg,
      brand: '',
    },
  };
}

export function normalizeOrder(row) {
  const items = (row.order_items || []).map(normalizeOrderItem);
  const fulfillment = row.fulfillment_type || FULFILLMENT.DELIVERY;

  return {
    id: row.id,
    orderNumber: row.order_number || row.id,
    date: row.created_at ? new Date(row.created_at).toISOString().slice(0, 10) : '',
    customer: {
      id: row.customer_id,
      name: row.customer_name || row.customers?.full_name || '',
      phone: row.customer_phone || row.customers?.phone || '',
      email: row.customer_email || row.customers?.email || '',
    },
    fulfillment,
    status: row.status || ORDER_STATUSES.PENDING,
    address: {
      street: row.street_address || '',
      city: row.city || '',
      area: row.area || '',
      notes: row.notes || '',
    },
    items,
    subtotal: Number(row.subtotal || 0),
    logistics: Number(row.logistics_fee || 0),
    tax: Number(row.tax || 0),
    total: Number(row.total || 0),
    paymentMethod: row.payment_method || PAYMENT_METHODS.COD,
    createdAt: row.created_at || null,
    timeline: mapOrderStatusTimeline(row.status, fulfillment, row.created_at),
  };
}


export async function createOrder(orderPayload, cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Cart is empty.');
  }

  const items = cartItems.map((item) => ({
    product_id: item.product.id,
    qty: Number(item.qty || 0),
  }));

  const payload = {
    p_items: items,
    p_customer_name: orderPayload.customer?.fullName?.trim() || '',
    p_customer_phone: orderPayload.customer?.phone?.trim() || '',
    p_customer_email: orderPayload.customer?.email?.trim() || null,
    p_fulfillment_type: orderPayload.fulfillmentType || FULFILLMENT.DELIVERY,
    p_city: orderPayload.city || null,
    p_area: orderPayload.area || null,
    p_street_address: orderPayload.streetAddress || null,
    p_notes: orderPayload.notes || null,
    p_customer_id: orderPayload.customer?.id || null,
  };

  const { data: newOrderId, error } = await supabase.rpc('create_online_order', payload);

  if (error) {
    console.error('RPC Checkout Error:', error);
    throw new Error(error.message || 'Failed to complete secure checkout.');
  }

  const fresh = await getOrderById(newOrderId);
  return fresh;
}

export async function trackOrder(orderNumber, phoneOrEmail) {
  const num = String(orderNumber || '').trim();
  const contact = String(phoneOrEmail || '').trim();
  
  if (!num || !contact) return null;

  const { data, error } = await supabase.rpc('track_online_order', {
    p_order_number: num,
    p_contact: contact
  });

  if (error) throw error;
  return data ? normalizeOrder(data) : null;
}

export async function cancelOrder(orderNumber, phone, email) {
  const { data, error } = await supabase.rpc('cancel_online_order', {
    p_order_number: orderNumber,
    p_customer_phone: phone || '',
    p_customer_email: email || ''
  });

  if (error) {
    throw new Error(error.message || 'Failed to cancel order.');
  }
  return data;
}

export async function getOrderById(orderId) {
  const query = supabase.from(ORDERS_TABLE).select(baseOrderSelect());
  const { data, error } = String(orderId).includes('-')
    ? await query.eq('order_number', String(orderId)).maybeSingle()
    : await query.eq('id', orderId).maybeSingle();

  if (error) throw error;
  return data ? normalizeOrder(data) : null;
}
