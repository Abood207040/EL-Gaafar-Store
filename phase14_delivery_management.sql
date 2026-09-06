-- ==============================================================================
-- Phase 14: Admin-Controlled Delivery Management System
-- EL-Gaafar Store (Al-Jafar)
-- ==============================================================================

-- 1. Table: delivery_classes
CREATE TABLE IF NOT EXISTS public.delivery_classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed ONLY the 5 Delivery Classes (No invented prices, no dummy governorates)
INSERT INTO public.delivery_classes (code, name_en, name_ar, sort_order, is_active)
VALUES 
    ('small', 'Small', 'صغير', 1, true),
    ('medium', 'Medium', 'متوسط', 2, true),
    ('large', 'Large', 'كبير', 3, true),
    ('oversized', 'Oversized', 'ضخم', 4, true),
    ('special', 'Special', 'خاص', 5, true)
ON CONFLICT (code) DO UPDATE 
SET 
    name_en = EXCLUDED.name_en,
    name_ar = EXCLUDED.name_ar,
    sort_order = EXCLUDED.sort_order;

-- 2. Table: governorates
CREATE TABLE IF NOT EXISTS public.governorates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table: delivery_areas
CREATE TABLE IF NOT EXISTS public.delivery_areas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    governorate_id UUID NOT NULL REFERENCES public.governorates(id) ON DELETE CASCADE,
    name_en TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_delivery_areas_gov_id ON public.delivery_areas(governorate_id);

-- 4. Table: delivery_rates
CREATE TABLE IF NOT EXISTS public.delivery_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    governorate_id UUID NOT NULL REFERENCES public.governorates(id) ON DELETE CASCADE,
    area_id UUID REFERENCES public.delivery_areas(id) ON DELETE CASCADE,
    delivery_class_id UUID NOT NULL REFERENCES public.delivery_classes(id) ON DELETE CASCADE,
    price NUMERIC NOT NULL DEFAULT 0 CHECK (price >= 0),
    requires_manual_quote BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prevent duplicate active rates for the same area + delivery class
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_rates_area_class 
ON public.delivery_rates (governorate_id, area_id, delivery_class_id) 
WHERE area_id IS NOT NULL;

-- Prevent duplicate active governorate-level fallback rates
CREATE UNIQUE INDEX IF NOT EXISTS idx_delivery_rates_gov_default_class 
ON public.delivery_rates (governorate_id, delivery_class_id) 
WHERE area_id IS NULL;

-- 5. Product delivery columns
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS delivery_class TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_delivery_available BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS is_pickup_available BOOLEAN NOT NULL DEFAULT true;

-- Ensure all existing products default to is_delivery_available = false and delivery_class = NULL
-- Admin must explicitly configure delivery_class and review delivery availability.
UPDATE public.products
SET is_delivery_available = false,
    is_pickup_available = true
WHERE is_delivery_available IS NULL;

-- 6. Order historical delivery snapshot columns
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS delivery_governorate_id UUID,
ADD COLUMN IF NOT EXISTS delivery_governorate_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_area_id UUID,
ADD COLUMN IF NOT EXISTS delivery_area_name TEXT,
ADD COLUMN IF NOT EXISTS delivery_class TEXT,
ADD COLUMN IF NOT EXISTS delivery_requires_manual_quote BOOLEAN NOT NULL DEFAULT false;

-- 7. Row-Level Security (RLS)
ALTER TABLE public.delivery_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governorates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_rates ENABLE ROW LEVEL SECURITY;

-- delivery_classes policies
DROP POLICY IF EXISTS "Public can view active delivery classes" ON public.delivery_classes;
CREATE POLICY "Public can view active delivery classes" 
ON public.delivery_classes FOR SELECT 
USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins have full access to delivery classes" ON public.delivery_classes;
CREATE POLICY "Admins have full access to delivery classes" 
ON public.delivery_classes FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- governorates policies
DROP POLICY IF EXISTS "Public can view active governorates" ON public.governorates;
CREATE POLICY "Public can view active governorates" 
ON public.governorates FOR SELECT 
USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins have full access to governorates" ON public.governorates;
CREATE POLICY "Admins have full access to governorates" 
ON public.governorates FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- delivery_areas policies
DROP POLICY IF EXISTS "Public can view active delivery areas" ON public.delivery_areas;
CREATE POLICY "Public can view active delivery areas" 
ON public.delivery_areas FOR SELECT 
USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins have full access to delivery areas" ON public.delivery_areas;
CREATE POLICY "Admins have full access to delivery areas" 
ON public.delivery_areas FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- delivery_rates policies
DROP POLICY IF EXISTS "Public can view active delivery rates" ON public.delivery_rates;
CREATE POLICY "Public can view active delivery rates" 
ON public.delivery_rates FOR SELECT 
USING (is_active = true OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

DROP POLICY IF EXISTS "Admins have full access to delivery rates" ON public.delivery_rates;
CREATE POLICY "Admins have full access to delivery rates" 
ON public.delivery_rates FOR ALL 
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));


