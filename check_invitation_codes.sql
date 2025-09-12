-- Check invitation codes for babyimmastarrecords@gmail.com
-- Run this in Supabase SQL Editor

-- Find all invitations for this email
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  used,
  created_at,
  expires_at
FROM producer_invitations 
WHERE email = 'babyimmastarrecords@gmail.com'
ORDER BY created_at DESC;

-- Find unused invitation codes for this email
SELECT 
  id,
  email,
  first_name,
  last_name,
  producer_number,
  invitation_code,
  used,
  created_at
FROM producer_invitations 
WHERE email = 'babyimmastarrecords@gmail.com'
  AND (used IS NULL OR used = FALSE)
ORDER BY created_at DESC;
