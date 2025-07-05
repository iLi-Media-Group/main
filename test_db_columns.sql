-- Test query to check what columns exist in sync_proposals table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sync_proposals' 
ORDER BY ordinal_position; 