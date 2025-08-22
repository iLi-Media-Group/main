-- Check what's actually working in the existing tables

-- Check track_media_types structure
SELECT 
    'Track media types columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'track_media_types'
ORDER BY ordinal_position;

-- Check track_media_types sample data
SELECT 
    'Track media types sample' as info,
    track_id,
    media_type_id
FROM track_media_types 
LIMIT 5;

-- Check if there's a track_instruments junction table
SELECT 
    'Track instruments junction exists' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'track_instruments'
    ) as exists;

-- Check media_types structure and data
SELECT 
    'Media types columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'media_types'
ORDER BY ordinal_position;

-- Check media_types sample data
SELECT 
    'Media types sample' as info,
    id,
    name
FROM media_types 
LIMIT 5;

-- Check instruments structure
SELECT 
    'Instruments columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instruments'
ORDER BY ordinal_position;

-- Check instruments with their category text
SELECT 
    'Instruments with categories' as info,
    i.id,
    i.name,
    i.category
FROM instruments i
LIMIT 5;
