-- Filter Tracks by Disabled Roster Entities
-- This migration ensures that tracks from disabled roster entities are hidden from the main catalog
-- while preserving existing licenses and sync proposals

-- ============================================
-- 1. UPDATE ROSTER ENTITY ANALYTICS VIEW
-- ============================================

-- Update the roster_entity_analytics view to only include active roster entities
CREATE OR REPLACE VIEW roster_entity_analytics AS
SELECT 
    re.id as roster_entity_id,
    re.name as entity_name,
    re.entity_type,
    re.date_entered,
    re.rights_holder_id,
    COUNT(DISTINCT t.id) as total_tracks,
    COUNT(DISTINCT CASE WHEN t.deleted_at IS NULL THEN t.id END) as active_tracks,
    COUNT(DISTINCT sp.id) as sync_proposals_completed,
    COUNT(DISTINCT CASE WHEN sp.status = 'pending' THEN sp.id END) as sync_proposals_pending,
    0 as custom_sync_requests_completed,
    0 as custom_sync_requests_pending,
    COALESCE(SUM(sp.final_amount), 0) as total_sync_revenue,
    0 as total_custom_sync_revenue,
    COALESCE(SUM(s.amount), 0) as total_sales_revenue,
    (COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(s.amount), 0)) as total_revenue
FROM roster_entities re
LEFT JOIN tracks t ON t.roster_entity_id = re.id
LEFT JOIN sync_proposals sp ON sp.track_id = t.id AND sp.status = 'accepted'
LEFT JOIN sales s ON s.track_id = t.id
WHERE re.is_active = true  -- Only include active roster entities
GROUP BY re.id, re.name, re.entity_type, re.date_entered, re.rights_holder_id;

-- ============================================
-- 2. UPDATE GET_ROSTER_ENTITY_STATS FUNCTION
-- ============================================

-- Update the function to only count tracks from active roster entities
CREATE OR REPLACE FUNCTION get_roster_entity_stats(entity_id UUID)
RETURNS TABLE (
    total_tracks BIGINT,
    active_tracks BIGINT,
    sync_proposals_completed BIGINT,
    sync_proposals_pending BIGINT,
    custom_sync_requests_completed BIGINT,
    custom_sync_requests_pending BIGINT,
    total_revenue DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT t.id)::BIGINT as total_tracks,
        COUNT(DISTINCT CASE WHEN t.deleted_at IS NULL THEN t.id END)::BIGINT as active_tracks,
        COUNT(DISTINCT sp.id)::BIGINT as sync_proposals_completed,
        COUNT(DISTINCT CASE WHEN sp.status = 'pending' THEN sp.id END)::BIGINT as sync_proposals_pending,
        0::BIGINT as custom_sync_requests_completed,
        0::BIGINT as custom_sync_requests_pending,
        (COALESCE(SUM(sp.final_amount), 0) + COALESCE(SUM(s.amount), 0)) as total_revenue
    FROM roster_entities re
    LEFT JOIN tracks t ON t.roster_entity_id = re.id
    LEFT JOIN sync_proposals sp ON sp.track_id = t.id AND sp.status = 'accepted'
    LEFT JOIN sales s ON s.track_id = t.id
    WHERE re.id = entity_id AND re.is_active = true  -- Only count tracks from active roster entities
    GROUP BY re.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. CREATE HELPER FUNCTION FOR TRACK FILTERING
-- ============================================

-- Create a function to check if a track should be visible based on roster entity status
CREATE OR REPLACE FUNCTION is_track_visible_for_catalog(track_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    roster_entity_active BOOLEAN;
BEGIN
    -- Check if the track is associated with a roster entity
    SELECT re.is_active INTO roster_entity_active
    FROM tracks t
    LEFT JOIN roster_entities re ON t.roster_entity_id = re.id
    WHERE t.id = track_id;
    
    -- If no roster entity is associated, or if the roster entity is active, show the track
    RETURN roster_entity_active IS NULL OR roster_entity_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. UPDATE RLS POLICIES FOR TRACKS
-- ============================================

-- Update the tracks RLS policy to exclude tracks from disabled roster entities
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;

CREATE POLICY "Tracks are viewable by everyone" ON tracks
  FOR SELECT
  USING (
    -- Show tracks that are not associated with any roster entity
    roster_entity_id IS NULL
    OR
    -- Show tracks that are associated with active roster entities
    EXISTS (
      SELECT 1 FROM roster_entities re 
      WHERE re.id = tracks.roster_entity_id 
      AND re.is_active = true
    )
  );

-- ============================================
-- 5. CREATE INDEX FOR PERFORMANCE
-- ============================================

-- Create a composite index for efficient filtering of tracks by roster entity status
CREATE INDEX IF NOT EXISTS idx_tracks_roster_entity_active 
ON tracks(roster_entity_id) 
WHERE roster_entity_id IS NOT NULL;

-- ============================================
-- 6. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON FUNCTION is_track_visible_for_catalog(UUID) IS 'Determines if a track should be visible in the catalog based on its associated roster entity status';
COMMENT ON INDEX idx_tracks_roster_entity_active IS 'Index for efficient filtering of tracks by roster entity status';
