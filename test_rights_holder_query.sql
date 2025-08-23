-- Test the exact query that Rights Holder Dashboard is using
-- This simulates what the dashboard is trying to do

-- First, let's see what user IDs we're working with
SELECT id, email, account_type 
FROM profiles 
WHERE email IN ('babyimmastarrecords@gmail.com', 'ilimediagroup@gmail.com');

-- Now test the exact query that the dashboard uses
-- For rights holders, show requests that are either:
-- 1. Open to all rights holders (no specific rights holder selected)
-- 2. Specifically assigned to this rights holder

-- Let's test without the user ID filter first to see all open requests
SELECT 
  csr.*,
  p.id as client_id,
  p.first_name,
  p.last_name,
  p.email as client_email
FROM custom_sync_requests csr
LEFT JOIN profiles p ON csr.client_id = p.id
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW()
ORDER BY csr.created_at DESC;

-- Now let's test with a specific user ID (replace with actual ID from above)
-- We'll test with the condition that should match the existing record
SELECT 
  csr.*,
  p.id as client_id,
  p.first_name,
  p.last_name,
  p.email as client_email
FROM custom_sync_requests csr
LEFT JOIN profiles p ON csr.client_id = p.id
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW()
  AND (csr.selected_rights_holder_id IS NULL)  -- This should match our existing record
ORDER BY csr.created_at DESC;
