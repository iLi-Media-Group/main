-- Check existing instruments structure and data
-- Run this in your Supabase SQL Editor

-- Check if tables exist
SELECT 'Checking table existence:' as info;
SELECT 
  table_name,
  EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = table_name
  ) as exists
FROM (VALUES ('instrument_categories'), ('instruments')) as t(table_name);

-- Show instrument_categories table structure
SELECT 'instrument_categories table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instrument_categories'
ORDER BY ordinal_position;

-- Show instruments table structure
SELECT 'instruments table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'instruments'
ORDER BY ordinal_position;

-- Show instrument_categories data
SELECT 'instrument_categories data:' as info;
SELECT * FROM instrument_categories ORDER BY display_name;

-- Show instruments data
SELECT 'instruments data:' as info;
SELECT * FROM instruments ORDER BY display_name;

-- Show relationship between categories and instruments (using name field)
SELECT 'Relationship between categories and instruments:' as info;
SELECT 
  ic.display_name as category_name,
  ic.name as category_name_id,
  i.display_name as instrument_name,
  i.name as instrument_name_id,
  i.category as instrument_category
FROM instrument_categories ic
LEFT JOIN instruments i ON i.category = ic.name
ORDER BY ic.display_name, i.display_name;

-- Show all instruments with their category info
SELECT 'All instruments with category info:' as info;
SELECT 
  i.id,
  i.name as instrument_name,
  i.display_name as instrument_display_name,
  i.category as category_name,
  ic.display_name as category_display_name
FROM instruments i
LEFT JOIN instrument_categories ic ON i.category = ic.name
ORDER BY ic.display_name, i.display_name;

-- Check if there are any foreign key constraints
SELECT 'Foreign key constraints:' as info;
SELECT 
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
AND tc.table_name IN ('instruments', 'instrument_categories');
