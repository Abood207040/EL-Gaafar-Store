import { DELIVERY_CLASS_LIST, getDeliveryClassConfig } from '../constants/domain.js';
import { supabase } from './authService.js';
import { withAdminRlsError } from './orderUtils.js';

const DELIVERY_CLASSES_TABLE = 'delivery_classes';
const GOVERNORATES_TABLE = 'governorates';
const DELIVERY_AREAS_TABLE = 'delivery_areas';
const DELIVERY_RATES_TABLE = 'delivery_rates';

// ==========================================
// 1. DELIVERY CLASSES
// ==========================================

export async function getDeliveryClasses(adminOnly = false) {
  let query = supabase
    .from(DELIVERY_CLASSES_TABLE)
    .select('*')
    .order('sort_order', { ascending: true });

  if (!adminOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    console.warn('Could not fetch delivery classes from DB, falling back to constants:', error.message);
    return DELIVERY_CLASS_LIST;
  }

  if (!data || data.length === 0) {
    return DELIVERY_CLASS_LIST;
  }

  return data.map((row) => ({
    id: row.id,
    code: row.code,
    rank: row.sort_order,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    isActive: row.is_active,
    requiresManualQuote: row.code === 'special',
  }));
}

export async function updateDeliveryClass(id, updates) {
  const payload = {
    updated_at: new Date().toISOString(),
  };
  if (updates.nameEn !== undefined) payload.name_en = updates.nameEn.trim();
  if (updates.nameAr !== undefined) payload.name_ar = updates.nameAr.trim();
  if (updates.isActive !== undefined) payload.is_active = Boolean(updates.isActive);

  const { data, error } = await supabase
    .from(DELIVERY_CLASSES_TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw withAdminRlsError(error);
  return data;
}

// ==========================================
// 2. GOVERNORATES
// ==========================================

export async function getGovernorates(adminOnly = false) {
  let query = supabase
    .from(GOVERNORATES_TABLE)
    .select(`
      id,
      name_en,
      name_ar,
      is_active,
      display_order,
      created_at,
      delivery_areas (id, is_active)
    `)
    .order('display_order', { ascending: true })
    .order('name_en', { ascending: true });

  if (!adminOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw withAdminRlsError(error);

  return (data || []).map((row) => {
    const areas = row.delivery_areas || [];
    return {
      id: row.id,
      nameEn: row.name_en,
      nameAr: row.name_ar,
      isActive: row.is_active,
      displayOrder: row.display_order ?? 0,
      totalAreas: areas.length,
      activeAreas: areas.filter((a) => a.is_active).length,
      createdAt: row.created_at,
    };
  });
}

export async function createGovernorate({ nameEn, nameAr, displayOrder = 0, isActive = true }) {
  const { data, error } = await supabase
    .from(GOVERNORATES_TABLE)
    .insert({
      name_en: nameEn.trim(),
      name_ar: nameAr.trim(),
      display_order: Number(displayOrder) || 0,
      is_active: Boolean(isActive),
    })
    .select()
    .single();

  if (error) throw withAdminRlsError(error);
  return data;
}

export async function updateGovernorate(id, { nameEn, nameAr, displayOrder, isActive }) {
  const payload = { updated_at: new Date().toISOString() };
  if (nameEn !== undefined) payload.name_en = nameEn.trim();
  if (nameAr !== undefined) payload.name_ar = nameAr.trim();
  if (displayOrder !== undefined) payload.display_order = Number(displayOrder) || 0;
  if (isActive !== undefined) payload.is_active = Boolean(isActive);

  const { data, error } = await supabase
    .from(GOVERNORATES_TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw withAdminRlsError(error);
  return data;
}

export async function toggleGovernorateStatus(id, isActive) {
  return updateGovernorate(id, { isActive });
}

// ==========================================
// 3. DELIVERY AREAS
// ==========================================

export async function getAreasByGovernorate(governorateId, adminOnly = false) {
  if (!governorateId) return [];

  let query = supabase
    .from(DELIVERY_AREAS_TABLE)
    .select('id, governorate_id, name_en, name_ar, is_active, display_order, created_at')
    .eq('governorate_id', governorateId)
    .order('display_order', { ascending: true })
    .order('name_en', { ascending: true });

  if (!adminOnly) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) throw withAdminRlsError(error);

  return (data || []).map((row) => ({
    id: row.id,
    governorateId: row.governorate_id,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    isActive: row.is_active,
    displayOrder: row.display_order ?? 0,
    createdAt: row.created_at,
  }));
}

export async function createArea({ governorateId, nameEn, nameAr, displayOrder = 0, isActive = true }) {
  const { data, error } = await supabase
    .from(DELIVERY_AREAS_TABLE)
    .insert({
      governorate_id: governorateId,
      name_en: nameEn.trim(),
      name_ar: nameAr.trim(),
      display_order: Number(displayOrder) || 0,
      is_active: Boolean(isActive),
    })
    .select()
    .single();

  if (error) throw withAdminRlsError(error);
  return data;
}

export async function updateArea(id, { nameEn, nameAr, displayOrder, isActive }) {
  const payload = { updated_at: new Date().toISOString() };
  if (nameEn !== undefined) payload.name_en = nameEn.trim();
  if (nameAr !== undefined) payload.name_ar = nameAr.trim();
  if (displayOrder !== undefined) payload.display_order = Number(displayOrder) || 0;
  if (isActive !== undefined) payload.is_active = Boolean(isActive);

  const { data, error } = await supabase
    .from(DELIVERY_AREAS_TABLE)
    .update(payload)
    .eq('id', id)
    .select()
    .single();

  if (error) throw withAdminRlsError(error);
  return data;
}

export async function toggleAreaStatus(id, isActive) {
  return updateArea(id, { isActive });
}

// ==========================================
// 4. DELIVERY RATES (PRICING MATRIX)
// ==========================================

export async function getRatesForGovernorate(governorateId) {
  if (!governorateId) return [];

  const { data, error } = await supabase
    .from(DELIVERY_RATES_TABLE)
    .select(`
      id,
      governorate_id,
      area_id,
      delivery_class_id,
      price,
      requires_manual_quote,
      is_active,
      delivery_classes (id, code, name_en, name_ar, sort_order)
    `)
    .eq('governorate_id', governorateId);

  if (error) throw withAdminRlsError(error);

  return (data || []).map((row) => ({
    id: row.id,
    governorateId: row.governorate_id,
    areaId: row.area_id,
    deliveryClassId: row.delivery_class_id,
    classCode: row.delivery_classes?.code,
    price: Number(row.price || 0),
    requiresManualQuote: Boolean(row.requires_manual_quote),
    isActive: row.is_active,
  }));
}

/**
 * Upsert a single rate. Supports both area-specific rates (areaId is set)
 * and governorate default rates (areaId is null).
 */
export async function upsertRate({
  governorateId,
  areaId = null,
  deliveryClassId,
  price = 0,
  requiresManualQuote = false,
  isActive = true,
}) {
  const numPrice = Number(price);
  if (isNaN(numPrice) || numPrice < 0) {
    throw new Error('Delivery price cannot be negative.');
  }

  // Find existing rate to update or insert new
  let findQuery = supabase
    .from(DELIVERY_RATES_TABLE)
    .select('id')
    .eq('governorate_id', governorateId)
    .eq('delivery_class_id', deliveryClassId);

  if (areaId) {
    findQuery = findQuery.eq('area_id', areaId);
  } else {
    findQuery = findQuery.is('area_id', null);
  }

  const { data: existing } = await findQuery.maybeSingle();

  const payload = {
    governorate_id: governorateId,
    area_id: areaId || null,
    delivery_class_id: deliveryClassId,
    price: requiresManualQuote ? 0 : numPrice,
    requires_manual_quote: Boolean(requiresManualQuote),
    is_active: Boolean(isActive),
    updated_at: new Date().toISOString(),
  };

  let query;
  if (existing?.id) {
    query = supabase.from(DELIVERY_RATES_TABLE).update(payload).eq('id', existing.id).select().single();
  } else {
    query = supabase.from(DELIVERY_RATES_TABLE).insert(payload).select().single();
  }

  const { data, error } = await query;
  if (error) throw withAdminRlsError(error);
  return data;
}

/**
 * Bulk save rates from the admin pricing matrix grid.
 */
export async function batchSaveRates(ratesList) {
  if (!Array.isArray(ratesList) || ratesList.length === 0) return [];
  const results = [];
  for (const rateItem of ratesList) {
    const saved = await upsertRate(rateItem);
    results.push(saved);
  }
  return results;
}

// ==========================================
// 5. CUSTOMER CHECKOUT RESOLVER
// ==========================================

export async function resolveCheckoutDeliveryRate(governorateId, areaId, dominantClassCode = 'medium') {
  if (!governorateId || !areaId) {
    return {
      available: false,
      price: 0,
      requiresManualQuote: false,
      messageKey: 'selectGovernorateAndArea',
    };
  }

  // Special dominant class always requires manual quote
  if (dominantClassCode === 'special') {
    return {
      available: true,
      price: 0,
      requiresManualQuote: true,
      dominantClass: getDeliveryClassConfig('special'),
    };
  }

  // Look up delivery_class row by code
  const { data: classRow } = await supabase
    .from(DELIVERY_CLASSES_TABLE)
    .select('id, code, sort_order')
    .eq('code', dominantClassCode.toLowerCase())
    .eq('is_active', true)
    .maybeSingle();

  if (!classRow) {
    return {
      available: false,
      price: 0,
      requiresManualQuote: false,
      messageKey: 'DELIVERY_NOT_AVAILABLE',
    };
  }

  // 1. Try Area-specific rate
  const { data: areaRate } = await supabase
    .from(DELIVERY_RATES_TABLE)
    .select('price, requires_manual_quote, is_active')
    .eq('governorate_id', governorateId)
    .eq('area_id', areaId)
    .eq('delivery_class_id', classRow.id)
    .eq('is_active', true)
    .maybeSingle();

  if (areaRate) {
    return {
      available: true,
      price: areaRate.requires_manual_quote ? 0 : Number(areaRate.price || 0),
      requiresManualQuote: Boolean(areaRate.requires_manual_quote),
      dominantClass: getDeliveryClassConfig(dominantClassCode),
    };
  }

  // 2. Fallback to Governorate default rate (area_id IS NULL)
  const { data: govRate } = await supabase
    .from(DELIVERY_RATES_TABLE)
    .select('price, requires_manual_quote, is_active')
    .eq('governorate_id', governorateId)
    .is('area_id', null)
    .eq('delivery_class_id', classRow.id)
    .eq('is_active', true)
    .maybeSingle();

  if (govRate) {
    return {
      available: true,
      price: govRate.requires_manual_quote ? 0 : Number(govRate.price || 0),
      requiresManualQuote: Boolean(govRate.requires_manual_quote),
      dominantClass: getDeliveryClassConfig(dominantClassCode),
    };
  }

  return {
    available: false,
    price: 0,
    requiresManualQuote: false,
    messageKey: 'DELIVERY_RATE_NOT_FOUND',
  };
}

// ==========================================
// 6. ADMIN AUDIT & COVERAGE SUMMARY
// ==========================================

export async function getDeliveryAuditSummary() {
  const [govs, classes] = await Promise.all([
    getGovernorates(true),
    getDeliveryClasses(true),
  ]);

  const activeGovs = govs.filter((g) => g.isActive);
  const activeClasses = classes.filter((c) => c.isActive && c.code !== 'special');

  let totalAreas = 0;
  let missingRateAlerts = [];

  for (const gov of activeGovs) {
    const areas = await getAreasByGovernorate(gov.id, true);
    const activeAreas = areas.filter((a) => a.isActive);
    totalAreas += activeAreas.length;

    if (activeAreas.length > 0) {
      const rates = await getRatesForGovernorate(gov.id);

      for (const area of activeAreas) {
        for (const cls of activeClasses) {
          const hasRate = rates.some(
            (r) =>
              r.isActive &&
              (r.areaId === area.id || r.areaId === null) &&
              r.deliveryClassId === cls.id
          );
          if (!hasRate) {
            missingRateAlerts.push({
              governorateNameEn: gov.nameEn,
              governorateNameAr: gov.nameAr,
              areaNameEn: area.nameEn,
              areaNameAr: area.nameAr,
              classNameEn: cls.nameEn,
              classNameAr: cls.nameAr,
            });
          }
        }
      }
    }
  }

  return {
    totalGovernorates: govs.length,
    activeGovernoratesCount: activeGovs.length,
    totalAreas,
    deliveryClassesCount: classes.length,
    missingRateAlerts,
  };
}
