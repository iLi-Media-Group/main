-- Fix RLS on Unrestricted Tables
-- This script enables RLS and adds appropriate policies for security

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

-- Enable RLS on all user tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_media_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_sync_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_sync_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_proposal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_submission_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE white_label_monthly ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stripe_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_settings ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. PUBLIC READ-ONLY TABLES (Reference Data)
-- ============================================

-- Genres - public read access
DROP POLICY IF EXISTS "Genres are viewable by everyone" ON genres;
CREATE POLICY "Genres are viewable by everyone" ON genres
    FOR SELECT USING (true);

-- Sub-genres - public read access
DROP POLICY IF EXISTS "Sub-genres are viewable by everyone" ON sub_genres;
CREATE POLICY "Sub-genres are viewable by everyone" ON sub_genres
    FOR SELECT USING (true);

-- Moods - public read access
DROP POLICY IF EXISTS "Moods are viewable by everyone" ON moods;
CREATE POLICY "Moods are viewable by everyone" ON moods
    FOR SELECT USING (true);

-- Instruments - public read access
DROP POLICY IF EXISTS "Instruments are viewable by everyone" ON instruments;
CREATE POLICY "Instruments are viewable by everyone" ON instruments
    FOR SELECT USING (true);

-- Instrument categories - public read access
DROP POLICY IF EXISTS "Instrument categories are viewable by everyone" ON instrument_categories;
CREATE POLICY "Instrument categories are viewable by everyone" ON instrument_categories
    FOR SELECT USING (true);

-- Media types - public read access
DROP POLICY IF EXISTS "Media types are viewable by everyone" ON media_types;
CREATE POLICY "Media types are viewable by everyone" ON media_types
    FOR SELECT USING (true);

-- Sub media types - public read access
DROP POLICY IF EXISTS "Sub media types are viewable by everyone" ON sub_media_types;
CREATE POLICY "Sub media types are viewable by everyone" ON sub_media_types
    FOR SELECT USING (true);

-- ============================================
-- 3. TRACKS TABLE POLICIES
-- ============================================

-- Public read access for catalog browsing
DROP POLICY IF EXISTS "Tracks are viewable by everyone" ON tracks;
CREATE POLICY "Tracks are viewable by everyone" ON tracks
    FOR SELECT USING (true);

-- Producers can manage their own tracks
DROP POLICY IF EXISTS "Producers can insert own tracks" ON tracks;
CREATE POLICY "Producers can insert own tracks" ON tracks
    FOR INSERT WITH CHECK (
        auth.uid() = track_producer_id
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'producer' OR account_type = 'admin,producer' OR account_type = 'admin')
        )
    );

DROP POLICY IF EXISTS "Producers can update own tracks" ON tracks;
CREATE POLICY "Producers can update own tracks" ON tracks
    FOR UPDATE USING (
        auth.uid() = track_producer_id
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'producer' OR account_type = 'admin,producer' OR account_type = 'admin')
        )
    );

DROP POLICY IF EXISTS "Producers can delete own tracks" ON tracks;
CREATE POLICY "Producers can delete own tracks" ON tracks
    FOR DELETE USING (
        auth.uid() = track_producer_id
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'producer' OR account_type = 'admin,producer' OR account_type = 'admin')
        )
    );

-- ============================================
-- 4. PROFILES TABLE POLICIES
-- ============================================

-- Users can view and update their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- 5. PRODUCER APPLICATIONS POLICIES
-- ============================================

-- Users can view their own applications
DROP POLICY IF EXISTS "Users can view own applications" ON producer_applications;
CREATE POLICY "Users can view own applications" ON producer_applications
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own applications
DROP POLICY IF EXISTS "Users can insert own applications" ON producer_applications;
CREATE POLICY "Users can insert own applications" ON producer_applications
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all applications
DROP POLICY IF EXISTS "Admins can view all applications" ON producer_applications;
CREATE POLICY "Admins can view all applications" ON producer_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'admin' OR account_type = 'admin,producer')
        )
    );

-- Admins can update applications
DROP POLICY IF EXISTS "Admins can update applications" ON producer_applications;
CREATE POLICY "Admins can update applications" ON producer_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'admin' OR account_type = 'admin,producer')
        )
    );

-- ============================================
-- 6. CUSTOM SYNC REQUESTS POLICIES
-- ============================================

-- Clients can manage their own sync requests
DROP POLICY IF EXISTS "Users can view own sync requests" ON custom_sync_requests;
CREATE POLICY "Users can view own sync requests" ON custom_sync_requests
    FOR SELECT USING (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can insert own sync requests" ON custom_sync_requests;
CREATE POLICY "Users can insert own sync requests" ON custom_sync_requests
    FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "Users can update own sync requests" ON custom_sync_requests;
CREATE POLICY "Users can update own sync requests" ON custom_sync_requests
    FOR UPDATE USING (auth.uid() = client_id);

-- Producers can view open sync requests
DROP POLICY IF EXISTS "Producers can view open sync requests" ON custom_sync_requests;
CREATE POLICY "Producers can view open sync requests" ON custom_sync_requests
    FOR SELECT USING (
        status = 'open'
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'producer' OR account_type = 'admin,producer')
        )
    );

-- ============================================
-- 7. SYNC PROPOSALS POLICIES
-- ============================================

