-- Check the structure of custom_sync_requests table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests'
ORDER BY ordinal_position;

-- Check sample data to understand the structure
SELECT 
  id,
  client_id,
  project_title,
  status,
  end_date,
  created_at,
  updated_at
FROM custom_sync_requests
LIMIT 5;
