-- Create comprehensive pitch service tables
-- This migration creates all necessary tables for the MyBeatFi Pitch Service functionality

-- ============================================
-- 1. PITCH OPPORTUNITIES (SYNC BRIEFS)
-- ============================================

CREATE TABLE IF NOT EXISTS pitch_opportunities (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    client_name TEXT NOT NULL,
    client_email TEXT,
    client_company TEXT,
    brief_type TEXT NOT NULL CHECK (brief_type IN ('sync', 'licensing', 'custom')),
    genre_requirements TEXT[],
    mood_requirements TEXT[],
    instrument_requirements TEXT[],
    media_usage_requirements TEXT[],
    bpm_range_min INTEGER,
    bpm_range_max INTEGER,
    key_requirements TEXT[],
    duration_requirements TEXT,
    vocals_required BOOLEAN DEFAULT false,
    vocals_type TEXT CHECK (vocals_type IN ('lead_vocals', 'background_vocals', 'no_vocals', 'either')),
    budget_range TEXT,
    deadline TIMESTAMPTZ,
    submission_email TEXT NOT NULL,
    submission_instructions TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed', 'cancelled')),
    is_priority BOOLEAN DEFAULT false,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. PITCH SUBMISSIONS
-- ============================================

CREATE TABLE IF NOT EXISTS pitch_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID NOT NULL REFERENCES pitch_opportunities(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    submitted_by UUID NOT NULL REFERENCES auth.users(id),
    submission_notes TEXT,
    submission_status TEXT DEFAULT 'submitted' CHECK (submission_status IN ('submitted', 'selected', 'rejected', 'placed')),
    selection_notes TEXT,
    placement_details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(opportunity_id, track_id)
);

-- ============================================
-- 3. PITCH PLAYLISTS
-- ============================================

CREATE TABLE IF NOT EXISTS pitch_playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID NOT NULL REFERENCES pitch_opportunities(id) ON DELETE CASCADE,
    playlist_name TEXT NOT NULL,
    submission_email TEXT NOT NULL,
    submission_instructions TEXT,
    tracks_included UUID[] NOT NULL DEFAULT '{}',
    submission_status TEXT DEFAULT 'draft' CHECK (submission_status IN ('draft', 'sent', 'delivered', 'opened')),
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    response_received BOOLEAN DEFAULT false,
    response_notes TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. PITCH DEALS
-- ============================================

CREATE TABLE IF NOT EXISTS pitch_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    opportunity_id UUID REFERENCES pitch_opportunities(id),
    track_id UUID REFERENCES tracks(id),
    submission_id UUID NOT NULL REFERENCES pitch_submissions(id),
    client_name TEXT NOT NULL,
    track_title TEXT NOT NULL,
    producer_name TEXT NOT NULL,
    deal_status TEXT DEFAULT 'negotiating' CHECK (deal_status IN ('negotiating', 'pending_approval', 'approved', 'closed', 'cancelled')),
    deal_value NUMERIC,
    deal_currency TEXT DEFAULT 'USD',
    negotiation_notes TEXT,
    expected_close_date TIMESTAMPTZ,
    actual_close_date TIMESTAMPTZ,
    commission_rate NUMERIC DEFAULT 15,
    commission_amount NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id)
);

-- ============================================
-- 5. PITCH ANALYTICS
-- ============================================

CREATE TABLE IF NOT EXISTS pitch_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    opportunity_id UUID REFERENCES pitch_opportunities(id),
    track_id UUID REFERENCES tracks(id),
    metric_type TEXT NOT NULL CHECK (metric_type IN ('submission', 'selection', 'placement', 'revenue', 'email_sent', 'deal_updated', 'notification_sent')),
    metric_value NUMERIC DEFAULT 0,
    metric_details JSONB,
    period_start TIMESTAMPTZ,
    period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 6. INDEXES FOR PERFORMANCE
-- ============================================

