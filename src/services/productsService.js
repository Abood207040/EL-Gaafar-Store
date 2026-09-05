import placeholderImg from '../assets/main-image.png';
import { STOCK_STATUSES } from '../constants/domain.js';
import { supabase } from './authService.js';

const PRODUCTS_TABLE = 'products';
const CATEGORIES_TABLE = 'categories';

function computeStockStatus(stock, stockStatus) {
  if (stockStatus && Object.values(STOCK_STATUSES).includes(stockStatus)) {
    return stockStatus;
  }

  const qty = Number(stock) || 0;
  // NOTE: This fallback logic is still used by the frontend for optimistic updates,
  // but the DB trigger is now the ultimate source of truth for stock_status.
  if (qty <= 0) return STOCK_STATUSES.OUT_OF_STOCK;
  if (qty <= 10) return STOCK_STATUSES.LOW_STOCK;
  return STOCK_STATUSES.IN_STOCK;
}

export async function generateUniqueBarcode() {
  let unique = false;
  let newBarcode = '';
  while (!unique) {
    // Generate a 12-digit numeric internal barcode
    newBarcode = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    
    const { data, error } = await supabase
      .from(PRODUCTS_TABLE)
      .select('id')
      .eq('barcode', newBarcode)
      .maybeSingle();
      
    if (error) throw error;
    if (!data) {
      unique = true;
    }
  }
  return newBarcode;
}

export function selectProductsQuery() {
  return `
    id,
    category_id,
    name_en,
    name_ar,
    sku,
    brand,
    price,
    cost,
    barcode,
    stock,
    low_stock_threshold,
    stock_status,
    image_url,
    description_en,
    description_ar,
    size,
    material,
    usage,
    color,
    pressure_rating,
    warranty,
    is_active,
    is_featured,
    available_online,
    available_offline,
    created_at,
    updated_at,
    categories:category_id (
      id,
      name_en,
      name_ar,
      is_active
    )
  `;
}

export function normalizeProduct(row) {
  const stock = Number(row.stock ?? 0);
  return {
    id: row.id,
    categoryId: row.category_id ?? row.categories?.id ?? null,
    category: row.categories?.name_en || '',
    categoryAr: row.categories?.name_ar || '',
    nameEn: row.name_en || '',
    nameAr: row.name_ar || '',
    brand: row.brand || '',
    sku: row.sku || '',
    price: Number(row.price ?? 0),
    cost: row.cost !== null ? Number(row.cost) : null,
    barcode: row.barcode || '',
    stock,
    lowStockThreshold: Number(row.low_stock_threshold ?? 5),
    stockStatus: row.stock_status || computeStockStatus(stock, row.stock_status),
    image: row.image_url || placeholderImg,
    description: row.description_en || '',
    descriptionEn: row.description_en || '',
    descriptionAr: row.description_ar || '',
    specs: {
      size: row.size || '',
      material: row.material || '',
      usage: row.usage || '',
      color: row.color || '',
      pressureRating: row.pressure_rating || '',
      warranty: row.warranty || '',
    },
    featured: Boolean(row.is_featured),
    active: row.is_active !== false,
    availableOnline: row.available_online !== false,
    availableOffline: row.available_offline !== false,
    createdAt: row.created_at || null,
    updatedAt: row.updated_at || null,
  };
}

