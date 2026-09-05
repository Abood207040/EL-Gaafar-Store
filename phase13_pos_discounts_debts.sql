-- Phase 13: POS Discounts, Partial Payments, Customer Debt Mega Feature

-- 1. Alter offline_sales table
ALTER TABLE public.offline_sales
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'PAID',
ADD COLUMN IF NOT EXISTS total_paid numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance numeric DEFAULT 0;

-- 2. Alter offline_sale_items table
ALTER TABLE public.offline_sale_items
ADD COLUMN IF NOT EXISTS line_subtotal numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS discount_value numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- 3. Backfill Historical Data gracefully
-- Only backfill sales that don't have total_paid set yet.
UPDATE public.offline_sales 
SET payment_status = 'PAID', 
    total_paid = total, 
    remaining_balance = 0,
    discount_amount = COALESCE(discount, 0),
    discount_value = COALESCE(discount, 0),
    discount_type = 'fixed'
WHERE total_paid = 0 OR total_paid IS NULL;

UPDATE public.offline_sale_items
SET line_subtotal = line_total,
    discount_amount = 0,
    discount_value = 0,
    discount_type = 'fixed'
WHERE line_subtotal = 0 OR line_subtotal IS NULL;

-- 4. Create offline_sale_payments table
CREATE TABLE IF NOT EXISTS public.offline_sale_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES public.offline_sales(id) ON DELETE CASCADE,
    customer_id uuid REFERENCES public.customers(id),
    staff_id uuid NOT NULL REFERENCES auth.users(id),
    amount numeric NOT NULL,
    payment_method text NOT NULL DEFAULT 'cash',
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS for payments
ALTER TABLE public.offline_sale_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins have full access to offline sale payments" ON public.offline_sale_payments;
CREATE POLICY "Admins have full access to offline sale payments" 
ON public.offline_sale_payments FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 5. Drop old RPC to prevent overloading conflicts
DROP FUNCTION IF EXISTS public.create_offline_sale(jsonb, text, numeric, text, uuid);
DROP FUNCTION IF EXISTS public.create_offline_sale(jsonb, text, uuid, numeric, numeric, numeric);

