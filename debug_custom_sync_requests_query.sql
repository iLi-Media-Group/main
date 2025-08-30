-- Debug custom sync requests query for ilimediagroup@gmail.com
-- Let's check what should be returned by the exact query used in the dashboard

-- 1. Get the user ID for ilimediagroup@gmail.com
SELECT 
  'User ID for ilimediagroup' as info,
  id,
  email,
  account_type,
  verification_status,
  is_active
FROM profiles
WHERE email = 'ilimediagroup@gmail.com';

-- 2. Check the exact query that should be run
-- This mimics the query in RightsHolderDashboard.tsx
SELECT 
  'Query result for ilimediagroup' as info,
  csr.id,
  csr.client_id,
  csr.project_title,
  csr.status,
  csr.end_date,
  csr.selected_rights_holder_id,
  csr.selected_producer_id,
  csr.created_at,
  NOW() as current_time,
  (csr.end_date >= NOW()) as not_expired
FROM custom_sync_requests csr
WHERE csr.status = 'open' 
  AND csr.end_date >= NOW()
  AND (
    csr.selected_rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc' 
    OR csr.selected_rights_holder_id IS NULL
  )
ORDER BY csr.created_at DESC;

-- 3. Check what the OR condition should return
SELECT 
  'OR condition test' as info,
  id,
  project_title,
  selected_rights_holder_id,
  CASE 
    WHEN selected_rights_holder_id = 'c5988a02-36b2-4225-b26e-fabfaa5796dc' THEN 'Assigned to ilimediagroup'
    WHEN selected_rights_holder_id IS NULL THEN 'Open to all rights holders'
    ELSE 'Assigned to other rights holder'
  END as assignment_status
FROM custom_sync_requests
WHERE status = 'open' 
  AND end_date >= NOW();

-- 4. Check if there are any issues with the data
SELECT 
  'Data validation' as info,
  COUNT(*) as total_open_requests,
  COUNT(CASE WHEN end_date >= NOW() THEN 1 END) as not_expired_requests,
  COUNT(CASE WHEN selected_rights_holder_id IS NULL THEN 1 END) as open_to_all,
  COUNT(CASE WHEN selected_rights_holder_id IS NOT NULL THEN 1 END) as assigned_to_specific
FROM custom_sync_requests
WHERE status = 'open';
