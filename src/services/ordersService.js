import placeholderImg from '../assets/main-image.png';
import { FULFILLMENT, ORDER_STATUSES, PAYMENT_METHODS } from '../constants/domain.js';
import { supabase } from './authService.js';

const CUSTOMERS_TABLE = 'customers';
const ORDERS_TABLE = 'orders';
const ORDER_ITEMS_TABLE = 'order_items';

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

async function findOrCreateCustomer(customer) {
  const email = customer.email?.trim() || null;
  const phone = customer.phone?.trim() || null;

  if (!phone && !email) {
    throw new Error('Customer phone or email is required.');
  }

  let query = supabase
    .from(CUSTOMERS_TABLE)
    .select('*');

  if (phone && email) {
    query = query.or(`phone.eq.${phone},email.eq.${email}`);
  } else if (phone) {
    query = query.eq('phone', phone);
  } else {
    query = query.eq('email', email);
  }

  const { data: existing, error: findError } = await query.limit(1).maybeSingle();
  if (findError) throw findError;
  if (existing) return existing;

  const insertPayload = {
    full_name: customer.fullName?.trim() || '',
    phone,
    email,
    city: customer.city?.trim() || '',
    area: customer.area?.trim() || '',
    address: customer.address?.trim() || '',
  };

  const { data: created, error: createError } = await supabase
    .from(CUSTOMERS_TABLE)
    .insert(insertPayload)
    .select('*')
    .single();

  if (createError) throw createError;
  return created;
}

function buildOrderNumber() {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `AJ-${datePart}-${rand}`;
}

export async function createOrder(orderPayload, cartItems) {
  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new Error('Cart is empty.');
  }

  const customer = await findOrCreateCustomer(orderPayload.customer || {});

  const orderInsert = {
    customer_id: customer.id,
    order_number: buildOrderNumber(),
    customer_name: orderPayload.customer?.fullName?.trim() || customer.full_name || '',
    customer_phone: orderPayload.customer?.phone?.trim() || customer.phone || '',
    customer_email: orderPayload.customer?.email?.trim() || customer.email || '',
    fulfillment_type: orderPayload.fulfillmentType || FULFILLMENT.DELIVERY,
    status: ORDER_STATUSES.PENDING,
    city: orderPayload.city || null,
    area: orderPayload.area || null,
    street_address: orderPayload.streetAddress || null,
    notes: orderPayload.notes || null,
    subtotal: Number(orderPayload.subtotal || 0),
    logistics_fee: Number(orderPayload.logisticsFee || 0),
    tax: Number(orderPayload.tax || 0),
    total: Number(orderPayload.total || 0),
    payment_method: PAYMENT_METHODS.COD,
  };

  const { data: createdOrder, error: orderError } = await supabase
    .from(ORDERS_TABLE)
    .insert(orderInsert)
    .select(baseOrderSelect())
    .single();

  if (orderError) throw orderError;

  const orderItemsInsert = cartItems.map((item) => ({
    order_id: createdOrder.id,
    product_id: item.product.id,
    product_name: item.product.nameEn || item.product.nameAr || '',
    sku: item.product.sku || '',
    qty: Number(item.qty || 0),
    unit_price: Number(item.product.price || 0),
    line_total: Number((item.qty || 0) * (item.product.price || 0)),
  }));

  const { error: itemsError } = await supabase
    .from(ORDER_ITEMS_TABLE)
    .insert(orderItemsInsert);

  if (itemsError) throw itemsError;

  const fresh = await getOrderById(createdOrder.id);
  return fresh;
}

export async function getCustomerOrders(phoneOrEmail) {
  const value = String(phoneOrEmail || '').trim();
  if (!value) return [];

  const query = value.includes('@')
    ? supabase.from(ORDERS_TABLE).select(baseOrderSelect()).eq('customer_email', value)
    : supabase.from(ORDERS_TABLE).select(baseOrderSelect()).eq('customer_phone', value);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).map(normalizeOrder);
}

export async function getOrderById(orderId) {
  const query = supabase.from(ORDERS_TABLE).select(baseOrderSelect());
  const { data, error } = String(orderId).includes('-')
    ? await query.eq('order_number', String(orderId)).maybeSingle()
    : await query.eq('id', orderId).maybeSingle();

  if (error) throw error;
  return data ? normalizeOrder(data) : null;
}