-- Pitch opportunities indexes
CREATE INDEX IF NOT EXISTS idx_pitch_opportunities_status ON pitch_opportunities(status);
CREATE INDEX IF NOT EXISTS idx_pitch_opportunities_deadline ON pitch_opportunities(deadline);
CREATE INDEX IF NOT EXISTS idx_pitch_opportunities_created_at ON pitch_opportunities(created_at);
CREATE INDEX IF NOT EXISTS idx_pitch_opportunities_genre ON pitch_opportunities USING GIN(genre_requirements);
CREATE INDEX IF NOT EXISTS idx_pitch_opportunities_mood ON pitch_opportunities USING GIN(mood_requirements);

-- Pitch submissions indexes
CREATE INDEX IF NOT EXISTS idx_pitch_submissions_opportunity ON pitch_submissions(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_pitch_submissions_track ON pitch_submissions(track_id);
CREATE INDEX IF NOT EXISTS idx_pitch_submissions_user ON pitch_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_pitch_submissions_status ON pitch_submissions(submission_status);

-- Pitch playlists indexes
CREATE INDEX IF NOT EXISTS idx_pitch_playlists_opportunity ON pitch_playlists(opportunity_id);
CREATE INDEX IF NOT EXISTS idx_pitch_playlists_created_by ON pitch_playlists(created_by);
CREATE INDEX IF NOT EXISTS idx_pitch_playlists_status ON pitch_playlists(submission_status);

-- Pitch deals indexes
CREATE INDEX IF NOT EXISTS idx_pitch_deals_submission ON pitch_deals(submission_id);
CREATE INDEX IF NOT EXISTS idx_pitch_deals_status ON pitch_deals(deal_status);
CREATE INDEX IF NOT EXISTS idx_pitch_deals_created_at ON pitch_deals(created_at);

-- Pitch analytics indexes
CREATE INDEX IF NOT EXISTS idx_pitch_analytics_user ON pitch_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_pitch_analytics_type ON pitch_analytics(metric_type);
CREATE INDEX IF NOT EXISTS idx_pitch_analytics_period ON pitch_analytics(period_start, period_end);

-- ============================================
-- 7. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE pitch_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE pitch_analytics ENABLE ROW LEVEL SECURITY;

-- Pitch opportunities policies
DROP POLICY IF EXISTS "Pitch opportunities are viewable by authenticated users" ON pitch_opportunities;
CREATE POLICY "Pitch opportunities are viewable by authenticated users" ON pitch_opportunities
    FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Pitch opportunities are manageable by admins" ON pitch_opportunities;
CREATE POLICY "Pitch opportunities are manageable by admins" ON pitch_opportunities
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE account_type = 'admin'
    ));

-- Pitch submissions policies
DROP POLICY IF EXISTS "Users can view their own pitch submissions" ON pitch_submissions;
CREATE POLICY "Users can view their own pitch submissions" ON pitch_submissions
    FOR SELECT USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Users can create pitch submissions" ON pitch_submissions;
CREATE POLICY "Users can create pitch submissions" ON pitch_submissions
    FOR INSERT WITH CHECK (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Users can update their own pitch submissions" ON pitch_submissions;
CREATE POLICY "Users can update their own pitch submissions" ON pitch_submissions
    FOR UPDATE USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "Admins can manage all pitch submissions" ON pitch_submissions;
CREATE POLICY "Admins can manage all pitch submissions" ON pitch_submissions
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE account_type = 'admin'
    ));

-- Pitch playlists policies
DROP POLICY IF EXISTS "Users can view pitch playlists they created" ON pitch_playlists;
CREATE POLICY "Users can view pitch playlists they created" ON pitch_playlists
    FOR SELECT USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can create pitch playlists" ON pitch_playlists;
CREATE POLICY "Users can create pitch playlists" ON pitch_playlists
    FOR INSERT WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update their own pitch playlists" ON pitch_playlists;
CREATE POLICY "Users can update their own pitch playlists" ON pitch_playlists
    FOR UPDATE USING (auth.uid() = created_by);

DROP POLICY IF EXISTS "Admins can manage all pitch playlists" ON pitch_playlists;
CREATE POLICY "Admins can manage all pitch playlists" ON pitch_playlists
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE account_type = 'admin'
    ));

