-- Phase 4: Offline POS RPC
-- Run this in the Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.create_offline_sale(
    p_items jsonb, -- Array of { "product_id": "uuid", "qty": int }
    p_payment_method text,
    p_customer_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id uuid;
    v_sale_number text;
    v_subtotal numeric := 0;
    v_tax numeric := 0;
    v_total numeric := 0;
    v_item jsonb;
    v_product_id uuid;
    v_qty int;
    v_price numeric;
    v_product_name text;
    v_sku text;
    v_line_total numeric;
    v_stock int;
    v_available_offline boolean;
    v_is_admin boolean;
    v_rand int;
BEGIN
    -- 1. Security Check: Only Admins can create offline sales
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Unauthorized: Only admins can process offline sales';
    END IF;

    -- 2. Generate POS Sale Number (POS-YYYYMMDD-XXXX)
    v_rand := floor(random() * 9000 + 1000)::int;
    v_sale_number := 'POS-' || to_char(now(), 'YYYYMMDD') || '-' || v_rand::text;

    -- 3. Create Sale Header (Subtotal/Total will be updated later)
    INSERT INTO public.offline_sales (
        sale_number, staff_id, customer_id, subtotal, tax, total, payment_method
    ) VALUES (
        v_sale_number, auth.uid(), p_customer_id, 0, 0, 0, p_payment_method
    )
    RETURNING id INTO v_sale_id;

    -- 4. Process Items (Row-Level Locks)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'qty')::int;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantity must be greater than zero for product %', v_product_id;
        END IF;

        -- Lock the row for update
        SELECT price, stock, available_offline, name_en, sku 
        INTO v_price, v_stock, v_available_offline, v_product_name, v_sku
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;

        IF NOT v_available_offline THEN
            RAISE EXCEPTION 'Product % is not available for offline sale', v_product_name;
        END IF;

        IF v_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product % (Requested: %, Available: %)', v_product_name, v_qty, v_stock;
        END IF;

        v_line_total := v_price * v_qty;
        v_subtotal := v_subtotal + v_line_total;

        -- Insert offline sale item
        INSERT INTO public.offline_sale_items (
            sale_id, product_id, product_name, sku, qty, unit_price, line_total
        ) VALUES (
            v_sale_id, v_product_id, v_product_name, v_sku, v_qty, v_price, v_line_total
        );

        -- Deduct stock
        UPDATE public.products 
        SET stock = stock - v_qty 
        WHERE id = v_product_id;

        -- Insert inventory audit trail
        INSERT INTO public.inventory_transactions (
            product_id, quantity, transaction_type, reference_id, created_by, notes
        ) VALUES (
            v_product_id, -v_qty, 'offline_sale', v_sale_id, auth.uid(), 'POS Sale'
        );
    END LOOP;

    -- 5. Finalize Sale Totals
    v_total := v_subtotal + v_tax;

    UPDATE public.offline_sales
    SET subtotal = v_subtotal,
        total = v_total
    WHERE id = v_sale_id;

    RETURN v_sale_id;
END;
$$;
