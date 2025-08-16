-- Check if test data exists in producer_applications table
SELECT 'Checking if test data exists:' as info;

-- Count total applications
SELECT 'Total Applications:' as info;
SELECT COUNT(*) as total_count FROM producer_applications;

-- Show all applications if any exist
SELECT 'All Applications (if any):' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

-- Check if the table exists and has the right structure
SELECT 'Table Structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
AND column_name IN ('name', 'email', 'status', 'instrument_one', 'records_artists')
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 'RLS Policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'producer_applications'; 