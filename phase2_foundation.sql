-- Phase 2: Database Foundation
-- Run this in the Supabase SQL Editor

-- 1. ADD NEW COLUMNS TO EXISTING PRODUCTS TABLE
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS available_online boolean NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS available_offline boolean NOT NULL DEFAULT true;

-- 2. CREATE INVENTORY TRANSACTIONS TABLE (Audit log)
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id),
    quantity int NOT NULL,
    transaction_type text NOT NULL, -- 'online_sale', 'offline_sale', 'restock', 'manual_adjustment'
    reference_id uuid, -- ALWAYS references orders.id or offline_sales.id for sales
    created_by uuid REFERENCES auth.users(id),
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. CREATE OFFLINE SALES TABLE
CREATE TABLE IF NOT EXISTS public.offline_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_number text NOT NULL UNIQUE,
    staff_id uuid NOT NULL REFERENCES auth.users(id),
    customer_id uuid REFERENCES public.customers(id),
    subtotal numeric NOT NULL,
    tax numeric NOT NULL DEFAULT 0,
    total numeric NOT NULL,
    payment_method text NOT NULL DEFAULT 'cash',
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. CREATE OFFLINE SALE ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.offline_sale_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES public.offline_sales(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id),
    product_name text NOT NULL,
    sku text,
    qty int NOT NULL,
    unit_price numeric NOT NULL,
    line_total numeric NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. ENABLE RLS (ROW LEVEL SECURITY)
ALTER TABLE public.inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_sale_items ENABLE ROW LEVEL SECURITY;

-- 6. DROP EXISTING POLICIES IF RE-RUNNING (Prevents errors)
DROP POLICY IF EXISTS "Admins can view inventory transactions" ON public.inventory_transactions;
DROP POLICY IF EXISTS "Admins have full access to offline sales" ON public.offline_sales;
DROP POLICY IF EXISTS "Admins have full access to offline sale items" ON public.offline_sale_items;

-- 7. CREATE STRICT RLS POLICIES USING profiles.role
CREATE POLICY "Admins can view inventory transactions"
ON public.inventory_transactions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
-- Note: Inserts to inventory_transactions happen strictly inside SECURITY DEFINER functions (RPCs) to prevent client manipulation.

CREATE POLICY "Admins have full access to offline sales"
ON public.offline_sales FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);

CREATE POLICY "Admins have full access to offline sale items"
ON public.offline_sale_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p 
    WHERE p.id = auth.uid() AND p.role = 'admin'
  )
);
