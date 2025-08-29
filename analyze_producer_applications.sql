-- Get Producer Applications Table Structure
-- This will show us the exact data types of all columns

-- Show all columns and their data types
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position;
