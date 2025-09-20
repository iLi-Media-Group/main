-- Test Password Reset Functionality
-- Run this in Supabase SQL Editor to verify the setup

-- 1. Check if email_logs table exists and has the right structure
SELECT 'Step 1: Check email_logs table structure' as step;
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;

-- 2. Check recent email logs for password reset attempts
SELECT 'Step 2: Check recent password reset emails' as step;
SELECT 
  to_email,
  subject,
  sent_at,
  status,
  provider,
  email_type
FROM email_logs 
WHERE email_type = 'password_reset'
ORDER BY sent_at DESC
LIMIT 10;

-- 3. Check if the send-password-reset function exists
SELECT 'Step 3: Check if send-password-reset function exists' as step;
SELECT 
  proname,
  prosrc
FROM pg_proc 
WHERE proname = 'send-password-reset';

-- 4. Test the function with a sample email (replace with actual email)
SELECT 'Step 4: Test password reset function' as step;
-- This will be tested via the frontend, but we can verify the function exists

-- 5. Check environment variables (this will show if they're configured)
SELECT 'Step 5: Check environment configuration' as step;
-- Note: Environment variables are not directly queryable in SQL
-- They need to be checked in the Supabase dashboard under Settings > API

-- 6. Show all recent email logs
SELECT 'Step 6: All recent email logs' as step;
SELECT 
  to_email,
  subject,
  sent_at,
  status,
  provider,
  email_type
FROM email_logs 
ORDER BY sent_at DESC
LIMIT 20;

-- 7. Check for any failed email attempts
SELECT 'Step 7: Check for failed email attempts' as step;
SELECT 
  to_email,
  subject,
  sent_at,
  status,
  provider,
  email_type
FROM email_logs 
WHERE status != 'sent'
ORDER BY sent_at DESC
LIMIT 10;
