-- Simple check of what exists in the database

-- Check if instruments table exists
SELECT 
    'Instruments table exists' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instruments'
    ) as exists;

-- Check if instrument_categories table exists  
SELECT 
    'Instrument categories table exists' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instrument_categories'
    ) as exists;

-- Check if media_types table exists
SELECT 
    'Media types table exists' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'media_types'
    ) as exists;

-- Try to show media_types structure (if exists)
SELECT 
    'Media types columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'media_types'
ORDER BY ordinal_position;

-- Try to show instrument_categories structure (if exists)
SELECT 
    'Instrument categories columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instrument_categories'
ORDER BY ordinal_position;

-- Try to show instruments structure (if exists)
SELECT 
    'Instruments columns' as info,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instruments'
ORDER BY ordinal_position;

-- Try to show sample media_types data (if exists)
SELECT 
    'Sample media_types' as info,
    id,
    name
FROM media_types 
LIMIT 5;

-- Try to show sample instrument_categories data (if exists)
SELECT 
    'Sample instrument_categories' as info,
    id,
    name
FROM instrument_categories 
LIMIT 5;

-- Try to show sample instruments data (if exists)
SELECT 
    'Sample instruments' as info,
    id,
    name
FROM instruments 
LIMIT 5;
