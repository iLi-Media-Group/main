-- Rights Holder Roster Management System
-- This system allows record labels and publishers to manage their roster of artists, bands, and producers

-- ============================================
-- 1. ROSTER ENTITIES TABLE
-- ============================================

-- Main roster entities table (artists, bands, producers)
CREATE TABLE IF NOT EXISTS roster_entities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    entity_type TEXT NOT NULL CHECK (entity_type IN ('artist', 'band', 'producer')),
    name TEXT NOT NULL,
    display_name TEXT,
    email TEXT,
    phone TEXT,
    website TEXT,
    bio TEXT,
    genres TEXT[],
    image_url TEXT, -- Profile image URL stored in profile-photos bucket
    social_media JSONB DEFAULT '{}',
    contact_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    date_entered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. ROSTER ENTITY MEMBERS (for bands)
-- ============================================

-- Band members table for when entity_type is 'band'
CREATE TABLE IF NOT EXISTS roster_entity_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    roster_entity_id UUID REFERENCES roster_entities(id) ON DELETE CASCADE,
    member_name TEXT NOT NULL,
    role TEXT, -- e.g., 'lead singer', 'guitarist', 'drummer'
    email TEXT,
    phone TEXT,
    is_primary_contact BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. TRACK-ROSTER ASSOCIATION
-- ============================================

-- Add roster_entity_id to tracks table to link tracks to roster entities
ALTER TABLE tracks ADD COLUMN IF NOT EXISTS roster_entity_id UUID REFERENCES roster_entities(id) ON DELETE SET NULL;

-- ============================================
-- 4. ROSTER ANALYTICS VIEWS
-- ============================================

-- View for roster entity performance analytics
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
WHERE re.is_active = true
GROUP BY re.id, re.name, re.entity_type, re.date_entered, re.rights_holder_id;

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Indexes for roster_entities
CREATE INDEX IF NOT EXISTS idx_roster_entities_rights_holder_id ON roster_entities(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_roster_entities_entity_type ON roster_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_roster_entities_name ON roster_entities(name);
CREATE INDEX IF NOT EXISTS idx_roster_entities_date_entered ON roster_entities(date_entered);
CREATE INDEX IF NOT EXISTS idx_roster_entities_is_active ON roster_entities(is_active);

-- Indexes for roster_entity_members
CREATE INDEX IF NOT EXISTS idx_roster_entity_members_roster_entity_id ON roster_entity_members(roster_entity_id);
CREATE INDEX IF NOT EXISTS idx_roster_entity_members_is_primary_contact ON roster_entity_members(is_primary_contact);

-- Index for tracks roster association
CREATE INDEX IF NOT EXISTS idx_tracks_roster_entity_id ON tracks(roster_entity_id);

-- ============================================
-- 6. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE roster_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE roster_entity_members ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES
-- ============================================

-- Rights holders can manage their own roster entities
CREATE POLICY "Rights holders can manage own roster entities" ON roster_entities
    FOR ALL USING (
        rights_holder_id = auth.uid() AND
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND rights_holder_type IN ('record_label', 'publisher')
        )
    );

-- Rights holders can manage their own roster entity members
CREATE POLICY "Rights holders can manage own roster entity members" ON roster_entity_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM roster_entities re
            JOIN profiles p ON p.id = re.rights_holder_id
            WHERE re.id = roster_entity_members.roster_entity_id
            AND p.id = auth.uid()
            AND p.rights_holder_type IN ('record_label', 'publisher')
        )
    );

-- Admins can manage all roster entities
CREATE POLICY "Admins can manage all roster entities" ON roster_entities
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type LIKE '%admin%'
        )
    );

CREATE POLICY "Admins can manage all roster entity members" ON roster_entity_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type LIKE '%admin%'
        )
    );

-- ============================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for roster_entities
CREATE TRIGGER update_roster_entities_updated_at 
    BEFORE UPDATE ON roster_entities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Triggers for roster_entity_members
CREATE TRIGGER update_roster_entity_members_updated_at 
    BEFORE UPDATE ON roster_entity_members 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. HELPER FUNCTIONS
-- ============================================

-- Function to get roster entity statistics
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
    WHERE re.id = entity_id AND re.is_active = true
    GROUP BY re.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE roster_entities IS 'Main table for rights holder roster management - artists, bands, and producers';
COMMENT ON TABLE roster_entity_members IS 'Band members for roster entities of type band';
COMMENT ON COLUMN tracks.roster_entity_id IS 'Links tracks to roster entities for rights holder management';
COMMENT ON VIEW roster_entity_analytics IS 'Analytics view for roster entity performance and revenue tracking';
