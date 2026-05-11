import placeholderImg from '../assets/main-image.png';
import { STOCK_STATUSES } from '../data/products.js';
import { supabase } from './authService.js';

const PRODUCTS_TABLE = 'products';

function computeStockStatus(stock, stockStatus) {
  if (stockStatus && Object.values(STOCK_STATUSES).includes(stockStatus)) {
    return stockStatus;
  }

  const qty = Number(stock) || 0;
  if (qty <= 0) return STOCK_STATUSES.OUT_OF_STOCK;
  if (qty <= 10) return STOCK_STATUSES.LOW_STOCK;
  return STOCK_STATUSES.IN_STOCK;
}

export function normalizeProduct(row) {
  const stock = Number(row.stock ?? 0);
  return {
    id: row.id,
    nameEn: row.nameEn ?? row.name_en ?? '',
    nameAr: row.nameAr ?? row.name_ar ?? '',
    category: row.category ?? '',
    brand: row.brand ?? '',
    sku: row.sku ?? '',
    price: Number(row.price ?? 0),
    stock,
    stockStatus: computeStockStatus(stock, row.stockStatus ?? row.stock_status),
    image: row.image ?? placeholderImg,
    description: row.description ?? '',
    specs: row.specs ?? {},
    featured: Boolean(row.featured),
    active: row.active !== false,
  };
}

function toDbPayloadSnake(payload) {
  return {
    name_en: payload.nameEn,
    name_ar: payload.nameAr,
    category: payload.category,
    brand: payload.brand,
    sku: payload.sku,
    price: Number(payload.price || 0),
    stock: Number(payload.stock || 0),
    stock_status: computeStockStatus(payload.stock, payload.stockStatus),
    image: payload.image || placeholderImg,
    description: payload.description || '',
    specs: payload.specs || {},
    featured: Boolean(payload.featured),
    active: payload.active !== false,
  };
}

function toDbPayloadCamel(payload) {
  return {
    nameEn: payload.nameEn,
    nameAr: payload.nameAr,
    category: payload.category,
    brand: payload.brand,
    sku: payload.sku,
    price: Number(payload.price || 0),
    stock: Number(payload.stock || 0),
    stockStatus: computeStockStatus(payload.stock, payload.stockStatus),
    image: payload.image || placeholderImg,
    description: payload.description || '',
    specs: payload.specs || {},
    featured: Boolean(payload.featured),
    active: payload.active !== false,
  };
}

function isColumnError(error) {
  const message = String(error?.message || '').toLowerCase();
  return error?.code === '42703' || message.includes('column') || message.includes('nameen');
}

export async function listAdminProducts() {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function createAdminProduct(payload) {
  const snakeAttempt = await supabase
    .from(PRODUCTS_TABLE)
    .insert(toDbPayloadSnake(payload))
    .select('*')
    .single();

  if (!snakeAttempt.error) {
    return normalizeProduct(snakeAttempt.data);
  }

  if (!isColumnError(snakeAttempt.error)) {
    throw snakeAttempt.error;
  }

  const camelAttempt = await supabase
    .from(PRODUCTS_TABLE)
    .insert(toDbPayloadCamel(payload))
    .select('*')
    .single();

  if (camelAttempt.error) throw camelAttempt.error;
  return normalizeProduct(camelAttempt.data);
}

export async function updateAdminProduct(id, payload) {
  const snakeAttempt = await supabase
    .from(PRODUCTS_TABLE)
    .update(toDbPayloadSnake(payload))
    .eq('id', id)
    .select('*')
    .single();

  if (!snakeAttempt.error) {
    return normalizeProduct(snakeAttempt.data);
  }

  if (!isColumnError(snakeAttempt.error)) {
    throw snakeAttempt.error;
  }

  const camelAttempt = await supabase
    .from(PRODUCTS_TABLE)
    .update(toDbPayloadCamel(payload))
    .eq('id', id)
    .select('*')
    .single();

  if (camelAttempt.error) throw camelAttempt.error;
  return normalizeProduct(camelAttempt.data);
}

export async function deleteAdminProduct(id) {
  const { error } = await supabase
    .from(PRODUCTS_TABLE)
    .delete()
    .eq('id', id);

  if (error) throw error;
}
