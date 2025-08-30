-- Quick check of discounts in the database
SELECT 'Current discounts in database:' as info;
SELECT 
    id,
    name,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN 'FUTURE'
        WHEN CURRENT_DATE > end_date THEN 'EXPIRED'
        ELSE 'INACTIVE'
    END as status
FROM discounts
ORDER BY created_at DESC;

-- Check if any discounts apply to single_track
SELECT 'Discounts that should apply to single_track:' as info;
SELECT 
    name,
    discount_percent,
    applies_to,
    CASE 
        WHEN 'single_track' = ANY(applies_to) THEN 'YES'
        WHEN 'all' = ANY(applies_to) THEN 'YES'
        ELSE 'NO'
    END as applies_to_single_track,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN 'ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN 'FUTURE'
        WHEN CURRENT_DATE > end_date THEN 'EXPIRED'
        ELSE 'INACTIVE'
    END as date_status
FROM discounts
WHERE is_active = true
ORDER BY discount_percent DESC; 