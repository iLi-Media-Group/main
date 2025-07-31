-- Fix Missing Function Issue
-- This script ensures the update_updated_at_column function exists

-- ============================================
-- 1. CREATE THE MISSING FUNCTION
-- ============================================

-- Create the update_updated_at_column function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- 2. VERIFY FUNCTION EXISTS
-- ============================================

-- Check if the function exists
SELECT 
    'update_updated_at_column function exists' as check_item,
    COUNT(*) as result
FROM information_schema.routines 
WHERE routine_name = 'update_updated_at_column';

-- ============================================
-- 3. RECREATE THE TRIGGER
-- ============================================

-- Drop and recreate the trigger for producer_resources
DROP TRIGGER IF EXISTS update_producer_resources_updated_at ON producer_resources;
CREATE TRIGGER update_producer_resources_updated_at 
    BEFORE UPDATE ON producer_resources
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. VERIFY TRIGGER EXISTS
-- ============================================

-- Check if the trigger exists
SELECT 
    'producer_resources trigger exists' as check_item,
    COUNT(*) as result
FROM information_schema.triggers 
WHERE trigger_name = 'update_producer_resources_updated_at'; 