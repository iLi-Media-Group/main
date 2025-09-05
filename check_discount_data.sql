-- Check all discounts in the database
SELECT 'All discounts in database:' as info;
SELECT 
    id,
    name,
    discount_percent,
    applies_to,
    discount_type,
    is_automatic,
    promotion_code,
    start_date,
    end_date,
    is_active,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
ORDER BY created_at DESC;

-- Check specifically for Grand Opening Sale
SELECT 'Grand Opening Sale details:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    is_automatic,
    start_date,
    end_date,
    is_active,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        ELSE 'NOT ACTIVE TODAY'
    END as date_status
FROM discounts
WHERE name = 'Grand Opening Sale';

-- Test get_applicable_discounts function directly
SELECT 'Testing get_applicable_discounts for single_track:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE);

-- Check if 'single_track' is in the applies_to array for any discount
SELECT 'Discounts that apply to single_track:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    discount_type,
    is_automatic,
    CASE 
        WHEN 'all' = ANY(applies_to) THEN 'Applies to all'
        WHEN 'single_track' = ANY(applies_to) THEN 'Applies to single_track'
        ELSE 'Does not apply to single_track'
    END as applicability
FROM discounts
WHERE is_active = true 
AND CURRENT_DATE BETWEEN start_date AND end_date; 