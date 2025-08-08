-- Test the email function and check environment variables
-- Run this in Supabase SQL Editor

-- Check if email_logs table exists
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;

-- Check if producer_invitations table exists and has data
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name = 'producer_invitations'
ORDER BY ordinal_position;

-- Check if there are any invitations for the test email
SELECT * FROM producer_invitations 
WHERE email = 'babyimmastarrecords@gmail.com';

-- Check RLS policies on producer_invitations
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies 
WHERE tablename = 'producer_invitations';

-- Test if we can query the table as admin
SELECT COUNT(*) as invitation_count FROM producer_invitations;
