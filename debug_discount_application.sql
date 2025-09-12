-- Debug script to check discount application issues
-- This will help identify why discounts aren't being applied in Stripe

-- 1. Check if the discounts table exists and has the correct structure
SELECT '1. Checking discounts table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'discounts'
ORDER BY ordinal_position;

-- 2. Check if the discount functions exist
SELECT '2. Checking if discount functions exist:' as info;
SELECT 
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('get_applicable_discounts', 'calculate_discounted_price')
AND routine_schema = 'public';

-- 3. Check current discounts in the database
SELECT '3. Current discounts in database:' as info;
SELECT 
    id,
    name,
    description,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    created_at,
    updated_at
FROM discounts
ORDER BY created_at DESC;

-- 4. Check which discounts should be active today
SELECT '4. Discounts that should be active today:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE'
        WHEN CURRENT_DATE < start_date THEN 'FUTURE'
        WHEN CURRENT_DATE > end_date THEN 'EXPIRED'
        ELSE 'INACTIVE'
    END as date_status
FROM discounts
WHERE is_active = true
ORDER BY discount_percent DESC;

-- 5. Test the discount functions with sample data
SELECT '5. Testing discount functions:' as info;

-- Test with a sample price (1000 cents = $10.00)
SELECT 
    'single_track' as product_name,
    * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE)
UNION ALL
SELECT 
    'gold_access' as product_name,
    * FROM calculate_discounted_price(2000, 'gold_access', CURRENT_DATE)
UNION ALL
SELECT 
    'starter' as product_name,
    * FROM calculate_discounted_price(5000, 'starter', CURRENT_DATE);

-- 6. Check if there are any RLS policy issues
SELECT '6. Checking RLS policies on discounts table:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'discounts';

-- 7. Check if the functions can be called by the service role
SELECT '7. Testing function access:' as info;
-- This will show if there are any permission issues
SELECT 
    'get_applicable_discounts' as function_name,
    COUNT(*) as call_count
FROM get_applicable_discounts('single_track', CURRENT_DATE)
UNION ALL
SELECT 
    'calculate_discounted_price' as function_name,
    COUNT(*) as call_count
FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE); 