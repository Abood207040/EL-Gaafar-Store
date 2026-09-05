-- Phase 9: User / Customer Mega-Edit
-- Safe additive schema changes to support unified customer identity

-- 1. ADD NEW COLUMNS
ALTER TABLE public.customers 
  ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS phone_normalized VARCHAR(20),
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 2. CREATE PHONE NORMALIZATION FUNCTION
CREATE OR REPLACE FUNCTION public.normalize_phone(p_phone VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    v_clean VARCHAR;
BEGIN
    IF p_phone IS NULL OR trim(p_phone) = '' THEN 
        RETURN NULL; 
    END IF;
    
    -- Remove all non-numeric characters
    v_clean := regexp_replace(p_phone, '\D', '', 'g');
    
    -- Egyptian canonical format: 20XXXXXXXXXX
    -- Convert 010... to 2010...
    IF v_clean LIKE '01%' AND length(v_clean) = 11 THEN
        v_clean := '20' || substr(v_clean, 2);
    ELSIF v_clean LIKE '0020%' THEN
        v_clean := substr(v_clean, 3);
    ELSIF v_clean LIKE '20%' AND length(v_clean) = 12 THEN
        -- Already 20XXXXXXXXXX
        v_clean := v_clean;
    END IF;
    
    RETURN v_clean;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. CREATE INDEX FOR FASTER LOOKUPS
CREATE INDEX IF NOT EXISTS idx_customers_phone_norm ON public.customers(phone_normalized);

-- 4. CREATE TRIGGER FOR AUTO-NORMALIZATION
CREATE OR REPLACE FUNCTION public.trg_normalize_phone()
RETURNS trigger AS $$
BEGIN
    IF NEW.phone IS NOT NULL THEN
        NEW.phone_normalized := public.normalize_phone(NEW.phone);
    ELSE
        NEW.phone_normalized := NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_customers_normalize_phone ON public.customers;
CREATE TRIGGER trg_customers_normalize_phone
    BEFORE INSERT OR UPDATE OF phone ON public.customers
    FOR EACH ROW
    EXECUTE FUNCTION public.trg_normalize_phone();

-- 5. UPDATE EXISTING RECORDS WITH NORMALIZED PHONES
UPDATE public.customers
SET phone_normalized = public.normalize_phone(phone)
WHERE phone_normalized IS NULL AND phone IS NOT NULL;

-- 6. ENABLE RLS ON CUSTOMERS (Ensures secure default state)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- 7. ADMIN POLICY FOR CUSTOMERS
DROP POLICY IF EXISTS "Admins have full access to customers" ON public.customers;
CREATE POLICY "Admins have full access to customers"
ON public.customers FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

-- 7. CUSTOMER POLICIES FOR OWN RECORD (READ-ONLY VIA RLS)
DROP POLICY IF EXISTS "Customers can view own record" ON public.customers;
CREATE POLICY "Customers can view own record" 
ON public.customers FOR SELECT 
USING (auth_user_id = auth.uid());

-- 8. CUSTOMER POLICIES FOR ORDERS
DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" 
ON public.orders FOR SELECT 
USING (
    customer_id IN (
        SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
);

-- 9. CUSTOMER POLICIES FOR OFFLINE SALES (READ-ONLY)
DROP POLICY IF EXISTS "Customers can view own offline sales" ON public.offline_sales;
CREATE POLICY "Customers can view own offline sales" 
ON public.offline_sales FOR SELECT 
USING (
    customer_id IN (
        SELECT id FROM public.customers WHERE auth_user_id = auth.uid()
    )
);

-- 10. SECURE RPC FOR REGISTRATION
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
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if already registered
  SELECT id INTO v_customer_id FROM public.customers WHERE auth_user_id = v_uid LIMIT 1;
  IF v_customer_id IS NOT NULL THEN
    RAISE EXCEPTION 'Customer profile already exists for this account';
  END IF;
  
  INSERT INTO public.customers (auth_user_id, full_name, phone, phone_normalized, email, city, area, address, status)
  VALUES (v_uid, p_full_name, p_phone, public.normalize_phone(p_phone), p_email, p_city, p_area, p_address, 'active')
  RETURNING id INTO v_customer_id;
  
  RETURN v_customer_id;
END;
$$;

-- 11. SECURE RPC FOR PROFILE UPDATES
CREATE OR REPLACE FUNCTION public.update_customer_profile(
  p_full_name text,
  p_phone text,
  p_city text,
  p_area text,
  p_address text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid;
BEGIN
  v_uid := auth.uid();
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  UPDATE public.customers
  SET 
    full_name = p_full_name,
    phone = p_phone,
    phone_normalized = public.normalize_phone(p_phone),
    city = p_city,
    area = p_area,
    address = p_address
  WHERE auth_user_id = v_uid;
END;
$$;

-- 12. UPDATE ONLINE ORDER RPC TO USE NORMALIZED PHONE
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

    -- 1. Determine Customer
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

    -- 2. Generate Order Number (AJ-YYYYMMDD-XXXX)
    v_rand := floor(random() * 9000 + 1000)::int;
    v_order_number := 'AJ-' || to_char(now(), 'YYYYMMDD') || '-' || v_rand::text;

    -- 3. Calculate Logistics Fee from settings
    IF p_fulfillment_type = 'delivery' THEN
        SELECT (value->>0)::numeric INTO v_logistics_fee 
        FROM public.store_settings 
        WHERE key = 'delivery_fee';
        
        IF v_logistics_fee IS NULL THEN
            v_logistics_fee := 25; -- Fallback
        END IF;
    END IF;

    -- 4. Create Order Header
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
