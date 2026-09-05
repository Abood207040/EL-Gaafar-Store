-- Phase 7: Store / POS Mega-Edit
-- Run this in the Supabase SQL Editor

-- 1. store_shifts
CREATE TABLE IF NOT EXISTS public.store_shifts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    opened_by uuid NOT NULL REFERENCES auth.users(id),
    opened_at timestamptz NOT NULL DEFAULT now(),
    closed_at timestamptz,
    starting_cash numeric(10,2) NOT NULL DEFAULT 0,
    ending_cash numeric(10,2),
    expected_cash numeric(10,2),
    status text NOT NULL DEFAULT 'open', -- 'open', 'closed'
    notes text
);

-- 2. pos_held_sales
CREATE TABLE IF NOT EXISTS public.pos_held_sales (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    staff_id uuid NOT NULL REFERENCES auth.users(id),
    customer_id uuid REFERENCES public.customers(id),
    cart_json jsonb NOT NULL,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. offline_returns and offline_return_items
CREATE TABLE IF NOT EXISTS public.offline_returns (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id uuid NOT NULL REFERENCES public.offline_sales(id),
    staff_id uuid NOT NULL REFERENCES auth.users(id),
    amount_refunded numeric(10,2) NOT NULL,
    reason text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.offline_return_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    return_id uuid NOT NULL REFERENCES public.offline_returns(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id),
    qty int NOT NULL,
    restocked boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. RLS Policies
ALTER TABLE public.store_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pos_held_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_returns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offline_return_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins have full access to store shifts" ON public.store_shifts;
DROP POLICY IF EXISTS "Admins have full access to held sales" ON public.pos_held_sales;
DROP POLICY IF EXISTS "Admins have full access to offline returns" ON public.offline_returns;
DROP POLICY IF EXISTS "Admins have full access to offline return items" ON public.offline_return_items;

CREATE POLICY "Admins have full access to store shifts" ON public.store_shifts FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Admins have full access to held sales" ON public.pos_held_sales FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Admins have full access to offline returns" ON public.offline_returns FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));
CREATE POLICY "Admins have full access to offline return items" ON public.offline_return_items FOR ALL USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'admin'));

-- 5. Return Processing RPC
CREATE OR REPLACE FUNCTION public.process_offline_return(
    p_sale_id uuid,
    p_amount_refunded numeric,
    p_reason text,
    p_items jsonb -- [{product_id, qty, restock: boolean}]
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_admin boolean;
    v_return_id uuid;
    v_item jsonb;
    v_product_id uuid;
    v_qty int;
    v_restock boolean;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin') INTO v_is_admin;
    IF NOT v_is_admin THEN RAISE EXCEPTION 'Unauthorized'; END IF;

    -- Insert return record
    INSERT INTO public.offline_returns (sale_id, staff_id, amount_refunded, reason)
    VALUES (p_sale_id, auth.uid(), p_amount_refunded, p_reason)
    RETURNING id INTO v_return_id;

    -- Process items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_product_id := (v_item->>'product_id')::uuid;
        v_qty := (v_item->>'qty')::int;
        v_restock := (v_item->>'restock')::boolean;

        INSERT INTO public.offline_return_items (return_id, product_id, qty, restocked)
        VALUES (v_return_id, v_product_id, v_qty, v_restock);

        IF v_restock THEN
            -- Safely increment stock using the secure adjust_stock RPC from Phase 6
            PERFORM public.adjust_stock(v_product_id, v_qty, 'manual_adjustment', 'Return from sale ' || p_sale_id);
        END IF;
    END LOOP;

    RETURN v_return_id;
END;
$$;
