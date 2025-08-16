-- Check available columns in producer_applications table
SELECT 'All available columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position;

-- Check if any ranking or score related columns exist
SELECT 'Ranking/Score related columns:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
AND column_name LIKE '%score%' 
   OR column_name LIKE '%rank%'
   OR column_name LIKE '%auto%'
ORDER BY column_name; 