-- 8. AUTHORITATIVE SERVER-SIDE ORDER CREATION RPC
-- Drop previous signatures to avoid parameter conflict
DROP FUNCTION IF EXISTS public.create_online_order(jsonb, text, text, text, text, text, text, text, text, uuid);
DROP FUNCTION IF EXISTS public.create_online_order(jsonb, text, text, text, text, text, text, text, text, uuid, uuid, uuid);

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
    p_customer_id uuid DEFAULT NULL,
    p_governorate_id uuid DEFAULT NULL,
    p_area_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
    v_is_delivery_available boolean;
    v_is_pickup_available boolean;
    v_prod_delivery_class text;
    v_final_customer_id uuid;
    v_rand int;
    v_norm_phone text;

    -- Delivery calculation variables
    v_dominant_rank int := 0;
    v_dominant_code text := NULL;
    v_dominant_class_id uuid := NULL;
    v_item_class_rank int;
    v_item_class_id uuid;
    v_gov_name text := NULL;
    v_area_name text := NULL;
    v_rate_price numeric;
    v_rate_manual_quote boolean := false;
    v_delivery_requires_manual_quote boolean := false;
BEGIN
    -- 1. Customer resolution
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

    -- 2. Validate Fulfillment & Geographic hierarchy
    IF p_fulfillment_type = 'delivery' THEN
        IF p_governorate_id IS NULL THEN
            PERFORM public.raise_standard_error('GOVERNORATE_NOT_FOUND', 'Governorate is required for delivery');
        END IF;

        IF p_area_id IS NULL THEN
            PERFORM public.raise_standard_error('AREA_NOT_FOUND', 'Area is required for delivery');
        END IF;

        -- Validate Governorate is active
        SELECT name_en INTO v_gov_name
        FROM public.governorates
        WHERE id = p_governorate_id AND is_active = true;

        IF NOT FOUND THEN
            PERFORM public.raise_standard_error('GOVERNORATE_NOT_FOUND', 'Selected governorate is invalid or inactive', jsonb_build_object('governorateId', p_governorate_id));
        END IF;

        -- Validate Area belongs to Governorate and is active
        SELECT name_en INTO v_area_name
        FROM public.delivery_areas
        WHERE id = p_area_id AND governorate_id = p_governorate_id AND is_active = true;

        IF NOT FOUND THEN
            PERFORM public.raise_standard_error('AREA_NOT_IN_GOVERNORATE', 'Selected area does not belong to this governorate or is inactive', jsonb_build_object('areaId', p_area_id, 'governorateId', p_governorate_id));
        END IF;
    ELSIF p_fulfillment_type = 'pickup' THEN
        v_logistics_fee := 0;
        v_delivery_requires_manual_quote := false;
    ELSE
        PERFORM public.raise_standard_error('INVALID_FULFILLMENT', 'Invalid fulfillment type');
    END IF;

    -- 3. Generate Order Number
    v_rand := floor(random() * 9000 + 1000)::int;
    v_order_number := 'AJ-' || to_char(now(), 'YYYYMMDD') || '-' || v_rand::text;

    -- 4. Initial insert into orders
    INSERT INTO public.orders (
        customer_id, order_number, customer_name, customer_phone, customer_email,
        fulfillment_type, status, city, area, street_address, notes,
        subtotal, logistics_fee, tax, total, payment_method,
        delivery_governorate_id, delivery_governorate_name,
        delivery_area_id, delivery_area_name
    ) VALUES (
        v_final_customer_id, v_order_number, p_customer_name, p_customer_phone, p_customer_email,
        p_fulfillment_type, 'pending', COALESCE(v_gov_name, p_city), COALESCE(v_area_name, p_area), p_street_address, p_notes,
        0, 0, 0, 0, 'cash',
        p_governorate_id, v_gov_name,
        p_area_id, v_area_name
    )
    RETURNING id INTO v_order_id;

    -- 5. Process Cart Items & Compute Dominant Delivery Class
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'qty')::int;

        IF v_qty <= 0 THEN
            PERFORM public.raise_standard_error('ERR_INVALID_QTY', 'Quantity must be greater than zero', jsonb_build_object('productId', v_product_id));
        END IF;

        SELECT price, stock, available_online, name_en, sku,
               is_delivery_available, is_pickup_available, delivery_class
        INTO v_price, v_stock, v_available_online, v_product_name, v_sku,
             v_is_delivery_available, v_is_pickup_available, v_prod_delivery_class
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

        -- Fulfillment-specific item validation
        IF p_fulfillment_type = 'delivery' THEN
            IF NOT COALESCE(v_is_delivery_available, false) THEN
                PERFORM public.raise_standard_error(
                    'PRODUCT_NOT_DELIVERABLE',
                    'This product is available for showroom pickup only.',
                    jsonb_build_object('productId', v_product_id, 'productName', v_product_name)
                );
            END IF;

            -- Check delivery class
            IF v_prod_delivery_class IS NULL OR trim(v_prod_delivery_class) = '' THEN
                PERFORM public.raise_standard_error(
                    'INVALID_DELIVERY_CLASS',
                    'Product delivery class is not configured.',
                    jsonb_build_object('productId', v_product_id, 'productName', v_product_name)
                );
            END IF;

            -- Find class ranking
            SELECT id, sort_order INTO v_item_class_id, v_item_class_rank
            FROM public.delivery_classes
            WHERE code = LOWER(trim(v_prod_delivery_class)) AND is_active = true;

            IF NOT FOUND THEN
                PERFORM public.raise_standard_error(
                    'INVALID_DELIVERY_CLASS',
                    'Invalid or inactive delivery class for product.',
                    jsonb_build_object('productId', v_product_id, 'deliveryClass', v_prod_delivery_class)
                );
            END IF;

            -- Compare ranking for dominant class
            IF v_item_class_rank > v_dominant_rank THEN
                v_dominant_rank := v_item_class_rank;
                v_dominant_code := LOWER(trim(v_prod_delivery_class));
                v_dominant_class_id := v_item_class_id;
            END IF;
        ELSIF p_fulfillment_type = 'pickup' THEN
            IF NOT COALESCE(v_is_pickup_available, true) THEN
                PERFORM public.raise_standard_error(
                    'PRODUCT_NOT_PICKUPABLE',
                    'This product is not available for showroom pickup.',
                    jsonb_build_object('productId', v_product_id, 'productName', v_product_name)
                );
            END IF;
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

    -- 6. Authoritative Delivery Rate Lookup (for Delivery orders)
    IF p_fulfillment_type = 'delivery' THEN
        -- Check if dominant class is 'special' (which by rule always requires manual quote)
        IF v_dominant_code = 'special' THEN
            v_delivery_requires_manual_quote := true;
            v_logistics_fee := 0;
        ELSE
            -- Try area-specific rate first
            SELECT price, requires_manual_quote 
            INTO v_rate_price, v_rate_manual_quote
            FROM public.delivery_rates
            WHERE governorate_id = p_governorate_id 
              AND area_id = p_area_id 
              AND delivery_class_id = v_dominant_class_id 
              AND is_active = true
            LIMIT 1;

            -- If area-specific rate not found, try governorate-level default (area_id IS NULL)
            IF NOT FOUND THEN
                SELECT price, requires_manual_quote 
                INTO v_rate_price, v_rate_manual_quote
                FROM public.delivery_rates
                WHERE governorate_id = p_governorate_id 
                  AND area_id IS NULL 
                  AND delivery_class_id = v_dominant_class_id 
                  AND is_active = true
                LIMIT 1;
            END IF;

            -- If still not found, delivery is not available for this area & class
            IF NOT FOUND THEN
                PERFORM public.raise_standard_error(
                    'DELIVERY_RATE_NOT_FOUND',
                    'Delivery is not currently available for this area.',
                    jsonb_build_object('governorateId', p_governorate_id, 'areaId', p_area_id, 'deliveryClass', v_dominant_code)
                );
            END IF;

            IF v_rate_manual_quote THEN
                v_delivery_requires_manual_quote := true;
                v_logistics_fee := 0;
            ELSE
                v_delivery_requires_manual_quote := false;
                v_logistics_fee := v_rate_price;
            END IF;
        END IF;
    END IF;

    -- 7. Final Order Totals & Historical Snapshot Freeze
    v_total := v_subtotal + v_logistics_fee + v_tax;

    UPDATE public.orders
    SET subtotal = v_subtotal,
        logistics_fee = v_logistics_fee,
        total = v_total,
        delivery_class = v_dominant_code,
        delivery_requires_manual_quote = v_delivery_requires_manual_quote
    WHERE id = v_order_id;

    RETURN v_order_id;
END;
$$;
