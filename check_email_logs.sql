-- Check email_logs table to see if emails are being logged
-- Run this in Supabase SQL Editor

-- Check email_logs table structure
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'email_logs'
ORDER BY ordinal_position;

-- Check recent email logs
SELECT 
  id,
  to_email,
  subject,
  sent_at,
  status,
  error_message,
  created_at
FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check if there are any failed emails
SELECT 
  id,
  to_email,
  subject,
  status,
  error_message,
  created_at
FROM email_logs 
WHERE status != 'sent' OR error_message IS NOT NULL
ORDER BY created_at DESC;

-- Count emails by status
SELECT 
  status,
  COUNT(*) as count
FROM email_logs 
GROUP BY status;
