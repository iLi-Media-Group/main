-- Check current user's account type and modal eligibility

-- Current user info
SELECT 'Current user info:' as info;
SELECT 
    auth.uid() as current_user_id,
    auth.email() as current_user_email;

-- User profile
SELECT 'User profile:' as info;
SELECT 
    id,
    email,
    account_type,
    created_at,
    updated_at
FROM profiles 
WHERE id = auth.uid();

-- Check if user should see the modal
SELECT 'Modal eligibility check:' as info;
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

-- Check if there are any active promotion code discounts
SELECT 'Active promotion code discounts:' as info;
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