-- Add Promotion Codes to Discounts
-- This script adds promotion codes to discounts that need them

-- ============================================
-- 1. SHOW DISCOUNTS THAT NEED PROMOTION CODES
-- ============================================

SELECT
    'Discounts that need promotion codes added:' as info;
SELECT
    id,
    name,
    description,
    discount_percent,
    discount_type,
    applies_to,
    is_active,
    start_date,
    end_date
FROM discounts
WHERE promotion_code IS NULL OR promotion_code = ''
ORDER BY created_at DESC;

-- ============================================
-- 2. UPDATE DISCOUNTS WITH PROMOTION CODES
-- ============================================

-- Example: Update a specific discount with a promotion code
-- Replace the id and promotion_code values with your actual data

-- UPDATE discounts 
-- SET promotion_code = 'WELCOME20'
-- WHERE id = 'your-discount-id-here' 
-- AND (promotion_code IS NULL OR promotion_code = '');

-- UPDATE discounts 
-- SET promotion_code = 'GRANDOPEN30'
-- WHERE id = 'your-discount-id-here' 
-- AND (promotion_code IS NULL OR promotion_code = '');

-- ============================================
-- 3. VERIFY THE UPDATES
-- ============================================

SELECT
    'Verification - All discounts with promotion codes:' as info;
SELECT
    id,
    name,
    promotion_code,
    discount_percent,
    discount_type,
    is_active,
    start_date,
    end_date,
    CASE
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as date_status
FROM discounts
WHERE promotion_code IS NOT NULL AND promotion_code != ''
ORDER BY created_at DESC;

-- ============================================
-- 4. COUNT ACTIVE PROMOTION CODES
-- ============================================

SELECT
    'Active promotion codes count:' as info;
SELECT
    COUNT(*) as active_promotion_codes
FROM discounts
WHERE promotion_code IS NOT NULL 
AND promotion_code != ''
AND discount_type = 'promotion_code'
AND is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date; 