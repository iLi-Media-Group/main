-- Check current database structure and discount data

-- Check what columns exist in discounts table
SELECT 'Current discounts table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'discounts'
ORDER BY ordinal_position;

-- Check current discount data
SELECT 'Current discount data:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at,
    created_at
FROM discounts
WHERE discount_type = 'promotion_code'
ORDER BY created_at DESC;

-- Check if TEST30 exists and its details
SELECT 'TEST30 discount details:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at
FROM discounts
WHERE promotion_code = 'TEST30'; 