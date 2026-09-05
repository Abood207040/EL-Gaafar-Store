-- Phase 3: Online Inventory & Secure RPC
-- Run this in the Supabase SQL Editor

-- 1. Create the secure RPC for online orders
CREATE OR REPLACE FUNCTION public.create_online_order(
    p_items jsonb, -- Array of { "product_id": "uuid", "qty": int }
    p_customer_name text,
    p_customer_phone text,
    p_customer_email text,
    p_fulfillment_type text,
    p_city text,
    p_area text,
    p_street_address text,
    p_notes text,
    p_customer_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges so anonymous users can checkout
AS $$
DECLARE
    v_order_id uuid;
    v_order_number text;
    v_subtotal numeric := 0;
    v_logistics_fee numeric := 0;
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
    v_available_online boolean;
    v_final_customer_id uuid;
    v_rand int;
BEGIN
    -- 1. Determine Customer
    -- If p_customer_id is passed, we use it. 
    -- Otherwise, we try to find by phone/email or create a new one.
    v_final_customer_id := p_customer_id;
    IF v_final_customer_id IS NULL THEN
        SELECT id INTO v_final_customer_id FROM public.customers 
        WHERE phone = p_customer_phone OR email = p_customer_email LIMIT 1;
        
        IF v_final_customer_id IS NULL THEN
            INSERT INTO public.customers (full_name, phone, email, city, area, address)
            VALUES (p_customer_name, p_customer_phone, p_customer_email, p_city, p_area, p_street_address)
            RETURNING id INTO v_final_customer_id;
        END IF;
    END IF;

    -- 2. Generate Order Number (AJ-YYYYMMDD-XXXX)
    v_rand := floor(random() * 9000 + 1000)::int;
    v_order_number := 'AJ-' || to_char(now(), 'YYYYMMDD') || '-' || v_rand::text;

    -- 3. Calculate Logistics Fee
    IF p_fulfillment_type = 'delivery' THEN
        v_logistics_fee := 25;
    END IF;

    -- 4. Create Order Header (Subtotal/Total will be updated later)
    INSERT INTO public.orders (
        customer_id, order_number, customer_name, customer_phone, customer_email,
        fulfillment_type, status, city, area, street_address, notes,
        subtotal, logistics_fee, tax, total, payment_method, created_by
    ) VALUES (
        v_final_customer_id, v_order_number, p_customer_name, p_customer_phone, p_customer_email,
        p_fulfillment_type, 'pending', p_city, p_area, p_street_address, p_notes,
        0, v_logistics_fee, 0, 0, 'cash', auth.uid()
    )
    RETURNING id INTO v_order_id;

    -- 5. Process Items (Row-Level Locks)
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'qty')::int;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Quantity must be greater than zero for product %', v_product_id;
        END IF;

        -- Lock the row for update
        SELECT price, stock, available_online, name_en, sku 
        INTO v_price, v_stock, v_available_online, v_product_name, v_sku
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found', v_product_id;
        END IF;

        IF NOT v_available_online THEN
            RAISE EXCEPTION 'Product % is not available for online sale', v_product_name;
        END IF;

        IF v_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for product % (Requested: %, Available: %)', v_product_name, v_qty, v_stock;
        END IF;

        v_line_total := v_price * v_qty;
        v_subtotal := v_subtotal + v_line_total;

        -- Insert order item
        INSERT INTO public.order_items (
            order_id, product_id, product_name, sku, qty, unit_price, line_total
        ) VALUES (
            v_order_id, v_product_id, v_product_name, v_sku, v_qty, v_price, v_line_total
        );

        -- Deduct stock
        UPDATE public.products 
        SET stock = stock - v_qty 
        WHERE id = v_product_id;

        -- Insert inventory audit trail
        INSERT INTO public.inventory_transactions (
            product_id, quantity, transaction_type, reference_id, created_by, notes
        ) VALUES (
            v_product_id, -v_qty, 'online_sale', v_order_id, auth.uid(), 'Online checkout'
        );
    END LOOP;

    -- 6. Finalize Order Totals
    v_total := v_subtotal + v_logistics_fee + v_tax;

    UPDATE public.orders
    SET subtotal = v_subtotal,
        total = v_total
    WHERE id = v_order_id;

    RETURN v_order_id;
END;
$$;
