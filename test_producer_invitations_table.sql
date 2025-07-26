-- Test script to verify producer_invitations table structure
-- This will help us confirm the table is working correctly

-- Check if table exists
SELECT 'Checking if producer_invitations table exists:' as info;
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'producer_invitations'
) as table_exists;

-- Show table structure
SELECT 'Producer invitations table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_invitations'
ORDER BY ordinal_position;

-- Show constraints
SELECT 'Table constraints:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint 
WHERE conrelid = 'producer_invitations'::regclass;

-- Show indexes
SELECT 'Table indexes:' as info;
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'producer_invitations';

-- Test inserting a sample record
SELECT 'Testing insert functionality:' as info;
INSERT INTO producer_invitations (
    email,
    first_name,
    last_name,
    producer_number,
    invitation_code,
    created_by
) VALUES (
    'test@example.com',
    'Test',
    'Producer',
    'mbfpr-999',
    'TEST123456789',
    (SELECT id FROM auth.users LIMIT 1)
) ON CONFLICT DO NOTHING;

-- Show any existing data
SELECT 'Existing producer_invitations data:' as info;
SELECT 
    id,
    email,
    first_name,
    last_name,
    producer_number,
    invitation_code,
    created_at
FROM producer_invitations
ORDER BY created_at DESC
LIMIT 5;

-- Clean up test data
DELETE FROM producer_invitations WHERE email = 'test@example.com'; 