-- Check the structure of the rights_holders table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'rights_holders' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any existing policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'rights_holders';
