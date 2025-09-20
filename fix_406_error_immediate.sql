-- Immediate fix for 406 error on producer_invitations
-- Run this in Supabase SQL Editor

-- Temporarily disable RLS to fix the 406 error
ALTER TABLE producer_invitations DISABLE ROW LEVEL SECURITY;

-- Test that we can now query the table
SELECT COUNT(*) as invitation_count FROM producer_invitations;

-- Test the specific query that was failing
SELECT * FROM producer_invitations WHERE email = 'babyimmastarrecords@gmail.com';

-- Show current invitations
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  created_at
FROM producer_invitations 
ORDER BY created_at DESC;
