-- ==============================================================================
-- Phase 15: Order Lifecycle, Offline Returns & Relational Integrity
-- EL-Gaafar Store (Al-Jafar)
-- ==============================================================================

BEGIN;

-- 0. Ensure schema columns exist on parent offline tables (Gracefully handles pre-existing tables)
ALTER TABLE public.offline_sales
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS staff_id UUID,
ADD COLUMN IF NOT EXISTS sale_number TEXT,
ADD COLUMN IF NOT EXISTS discount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'PAID',
ADD COLUMN IF NOT EXISTS total_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.offline_sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.offline_sales(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id),
    staff_id UUID,
    amount NUMERIC NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cash',
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.offline_sale_payments
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id),
ADD COLUMN IF NOT EXISTS staff_id UUID,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 1. Ensure staff profiles exist for any historical orphaned staff_ids
INSERT INTO public.profiles (id, full_name, role)
SELECT DISTINCT s.staff_id, 'Staff (' || substr(s.staff_id::text, 1, 8) || ')', 'staff'
FROM public.offline_sales s
WHERE s.staff_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = s.staff_id)
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.profiles (id, full_name, role)
SELECT DISTINCT p.staff_id, 'Staff (' || substr(p.staff_id::text, 1, 8) || ')', 'staff'
FROM public.offline_sale_payments p
WHERE p.staff_id IS NOT NULL 
  AND NOT EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = p.staff_id)
ON CONFLICT (id) DO NOTHING;

-- 2. Add Relational Foreign Keys to public.profiles for clean PostgREST joins
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_offline_sales_staff') THEN
    ALTER TABLE public.offline_sales 
    ADD CONSTRAINT fk_offline_sales_staff FOREIGN KEY (staff_id) REFERENCES public.profiles(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_offline_sale_payments_staff') THEN
    ALTER TABLE public.offline_sale_payments 
    ADD CONSTRAINT fk_offline_sale_payments_staff FOREIGN KEY (staff_id) REFERENCES public.profiles(id);
  END IF;
END $$;

-- 3. Enhance offline_sale_items to track returned quantities atomically
ALTER TABLE public.offline_sale_items
ADD COLUMN IF NOT EXISTS returned_qty INT NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_subtotal NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'fixed',
ADD COLUMN IF NOT EXISTS discount_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'chk_offline_sale_items_returned_qty') THEN
    ALTER TABLE public.offline_sale_items
    ADD CONSTRAINT chk_offline_sale_items_returned_qty CHECK (returned_qty >= 0 AND returned_qty <= qty);
  END IF;
END $$;

