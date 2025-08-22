-- Check what exists in the current database tables

-- Check if instruments table exists
SELECT 
    'Instruments table check' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instruments'
    ) as instruments_table_exists;

-- Check if instrument_categories table exists  
SELECT 
    'Instrument categories table check' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instrument_categories'
    ) as instrument_categories_table_exists;

-- Show media_types table structure
SELECT 
    'Media types table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'media_types'
ORDER BY ordinal_position;

-- Show sample media_types data
SELECT 
    'Sample media_types data' as info,
    id,
    name
FROM media_types 
LIMIT 10;

-- Show instruments table structure (if exists)
SELECT 
    'Instruments table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instruments'
ORDER BY ordinal_position;

-- Show sample instruments data (if exists)
SELECT 
    'Sample instruments data' as info,
    id,
    name
FROM instruments 
LIMIT 10;

-- Show instrument_categories table structure (if exists)
SELECT 
    'Instrument categories table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instrument_categories'
ORDER BY ordinal_position;

-- Show sample instrument_categories data (if exists)
SELECT 
    'Sample instrument_categories data' as info,
    id,
    name
FROM instrument_categories 
LIMIT 10;
