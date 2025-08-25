-- Check Producer Applications Schema
-- This script shows the exact column types and constraints

SELECT 'Producer Applications Table Schema:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position;

-- Check constraints on the table
SELECT 'Table Constraints:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'producer_applications'::regclass
ORDER BY conname; 