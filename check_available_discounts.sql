-- Check Available Discount Codes for Client Dashboard
-- This script shows what discount codes are available to display to clients

-- ============================================
-- 1. CHECK ALL ACTIVE DISCOUNT CODES
-- ============================================

-- Show all active promotion code discounts
SELECT 
    'Active promotion code discounts:' as info;
SELECT 
    id,
    name,
    description,
    promotion_code,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as status
FROM discounts
WHERE discount_type = 'promotion_code'
AND is_active = true
ORDER BY created_at DESC;

-- ============================================
-- 2. CHECK AUTOMATIC DISCOUNTS
-- ============================================

-- Show automatic discounts that apply to client purchases
SELECT 
    'Automatic discounts for clients:' as info;
SELECT 
    id,
    name,
    description,
    discount_percent,
    applies_to,
    start_date,
    end_date,
    is_active,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE TODAY'
        WHEN CURRENT_DATE < start_date THEN '⏳ NOT YET STARTED'
        WHEN CURRENT_DATE > end_date THEN '❌ EXPIRED'
        ELSE '❓ UNKNOWN'
    END as status
FROM discounts
WHERE discount_type = 'automatic'
AND is_active = true
AND ('single_track' = ANY(applies_to) OR 'all' = ANY(applies_to))
ORDER BY created_at DESC;

-- ============================================
-- 3. SUMMARY FOR CLIENT DASHBOARD
-- ============================================

-- Show summary of what should be displayed to clients
SELECT 
    'Summary for client dashboard:' as info;
SELECT 
    'Promotion Codes Available:' as section,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'promotion_code'
AND is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date

UNION ALL

SELECT 
    'Automatic Discounts Active:' as section,
    COUNT(*) as count
FROM discounts
WHERE discount_type = 'automatic'
AND is_active = true
AND CURRENT_DATE BETWEEN start_date AND end_date
AND ('single_track' = ANY(applies_to) OR 'all' = ANY(applies_to));

-- ============================================
-- 4. SAMPLE DISCOUNT CODES FOR TESTING
-- ============================================

-- Create some sample discount codes if none exist
DO $$
BEGIN
    -- Create WELCOME30 if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM discounts WHERE promotion_code = 'WELCOME30') THEN
        INSERT INTO discounts (
            name,
            description,
            discount_percent,
            applies_to,
            discount_type,
            promotion_code,
            is_automatic,
            is_active,
            start_date,
            end_date,
            created_at,
            updated_at
        ) VALUES (
            'Welcome Discount',
            'Use this code for a discount on your first purchase!',
            30.00,
            ARRAY['single_track', 'gold_access', 'platinum_access', 'ultimate_access'],
            'promotion_code',
            'WELCOME30',
            false,
            true,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '30 days',
            NOW(),
            NOW()
        );
    END IF;

    -- Create SAVE20 if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM discounts WHERE promotion_code = 'SAVE20') THEN
        INSERT INTO discounts (
            name,
            description,
            discount_percent,
            applies_to,
            discount_type,
            promotion_code,
            is_automatic,
            is_automatic,
            is_active,
            start_date,
            end_date,
            created_at,
            updated_at
        ) VALUES (
            'Save 20%',
            'Get 20% off your next purchase!',
            20.00,
            ARRAY['single_track'],
            'promotion_code',
            'SAVE20',
            false,
            true,
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '60 days',
            NOW(),
            NOW()
        );
    END IF;
END $$;

-- Show final list of available discount codes
SELECT 
    'Final list of available discount codes:' as info;
SELECT 
    promotion_code,
    name,
    description,
    discount_percent,
    end_date,
    CASE 
        WHEN CURRENT_DATE BETWEEN start_date AND end_date THEN '✅ ACTIVE'
        ELSE '❌ INACTIVE'
    END as status
FROM discounts
WHERE discount_type = 'promotion_code'
AND is_active = true
ORDER BY created_at DESC; 