-- Phase 11: Fix Anonymous Order Tracking
-- Run this in the Supabase SQL Editor

-- Create a secure RPC for guests/users to track their orders
-- This bypasses RLS securely by strictly enforcing the contact matching
CREATE OR REPLACE FUNCTION public.track_online_order(
    p_order_number text,
    p_contact text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order json;
BEGIN
    SELECT json_build_object(
        'id', o.id,
        'customer_id', o.customer_id,
        'order_number', o.order_number,
        'customer_name', o.customer_name,
        'customer_phone', o.customer_phone,
        'customer_email', o.customer_email,
        'fulfillment_type', o.fulfillment_type,
        'status', o.status,
        'city', o.city,
        'area', o.area,
        'street_address', o.street_address,
        'notes', o.notes,
        'subtotal', o.subtotal,
        'logistics_fee', o.logistics_fee,
        'tax', o.tax,
        'total', o.total,
        'payment_method', o.payment_method,
        'created_at', o.created_at,
        'customers', (
            SELECT json_build_object(
                'id', c.id,
                'full_name', c.full_name,
                'phone', c.phone,
                'email', c.email
            ) FROM public.customers c WHERE c.id = o.customer_id
        ),
        'order_items', (
            SELECT COALESCE(json_agg(json_build_object(
                'id', oi.id,
                'order_id', oi.order_id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'sku', oi.sku,
                'qty', oi.qty,
                'unit_price', oi.unit_price,
                'line_total', oi.line_total,
                'created_at', oi.created_at
            )), '[]'::json) FROM public.order_items oi WHERE oi.order_id = o.id
        )
    ) INTO v_order
    FROM public.orders o
    WHERE o.order_number = p_order_number
      AND (
          (p_contact LIKE '%@%' AND o.customer_email = p_contact) OR
          (p_contact NOT LIKE '%@%' AND o.customer_phone = p_contact)
      );

    RETURN v_order;
END;
$$;
