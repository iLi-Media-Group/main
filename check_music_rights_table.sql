-- Check Music Rights Table
-- This will help us find the correct table name

SELECT 'Checking for music rights related tables:' as info;
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name LIKE '%rights%' 
  OR table_name LIKE '%music%'
ORDER BY table_name;

-- Check if music_rights table exists
SELECT 'Checking if music_rights table exists:' as info;
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables 
  WHERE table_name = 'music_rights'
) as music_rights_exists;

-- Check what tables exist with 'rights' in the name
SELECT 'Tables with rights in name:' as info;
SELECT table_name FROM information_schema.tables 
WHERE table_name LIKE '%rights%'
ORDER BY table_name;