-- 4. Re-architect offline_returns & offline_return_items tables
CREATE TABLE IF NOT EXISTS public.offline_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_number TEXT,
    sale_id UUID NOT NULL REFERENCES public.offline_sales(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    staff_id UUID NOT NULL REFERENCES public.profiles(id),
    total_returned_value NUMERIC NOT NULL DEFAULT 0,
    debt_offset_amount NUMERIC NOT NULL DEFAULT 0,
    refund_amount NUMERIC NOT NULL DEFAULT 0,
    refund_method TEXT NOT NULL DEFAULT 'cash',
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crucial: Upgrade existing offline_returns table if created in earlier phases
ALTER TABLE public.offline_returns
ADD COLUMN IF NOT EXISTS return_number TEXT,
ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.profiles(id),
ADD COLUMN IF NOT EXISTS total_returned_value NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS debt_offset_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_amount NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS refund_method TEXT DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS reason TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Generate return_number for legacy rows if any exist
UPDATE public.offline_returns 
SET return_number = 'RET-LEGACY-' || substr(id::text, 1, 8) 
WHERE return_number IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_offline_returns_return_number ON public.offline_returns(return_number);

CREATE TABLE IF NOT EXISTS public.offline_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id UUID NOT NULL REFERENCES public.offline_returns(id) ON DELETE CASCADE,
    sale_item_id UUID REFERENCES public.offline_sale_items(id) ON DELETE RESTRICT,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty INT NOT NULL DEFAULT 1,
    unit_refund_price NUMERIC NOT NULL DEFAULT 0,
    line_refund_total NUMERIC NOT NULL DEFAULT 0,
    restocked BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Crucial: Upgrade existing offline_return_items table if created in earlier phases
ALTER TABLE public.offline_return_items
ADD COLUMN IF NOT EXISTS sale_item_id UUID REFERENCES public.offline_sale_items(id) ON DELETE RESTRICT,
ADD COLUMN IF NOT EXISTS unit_refund_price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS line_refund_total NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS restocked BOOLEAN DEFAULT true;

-- Indexes for fast inspection & debts lookup
CREATE INDEX IF NOT EXISTS idx_offline_returns_sale_id ON public.offline_returns(sale_id);
CREATE INDEX IF NOT EXISTS idx_offline_returns_customer_id ON public.offline_returns(customer_id);
CREATE INDEX IF NOT EXISTS idx_offline_return_items_sale_item_id ON public.offline_return_items(sale_item_id);

-- RLS for Returns
ALTER TABLE public.offline_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_return_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to offline returns" ON public.offline_returns;
CREATE POLICY "Admins have full access to offline returns" 
ON public.offline_returns FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins have full access to offline return items" ON public.offline_return_items;
CREATE POLICY "Admins have full access to offline return items" 
ON public.offline_return_items FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 5. RPC: Authoritative Admin Online Order Status Transition & Stock Reconciliation
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
    p_order_id UUID,
    p_new_status TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order RECORD;
    v_target_status TEXT;
    v_curr_status TEXT;
    v_item RECORD;
    v_product RECORD;
    v_is_admin BOOLEAN;
BEGIN
    -- Authorization check
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
    IF NOT v_is_admin THEN
        PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Only administrators can update order status');
    END IF;

    -- Normalize target status
    v_target_status := lower(trim(p_new_status));
    IF v_target_status = 'ready for pickup' THEN
        v_target_status := 'ready_pickup';
    END IF;

    IF v_target_status NOT IN ('pending', 'confirmed', 'shipped', 'ready_pickup', 'delivered', 'cancelled') THEN
        PERFORM public.raise_standard_error('ERR_INVALID_STATUS', 'Invalid order status: ' || p_new_status);
    END IF;

    -- Row lock on order
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Order not found');
    END IF;

    v_curr_status := lower(trim(v_order.status));
    IF v_curr_status = 'ready for pickup' THEN v_curr_status := 'ready_pickup'; END IF;

    -- No-op check
    IF v_curr_status = v_target_status THEN
        RETURN jsonb_build_object('order_id', p_order_id, 'status', v_target_status, 'updated', false);
    END IF;

    -- Check transition from Terminal Delivered
    IF v_curr_status = 'delivered' THEN
        PERFORM public.raise_standard_error('ERR_ORDER_ALREADY_DELIVERED', 'Delivered orders cannot be cancelled directly. Use the returns workflow.');
    END IF;

    -- Transition TO Cancelled -> Restore Stock Exactly Once
    IF v_target_status = 'cancelled' THEN
        FOR v_item IN SELECT product_id, qty FROM public.order_items WHERE order_id = p_order_id
        LOOP
            UPDATE public.products 
            SET stock = stock + v_item.qty 
            WHERE id = v_item.product_id;

            INSERT INTO public.inventory_transactions (
                product_id, quantity, transaction_type, reference_id, created_by, notes
            ) VALUES (
                v_item.product_id, v_item.qty, 'cancellation', p_order_id, auth.uid(), 
                COALESCE(p_notes, 'Order cancelled by admin')
            );
        END LOOP;
    END IF;

    -- Transition FROM Cancelled -> Active (Re-opening an order)
    IF v_curr_status = 'cancelled' AND v_target_status IN ('pending', 'confirmed') THEN
        -- Verify sufficient stock across all items before making any modifications
        FOR v_item IN SELECT product_id, qty, product_name FROM public.order_items WHERE order_id = p_order_id
        LOOP
            SELECT id, stock INTO v_product FROM public.products WHERE id = v_item.product_id FOR UPDATE;
            IF v_product.stock < v_item.qty THEN
                PERFORM public.raise_standard_error('ERR_INSUFFICIENT_STOCK', 
                    'Cannot reopen order: Insufficient stock for ' || v_item.product_name,
                    jsonb_build_object('productId', v_item.product_id, 'requested', v_item.qty, 'available', v_product.stock)
                );
            END IF;
        END LOOP;

        -- Deduct stock and log
        FOR v_item IN SELECT product_id, qty FROM public.order_items WHERE order_id = p_order_id
        LOOP
            UPDATE public.products 
            SET stock = stock - v_item.qty 
            WHERE id = v_item.product_id;

            INSERT INTO public.inventory_transactions (
                product_id, quantity, transaction_type, reference_id, created_by, notes
            ) VALUES (
                v_item.product_id, -v_item.qty, 'online_sale', p_order_id, auth.uid(), 
                'Order reopened by admin'
            );
        END LOOP;
    END IF;

    -- Update order status
    UPDATE public.orders
    SET status = v_target_status,
        updated_at = now()
    WHERE id = p_order_id;

    RETURN jsonb_build_object('order_id', p_order_id, 'status', v_target_status, 'updated', true);
END;
$$;

-- 6. RPC: Authoritative Offline Return & Financial Reconciliation
DROP FUNCTION IF EXISTS public.process_offline_return(uuid, numeric, text, jsonb);
DROP FUNCTION IF EXISTS public.process_offline_return(uuid, jsonb, text);
DROP FUNCTION IF EXISTS public.process_offline_return(uuid, jsonb, text, text);

CREATE OR REPLACE FUNCTION public.process_offline_return(
    p_sale_id UUID,
    p_items JSONB, -- Array of { "sale_item_id": "uuid", "qty": int, "restock": bool }
    p_reason TEXT DEFAULT NULL,
    p_refund_method TEXT DEFAULT 'cash'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sale RECORD;
    v_return_id UUID;
    v_return_number TEXT;
    v_rand INT;
    v_item JSONB;
    v_sale_item_id UUID;
    v_qty INT;
    v_restock BOOLEAN;
    
    v_sale_item RECORD;
    v_unit_net NUMERIC;
    v_line_refund NUMERIC;
    v_total_return_value NUMERIC := 0;
    
    v_debt_offset NUMERIC := 0;
    v_cash_refund NUMERIC := 0;
    v_new_remaining NUMERIC;
    v_new_paid NUMERIC;
    v_new_payment_status TEXT;
    v_is_admin BOOLEAN;
BEGIN
    -- 1. Authorization
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
    IF NOT v_is_admin THEN
        PERFORM public.raise_standard_error('ERR_UNAUTHORIZED', 'Only administrators can process offline returns');
    END IF;

    -- 2. Lock Sale Header
    SELECT * INTO v_sale FROM public.offline_sales WHERE id = p_sale_id FOR UPDATE;
    IF NOT FOUND THEN
        PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Offline sale not found');
    END IF;

    -- Generate Return Reference Number
    v_rand := floor(random() * 90000 + 10000)::int;
    v_return_number := 'RET-' || to_char(now(), 'YYYYMMDD') || '-' || v_rand::text;

    -- 3. Calculate Item Refunds & Lock Lines
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_sale_item_id := (v_item->>'sale_item_id')::uuid;
        v_qty := (v_item->>'qty')::int;
        v_restock := COALESCE((v_item->>'restock')::boolean, true);

        IF v_qty <= 0 THEN
            PERFORM public.raise_standard_error('ERR_INVALID_QTY', 'Return quantity must be greater than zero');
        END IF;

        -- Lock sale item row
        SELECT * INTO v_sale_item 
        FROM public.offline_sale_items 
        WHERE id = v_sale_item_id AND sale_id = p_sale_id 
        FOR UPDATE;

        IF NOT FOUND THEN
            PERFORM public.raise_standard_error('ERR_NOT_FOUND', 'Sale line item not found on this invoice');
        END IF;

        -- Protect against over-return
        IF (v_sale_item.returned_qty + v_qty) > v_sale_item.qty THEN
            PERFORM public.raise_standard_error('ERR_QTY_EXCEEDED', 
                'Cannot return more items than purchased for: ' || v_sale_item.product_name,
                jsonb_build_object('available', (v_sale_item.qty - v_sale_item.returned_qty), 'requested', v_qty)
            );
        END IF;

        -- Exact net refundable price per unit accounting for invoice-level discounts
        IF v_sale.subtotal > 0 THEN
            v_unit_net := ROUND(
                ((v_sale_item.line_total / v_sale_item.qty::numeric) * (1.0 - (COALESCE(v_sale.discount_amount, 0) / v_sale.subtotal)))::numeric, 
                2
            );
        ELSE
            v_unit_net := 0;
        END IF;

        v_line_refund := ROUND((v_unit_net * v_qty)::numeric, 2);
        v_total_return_value := v_total_return_value + v_line_refund;
    END LOOP;

    IF v_total_return_value <= 0 THEN
        PERFORM public.raise_standard_error('ERR_ZERO_RETURN', 'Calculated return value must be greater than zero');
    END IF;

    -- 4. Reconcile Customer Debt vs Cash Refund
    -- Offset debt first
    IF v_sale.remaining_balance > 0 THEN
        IF v_total_return_value <= v_sale.remaining_balance THEN
            v_debt_offset := v_total_return_value;
            v_cash_refund := 0;
        ELSE
            v_debt_offset := v_sale.remaining_balance;
            v_cash_refund := v_total_return_value - v_debt_offset;
        END IF;
    ELSE
        v_debt_offset := 0;
        v_cash_refund := v_total_return_value;
    END IF;

    v_new_remaining := v_sale.remaining_balance - v_debt_offset;
    v_new_paid := v_sale.total_paid - v_cash_refund;

    IF v_new_remaining <= 0 THEN
        IF v_new_paid <= 0 THEN
            v_new_payment_status := 'REFUNDED';
        ELSE
            v_new_payment_status := 'PAID';
        END IF;
    ELSE
        v_new_payment_status := 'PARTIALLY_PAID';
    END IF;

    -- 5. Insert Master Return Record
    INSERT INTO public.offline_returns (
        return_number, sale_id, customer_id, staff_id,
        total_returned_value, debt_offset_amount, refund_amount,
        refund_method, reason
    ) VALUES (
        v_return_number, p_sale_id, v_sale.customer_id, auth.uid(),
        v_total_return_value, v_debt_offset, v_cash_refund,
        p_refund_method, p_reason
    ) RETURNING id INTO v_return_id;

    -- 6. Insert Return Items, Update Lines & Restock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_sale_item_id := (v_item->>'sale_item_id')::uuid;
        v_qty := (v_item->>'qty')::int;
        v_restock := COALESCE((v_item->>'restock')::boolean, true);

        SELECT * INTO v_sale_item FROM public.offline_sale_items WHERE id = v_sale_item_id;

        IF v_sale.subtotal > 0 THEN
            v_unit_net := ROUND(
                ((v_sale_item.line_total / v_sale_item.qty::numeric) * (1.0 - (COALESCE(v_sale.discount_amount, 0) / v_sale.subtotal)))::numeric, 
                2
            );
        ELSE
            v_unit_net := 0;
        END IF;
        v_line_refund := ROUND((v_unit_net * v_qty)::numeric, 2);

        -- Record line return
        INSERT INTO public.offline_return_items (
            return_id, sale_item_id, product_id, qty, unit_refund_price, line_refund_total, restocked
        ) VALUES (
            v_return_id, v_sale_item_id, v_sale_item.product_id, v_qty, v_unit_net, v_line_refund, v_restock
        );

        -- Update returned_qty on the line item
        UPDATE public.offline_sale_items 
        SET returned_qty = returned_qty + v_qty 
        WHERE id = v_sale_item_id;

        -- Physical inventory movement
        IF v_restock THEN
            UPDATE public.products 
            SET stock = stock + v_qty 
            WHERE id = v_sale_item.product_id;

            INSERT INTO public.inventory_transactions (
                product_id, quantity, transaction_type, reference_id, created_by, notes
            ) VALUES (
                v_sale_item.product_id, v_qty, 'offline_return', v_return_id, auth.uid(),
                'Restocked from return ' || v_return_number
            );
        END IF;
    END LOOP;

    -- 7. Update Sale Record
    UPDATE public.offline_sales
    SET total = total - v_total_return_value,
        total_paid = v_new_paid,
        remaining_balance = v_new_remaining,
        payment_status = v_new_payment_status
    WHERE id = p_sale_id;

    RETURN jsonb_build_object(
        'return_id', v_return_id,
        'return_number', v_return_number,
        'total_returned_value', v_total_return_value,
        'debt_offset_amount', v_debt_offset,
        'cash_refund_amount', v_cash_refund,
        'new_remaining_balance', v_new_remaining,
        'new_payment_status', v_new_payment_status
    );
END;
$$;

-- 7. RPC: create_offline_sale enhanced to return full receipt JSON
DROP FUNCTION IF EXISTS public.create_offline_sale(jsonb, text, text, numeric, numeric, text, uuid);

CREATE OR REPLACE FUNCTION public.create_offline_sale(
    p_items JSONB,
    p_payment_method TEXT,
    p_invoice_discount_type TEXT,
    p_invoice_discount_value NUMERIC,
    p_amount_paid NUMERIC,
    p_notes TEXT,
    p_customer_id UUID DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_sale_id UUID;
    v_receipt_number TEXT;
    
    v_subtotal NUMERIC := 0;
    v_invoice_discount_amount NUMERIC := 0;
    v_final_total NUMERIC := 0;
    
    v_item JSONB;
    v_product_id UUID;
    v_qty INT;
    v_item_discount_type TEXT;
    v_item_discount_value NUMERIC;
    
    v_price NUMERIC;
    v_product_name TEXT;
    v_sku TEXT;
    v_stock INT;
    v_available_offline BOOLEAN;
    
    v_line_subtotal NUMERIC;
    v_line_discount_amount NUMERIC;
    v_line_total NUMERIC;
    
    v_payment_status TEXT;
    v_actual_payment NUMERIC;
    v_remaining_balance NUMERIC;
    
    v_rand INT;
    v_is_admin BOOLEAN;
    v_created_at TIMESTAMPTZ := now();
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

    -- Receipt number generation
    v_rand := floor(random() * 90000 + 10000)::int;
    v_receipt_number := 'POS-' || to_char(v_created_at, 'YYYYMMDD') || '-' || v_rand::text;

    -- Insert sale skeleton
    INSERT INTO public.offline_sales (
        sale_number, customer_id, payment_method, 
        subtotal, discount, tax, total, staff_id,
        discount_type, discount_value, discount_amount,
        payment_status, total_paid, remaining_balance, created_at
    ) VALUES (
        v_receipt_number, p_customer_id, p_payment_method,
        0, 0, 0, 0, auth.uid(),
        p_invoice_discount_type, p_invoice_discount_value, 0,
        'UNPAID', 0, 0, v_created_at
    ) RETURNING id INTO v_sale_id;

    -- Process items & calculate subtotal
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

        -- Authoritative lookup & row lock
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
        v_subtotal := v_subtotal + v_line_total;

        -- Insert line item with returned_qty = 0
        INSERT INTO public.offline_sale_items (
            sale_id, product_id, product_name, sku, qty, unit_price,
            line_subtotal, discount_type, discount_value, discount_amount, line_total, returned_qty
        ) VALUES (
            v_sale_id, v_product_id, v_product_name, v_sku, v_qty, v_price,
            v_line_subtotal, v_item_discount_type, v_item_discount_value, v_line_discount_amount, v_line_total, 0
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

    v_actual_payment := p_amount_paid;
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
        discount = v_invoice_discount_amount,
        discount_type = p_invoice_discount_type,
        discount_value = p_invoice_discount_value,
        discount_amount = v_invoice_discount_amount,
        total = v_final_total,
        payment_status = v_payment_status,
        total_paid = v_actual_payment,
        remaining_balance = v_remaining_balance
    WHERE id = v_sale_id;

    RETURN jsonb_build_object(
        'id', v_sale_id,
        'sale_number', v_receipt_number,
        'subtotal', v_subtotal,
        'discount_amount', v_invoice_discount_amount,
        'total', v_final_total,
        'total_paid', v_actual_payment,
        'remaining_balance', v_remaining_balance,
        'payment_status', v_payment_status,
        'created_at', v_created_at
    );
END;
$$;

COMMIT;

