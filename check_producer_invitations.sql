-- Check if producer_invitations table exists and has correct structure
-- Run this in Supabase SQL Editor

-- Check if table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'producer_invitations'
) as table_exists;

-- Check table structure
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'producer_invitations'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- Test if we can insert a test record
INSERT INTO producer_invitations (
  email, 
  first_name, 
  last_name, 
  producer_number, 
  invitation_code
) VALUES (
  'test@example.com',
  'Test',
  'User',
  'mbfpr-001',
  'test-invitation-001'
) ON CONFLICT (invitation_code) DO NOTHING;

-- Check if the test record was inserted
SELECT * FROM producer_invitations WHERE email = 'test@example.com';

-- Clean up test record
DELETE FROM producer_invitations WHERE email = 'test@example.com';
