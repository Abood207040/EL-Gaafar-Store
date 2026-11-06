-- ==============================================================================
-- EL-GAAFAR STORE — REAL PRODUCTS SEED SCRIPT
-- ==============================================================================
-- This script populates the 'products' table with real plumbing & sanitary products
-- linked to existing categories and using the uploaded images from the 'product-images' storage bucket.
-- Run this in your Supabase SQL Editor if your 'products' table is currently empty.
-- ==============================================================================

DO $$
DECLARE
    v_pipe_cat_id UUID;
    v_faucet_cat_id UUID;
    v_valve_cat_id UUID;
    v_mixer_cat_id UUID;
BEGIN
    -- 1. Ensure primary sanitary & plumbing categories exist
    SELECT id INTO v_pipe_cat_id FROM public.categories WHERE slug = 'pipes' LIMIT 1;
    IF v_pipe_cat_id IS NULL THEN
        INSERT INTO public.categories (name_en, name_ar, slug, is_active)
        VALUES ('Pipes', 'مواسير', 'pipes', true)
        RETURNING id INTO v_pipe_cat_id;
    END IF;

    SELECT id INTO v_valve_cat_id FROM public.categories WHERE slug = 'valves' LIMIT 1;
    IF v_valve_cat_id IS NULL THEN
        INSERT INTO public.categories (name_en, name_ar, slug, is_active)
        VALUES ('Valves', 'محابس وصمامات', 'valves', true)
        RETURNING id INTO v_valve_cat_id;
    END IF;

    SELECT id INTO v_mixer_cat_id FROM public.categories WHERE slug = 'mixers' LIMIT 1;
    IF v_mixer_cat_id IS NULL THEN
        INSERT INTO public.categories (name_en, name_ar, slug, is_active)
        VALUES ('Mixers', 'خلاطات', 'mixers', true)
        RETURNING id INTO v_mixer_cat_id;
    END IF;

    SELECT id INTO v_faucet_cat_id FROM public.categories WHERE slug = 'faucets' LIMIT 1;
    IF v_faucet_cat_id IS NULL THEN
        INSERT INTO public.categories (name_en, name_ar, slug, is_active)
        VALUES ('Faucets', 'حنفيات', 'faucets', true)
        RETURNING id INTO v_faucet_cat_id;
    END IF;

    -- 2. Insert real products using real images from the Supabase storage bucket
    -- Image 1: 1778495314688-download.jpg
    INSERT INTO public.products (
        name_en, name_ar, category_id, brand, sku, barcode, price, cost, stock, stock_status, low_stock_threshold,
        is_featured, is_active, available_online, available_offline,
        image_url, description_en, description_ar
    ) VALUES (
        'High Pressure UPVC Pipe 4 Inch',
        'ماسورة UPVC ضغط عالي 4 بوصة',
        v_pipe_cat_id,
        'الشريف',
        'UPVC-4IN-HP',
        '100000000001',
        340.00,
        250.00,
        50,
        'in_stock',
        5,
        true,
        true,
        true,
        true,
        'https://ibwurjxseiuiotlqoywa.supabase.co/storage/v1/object/public/product-images/products/1778495314688-download.jpg',
        'High quality UPVC pressure pipe 4 inch designed for plumbing and drainage systems.',
        'ماسورة UPVC ضغط عالي 4 بوصة معتمدة لأعمال الصرف والسباكة والشبكات الرئيسية.'
    ) ON CONFLICT (barcode) DO NOTHING;

    -- Image 2: 1778495469441-download.jpg
    INSERT INTO public.products (
        name_en, name_ar, category_id, brand, sku, barcode, price, cost, stock, stock_status, low_stock_threshold,
        is_featured, is_active, available_online, available_offline,
        image_url, description_en, description_ar
    ) VALUES (
        'PPR Thermal Pipe 32mm PN20',
        'ماسورة بولي حراري 32 مم PN20',
        v_pipe_cat_id,
        'باننجر',
        'PPR-32MM-PN20',
        '100000000002',
        195.00,
        140.00,
        80,
        'in_stock',
        10,
        true,
        true,
        true,
        true,
        'https://ibwurjxseiuiotlqoywa.supabase.co/storage/v1/object/public/product-images/products/1778495469441-download.jpg',
        'Premium PPR hot and cold water thermal pipe 32mm PN20 German technology.',
        'ماسورة بولي بروبيلين حراري 32 مم PN20 مخصصة للمياه الساخنة والباردة بجودة عالية.'
    ) ON CONFLICT (barcode) DO NOTHING;

    -- Image 3: 1788332944792-tower.jpg
    INSERT INTO public.products (
        name_en, name_ar, category_id, brand, sku, barcode, price, cost, stock, stock_status, low_stock_threshold,
        is_featured, is_active, available_online, available_offline,
        image_url, description_en, description_ar
    ) VALUES (
        'Luxury Shower Tower Panel System',
        'شاور بانل عمود دوش مساج فاخر',
        v_mixer_cat_id,
        'ساريكس',
        'SHOWER-TOWER-01',
        '100000000003',
        3850.00,
        2900.00,
        15,
        'in_stock',
        3,
        true,
        true,
        true,
        true,
        'https://ibwurjxseiuiotlqoywa.supabase.co/storage/v1/object/public/product-images/products/1788332944792-tower.jpg',
        'Stainless steel luxury shower panel tower with multi-jet massage, waterfall, and handheld shower.',
        'عمود شاور بانل استانلس ستيل فاخر متعدد النفاثات مع شلال وسماعة يدوية للراحة القصوى.'
    ) ON CONFLICT (barcode) DO NOTHING;

    -- Additional popular essentials
    INSERT INTO public.products (
        name_en, name_ar, category_id, brand, sku, barcode, price, cost, stock, stock_status, low_stock_threshold,
        is_featured, is_active, available_online, available_offline,
        image_url, description_en, description_ar
    ) VALUES (
        'Premium Brass Ball Valve 1 Inch',
        'محبس بلية نحاس إيطالي 1 بوصة',
        v_valve_cat_id,
        'ايطالي',
        'VALVE-BRASS-1IN',
        '100000000004',
        285.00,
        210.00,
        45,
        'in_stock',
        5,
        true,
        true,
        true,
        true,
        'https://ibwurjxseiuiotlqoywa.supabase.co/storage/v1/object/public/product-images/products/1778495314688-download.jpg',
        'Heavy-duty brass ball valve 1 inch full port for reliable water shutoff.',
        'محبس بلية نحاس إيطالي 1 بوصة عالي التحمل للتحكم في خطوط المياه الرئيسية.'
    ) ON CONFLICT (barcode) DO NOTHING;

    INSERT INTO public.products (
        name_en, name_ar, category_id, brand, sku, barcode, price, cost, stock, stock_status, low_stock_threshold,
        is_featured, is_active, available_online, available_offline,
        image_url, description_en, description_ar
    ) VALUES (
        'Kitchen Basin Mixer Tap Chrome',
        'خلاط مطبخ شجرة كروم استانلس',
        v_mixer_cat_id,
        'ساريكس',
        'MIX-KIT-CHROME',
        '100000000005',
        1250.00,
        920.00,
        24,
        'in_stock',
        4,
        true,
        true,
        true,
        true,
        'https://ibwurjxseiuiotlqoywa.supabase.co/storage/v1/object/public/product-images/products/1788332944792-tower.jpg',
        'Single-lever stainless steel kitchen sink mixer tap with ceramic cartridge.',
        'خلاط مطبخ شجرة كروم استانلس بقلب سيراميك مقاوم للتآكل والترسبات.'
    ) ON CONFLICT (barcode) DO NOTHING;

END $$;

