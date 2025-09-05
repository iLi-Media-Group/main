-- Debug the Stripe coupon creation error

-- Check the WELCOME10 discount details
SELECT 'WELCOME10 discount details:' as info;
SELECT 
    id,
    name,
    discount_type,
    promotion_code,
    discount_percent,
    start_date,
    end_date,
    is_active,
    applies_to,
    description
FROM discounts
WHERE promotion_code = 'WELCOME10';

-- Test the Edge Function call manually
-- This will help us see what data is being sent
SELECT 'Testing Edge Function call data:' as info;
SELECT 
    'discount_id' as parameter,
    id as value
FROM discounts
WHERE promotion_code = 'WELCOME10';

-- Check if the discount has all required fields
SELECT 'Checking required fields for Stripe coupon:' as info;
SELECT 
    CASE 
        WHEN promotion_code IS NOT NULL THEN '✅ promotion_code'
        ELSE '❌ promotion_code is NULL'
    END as promotion_code_check,
    CASE 
        WHEN discount_percent IS NOT NULL THEN '✅ discount_percent'
        ELSE '❌ discount_percent is NULL'
    END as discount_percent_check,
    CASE 
        WHEN name IS NOT NULL THEN '✅ name'
        ELSE '❌ name is NULL'
    END as name_check,
    CASE 
        WHEN end_date IS NOT NULL THEN '✅ end_date'
        ELSE '❌ end_date is NULL'
    END as end_date_check,
    CASE 
        WHEN applies_to IS NOT NULL THEN '✅ applies_to'
        ELSE '❌ applies_to is NULL'
    END as applies_to_check
FROM discounts
WHERE promotion_code = 'WELCOME10'; 