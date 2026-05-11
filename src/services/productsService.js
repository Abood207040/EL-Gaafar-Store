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
  if (qty <= 0) return STOCK_STATUSES.OUT_OF_STOCK;
  if (qty <= 10) return STOCK_STATUSES.LOW_STOCK;
  return STOCK_STATUSES.IN_STOCK;
}

function selectProductsQuery() {
  return `
    id,
    category_id,
    name_en,
    name_ar,
    sku,
    brand,
    price,
    stock,
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

function normalizeProduct(row) {
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
    stock,
    stockStatus: computeStockStatus(stock, row.stock_status),
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
    stock: Number(payload.stock || 0),
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
  };
}

export async function listStoreProducts() {
  const { data, error } = await supabase
    .from(PRODUCTS_TABLE)
    .select(selectProductsQuery())
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
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

export async function createAdminProduct(payload) {
  const insertPayload = await toDbPayload(payload);
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
