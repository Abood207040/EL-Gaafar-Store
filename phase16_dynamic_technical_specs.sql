-- ==============================================================================
-- Phase 16: Dynamic Technical Specifications
-- EL-Gaafar Store (Al-Jafar)
-- ==============================================================================

BEGIN;

-- 1. Add technical_specs JSONB column
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS technical_specs JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 2. Backfill existing legacy specification columns into technical_specs (preserving non-empty values)
UPDATE public.products p
SET technical_specs = (
    SELECT COALESCE(jsonb_agg(spec), '[]'::jsonb)
    FROM (
        SELECT jsonb_build_object('id', gen_random_uuid()::text, 'nameEn', 'Size', 'nameAr', 'المقاس', 'valueEn', p.size, 'valueAr', p.size) AS spec 
        WHERE p.size IS NOT NULL AND trim(p.size) != ''
        UNION ALL
        SELECT jsonb_build_object('id', gen_random_uuid()::text, 'nameEn', 'Material', 'nameAr', 'الخامة', 'valueEn', p.material, 'valueAr', p.material) AS spec 
        WHERE p.material IS NOT NULL AND trim(p.material) != ''
        UNION ALL
        SELECT jsonb_build_object('id', gen_random_uuid()::text, 'nameEn', 'Usage', 'nameAr', 'الاستخدام', 'valueEn', p.usage, 'valueAr', p.usage) AS spec 
        WHERE p.usage IS NOT NULL AND trim(p.usage) != ''
        UNION ALL
        SELECT jsonb_build_object('id', gen_random_uuid()::text, 'nameEn', 'Color', 'nameAr', 'اللون', 'valueEn', p.color, 'valueAr', p.color) AS spec 
        WHERE p.color IS NOT NULL AND trim(p.color) != ''
        UNION ALL
        SELECT jsonb_build_object('id', gen_random_uuid()::text, 'nameEn', 'Pressure Rating', 'nameAr', 'تحمل الضغط', 'valueEn', p.pressure_rating, 'valueAr', p.pressure_rating) AS spec 
        WHERE p.pressure_rating IS NOT NULL AND trim(p.pressure_rating) != ''
        UNION ALL
        SELECT jsonb_build_object('id', gen_random_uuid()::text, 'nameEn', 'Warranty', 'nameAr', 'الضمان', 'valueEn', p.warranty, 'valueAr', p.warranty) AS spec 
        WHERE p.warranty IS NOT NULL AND trim(p.warranty) != ''
    ) sub
)
WHERE (p.technical_specs IS NULL OR p.technical_specs = '[]'::jsonb)
  AND (
      (p.size IS NOT NULL AND trim(p.size) != '') OR
      (p.material IS NOT NULL AND trim(p.material) != '') OR
      (p.usage IS NOT NULL AND trim(p.usage) != '') OR
      (p.color IS NOT NULL AND trim(p.color) != '') OR
      (p.pressure_rating IS NOT NULL AND trim(p.pressure_rating) != '') OR
      (p.warranty IS NOT NULL AND trim(p.warranty) != '')
  );

COMMIT;

