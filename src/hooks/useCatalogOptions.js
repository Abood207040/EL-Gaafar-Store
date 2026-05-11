import { useCallback, useEffect, useMemo, useState } from 'react';
import { CATEGORIES as DEFAULT_CATEGORIES, BRANDS as DEFAULT_BRANDS } from '../data/products.js';

const STORAGE_KEYS = {
  categories: 'al-jafar-custom-categories',
  brands: 'al-jafar-custom-brands',
};

const readStoredOptions = (key) => {
  try {
    const stored = window.localStorage.getItem(key);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
  } catch {
    return [];
  }
};

const writeStoredOptions = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage can be unavailable in restricted browser modes.
  }
};

const normalize = (value) => value.trim().replace(/\s+/g, ' ');

const mergeOptions = (defaults, custom) => {
  const seen = new Set();
  return [...defaults, ...custom].filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const addOption = (setter, defaults, value) => {
  const next = normalize(value);
  if (!next || next.toLowerCase() === 'all') return false;

  const existsInDefaults = defaults.some((item) => item.toLowerCase() === next.toLowerCase());
  if (existsInDefaults) return false;

  let added = false;
  setter((prev) => {
    const exists = prev.some((item) => item.toLowerCase() === next.toLowerCase());
    if (exists) return prev;
    added = true;
    return [...prev, next];
  });
  return added;
};

export default function useCatalogOptions() {
  const [customCategories, setCustomCategories] = useState(() => readStoredOptions(STORAGE_KEYS.categories));
  const [customBrands, setCustomBrands] = useState(() => readStoredOptions(STORAGE_KEYS.brands));

  useEffect(() => {
    writeStoredOptions(STORAGE_KEYS.categories, customCategories);
  }, [customCategories]);

  useEffect(() => {
    writeStoredOptions(STORAGE_KEYS.brands, customBrands);
  }, [customBrands]);

  const categories = useMemo(
    () => mergeOptions(DEFAULT_CATEGORIES, customCategories),
    [customCategories]
  );
  const brands = useMemo(
    () => mergeOptions(DEFAULT_BRANDS, customBrands),
    [customBrands]
  );

  const addCategory = useCallback(
    (value) => addOption(setCustomCategories, DEFAULT_CATEGORIES, value),
    []
  );
  const addBrand = useCallback(
    (value) => addOption(setCustomBrands, DEFAULT_BRANDS, value),
    []
  );

  const removeCategory = useCallback((value) => {
    setCustomCategories((prev) => prev.filter((item) => item !== value));
  }, []);

  const removeBrand = useCallback((value) => {
    setCustomBrands((prev) => prev.filter((item) => item !== value));
  }, []);

  return {
    categories,
    brands,
    customCategories,
    customBrands,
    addCategory,
    addBrand,
    removeCategory,
    removeBrand,
  };
}
