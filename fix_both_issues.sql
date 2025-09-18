-- Fix both the RLS issue and test email functionality
-- Run this in Supabase SQL Editor

-- 1. Temporarily disable RLS to fix the 406 error
ALTER TABLE producer_invitations DISABLE ROW LEVEL SECURITY;

-- 2. Test if we can query the table now
SELECT COUNT(*) as invitation_count FROM producer_invitations;

-- 3. Test if we can query by email (this was causing the 406 error)
SELECT * FROM producer_invitations WHERE email = 'babyimmastarrecords@gmail.com';

-- 4. Check current invitations
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

-- 5. Check email_logs table to see if emails are being logged
SELECT 
  id,
  to_email,
  subject,
  status,
  created_at
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- 6. Count emails by status
SELECT 
  status,
  COUNT(*) as count
FROM email_logs 
GROUP BY status;

-- IMPORTANT: After testing, run re_enable_rls.sql to restore RLS
