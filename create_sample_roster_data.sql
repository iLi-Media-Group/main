-- Create sample roster data to populate the views
-- This will create roster entities and link existing tracks to them

-- ============================================
-- 1. CREATE SAMPLE ROSTER ENTITIES
-- ============================================

-- Insert sample roster entities
INSERT INTO roster_entities (id, name, entity_type, rights_holder_id, date_entered, is_active, created_at, updated_at)
VALUES 
    (gen_random_uuid(), 'Sample Artist 1', 'artist', (SELECT id FROM profiles WHERE account_type = 'rights_holder' LIMIT 1), CURRENT_DATE, true, NOW(), NOW()),
    (gen_random_uuid(), 'Sample Group 1', 'group', (SELECT id FROM profiles WHERE account_type = 'rights_holder' LIMIT 1), CURRENT_DATE, true, NOW(), NOW()),
    (gen_random_uuid(), 'Sample Producer 1', 'producer', (SELECT id FROM profiles WHERE account_type = 'rights_holder' LIMIT 1), CURRENT_DATE, true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. ASSIGN EXISTING TRACKS TO ROSTER ENTITIES
-- ============================================

-- Update some existing tracks to be assigned to roster entities
UPDATE tracks 
SET roster_entity_id = (SELECT id FROM roster_entities LIMIT 1)
WHERE roster_entity_id IS NULL 
LIMIT 5;

-- ============================================
-- 3. VERIFY THE DATA WAS CREATED
-- ============================================

-- Check roster entities
SELECT 'roster_entities created' as check_item, COUNT(*) as count FROM roster_entities;

-- Check tracks assigned to roster entities
SELECT 'tracks with roster_entity_id' as check_item, COUNT(*) as count FROM tracks WHERE roster_entity_id IS NOT NULL;

-- Check sync proposals
SELECT 'sync_proposals accepted' as check_item, COUNT(*) as count FROM sync_proposals WHERE status = 'accepted';

-- Check custom sync requests
SELECT 'custom_sync_requests completed' as check_item, COUNT(*) as count FROM custom_sync_requests WHERE status = 'completed';

-- ============================================
-- 4. TEST THE VIEWS NOW
-- ============================================

-- Test the YTD analytics view
SELECT 'YTD analytics data' as check_item, COUNT(*) as count FROM roster_ytd_analytics;

-- Test the monthly analytics view
SELECT 'Monthly analytics data' as check_item, COUNT(*) as count FROM roster_monthly_analytics;