-- 6. New Authoritative RPC: create_offline_sale
CREATE OR REPLACE FUNCTION public.create_offline_sale(
    p_items jsonb,
    p_payment_method text,
    p_invoice_discount_type text,
    p_invoice_discount_value numeric,
    p_amount_paid numeric,
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
    v_total_discount numeric := 0;
    v_invoice_discount_amount numeric := 0;
    v_final_total numeric := 0;
    
    v_item jsonb;
    v_product_id uuid;
    v_qty int;
    v_item_discount_type text;
    v_item_discount_value numeric;
    
    v_price numeric;
    v_product_name text;
    v_sku text;
    v_stock int;
    v_available_offline boolean;
    
    v_line_subtotal numeric;
    v_line_discount_amount numeric;
    v_line_total numeric;
    
    v_payment_status text;
    v_remaining_balance numeric;
    
    v_rand int;
    v_is_admin boolean;
BEGIN
    -- Auth check
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
    IF NOT v_is_admin THEN
        PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Unauthorized: Only admins can process offline sales');
    END IF;

    -- Negative discount validation
    IF p_invoice_discount_value < 0 THEN
        PERFORM public.raise_standard_error('ERR_INVALID_DISCOUNT', 'Invoice discount cannot be negative');
    END IF;

    -- Receipt generation
    v_rand := floor(random() * 90000 + 10000)::int;
    v_receipt_number := 'POS-' || to_char(now(), 'YYYYMMDD') || '-' || v_rand::text;

    -- Insert sale skeleton to get ID (will UPDATE later)
    INSERT INTO public.offline_sales (
        sale_number, customer_id, payment_method, 
        subtotal, discount, tax, total, staff_id,
        discount_type, discount_value, discount_amount,
        payment_status, total_paid, remaining_balance
    ) VALUES (
        v_receipt_number, p_customer_id, p_payment_method,
        0, 0, 0, 0, auth.uid(),
        p_invoice_discount_type, p_invoice_discount_value, 0,
        'UNPAID', 0, 0
    ) RETURNING id INTO v_sale_id;

    -- Process Items & Calculate Subtotal
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'qty')::int;
        v_item_discount_type := COALESCE(v_item->>'discount_type', 'fixed');
        v_item_discount_value := COALESCE((v_item->>'discount_value')::numeric, 0);

        IF v_qty <= 0 THEN
            PERFORM public.raise_standard_error('ERR_INVALID_QTY', 'Quantity must be > 0', jsonb_build_object('productId', v_product_id));
        END IF;

        IF v_item_discount_value < 0 THEN
            PERFORM public.raise_standard_error('ERR_INVALID_DISCOUNT', 'Item discount cannot be negative', jsonb_build_object('productId', v_product_id));
        END IF;

        -- Authoritative lookup & lock
        SELECT stock, available_offline, name_en, sku, price 
        INTO v_stock, v_available_offline, v_product_name, v_sku, v_price
        FROM public.products
        WHERE id = v_product_id FOR UPDATE;

        IF NOT FOUND THEN
            PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Product not found', jsonb_build_object('productId', v_product_id));
        END IF;

        IF NOT v_available_offline THEN
            PERFORM public.raise_standard_error('ERR_NOT_AVAILABLE', 'Product is not available for offline sale', jsonb_build_object('productId', v_product_id, 'productName', v_product_name));
        END IF;

        IF v_stock < v_qty THEN
            PERFORM public.raise_standard_error('ERR_INSUFFICIENT_STOCK', 'Insufficient stock', jsonb_build_object('productId', v_product_id, 'productName', v_product_name, 'requested', v_qty, 'available', v_stock));
        END IF;

        -- Calculations
        v_line_subtotal := v_price * v_qty;
        
        IF v_item_discount_type = 'percentage' THEN
            IF v_item_discount_value > 100 THEN
                PERFORM public.raise_standard_error('ERR_INVALID_DISCOUNT', 'Item percentage discount cannot exceed 100%');
            END IF;
            v_line_discount_amount := ROUND((v_line_subtotal * (v_item_discount_value / 100.0))::numeric, 2);
        ELSE
            IF v_item_discount_value > v_line_subtotal THEN
                v_line_discount_amount := v_line_subtotal;
            ELSE
                v_line_discount_amount := v_item_discount_value;
            END IF;
        END IF;

        v_line_total := v_line_subtotal - v_line_discount_amount;
        v_subtotal := v_subtotal + v_line_total; -- Subtotal of the sale is sum of line_totals

        -- Insert line item
        INSERT INTO public.offline_sale_items (
            sale_id, product_id, product_name, sku, qty, unit_price,
            line_subtotal, discount_type, discount_value, discount_amount, line_total
        ) VALUES (
            v_sale_id, v_product_id, v_product_name, v_sku, v_qty, v_price,
            v_line_subtotal, v_item_discount_type, v_item_discount_value, v_line_discount_amount, v_line_total
        );

        -- Stock deduction
        UPDATE public.products SET stock = stock - v_qty WHERE id = v_product_id;

        -- Inventory tx
        INSERT INTO public.inventory_transactions (
            product_id, quantity, transaction_type, reference_id, created_by, notes
        ) VALUES (
            v_product_id, -v_qty, 'offline_sale', v_sale_id, auth.uid(), 'POS checkout'
        );
    END LOOP;

    -- Calculate Invoice Discount
    IF p_invoice_discount_type = 'percentage' THEN
        IF p_invoice_discount_value > 100 THEN
            PERFORM public.raise_standard_error('ERR_INVALID_DISCOUNT', 'Invoice percentage discount cannot exceed 100%');
        END IF;
        v_invoice_discount_amount := ROUND((v_subtotal * (p_invoice_discount_value / 100.0))::numeric, 2);
    ELSE
        IF p_invoice_discount_value > v_subtotal THEN
            v_invoice_discount_amount := v_subtotal;
        ELSE
            v_invoice_discount_amount := p_invoice_discount_value;
        END IF;
    END IF;

    v_final_total := v_subtotal - v_invoice_discount_amount;
    IF v_final_total < 0 THEN
        v_final_total := 0;
    END IF;

    -- Validate Payment
    IF p_amount_paid < 0 THEN
        PERFORM public.raise_standard_error('ERR_INVALID_PAYMENT', 'Payment cannot be negative');
    END IF;

    -- Guest restriction
    IF p_customer_id IS NULL AND p_amount_paid < v_final_total THEN
        PERFORM public.raise_standard_error('ERR_GUEST_DEBT', 'Guest customers cannot create debt. Full payment is required.');
    END IF;

    -- If payment is more than total, we cap it at total for the ledger
    -- (change should be calculated on the frontend, ledger only records money applied to the invoice)
    DECLARE
        v_actual_payment numeric := p_amount_paid;
    BEGIN
        IF v_actual_payment > v_final_total THEN
            v_actual_payment := v_final_total;
        END IF;

        v_remaining_balance := v_final_total - v_actual_payment;

        IF v_remaining_balance <= 0 THEN
            v_payment_status := 'PAID';
            v_remaining_balance := 0;
        ELSIF v_actual_payment = 0 THEN
            v_payment_status := 'UNPAID';
        ELSE
            v_payment_status := 'PARTIALLY_PAID';
        END IF;

        -- Create Payment Ledger Entry if money was received
        IF v_actual_payment > 0 THEN
            INSERT INTO public.offline_sale_payments (
                sale_id, customer_id, staff_id, amount, payment_method, notes
            ) VALUES (
                v_sale_id, p_customer_id, auth.uid(), v_actual_payment, p_payment_method, p_notes
            );
        END IF;

        -- Update Sale Record
        UPDATE public.offline_sales
        SET subtotal = v_subtotal,
            discount = v_invoice_discount_amount, -- Legacy fallback column
            discount_type = p_invoice_discount_type,
            discount_value = p_invoice_discount_value,
            discount_amount = v_invoice_discount_amount,
            total = v_final_total,
            payment_status = v_payment_status,
            total_paid = v_actual_payment,
            remaining_balance = v_remaining_balance
        WHERE id = v_sale_id;
    END;

    RETURN v_sale_id;
