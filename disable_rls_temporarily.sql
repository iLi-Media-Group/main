-- Temporarily disable RLS on producer_invitations to test
-- Run this in Supabase SQL Editor

-- Disable RLS temporarily
ALTER TABLE producer_invitations DISABLE ROW LEVEL SECURITY;

-- Test if we can query the table now
SELECT COUNT(*) as invitation_count FROM producer_invitations;

-- Test if we can query by email (this was causing the 406 error)
SELECT * FROM producer_invitations WHERE email = 'babyimmastarrecords@gmail.com';

-- Check current invitations
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

-- IMPORTANT: Re-enable RLS after testing
-- ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;
