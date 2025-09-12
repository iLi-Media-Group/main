-- Investigate the real issue preventing view creation
-- Let's find out what's actually happening

-- ============================================
-- 1. CHECK IF THE REQUIRED TABLE EXISTS
-- ============================================

SELECT 'roster_entities table exists' as check_item, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'roster_entities'
) as exists;

-- ============================================
-- 2. CHECK IF THERE'S DATA IN THE TABLE
-- ============================================

SELECT 'roster_entities has data' as check_item, 
       (SELECT COUNT(*) FROM roster_entities) as row_count;

-- ============================================
-- 3. CHECK THE TABLE STRUCTURE
-- ============================================

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'roster_entities'
ORDER BY ordinal_position;

-- ============================================
-- 4. TRY TO CREATE A SIMPLE VIEW FIRST
-- ============================================

-- Try creating a very simple view to see if it works
CREATE OR REPLACE VIEW test_simple_view AS
SELECT id, name FROM roster_entities LIMIT 1;

-- Check if the simple view was created
SELECT 'test_simple_view created' as check_item, EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_name = 'test_simple_view'
) as exists;

-- ============================================
-- 5. CHECK FOR ANY EXISTING VIEWS WITH SIMILAR NAMES
-- ============================================

SELECT view_name 
FROM information_schema.views 
WHERE view_name LIKE '%roster%' OR view_name LIKE '%analytics%';

-- ============================================
-- 6. CHECK FOR ANY DEPENDENCIES OR CONSTRAINTS
-- ============================================

SELECT 'roster_entities has is_active column' as check_item, EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'roster_entities' AND column_name = 'is_active'
) as exists;

-- ============================================
-- 7. TRY TO QUERY THE TABLE DIRECTLY
-- ============================================

SELECT 'Can query roster_entities' as check_item, 
       (SELECT COUNT(*) FROM roster_entities WHERE is_active = true) as active_count;
