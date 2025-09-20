-- Create Stripe Promotion Code for TEST30

-- First, let's check our current discount
SELECT 'Current TEST30 discount:' as info;
SELECT 
    id,
    name,
    promotion_code,
    stripe_coupon_id,
    discount_percent
FROM discounts
WHERE promotion_code = 'TEST30';

-- Instructions for creating Stripe Promotion Code:
SELECT 'Instructions to create Stripe Promotion Code:' as info;
SELECT 
    '1. Go to Stripe Dashboard > Product catalog > Coupons > Test30' as step1,
    '2. Click the "+" button next to "Promotion codes"' as step2,
    '3. Create a new promotion code with:' as step3,
    '   - Code: TEST30' as step4,
    '   - Coupon: Test30 (KK4HtRit)' as step5,
    '   - Active: Yes' as step6,
    '   - Max redemptions: Unlimited' as step7;

-- Alternative: Create via API
SELECT 'Or create via API call:' as info;
SELECT 
    'curl -X POST https://api.stripe.com/v1/promotion_codes \' as curl_command,
    '  -H "Authorization: Bearer YOUR_STRIPE_SECRET_KEY" \' as auth_header,
    '  -H "Content-Type: application/x-www-form-urlencoded" \' as content_header,
    '  -d "coupon=KK4HtRit" \' as coupon_param,
    '  -d "code=TEST30" \' as code_param,
    '  -d "active=true"' as active_param; 