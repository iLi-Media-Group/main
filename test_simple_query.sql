-- Test simple query without RLS to see if data exists
-- This bypasses RLS to see if the data is actually there

-- Check if we can see the data at all
SELECT COUNT(*) as total_open_requests 
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();

-- Check the actual data
SELECT 
  id,
  status,
  selected_producer_id,
  selected_rights_holder_id,
  end_date,
  created_at
FROM custom_sync_requests 
WHERE status = 'open' AND end_date >= NOW();

-- Check if the end_date is actually in the future
SELECT 
  id,
  status,
  end_date,
  NOW() as current_time,
  end_date > NOW() as is_future
FROM custom_sync_requests 
WHERE status = 'open';
