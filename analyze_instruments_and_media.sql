-- Analyze current instruments and media types in the database
-- This will help us understand what data exists before creating the new structure

-- Check if instruments table exists and what it contains
SELECT 
    'Instruments table check' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instruments'
    ) as instruments_table_exists;

-- If instruments table exists, show its structure and data
SELECT 
    'Instruments table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instruments'
ORDER BY ordinal_position;

-- Show sample instruments data if table exists
SELECT 
    'Sample instruments data' as info,
    id,
    name
FROM instruments 
LIMIT 10;

-- Show sample instrument categories data if table exists
SELECT 
    'Sample instrument categories data' as info,
    id,
    name
FROM instrument_categories 
LIMIT 10;

-- Check if media_types table exists and what it contains
SELECT 
    'Media types table check' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'media_types'
    ) as media_types_table_exists;

-- Check if instrument_categories table exists and what it contains
SELECT 
    'Instrument categories table check' as info,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'instrument_categories'
    ) as instrument_categories_table_exists;

-- If media_types table exists, show its structure and data
SELECT 
    'Media types table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'media_types'
ORDER BY ordinal_position;

-- If instrument_categories table exists, show its structure and data
SELECT 
    'Instrument categories table structure' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instrument_categories'
ORDER BY ordinal_position;

-- Show sample media types data if table exists
SELECT 
    'Sample media types data' as info,
    id,
    name
FROM media_types 
LIMIT 10;

-- Show sample instrument categories data if table exists
SELECT 
    'Sample instrument categories data' as info,
    id,
    name
FROM instrument_categories 
LIMIT 10;

-- Check what instruments and media usage data exists in tracks table
SELECT 
    'Tracks table instruments/media columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'tracks'
AND column_name IN ('instruments', 'media_usage')
ORDER BY ordinal_position;

-- Check if there are any foreign key relationships between instruments and categories
SELECT 
    'Instrument relationships' as info,
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
AND (tc.table_name = 'instruments' OR ccu.table_name = 'instrument_categories');

-- Show sample track instruments and media usage data
SELECT 
    'Sample track instruments' as info,
    id,
    title,
    instruments
FROM tracks 
WHERE instruments IS NOT NULL 
AND instruments != '{}' 
AND array_length(instruments, 1) > 0
LIMIT 5;

SELECT 
    'Sample track media usage' as info,
    id,
    title,
    media_usage
FROM tracks 
WHERE media_usage IS NOT NULL 
AND media_usage != '{}' 
AND array_length(media_usage, 1) > 0
LIMIT 5;
