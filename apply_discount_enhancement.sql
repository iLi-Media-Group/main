-- Apply the discount system enhancement
-- This will fix the automatic discount issue

-- 1. Add new columns to the discounts table
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS discount_type TEXT DEFAULT 'automatic' CHECK (discount_type IN ('automatic', 'promotion_code'));
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS promotion_code TEXT;
ALTER TABLE discounts ADD COLUMN IF NOT EXISTS is_automatic BOOLEAN DEFAULT true;

-- 2. Update existing discounts to be automatic
UPDATE discounts SET 
    discount_type = 'automatic',
    is_automatic = true
WHERE discount_type IS NULL;

-- 3. Create index for promotion codes
CREATE INDEX IF NOT EXISTS idx_discounts_promotion_code ON discounts(promotion_code);

-- 4. Update the Grand Opening Sale to be automatic
UPDATE discounts 
SET 
    discount_type = 'automatic',
    is_automatic = true
WHERE name = 'Grand Opening Sale';

-- 5. Check current discount status
SELECT 'Current discounts after update:' as info;
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
ORDER BY created_at DESC;

-- 6. Test the enhanced discount function
SELECT 'Testing enhanced discount function for single_track:' as info;
SELECT * FROM calculate_discounted_price(1000, 'single_track', CURRENT_DATE);

-- 7. Test the get_applicable_discounts function
SELECT 'Testing get_applicable_discounts for single_track:' as info;
SELECT * FROM get_applicable_discounts('single_track', CURRENT_DATE); 