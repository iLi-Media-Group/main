-- Comprehensive troubleshooting for discount modal system

-- 1. Check if any discounts exist at all
SELECT '1. All discounts in database:' as step;
SELECT 
    id,
    name,
    discount_percent,
    applies_to,
    discount_type,
    promotion_code,
    is_automatic,
    stripe_coupon_id,
    is_active,
    start_date,
    end_date,
    created_at
FROM discounts
ORDER BY created_at DESC;

-- 2. Check if there are any promotion code discounts
SELECT '2. Promotion code discounts:' as step;
SELECT 
    name,
    promotion_code,
    discount_percent,
    stripe_coupon_id,
    stripe_coupon_created_at,
    is_active,
    start_date,
    end_date,
    CASE 
        WHEN stripe_coupon_id IS NOT NULL THEN '✅ Stripe Coupon Created'
        WHEN discount_type = 'promotion_code' AND promotion_code IS NOT NULL THEN '⚠️ Needs Stripe Coupon'
        ELSE 'ℹ️ Not Applicable'
    END as stripe_status,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
WHERE discount_type = 'promotion_code';

-- 3. Check current user and their eligibility
SELECT '3. Current user info:' as step;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- 4. Check user profile
SELECT '4. User profile:' as step;
SELECT 
    id,
    email,
    account_type,
    created_at,
    updated_at
FROM profiles 
WHERE id = auth.uid();

-- 5. Check if user should see modal
SELECT '5. Modal eligibility:' as step;
SELECT 
    CASE 
        WHEN account_type = 'client' THEN '✅ Should see modal (client)'
        WHEN account_type = 'admin' THEN '❌ Should NOT see modal (admin)'
        WHEN account_type = 'admin,producer' THEN '❌ Should NOT see modal (admin,producer)'
        WHEN account_type = 'producer' THEN '❌ Should NOT see modal (producer)'
        WHEN account_type = 'white_label' THEN '❌ Should NOT see modal (white_label)'
        ELSE '❓ Unknown account type'
    END as modal_eligibility,
    account_type,
    email
FROM profiles 
WHERE id = auth.uid();

-- 6. Check if there are active promotion code discounts for modal
SELECT '6. Active promotion code discounts for modal:' as step;
SELECT 
    name,
    promotion_code,
    discount_percent,
    is_active,
    start_date,
    end_date,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
WHERE discount_type = 'promotion_code' 
AND is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date;

-- 7. Test discount functions
SELECT '7. Testing discount functions:' as step;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- 8. Check if any discounts apply to single_track
SELECT '8. Discounts that apply to single_track:' as step;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    promotion_code,
    is_active,
    CASE 
        WHEN 'single_track' = ANY(applies_to) THEN '✅ Applies to single_track'
        WHEN 'all' = ANY(applies_to) THEN '✅ Applies to all (includes single_track)'
        ELSE '❌ Does not apply to single_track'
    END as applicability
FROM discounts
WHERE is_active = true 
AND CURRENT_DATE BETWEEN start_date AND end_date; 