-- First, let's check ALL table structures to see what columns actually exist
-- This will help us build the correct RLS policies

-- 1. sync_submission_favorites table structure
SELECT 'sync_submission_favorites' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_submission_favorites' 
ORDER BY ordinal_position;

-- 2. sync_request_messages table structure
SELECT 'sync_request_messages' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_request_messages' 
ORDER BY ordinal_position;

-- 3. sync_submissions table structure
SELECT 'sync_submissions' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_submissions' 
ORDER BY ordinal_position;

-- 4. white_label_monthly table structure
SELECT 'white_label_monthly' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'white_label_monthly' 
ORDER BY ordinal_position;

-- 5. sync_proposal_history table structure
SELECT 'sync_proposal_history' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_proposal_history' 
ORDER BY ordinal_position;

-- 6. Also check related tables that we reference in policies
-- custom_sync_requests table structure
SELECT 'custom_sync_requests' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests' 
ORDER BY ordinal_position;

-- sync_proposals table structure
SELECT 'sync_proposals' as table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'sync_proposals' 
ORDER BY ordinal_position;

-- Check which tables actually exist
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename IN (
    'sync_proposal_history', 
    'sync_request_messages',
    'sync_submission_favorites',
    'sync_submissions',
    'white_label_monthly',
    'custom_sync_requests',
    'sync_proposals'
)
ORDER BY tablename; 