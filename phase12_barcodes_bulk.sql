-- Phase 12: Barcode Uniqueness and Bulk Deactivation RPC
-- Ensure this is run in the Supabase SQL Editor

BEGIN;

-- 1. Normalize empty barcodes to NULL so they don't count as duplicates
UPDATE public.products 
SET barcode = NULL 
WHERE trim(barcode) = '';

-- 2. Detect and resolve any existing barcode duplicates by appending a suffix (-1, -2, etc)
WITH numbered_barcodes AS (
    SELECT id, barcode,
           ROW_NUMBER() OVER (PARTITION BY barcode ORDER BY created_at ASC) as rn
    FROM public.products
    WHERE barcode IS NOT NULL
)
UPDATE public.products p
SET barcode = p.barcode || '-' || (n.rn - 1)::text
FROM numbered_barcodes n
WHERE p.id = n.id AND n.rn > 1;

-- 3. Add UNIQUE constraint to barcode column. 
-- In PostgreSQL, multiple NULLs are permitted in a UNIQUE column.
ALTER TABLE public.products 
DROP CONSTRAINT IF EXISTS products_barcode_key;

ALTER TABLE public.products 
ADD CONSTRAINT products_barcode_key UNIQUE (barcode);

-- 4. Create secure RPC for Bulk Deactivation (Soft Delete)
CREATE OR REPLACE FUNCTION public.admin_bulk_deactivate_products(p_product_ids uuid[])
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
    v_updated_count int;
BEGIN
    -- Verify caller is an authenticated admin
    SELECT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can perform bulk actions.';
    END IF;

    -- Perform the bulk deactivate
    UPDATE public.products
    SET is_active = false,
        updated_at = NOW()
    WHERE id = ANY(p_product_ids);

    -- Get the number of affected rows
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;

    RETURN v_updated_count;
END;
$$;

COMMIT;
