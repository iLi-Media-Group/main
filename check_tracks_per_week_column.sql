-- Check tracks_per_week column type
SELECT 'tracks_per_week column details:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
AND column_name = 'tracks_per_week';

-- Check all columns to see data types
SELECT 'All columns and their types:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position; 