END;
$$;


-- 7. New RPC: record_offline_sale_payment
CREATE OR REPLACE FUNCTION public.record_offline_sale_payment(
    p_sale_id uuid,
    p_amount numeric,
    p_payment_method text,
    p_notes text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin boolean;
    v_sale record;
    v_customer_id uuid;
    v_new_total_paid numeric;
    v_new_remaining numeric;
    v_new_status text;
BEGIN
    -- Auth check
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
    IF NOT v_is_admin THEN
        PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Unauthorized: Only admins can record payments');
    END IF;

    IF p_amount <= 0 THEN
        PERFORM public.raise_standard_error('ERR_INVALID_PAYMENT', 'Payment amount must be greater than zero');
    END IF;

    -- Lock the sale record to prevent concurrent double-payments
    SELECT * INTO v_sale 
    FROM public.offline_sales 
    WHERE id = p_sale_id FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Sale not found');
    END IF;

    IF v_sale.payment_status = 'PAID' OR v_sale.remaining_balance <= 0 THEN
        PERFORM public.raise_standard_error('ERR_ALREADY_PAID', 'This invoice is already fully paid');
    END IF;

    IF p_amount > v_sale.remaining_balance THEN
        PERFORM public.raise_standard_error('ERR_OVERPAYMENT', 'Payment cannot exceed the remaining balance of ' || v_sale.remaining_balance::text);
    END IF;

    -- Insert immutable payment record
    INSERT INTO public.offline_sale_payments (
        sale_id, customer_id, staff_id, amount, payment_method, notes
    ) VALUES (
        p_sale_id, v_sale.customer_id, auth.uid(), p_amount, p_payment_method, p_notes
    );

    -- Calculate new aggregates
    v_new_total_paid := v_sale.total_paid + p_amount;
    v_new_remaining := v_sale.total - v_new_total_paid;

    IF v_new_remaining <= 0 THEN
        v_new_status := 'PAID';
        v_new_remaining := 0;
    ELSE
        v_new_status := 'PARTIALLY_PAID';
    END IF;

    -- Update denormalized cached aggregates on the sale
    UPDATE public.offline_sales
    SET total_paid = v_new_total_paid,
        remaining_balance = v_new_remaining,
        payment_status = v_new_status
    WHERE id = p_sale_id;

    RETURN jsonb_build_object(
        'sale_id', p_sale_id,
        'total_paid', v_new_total_paid,
        'remaining_balance', v_new_remaining,
        'payment_status', v_new_status
    );
END;
$$;
