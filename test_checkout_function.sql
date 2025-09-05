-- Test what the checkout function would do with TEST30

-- Simulate the discount calculation for a single track purchase
SELECT 'Testing discount calculation for TEST30:' as info;
SELECT 
    d.name,
    d.promotion_code,
    d.discount_percent,
    d.stripe_coupon_id,
    d.discount_type,
    CASE 
        WHEN d.stripe_coupon_id IS NOT NULL THEN '✅ Has Stripe coupon'
        ELSE '❌ Missing Stripe coupon'
    END as coupon_status
FROM discounts d
WHERE d.promotion_code = 'TEST30'
  AND d.discount_type = 'promotion_code'
  AND d.is_active = true
  AND CURRENT_DATE BETWEEN d.start_date AND d.end_date;

-- Test the discount calculation function directly
SELECT 'Testing calculate_discounted_price function:' as info;
SELECT * FROM calculate_discounted_price(
    999, -- $9.99 in cents
    'single_track',
    CURRENT_DATE,
    'TEST30'
);

-- Check if the discount applies to single tracks
SELECT 'Checking if TEST30 applies to single tracks:' as info;
SELECT 
    d.name,
    d.applies_to,
    CASE 
        WHEN 'single_track' = ANY(d.applies_to) OR 'all' = ANY(d.applies_to) THEN '✅ Applies'
        ELSE '❌ Does not apply'
    END as applies_to_single_track
FROM discounts d
WHERE d.promotion_code = 'TEST30'; 