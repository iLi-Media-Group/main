-- Check what tables exist for revenue tracking
-- This will help us understand what data sources are available

-- Check if roster_revenue_transactions exists
SELECT 'roster_revenue_transactions' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'roster_revenue_transactions'
) as exists;

-- Check if sync_proposals exists and has revenue data
SELECT 'sync_proposals' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'sync_proposals'
) as exists;

-- Check if custom_sync_requests exists
SELECT 'custom_sync_requests' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'custom_sync_requests'
) as exists;

-- Check if sales exists
SELECT 'sales' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'sales'
) as exists;

-- Check if tracks exists and has roster_entity_id
SELECT 'tracks' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'tracks'
) as exists;

-- Check if tracks has roster_entity_id column
SELECT 'tracks.roster_entity_id' as column_name, EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tracks' AND column_name = 'roster_entity_id'
) as exists;

-- Check if roster_entities exists
SELECT 'roster_entities' as table_name, EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'roster_entities'
) as exists;

-- Check what columns sync_proposals has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'sync_proposals' 
ORDER BY ordinal_position;

-- Check what columns custom_sync_requests has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'custom_sync_requests' 
ORDER BY ordinal_position;