-- Pitch deals policies
DROP POLICY IF EXISTS "Admins can manage all pitch deals" ON pitch_deals;
CREATE POLICY "Admins can manage all pitch deals" ON pitch_deals
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE account_type = 'admin'
    ));

-- Pitch analytics policies
DROP POLICY IF EXISTS "Users can view their own pitch analytics" ON pitch_analytics;
CREATE POLICY "Users can view their own pitch analytics" ON pitch_analytics
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all pitch analytics" ON pitch_analytics;
CREATE POLICY "Admins can manage all pitch analytics" ON pitch_analytics
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE account_type = 'admin'
    ));

-- ============================================
-- 8. TRIGGERS FOR UPDATED_AT
-- ============================================

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DROP TRIGGER IF EXISTS update_pitch_opportunities_updated_at ON pitch_opportunities;
CREATE TRIGGER update_pitch_opportunities_updated_at
    BEFORE UPDATE ON pitch_opportunities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pitch_submissions_updated_at ON pitch_submissions;
CREATE TRIGGER update_pitch_submissions_updated_at
    BEFORE UPDATE ON pitch_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pitch_playlists_updated_at ON pitch_playlists;
CREATE TRIGGER update_pitch_playlists_updated_at
    BEFORE UPDATE ON pitch_playlists
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pitch_deals_updated_at ON pitch_deals;
CREATE TRIGGER update_pitch_deals_updated_at
    BEFORE UPDATE ON pitch_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 9. HELPFUL VIEWS
-- ============================================

-- View for active pitch opportunities with submission counts
CREATE OR REPLACE VIEW active_pitch_opportunities AS
SELECT 
    po.*,
    COUNT(ps.id) as total_submissions,
    COUNT(CASE WHEN ps.submission_status = 'selected' THEN 1 END) as selected_submissions,
    COUNT(CASE WHEN ps.submission_status = 'placed' THEN 1 END) as placed_submissions
FROM pitch_opportunities po
LEFT JOIN pitch_submissions ps ON po.id = ps.opportunity_id
WHERE po.status = 'active'
GROUP BY po.id;

-- View for user pitch statistics
CREATE OR REPLACE VIEW user_pitch_stats AS
SELECT 
    ps.submitted_by as user_id,
    COUNT(ps.id) as total_submissions,
    COUNT(CASE WHEN ps.submission_status = 'selected' THEN 1 END) as selected_count,
    COUNT(CASE WHEN ps.submission_status = 'placed' THEN 1 END) as placed_count,
    ROUND(
        (COUNT(CASE WHEN ps.submission_status = 'selected' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(ps.id), 0)) * 100, 2
    ) as selection_rate,
    ROUND(
        (COUNT(CASE WHEN ps.submission_status = 'placed' THEN 1 END)::DECIMAL / 
         NULLIF(COUNT(ps.id), 0)) * 100, 2
    ) as placement_rate
FROM pitch_submissions ps
GROUP BY ps.submitted_by;

-- ============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE pitch_opportunities IS 'Sync briefs and licensing opportunities from clients';
COMMENT ON TABLE pitch_submissions IS 'Individual track submissions for pitch opportunities';
COMMENT ON TABLE pitch_playlists IS 'Curated playlists sent to clients for pitch opportunities';
COMMENT ON TABLE pitch_deals IS 'Deal tracking and negotiation management for pitch submissions';
COMMENT ON TABLE pitch_analytics IS 'Analytics and metrics for pitch service performance';

COMMENT ON COLUMN pitch_opportunities.brief_type IS 'Type of opportunity: sync, licensing, or custom';
COMMENT ON COLUMN pitch_opportunities.status IS 'Current status of the opportunity';
COMMENT ON COLUMN pitch_submissions.submission_status IS 'Status of the track submission';
COMMENT ON COLUMN pitch_playlists.tracks_included IS 'Array of track IDs included in the playlist';
COMMENT ON COLUMN pitch_analytics.metric_type IS 'Type of metric being tracked';
COMMENT ON COLUMN pitch_deals.deal_status IS 'Current status of the deal negotiation';
COMMENT ON COLUMN pitch_deals.commission_rate IS 'Commission rate as percentage (e.g., 15 for 15%)';
