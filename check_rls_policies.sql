-- Check RLS policies on producer_invitations table
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- Check if RLS is enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'producer_invitations';

-- Test the actual RLS policy by trying to insert as authenticated user
-- This will show us the exact error
INSERT INTO producer_invitations (
  email, 
  first_name, 
  last_name, 
  invitation_code, 
  created_by, 
  producer_number
) VALUES (
  'test@example.com',
  'Test',
  'User',
  'testcode123',
  '00000000-0000-0000-0000-000000000000',
  'mbfpr-999'
); 