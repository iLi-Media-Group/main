-- Fix Custom Sync Request Upsert Constraint Issue
-- This script fixes the ON CONFLICT error when trying to upsert sync_request_selections

-- First, let's check the current structure of sync_request_selections table
SELECT 'Current sync_request_selections table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'sync_request_selections'
ORDER BY ordinal_position;

-- Check existing constraints
SELECT 'Current constraints on sync_request_selections:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'sync_request_selections';

-- Add the missing unique constraint if it doesn't exist
DO $$
BEGIN
    -- Check if the unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'sync_request_selections' 
        AND constraint_name = 'sync_request_selections_client_request_unique'
        AND constraint_type = 'UNIQUE'
    ) THEN
        -- Add the unique constraint
        ALTER TABLE sync_request_selections 
        ADD CONSTRAINT sync_request_selections_client_request_unique 
        UNIQUE (client_id, sync_request_id);
        
        RAISE NOTICE 'Added unique constraint on (client_id, sync_request_id)';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

-- Verify the constraint was added
SELECT 'Verification - constraints after fix:' as info;
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'sync_request_selections';

-- Test the upsert functionality
SELECT 'Testing upsert functionality:' as info;
-- This will show if there are any existing records that might conflict
SELECT 
    client_id,
    sync_request_id,
    COUNT(*) as record_count
FROM sync_request_selections
GROUP BY client_id, sync_request_id
HAVING COUNT(*) > 1;

-- Summary
SELECT 'Fix completed successfully' as status;
