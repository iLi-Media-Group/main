-- Check the actual current table structure
SELECT 'Current table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position;

-- Check specific columns that might be causing issues
SELECT 'Specific columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
AND column_name IN ('years_experience', 'tracks_per_week', 'name', 'email', 'status')
ORDER BY column_name; 