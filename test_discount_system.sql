-- Quick test to verify discount system is working

-- 1. Check current user permissions
SELECT '1. Current user permissions:' as test;
SELECT 
    auth.uid() as user_id,
    auth.email() as user_email,
    p.account_type,
    CASE 
        WHEN p.account_type IN ('admin', 'admin,producer') THEN '✅ Admin access'
        WHEN p.email IN ('knockriobeats@gmail.com', 'info@mybeatfi.io', 'derykbanks@yahoo.com', 'knockriobeats2@gmail.com') THEN '✅ Admin access via email'
        ELSE '❌ Not admin'
    END as admin_status
FROM profiles p
WHERE p.id = auth.uid();

-- 2. Check if we can read discounts (admin should see all)
SELECT '2. Can read discounts:' as test;
SELECT 
    COUNT(*) as total_discounts,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_discounts,
    COUNT(CASE WHEN discount_type = 'promotion_code' THEN 1 END) as promotion_code_discounts
FROM discounts;

-- 3. Check active promotion code discounts for modal
SELECT '3. Active promotion code discounts for modal:' as test;
SELECT 
    name,
    promotion_code,
    discount_percent,
    is_active,
    start_date,
    end_date,
    stripe_coupon_id,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
WHERE discount_type = 'promotion_code' 
AND is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date;

-- 4. Test discount functions
SELECT '4. Testing discount functions:' as test;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- 5. Check if we can insert a test discount (will rollback)
SELECT '5. Testing insert permission:' as test;
BEGIN;
INSERT INTO discounts (
    name, description, discount_percent, applies_to, discount_type, 
    promotion_code, is_automatic, is_active, start_date, end_date
) VALUES (
    'TEST_DISCOUNT', 'Test discount for permissions', 10.00, 
    ARRAY['single_track'], 'promotion_code', 'TEST10', false, true, 
    CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'
);
SELECT '✅ Insert successful' as result;
ROLLBACK; 