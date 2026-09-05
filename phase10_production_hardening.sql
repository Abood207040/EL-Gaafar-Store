-- Phase 10: Production Hardening (Error Standardization)

CREATE OR REPLACE FUNCTION public.raise_standard_error(p_code text, p_message text, p_details jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION '%', json_build_object(
        'code', p_code,
        'message', p_message,
        'details', p_details
    )::text;
END;
$$;

-- 1. UPDATE create_online_order
CREATE OR REPLACE FUNCTION public.create_online_order(
    p_items jsonb,
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
SECURITY DEFINER
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
    v_norm_phone text;
BEGIN
    v_norm_phone := public.normalize_phone(p_customer_phone);

    v_final_customer_id := p_customer_id;
    IF v_final_customer_id IS NULL THEN
        SELECT id INTO v_final_customer_id FROM public.customers 
        WHERE (phone_normalized = v_norm_phone AND v_norm_phone IS NOT NULL)
           OR (email = p_customer_email AND p_customer_email IS NOT NULL AND trim(p_customer_email) != '')
        LIMIT 1;
        
        IF v_final_customer_id IS NULL THEN
            INSERT INTO public.customers (full_name, phone, phone_normalized, email, city, area, address)
            VALUES (p_customer_name, p_customer_phone, v_norm_phone, p_customer_email, p_city, p_area, p_street_address)
            RETURNING id INTO v_final_customer_id;
        END IF;
    END IF;

    v_rand := floor(random() * 9000 + 1000)::int;
    v_order_number := 'AJ-' || to_char(now(), 'YYYYMMDD') || '-' || v_rand::text;

    IF p_fulfillment_type = 'delivery' THEN
        SELECT (value->>0)::numeric INTO v_logistics_fee 
        FROM public.store_settings 
        WHERE key = 'delivery_fee';
        
        IF v_logistics_fee IS NULL THEN
            v_logistics_fee := 25;
        END IF;
    END IF;

    INSERT INTO public.orders (
        customer_id, order_number, customer_name, customer_phone, customer_email,
        fulfillment_type, status, city, area, street_address, notes,
        subtotal, logistics_fee, tax, total, payment_method
    ) VALUES (
        v_final_customer_id, v_order_number, p_customer_name, p_customer_phone, p_customer_email,
        p_fulfillment_type, 'pending', p_city, p_area, p_street_address, p_notes,
        0, v_logistics_fee, 0, 0, 'cash'
    )
    RETURNING id INTO v_order_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'qty')::int;

        IF v_qty <= 0 THEN
            PERFORM public.raise_standard_error('ERR_INVALID_QTY', 'Quantity must be greater than zero', jsonb_build_object('productId', v_product_id));
        END IF;

        SELECT price, stock, available_online, name_en, sku 
        INTO v_price, v_stock, v_available_online, v_product_name, v_sku
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Product not found', jsonb_build_object('productId', v_product_id));
        END IF;

        IF NOT v_available_online THEN
            PERFORM public.raise_standard_error('ERR_NOT_AVAILABLE', 'Product is not available for online sale', jsonb_build_object('productId', v_product_id, 'productName', v_product_name));
        END IF;

        IF v_stock < v_qty THEN
            PERFORM public.raise_standard_error('ERR_INSUFFICIENT_STOCK', 'Insufficient stock', jsonb_build_object('productId', v_product_id, 'productName', v_product_name, 'requested', v_qty, 'available', v_stock));
        END IF;

        v_line_total := v_price * v_qty;
        v_subtotal := v_subtotal + v_line_total;

        INSERT INTO public.order_items (
            order_id, product_id, product_name, sku, qty, unit_price, line_total
        ) VALUES (
            v_order_id, v_product_id, v_product_name, v_sku, v_qty, v_price, v_line_total
        );

        UPDATE public.products 
        SET stock = stock - v_qty 
        WHERE id = v_product_id;

        INSERT INTO public.inventory_transactions (
            product_id, quantity, transaction_type, reference_id, created_by, notes
        ) VALUES (
            v_product_id, -v_qty, 'online_sale', v_order_id, auth.uid(), 'Online checkout'
        );
    END LOOP;

    v_total := v_subtotal + v_logistics_fee + v_tax;

    UPDATE public.orders
    SET subtotal = v_subtotal,
        total = v_total
    WHERE id = v_order_id;

    RETURN v_order_id;
END;
$$;


-- 2. UPDATE create_offline_sale
DROP FUNCTION IF EXISTS public.create_offline_sale(jsonb, text, uuid, numeric, numeric, numeric);
CREATE OR REPLACE FUNCTION public.create_offline_sale(
    p_items jsonb,
    p_payment_method text,
    p_discount numeric,
    p_notes text,
    p_customer_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_sale_id uuid;
    v_receipt_number text;
    v_subtotal numeric := 0;
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
    v_rand int;
    v_is_admin boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Unauthorized: Only admins can process offline sales');
    END IF;

    IF p_discount < 0 THEN
        PERFORM public.raise_standard_error('ERR_INVALID_DISCOUNT', 'Discount cannot be negative');
    END IF;

    v_rand := floor(random() * 90000 + 10000)::int;
    v_receipt_number := 'POS-' || to_char(now(), 'YYYYMMDD') || '-' || v_rand::text;

    INSERT INTO public.offline_sales (
        sale_number, customer_id, payment_method, 
        subtotal, discount, tax, total, staff_id
    ) VALUES (
        v_receipt_number, p_customer_id, p_payment_method,
        0, p_discount, 0, 0, auth.uid()
    )
    RETURNING id INTO v_sale_id;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'qty')::int;
        v_price := (v_item->>'unit_price')::numeric;

        IF v_qty <= 0 THEN
            PERFORM public.raise_standard_error('ERR_INVALID_QTY', 'Quantity must be greater than zero', jsonb_build_object('productId', v_product_id));
        END IF;

        SELECT stock, available_offline, name_en, sku 
        INTO v_stock, v_available_offline, v_product_name, v_sku
        FROM public.products
        WHERE id = v_product_id
        FOR UPDATE;

        IF NOT FOUND THEN
            PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Product not found', jsonb_build_object('productId', v_product_id));
        END IF;

        IF NOT v_available_offline THEN
            PERFORM public.raise_standard_error('ERR_NOT_AVAILABLE', 'Product is not available for offline sale', jsonb_build_object('productId', v_product_id, 'productName', v_product_name));
        END IF;

        IF v_stock < v_qty THEN
            PERFORM public.raise_standard_error('ERR_INSUFFICIENT_STOCK', 'Insufficient stock', jsonb_build_object('productId', v_product_id, 'productName', v_product_name, 'requested', v_qty, 'available', v_stock));
        END IF;

        v_line_total := v_price * v_qty;
        v_subtotal := v_subtotal + v_line_total;

        INSERT INTO public.offline_sale_items (
            sale_id, product_id, product_name, sku, qty, unit_price, line_total
        ) VALUES (
            v_sale_id, v_product_id, v_product_name, v_sku, v_qty, v_price, v_line_total
        );

        UPDATE public.products 
        SET stock = stock - v_qty 
        WHERE id = v_product_id;

        INSERT INTO public.inventory_transactions (
            product_id, quantity, transaction_type, reference_id, created_by, notes
        ) VALUES (
            v_product_id, -v_qty, 'offline_sale', v_sale_id, auth.uid(), 'POS checkout'
        );
    END LOOP;

    v_total := v_subtotal - p_discount;

    IF v_total < 0 THEN
        IF p_discount > v_subtotal THEN
            PERFORM public.raise_standard_error('ERR_INVALID_DISCOUNT', 'Discount cannot exceed subtotal');
        ELSE
            PERFORM public.raise_standard_error('ERR_INVALID_TOTAL', 'Total cannot be negative');
        END IF;
    END IF;

    UPDATE public.offline_sales
    SET subtotal = v_subtotal,
        total = v_total
    WHERE id = v_sale_id;

    RETURN v_sale_id;
END;
$$;


-- 3. UPDATE cancel_online_order
DROP FUNCTION IF EXISTS public.cancel_online_order(text, text, text);
CREATE OR REPLACE FUNCTION public.cancel_online_order(
    p_order_number text,
    p_customer_phone text DEFAULT NULL,
    p_customer_email text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_id uuid;
    v_current_status text;
    v_customer_phone text;
    v_customer_email text;
    v_item RECORD;
    v_norm_phone text;
BEGIN
    v_norm_phone := public.normalize_phone(p_customer_phone);

    SELECT id, status, customer_phone, customer_email 
    INTO v_order_id, v_current_status, v_customer_phone, v_customer_email
    FROM public.orders
    WHERE order_number = p_order_number
    FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Order not found', jsonb_build_object('orderNumber', p_order_number));
    END IF;

    -- If guest user provides verification details
    IF p_customer_phone IS NOT NULL OR p_customer_email IS NOT NULL THEN
        IF (v_norm_phone IS NOT NULL AND public.normalize_phone(v_customer_phone) != v_norm_phone) 
           OR (p_customer_email IS NOT NULL AND v_customer_email != p_customer_email) THEN
           PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Unauthorized: Verification failed');
        END IF;
    ELSE
        -- Ensure logged in user owns it (if no guest verification provided)
        IF NOT EXISTS (
            SELECT 1 FROM public.orders o
            JOIN public.customers c ON o.customer_id = c.id
            WHERE o.id = v_order_id AND c.auth_user_id = auth.uid()
        ) THEN
            -- Also allow admin
            IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') THEN
                PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Unauthorized: Not owner or admin');
            END IF;
        END IF;
    END IF;

    IF v_current_status NOT IN ('pending', 'confirmed') THEN
        PERFORM public.raise_standard_error('ERR_INVALID_STATUS', 'Order cannot be cancelled because it is already ' || v_current_status, jsonb_build_object('status', v_current_status));
    END IF;

    UPDATE public.orders
    SET status = 'cancelled'
    WHERE id = v_order_id;

    FOR v_item IN SELECT product_id, qty FROM public.order_items WHERE order_id = v_order_id
    LOOP
        UPDATE public.products
        SET stock = stock + v_item.qty
        WHERE id = v_item.product_id;

        INSERT INTO public.inventory_transactions (
            product_id, quantity, transaction_type, reference_id, created_by, notes
        ) VALUES (
            v_item.product_id, v_item.qty, 'restock', v_order_id, auth.uid(), 'Order cancellation'
        );
    END LOOP;
END;
$$;


-- 4. UPDATE adjust_stock
CREATE OR REPLACE FUNCTION public.adjust_stock(
    p_product_id uuid,
    p_quantity_change int,
    p_transaction_type text,
    p_notes text DEFAULT ''
)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin boolean;
    v_current_stock int;
    v_new_stock int;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Unauthorized: Only admins can adjust stock manually');
    END IF;

    IF p_quantity_change = 0 THEN
        PERFORM public.raise_standard_error('ERR_INVALID_QTY', 'Quantity change cannot be zero');
    END IF;

    IF p_transaction_type = 'restock' AND p_quantity_change < 0 THEN
        PERFORM public.raise_standard_error('ERR_INVALID_ADJUSTMENT', 'Restock must have a positive quantity change');
    END IF;

    IF p_transaction_type IN ('damage', 'loss') AND p_quantity_change > 0 THEN
        PERFORM public.raise_standard_error('ERR_INVALID_ADJUSTMENT', 'Damage and loss must have a negative quantity change');
    END IF;

    IF p_transaction_type NOT IN ('restock', 'damage', 'loss', 'manual_adjustment') THEN
        PERFORM public.raise_standard_error('ERR_INVALID_TYPE', 'Invalid transaction type');
    END IF;

    SELECT stock INTO v_current_stock
    FROM public.products
    WHERE id = p_product_id
    FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Product not found', jsonb_build_object('productId', p_product_id));
    END IF;

    v_new_stock := v_current_stock + p_quantity_change;

    IF v_new_stock < 0 THEN
        PERFORM public.raise_standard_error('ERR_INSUFFICIENT_STOCK', 'Insufficient stock. Adjustment would result in negative stock', jsonb_build_object('available', v_current_stock, 'newStock', v_new_stock));
    END IF;

    UPDATE public.products
    SET stock = v_new_stock
    WHERE id = p_product_id;

    INSERT INTO public.inventory_transactions (
        product_id, quantity, transaction_type, created_by, notes
    ) VALUES (
        p_product_id, p_quantity_change, p_transaction_type, auth.uid(), p_notes
    );

    RETURN v_new_stock;
END;
$$;


-- 5. UPDATE process_offline_return
DROP FUNCTION IF EXISTS public.process_offline_return(uuid, numeric, text, jsonb);
CREATE OR REPLACE FUNCTION public.process_offline_return(
    p_sale_id uuid,
    p_items jsonb, 
    p_notes text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin boolean;
    v_item jsonb;
    v_product_id uuid;
    v_qty int;
    v_sold_qty int;
    v_already_returned int;
    v_sale_status text;
    v_available_to_return int;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_is_admin;
    
    IF NOT v_is_admin THEN
        PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Unauthorized: Only admins can process returns');
    END IF;

    SELECT status INTO v_sale_status
    FROM public.offline_sales
    WHERE id = p_sale_id
    FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Offline sale not found');
    END IF;

    IF v_sale_status != 'completed' THEN
        PERFORM public.raise_standard_error('ERR_INVALID_STATUS', 'Cannot process return for sale with status: ' || v_sale_status);
    END IF;

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'qty')::int;

        IF v_qty <= 0 THEN
            PERFORM public.raise_standard_error('ERR_INVALID_QTY', 'Return quantity must be greater than zero');
        END IF;

        SELECT qty INTO v_sold_qty
        FROM public.offline_sale_items
        WHERE sale_id = p_sale_id AND product_id = v_product_id;

        IF NOT FOUND THEN
            PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Product was not part of this sale');
        END IF;

        SELECT COALESCE(SUM(quantity), 0) INTO v_already_returned
        FROM public.inventory_transactions
        WHERE reference_id = p_sale_id 
          AND product_id = v_product_id 
          AND transaction_type = 'return';

        v_available_to_return := v_sold_qty - v_already_returned;

        IF v_qty > v_available_to_return THEN
            PERFORM public.raise_standard_error('ERR_INVALID_QTY', 'Return quantity exceeds available purchased quantity');
        END IF;

        UPDATE public.products
        SET stock = stock + v_qty
        WHERE id = v_product_id;

        INSERT INTO public.inventory_transactions (
            product_id, quantity, transaction_type, reference_id, created_by, notes
        ) VALUES (
            v_product_id, v_qty, 'return', p_sale_id, auth.uid(), p_notes
        );
    END LOOP;

    UPDATE public.offline_sales
    SET status = 'refunded'
    WHERE id = p_sale_id;
END;
$$;


-- 6. UPDATE register_customer
CREATE OR REPLACE FUNCTION public.register_customer(
  p_full_name text,
  p_phone text,
  p_email text,
  p_city text,
  p_area text,
  p_address text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
  v_customer_id uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    PERFORM public.raise_standard_error('ERR_UNAUTHENTICATED', 'Not authenticated');
  END IF;
  
  SELECT id INTO v_customer_id FROM public.customers WHERE auth_user_id = v_uid LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    PERFORM public.raise_standard_error('ERR_ALREADY_EXISTS', 'Customer profile already exists for this account');
  END IF;
  
  INSERT INTO public.customers (auth_user_id, full_name, phone, phone_normalized, email, city, area, address, status)
  VALUES (v_uid, p_full_name, p_phone, public.normalize_phone(p_phone), p_email, p_city, p_area, p_address, 'active')
  RETURNING id INTO v_customer_id;
  
  RETURN v_customer_id;
END;
$$;
