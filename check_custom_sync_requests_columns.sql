-- Check the actual column names in custom_sync_requests table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests' 
AND (column_name LIKE '%rights_holder%' OR column_name LIKE '%producer%')
ORDER BY column_name;

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'custom_sync_requests';

-- Check if there are any data in the table
SELECT COUNT(*) as total_requests FROM custom_sync_requests;

-- Check sample data (only existing columns)
SELECT id, status, selected_producer_id, selected_rights_holder_id, end_date
FROM custom_sync_requests 
LIMIT 5;
