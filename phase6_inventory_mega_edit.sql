-- Phase 6: Storage / Inventory Mega-Edit
-- Run this in the Supabase SQL Editor

-- 1. Safe Additive Schema Changes
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS cost numeric(10,2) DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS barcode text UNIQUE DEFAULT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS low_stock_threshold int NOT NULL DEFAULT 5;

-- 2. Database Trigger for Stock Status Auto-Calculation
CREATE OR REPLACE FUNCTION public.trg_update_stock_status()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NEW.stock <= 0 THEN
        NEW.stock_status := 'Out of Stock';
    ELSIF NEW.stock > 0 AND NEW.stock <= NEW.low_stock_threshold THEN
        NEW.stock_status := 'Low Stock';
    ELSE
        NEW.stock_status := 'In Stock';
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_stock_status_trigger ON public.products;
CREATE TRIGGER update_stock_status_trigger
BEFORE INSERT OR UPDATE OF stock, low_stock_threshold ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.trg_update_stock_status();

-- Ensure all existing products have correct stock_status based on their current stock
UPDATE public.products SET stock = stock; -- This forces the trigger to fire on all rows

-- 3. Secure Stock Adjustment RPC
CREATE OR REPLACE FUNCTION public.adjust_stock(
    p_product_id uuid,
    p_quantity_change int,
    p_transaction_type text,
    p_notes text
) RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin boolean;
    v_current_stock int;
    v_new_stock int;
BEGIN
    -- 1. Security Check: Only Admins can manually adjust stock
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can adjust stock manually';
    END IF;

    -- 2. Validate Inputs
    IF p_quantity_change = 0 THEN
        RAISE EXCEPTION 'Quantity change cannot be zero';
    END IF;

    -- 3. Validate transaction type and sign conventions
    IF p_transaction_type = 'restock' AND p_quantity_change < 0 THEN
        RAISE EXCEPTION 'Restock must have a positive quantity change';
    END IF;
    
    IF p_transaction_type IN ('damage', 'loss') AND p_quantity_change > 0 THEN
        RAISE EXCEPTION 'Damage and loss must have a negative quantity change';
    END IF;

    IF p_transaction_type NOT IN ('restock', 'damage', 'loss', 'manual_adjustment') THEN
        RAISE EXCEPTION 'Invalid transaction type: %', p_transaction_type;
    END IF;

    -- 4. Lock row and get current stock
    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product % not found', p_product_id;
    END IF;

    v_new_stock := v_current_stock + p_quantity_change;

    -- 5. No negative stock allowed
    IF v_new_stock < 0 THEN
        RAISE EXCEPTION 'Insufficient stock. Adjustment would result in negative stock (%)', v_new_stock;
    END IF;

    -- 6. Apply stock update (The trigger will auto-calculate stock_status)
    UPDATE public.products
    SET stock = v_new_stock
    WHERE id = p_product_id;

    -- 7. Insert audit trail
    INSERT INTO public.inventory_transactions (
        product_id, quantity, transaction_type, created_by, notes
    ) VALUES (
        p_product_id, p_quantity_change, p_transaction_type, auth.uid(), p_notes
    );

    RETURN v_new_stock;
END;
$$;
