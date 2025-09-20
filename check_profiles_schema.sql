-- Check the profiles table schema to see available columns
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any columns with 'agent' or 'commission' in the name
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
AND (column_name ILIKE '%agent%' OR column_name ILIKE '%commission%');
