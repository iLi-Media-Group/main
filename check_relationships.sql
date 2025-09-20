-- Check relationships and media_types data

-- Check if instruments table has a category_id column
SELECT 
    'Instruments table columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instruments'
ORDER BY ordinal_position;

-- Check if there are foreign key relationships
SELECT 
    'Foreign key relationships' as info,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_schema = 'public'
AND (tc.table_name = 'instruments' OR tc.table_name = 'instrument_categories');

-- Show what's in media_types table
SELECT 
    'Media types data' as info,
    id,
    name
FROM media_types 
LIMIT 10;

-- Check if there are any junction tables for tracks
SELECT 
    'Track junction tables' as info,
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%track%'
AND table_name NOT LIKE '%mood%'
ORDER BY table_name;