-- Users can view proposals they're involved in
DROP POLICY IF EXISTS "Users can view their proposals" ON sync_proposals;
CREATE POLICY "Users can view their proposals" ON sync_proposals
    FOR SELECT USING (
        auth.uid() = client_id 
        OR auth.uid() = producer_id
    );

-- Users can insert proposals
DROP POLICY IF EXISTS "Users can insert proposals" ON sync_proposals;
CREATE POLICY "Users can insert proposals" ON sync_proposals
    FOR INSERT WITH CHECK (
        auth.uid() = producer_id
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND (account_type = 'producer' OR account_type = 'admin,producer')
        )
    );

-- Users can update their own proposals
DROP POLICY IF EXISTS "Users can update their proposals" ON sync_proposals;
CREATE POLICY "Users can update their proposals" ON sync_proposals
    FOR UPDATE USING (
        auth.uid() = producer_id OR auth.uid() = client_id
    );

-- ============================================
-- 8. PLAYLIST POLICIES
-- ============================================

-- Public read access for public playlists
DROP POLICY IF EXISTS "Anyone can view public playlists" ON playlists;
CREATE POLICY "Anyone can view public playlists" ON playlists
    FOR SELECT USING (is_public = true);

-- Producers can manage their own playlists
DROP POLICY IF EXISTS "Producers can manage their own playlists" ON playlists;
CREATE POLICY "Producers can manage their own playlists" ON playlists
    FOR ALL USING (auth.uid() = producer_id);

-- Playlist tracks - public read for public playlists
DROP POLICY IF EXISTS "Anyone can view tracks in public playlists" ON playlist_tracks;
CREATE POLICY "Anyone can view tracks in public playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.is_public = true
        )
    );

-- Producers can manage tracks in their playlists
DROP POLICY IF EXISTS "Producers can manage tracks in their playlists" ON playlist_tracks;
CREATE POLICY "Producers can manage tracks in their playlists" ON playlist_tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

-- Playlist views - allow anonymous tracking
DROP POLICY IF EXISTS "Allow anonymous playlist views" ON playlist_views;
CREATE POLICY "Allow anonymous playlist views" ON playlist_views
    FOR INSERT WITH CHECK (true);

-- Producers can view analytics for their playlists
DROP POLICY IF EXISTS "Producers can view analytics for their playlists" ON playlist_views;
CREATE POLICY "Producers can view analytics for their playlists" ON playlist_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_views.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

-- Playlist favorites
DROP POLICY IF EXISTS "Users can manage their favorites" ON playlist_favorites;
CREATE POLICY "Users can manage their favorites" ON playlist_favorites
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 9. WHITE LABEL POLICIES
-- ============================================

-- Users can view their own white label data
DROP POLICY IF EXISTS "Users can view own white label data" ON white_label_clients;
CREATE POLICY "Users can view own white label data" ON white_label_clients
    FOR SELECT USING (auth.uid() = owner_id);

-- Users can manage their own white label data
DROP POLICY IF EXISTS "Users can manage own white label data" ON white_label_clients;
CREATE POLICY "Users can manage own white label data" ON white_label_clients
    FOR ALL USING (auth.uid() = owner_id);

-- Admins can view all white label data
DROP POLICY IF EXISTS "Admins can view all white label data" ON white_label_clients;
CREATE POLICY "Admins can view all white label data" ON white_label_clients
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 10. STRIPE TABLES POLICIES
-- ============================================

-- Users can view their own Stripe data
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
CREATE POLICY "Users can view their own customer data" ON stripe_customers
    FOR SELECT USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Service role can manage all Stripe data
DROP POLICY IF EXISTS "Service role can manage customer data" ON stripe_customers;
CREATE POLICY "Service role can manage customer data" ON stripe_customers
    FOR ALL USING (auth.role() = 'service_role');

-- Similar policies for subscriptions and orders
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
CREATE POLICY "Users can view their own subscription data" ON stripe_subscriptions
    FOR SELECT USING (
        customer_id IN (
            SELECT customer_id FROM stripe_customers 
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS "Service role can manage subscription data" ON stripe_subscriptions;
CREATE POLICY "Service role can manage subscription data" ON stripe_subscriptions
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 11. ADMIN-ONLY TABLES
-- ============================================

-- Site settings - admin only
DROP POLICY IF EXISTS "Admins can manage site settings" ON site_settings;
CREATE POLICY "Admins can manage site settings" ON site_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- Contact messages - admin can view all
DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
CREATE POLICY "Admins can view contact messages" ON contact_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- Anyone can insert contact messages
DROP POLICY IF EXISTS "Anyone can insert contact messages" ON contact_messages;
CREATE POLICY "Anyone can insert contact messages" ON contact_messages
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 12. VERIFICATION
-- ============================================

-- Check final RLS status
SELECT 'Final RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%'
    AND tablename NOT LIKE 'sql_%'
ORDER BY tablename;

-- Check tables with no policies
SELECT 'Tables with no RLS policies:' as info;
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'information_schema%'
    AND t.tablename NOT LIKE 'sql_%'
    AND t.rowsecurity = true
GROUP BY t.tablename
HAVING COUNT(p.policyname) = 0
ORDER BY t.tablename;
