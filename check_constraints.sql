-- Check the negotiation_status check constraint
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'sync_proposals'::regclass 
AND conname LIKE '%negotiation_status%';

-- Also check what values are currently in the negotiation_status column
SELECT DISTINCT negotiation_status, COUNT(*) 
FROM sync_proposals 
GROUP BY negotiation_status; 