async function resolveCategoryId({ categoryId, categoryName }) {
  if (categoryId) return categoryId;
  if (!categoryName) return null;

  const normalized = String(categoryName).trim();
  if (!normalized) return null;

  const { data, error } = await supabase
    .from(CATEGORIES_TABLE)
    .select('id, name_en, name_ar')
    .or(`name_en.eq.${normalized},name_ar.eq.${normalized}`)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

async function toDbPayload(payload) {
  const categoryId = await resolveCategoryId({
    categoryId: payload.categoryId,
    categoryName: payload.category,
  });

  return {
    category_id: categoryId,
    name_en: payload.nameEn?.trim() || '',
    name_ar: payload.nameAr?.trim() || '',
    sku: payload.sku?.trim() || '',
    brand: payload.brand?.trim() || '',
    price: Number(payload.price || 0),
    cost: payload.cost !== undefined && payload.cost !== null && payload.cost !== '' ? Number(payload.cost) : null,
    barcode: payload.barcode?.trim() || null,
    stock: Number(payload.stock || 0),
    low_stock_threshold: payload.lowStockThreshold !== undefined ? Number(payload.lowStockThreshold) : 5,
    stock_status: computeStockStatus(payload.stock, payload.stockStatus),
    image_url: payload.image || placeholderImg,
    description_en: payload.descriptionEn ?? payload.description ?? '',
    description_ar: payload.descriptionAr ?? '',
    size: payload.specs?.size ?? '',
    material: payload.specs?.material ?? '',
    usage: payload.specs?.usage ?? '',
    color: payload.specs?.color ?? '',
    pressure_rating: payload.specs?.pressureRating ?? '',
    warranty: payload.specs?.warranty ?? '',
    is_active: payload.active !== false,
    is_featured: Boolean(payload.featured),
    available_online: payload.availableOnline !== false,
    available_offline: payload.availableOffline !== false,
  };
}

export async function listStoreProducts() {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select(selectProductsQuery())
    .eq('is_active', true)
    .eq('available_online', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function getFeaturedProducts(limit = 8) {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select(selectProductsQuery())
    .eq('is_active', true)
    .eq('available_online', true)
    .eq('is_featured', true)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) throw error;
  
  // If fewer than requested are returned, fallback to general active products
  if (!data || data.length < limit) {
    const fallbackLimit = limit - (data ? data.length : 0);
    const existingIds = data ? data.map(p => p.id) : [];
    
    let fallbackQuery = supabase
      .from(PRODUCTS_TABLE)
      .select(selectProductsQuery())
      .eq('is_active', true)
      .eq('available_online', true);
      
    if (existingIds.length > 0) {
      fallbackQuery = fallbackQuery.not('id', 'in', `(${existingIds.join(',')})`);
    }
    
    const { data: fallbackData, error: fallbackError } = await fallbackQuery
      .limit(fallbackLimit)
      .order('created_at', { ascending: false });
      
    if (!fallbackError && fallbackData) {
      return [...(data || []), ...fallbackData].map(normalizeProduct);
    }
  }

  return (data || []).map(normalizeProduct);
}

export async function getStoreProductById(id) {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select(selectProductsQuery())
    .eq('id', id)
    .eq('is_active', true)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeProduct(data) : null;
}

export async function getRelatedStoreProducts({ categoryId, excludeId, limit = 4 }) {
  if (!categoryId) return [];

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select(selectProductsQuery())
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', excludeId)
    .limit(limit)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function listAdminProducts() {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select(selectProductsQuery())
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(normalizeProduct);
}

export async function getAdminProductById(id) {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select(selectProductsQuery())
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data ? normalizeProduct(data) : null;
}

export async function createAdminProduct(payload) {
  const insertPayload = await toDbPayload(payload);
  
  if (!insertPayload.barcode) {
    insertPayload.barcode = await generateUniqueBarcode();
  } else {
    // Check if the provided barcode is unique
    const { data } = await supabase
      .from(PRODUCTS_TABLE)
      .select('id')
      .eq('barcode', insertPayload.barcode)
      .maybeSingle();
    if (data) {
      throw new Error(`Barcode ${insertPayload.barcode} is already in use by another product.`);
    }
  }

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .insert(insertPayload)
    .select(selectProductsQuery())
    .single();

  if (error) throw error;
  return normalizeProduct(data);
}

export async function updateAdminProduct(id, payload) {
  const updatePayload = await toDbPayload(payload);
  
  if (updatePayload.barcode) {
    const { data } = await supabase
      .from(PRODUCTS_TABLE)
      .select('id')
      .eq('barcode', updatePayload.barcode)
      .neq('id', id)
      .maybeSingle();
      
    if (data) {
      throw new Error(`Barcode ${updatePayload.barcode} is already in use by another product.`);
    }
  }

  // MEGA-EDIT: Never overwrite stock directly during a product info update.
  // Stock adjustments must go through adjustProductStock (adjust_stock RPC).
  delete updatePayload.stock;
  delete updatePayload.stock_status;

  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .update(updatePayload)
    .eq('id', id)
    .select(selectProductsQuery())
    .single();

  if (error) throw error;
  return normalizeProduct(data);
}

export async function deactivateAdminProduct(id) {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .update({ is_active: false })
    .eq('id', id)
    .select(selectProductsQuery())
    .single();

  if (error) throw error;
  return normalizeProduct(data);
}

export async function bulkDeactivateProducts(ids) {
  const { data, error } = await supabase.rpc('admin_bulk_deactivate_products', {
    p_product_ids: ids,
  });
  
  if (error) throw error;
  return data; // Returns the number of updated rows
}

export async function adjustProductStock(productId, quantityChange, transactionType, notes) {
  const { data, error } = await supabase.rpc('adjust_stock', {
    p_product_id: productId,
    p_quantity_change: Number(quantityChange),
    p_transaction_type: transactionType,
    p_notes: notes || ''
  });

  if (error) {
    throw new Error(error.message || 'Failed to adjust stock');
  }
  
  return data;
}
