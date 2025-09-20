-- Debug custom sync requests for rights holders
-- Check what data exists and why it might not be showing

-- 1. Check all custom sync requests
SELECT 
  'All custom sync requests' as info,
  id,
  client_id,
  project_title,
  status,
  end_date,
  selected_rights_holder_id,
  selected_producer_id,
  created_at
FROM custom_sync_requests
ORDER BY created_at DESC;

-- 2. Check open requests that haven't expired
SELECT 
  'Open requests that have not expired' as info,
  id,
  client_id,
  project_title,
  status,
  end_date,
  selected_rights_holder_id,
  selected_producer_id,
  created_at
FROM custom_sync_requests
WHERE status = 'open' 
  AND end_date >= NOW()
ORDER BY created_at DESC;

-- 3. Check requests that should be visible to rights holders
-- (either no specific rights holder selected OR assigned to a specific rights holder)
SELECT 
  'Requests visible to rights holders' as info,
  id,
  client_id,
  project_title,
  status,
  end_date,
  selected_rights_holder_id,
  selected_producer_id,
  created_at
FROM custom_sync_requests
WHERE status = 'open' 
  AND end_date >= NOW()
  AND (selected_rights_holder_id IS NULL OR selected_rights_holder_id IS NOT NULL)
ORDER BY created_at DESC;

-- 4. Check if there are any rights holders in the system
SELECT 
  'Rights holders in system' as info,
  id,
  email,
  account_type,
  company_name,
  rights_holder_type
FROM profiles
WHERE account_type = 'rights_holder'
ORDER BY created_at DESC;
