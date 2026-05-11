import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/authService.js';

const normalize = (value) => String(value || '').trim().replace(/\s+/g, ' ');

function slugify(value) {
  return normalize(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function dedupe(values) {
  const seen = new Set();
  return values.filter((value) => {
    const key = String(value || '').toLowerCase();
    if (!key) return false;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchFallbackBrandRowsFromProducts() {
  const fallback = await supabase
    .from('products')
    .select('brand')
    .order('brand', { ascending: true });

  if (fallback.error) return [];

  const names = dedupe(
    (fallback.data || [])
      .map((row) => normalize(row.brand))
      .filter(Boolean)
  );

  return names.map((name, index) => ({
    id: `fallback-brand-${index + 1}`,
    name_en: name,
    name_ar: '',
    slug: slugify(name),
    is_active: true,
  }));
}

async function buildUniqueSlug(table, base) {
  const safeBase = base || `item-${Date.now()}`;
  const { data, error } = await supabase
    .from(table)
    .select('slug')
    .like('slug', `${safeBase}%`);
  if (error) throw error;

  const taken = new Set((data || []).map((row) => String(row.slug || '').toLowerCase()));
  if (!taken.has(safeBase.toLowerCase())) return safeBase;

  let index = 2;
  while (taken.has(`${safeBase}-${index}`.toLowerCase())) {
    index += 1;
  }
  return `${safeBase}-${index}`;
}

export default function useCatalogOptions() {
  const [categoryRows, setCategoryRows] = useState([]);
  const [brandRows, setBrandRows] = useState([]);
  const [categoriesTableAvailable, setCategoriesTableAvailable] = useState(true);
  const [brandsTableAvailable, setBrandsTableAvailable] = useState(true);

  const refreshCategories = useCallback(async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name_en, name_ar, slug, is_active')
      .eq('is_active', true)
      .order('name_en', { ascending: true });
    if (error) {
      setCategoriesTableAvailable(false);
      setCategoryRows([]);
      return;
    }
    setCategoriesTableAvailable(true);
    setCategoryRows(data || []);
  }, []);

  const refreshBrands = useCallback(async () => {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name_en, name_ar, slug, is_active')
      .eq('is_active', true)
      .order('name_en', { ascending: true });
    if (error) {
      setBrandsTableAvailable(false);
      const fallbackRows = await fetchFallbackBrandRowsFromProducts();
      setBrandRows(fallbackRows);
      return;
    }
    setBrandsTableAvailable(true);
    const rows = data || [];
    if (rows.length === 0) {
      const fallbackRows = await fetchFallbackBrandRowsFromProducts();
      setBrandRows(fallbackRows);
      return;
    }
    setBrandRows(rows);
  }, []);

  useEffect(() => {
    refreshCategories().catch(() => {});
    refreshBrands().catch(() => {});
  }, [refreshCategories, refreshBrands]);

  const categories = useMemo(() => {
    const names = categoryRows.map((row) => normalize(row.name_en || row.name_ar));
    return ['All', ...dedupe(names)];
  }, [categoryRows]);

  const brands = useMemo(() => {
    const names = brandRows.map((row) => normalize(row.name_en || row.name_ar));
    return ['All', ...dedupe(names)];
  }, [brandRows]);

  const customCategories = useMemo(
    () => categories.filter((name) => name !== 'All'),
    [categories]
  );

  const customBrands = useMemo(
    () => brands.filter((name) => name !== 'All'),
    [brands]
  );

  const catalogWarnings = useMemo(() => {
    const warnings = [];
    if (!categoriesTableAvailable) {
      warnings.push('Categories table is missing or inaccessible. Showing fallback list.');
    }
    if (!brandsTableAvailable) {
      warnings.push('Brands table is missing or inaccessible. Showing fallback list.');
    }
    return warnings;
  }, [brandsTableAvailable, categoriesTableAvailable]);

  const addCategory = useCallback(
    async (value) => {
      const nameEn = normalize(value?.nameEn);
      const nameAr = normalize(value?.nameAr);

      if (!categoriesTableAvailable) {
        throw new Error('Categories table is missing or inaccessible in Supabase.');
      }
      if (!nameEn || !nameAr) {
        throw new Error('Please enter both English and Arabic names.');
      }
      if (nameEn.toLowerCase() === 'all') return false;
      if (categories.some((item) => item.toLowerCase() === nameEn.toLowerCase())) return false;

      const existingArabic = categoryRows.some(
        (item) => normalize(item.name_ar).toLowerCase() === nameAr.toLowerCase()
      );
      if (existingArabic) return false;

      const baseSlug = slugify(nameEn);
      const slug = await buildUniqueSlug('categories', baseSlug || 'category');

      const { error } = await supabase
        .from('categories')
        .insert({
          name_en: nameEn,
          name_ar: nameAr,
          slug,
          is_active: true,
        });
      if (error) throw error;

      await refreshCategories();
      return true;
    },
    [categories, categoryRows, categoriesTableAvailable, refreshCategories]
  );

  const removeCategory = useCallback(
    async (value) => {
      const next = normalize(value);
      if (!next) return;
      if (!categoriesTableAvailable) {
        throw new Error('Categories table is missing or inaccessible in Supabase.');
      }

      const row = categoryRows.find(
        (item) => normalize(item.name_en).toLowerCase() === next.toLowerCase()
      );
      if (!row) return;

      const { error } = await supabase
        .from('categories')
        .update({ is_active: false })
        .eq('id', row.id);
      if (error) throw error;

      await refreshCategories();
    },
    [categoriesTableAvailable, categoryRows, refreshCategories]
  );

  const addBrand = useCallback(
    async (value) => {
      const nameEn = normalize(value?.nameEn);
      const nameAr = normalize(value?.nameAr);

      if (!brandsTableAvailable) {
        throw new Error('Brands table is missing or inaccessible in Supabase.');
      }
      if (!nameEn || !nameAr) {
        throw new Error('Please enter both English and Arabic names.');
      }
      if (nameEn.toLowerCase() === 'all') return false;
      if (brands.some((item) => item.toLowerCase() === nameEn.toLowerCase())) return false;

      const existingArabic = brandRows.some(
        (item) => normalize(item.name_ar).toLowerCase() === nameAr.toLowerCase()
      );
      if (existingArabic) return false;

      const baseSlug = slugify(nameEn);
      const slug = await buildUniqueSlug('brands', baseSlug || 'brand');

      const { error } = await supabase
        .from('brands')
        .insert({
          name_en: nameEn,
          name_ar: nameAr,
          slug,
          is_active: true,
        });
      if (error) throw error;

      await refreshBrands();
      return true;
    },
    [brands, brandRows, brandsTableAvailable, refreshBrands]
  );

  const removeBrand = useCallback(
    async (value) => {
      const next = normalize(value);
      if (!next) return;
      if (!brandsTableAvailable) {
        throw new Error('Brands table is missing or inaccessible in Supabase.');
      }

      const row = brandRows.find(
        (item) => normalize(item.name_en).toLowerCase() === next.toLowerCase()
      );
      if (!row) return;

      const { error } = await supabase
        .from('brands')
        .update({ is_active: false })
        .eq('id', row.id);
      if (error) throw error;

      await refreshBrands();
    },
    [brandRows, brandsTableAvailable, refreshBrands]
  );

  return {
    categories,
    brands,
    customCategories,
    customBrands,
    categoriesTableAvailable,
    brandsTableAvailable,
    catalogWarnings,
    addCategory,
    addBrand,
    removeCategory,
    removeBrand,
  };
}
