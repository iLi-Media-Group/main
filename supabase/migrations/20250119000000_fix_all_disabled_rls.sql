-- Fix all tables with disabled RLS (unrestricted badges)
-- This migration enables RLS on all tables and adds appropriate security policies

-- First, identify all tables with RLS disabled
SELECT 'Tables with RLS disabled:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
    AND rowsecurity = false
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%'
ORDER BY tablename;

-- ============================================
-- 1. FIX TRACKS TABLE RLS
-- ============================================

-- Enable RLS on tracks table
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "tracks_select_policy" ON tracks;
DROP POLICY IF EXISTS "tracks_insert_policy" ON tracks;
DROP POLICY IF EXISTS "tracks_update_policy" ON tracks;
DROP POLICY IF EXISTS "tracks_delete_policy" ON tracks;

-- Create policies for tracks table
-- All authenticated users can view tracks
CREATE POLICY "tracks_select_policy" ON tracks
    FOR SELECT USING (auth.role() = 'authenticated');

-- Producers can insert their own tracks
CREATE POLICY "tracks_insert_policy" ON tracks
    FOR INSERT WITH CHECK (
        track_producer_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Producers can update their own tracks, admins can update any
CREATE POLICY "tracks_update_policy" ON tracks
    FOR UPDATE USING (
        track_producer_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        track_producer_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Producers can delete their own tracks, admins can delete any
CREATE POLICY "tracks_delete_policy" ON tracks
    FOR DELETE USING (
        track_producer_id = auth.uid() OR
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- ============================================
-- 2. FIX INSTRUMENT TABLES RLS
-- ============================================

-- Enable RLS on instrument_categories table
ALTER TABLE instrument_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "instrument_categories_select_policy" ON instrument_categories;
DROP POLICY IF EXISTS "instrument_categories_insert_policy" ON instrument_categories;
DROP POLICY IF EXISTS "instrument_categories_update_policy" ON instrument_categories;
DROP POLICY IF EXISTS "instrument_categories_delete_policy" ON instrument_categories;

-- Create policies for instrument_categories
-- Public read access
CREATE POLICY "instrument_categories_select_policy" ON instrument_categories
    FOR SELECT USING (true);

-- Only admins can manage instrument categories
CREATE POLICY "instrument_categories_insert_policy" ON instrument_categories
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "instrument_categories_update_policy" ON instrument_categories
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "instrument_categories_delete_policy" ON instrument_categories
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Enable RLS on instruments table
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "instruments_select_policy" ON instruments;
DROP POLICY IF EXISTS "instruments_insert_policy" ON instruments;
DROP POLICY IF EXISTS "instruments_update_policy" ON instruments;
DROP POLICY IF EXISTS "instruments_delete_policy" ON instruments;

-- Create policies for instruments
-- Public read access
CREATE POLICY "instruments_select_policy" ON instruments
    FOR SELECT USING (true);

-- Only admins can manage instruments
CREATE POLICY "instruments_insert_policy" ON instruments
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "instruments_update_policy" ON instruments
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "instruments_delete_policy" ON instruments
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- ============================================
-- 3. FIX GENRE TABLES RLS
-- ============================================

-- Enable RLS on genres table
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "genres_select_policy" ON genres;
DROP POLICY IF EXISTS "genres_insert_policy" ON genres;
DROP POLICY IF EXISTS "genres_update_policy" ON genres;
DROP POLICY IF EXISTS "genres_delete_policy" ON genres;

-- Create policies for genres
-- Public read access
CREATE POLICY "genres_select_policy" ON genres
    FOR SELECT USING (true);

-- Only admins can manage genres
CREATE POLICY "genres_insert_policy" ON genres
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "genres_update_policy" ON genres
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "genres_delete_policy" ON genres
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Enable RLS on sub_genres table
ALTER TABLE sub_genres ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "sub_genres_select_policy" ON sub_genres;
DROP POLICY IF EXISTS "sub_genres_insert_policy" ON sub_genres;
DROP POLICY IF EXISTS "sub_genres_update_policy" ON sub_genres;
DROP POLICY IF EXISTS "sub_genres_delete_policy" ON sub_genres;

-- Create policies for sub_genres
-- Public read access
CREATE POLICY "sub_genres_select_policy" ON sub_genres
    FOR SELECT USING (true);

-- Only admins can manage sub_genres
CREATE POLICY "sub_genres_insert_policy" ON sub_genres
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "sub_genres_update_policy" ON sub_genres
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "sub_genres_delete_policy" ON sub_genres
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Enable RLS on moods table
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "moods_select_policy" ON moods;
DROP POLICY IF EXISTS "moods_insert_policy" ON moods;
DROP POLICY IF EXISTS "moods_update_policy" ON moods;
DROP POLICY IF EXISTS "moods_delete_policy" ON moods;

-- Create policies for moods
-- Public read access
CREATE POLICY "moods_select_policy" ON moods
    FOR SELECT USING (true);

-- Only admins can manage moods
CREATE POLICY "moods_insert_policy" ON moods
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "moods_update_policy" ON moods
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "moods_delete_policy" ON moods
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Enable RLS on media_usage_types table
ALTER TABLE media_usage_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "media_usage_types_select_policy" ON media_usage_types;
DROP POLICY IF EXISTS "media_usage_types_insert_policy" ON media_usage_types;
DROP POLICY IF EXISTS "media_usage_types_update_policy" ON media_usage_types;
DROP POLICY IF EXISTS "media_usage_types_delete_policy" ON media_usage_types;

-- Create policies for media_usage_types
-- Public read access
CREATE POLICY "media_usage_types_select_policy" ON media_usage_types
    FOR SELECT USING (true);

-- Only admins can manage media_usage_types
CREATE POLICY "media_usage_types_insert_policy" ON media_usage_types
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "media_usage_types_update_policy" ON media_usage_types
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "media_usage_types_delete_policy" ON media_usage_types
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- ============================================
-- 4. FIX PRODUCER APPLICATIONS RLS
-- ============================================

-- Enable RLS on producer_applications table
ALTER TABLE producer_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "producer_applications_select_policy" ON producer_applications;
DROP POLICY IF EXISTS "producer_applications_insert_policy" ON producer_applications;
DROP POLICY IF EXISTS "producer_applications_update_policy" ON producer_applications;
DROP POLICY IF EXISTS "producer_applications_delete_policy" ON producer_applications;

-- Create policies for producer_applications
-- Admins can view all applications
CREATE POLICY "producer_applications_select_policy" ON producer_applications
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Anyone can submit an application
CREATE POLICY "producer_applications_insert_policy" ON producer_applications
    FOR INSERT WITH CHECK (true);

-- Only admins can update applications
CREATE POLICY "producer_applications_update_policy" ON producer_applications
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Only admins can delete applications
CREATE POLICY "producer_applications_delete_policy" ON producer_applications
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- ============================================
-- 5. FIX WHITE LABEL TABLES RLS
-- ============================================

-- Enable RLS on white_label_clients table
ALTER TABLE white_label_clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "white_label_clients_select_policy" ON white_label_clients;
DROP POLICY IF EXISTS "white_label_clients_insert_policy" ON white_label_clients;
DROP POLICY IF EXISTS "white_label_clients_update_policy" ON white_label_clients;
DROP POLICY IF EXISTS "white_label_clients_delete_policy" ON white_label_clients;

-- Create policies for white_label_clients
-- Admins can view all white label clients
CREATE POLICY "white_label_clients_select_policy" ON white_label_clients
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Only admins can manage white label clients
CREATE POLICY "white_label_clients_insert_policy" ON white_label_clients
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "white_label_clients_update_policy" ON white_label_clients
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "white_label_clients_delete_policy" ON white_label_clients
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Enable RLS on white_label_features table
ALTER TABLE white_label_features ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "white_label_features_select_policy" ON white_label_features;
DROP POLICY IF EXISTS "white_label_features_insert_policy" ON white_label_features;
DROP POLICY IF EXISTS "white_label_features_update_policy" ON white_label_features;
DROP POLICY IF EXISTS "white_label_features_delete_policy" ON white_label_features;

-- Create policies for white_label_features
-- Admins can view all feature flags
CREATE POLICY "white_label_features_select_policy" ON white_label_features
    FOR SELECT USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Only admins can manage feature flags
CREATE POLICY "white_label_features_insert_policy" ON white_label_features
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "white_label_features_update_policy" ON white_label_features
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "white_label_features_delete_policy" ON white_label_features
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- ============================================
-- 6. FIX SITE SETTINGS AND CLIENTS RLS
-- ============================================

-- Enable RLS on site_settings table
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "site_settings_select_policy" ON site_settings;
DROP POLICY IF EXISTS "site_settings_insert_policy" ON site_settings;
DROP POLICY IF EXISTS "site_settings_update_policy" ON site_settings;
DROP POLICY IF EXISTS "site_settings_delete_policy" ON site_settings;

-- Create policies for site_settings
-- Public read access
CREATE POLICY "site_settings_select_policy" ON site_settings
    FOR SELECT USING (true);

-- Only admins can manage site settings
CREATE POLICY "site_settings_insert_policy" ON site_settings
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "site_settings_update_policy" ON site_settings
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "site_settings_delete_policy" ON site_settings
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Enable RLS on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "clients_select_policy" ON clients;
DROP POLICY IF EXISTS "clients_insert_policy" ON clients;
DROP POLICY IF EXISTS "clients_update_policy" ON clients;
DROP POLICY IF EXISTS "clients_delete_policy" ON clients;

-- Create policies for clients
-- Public read access
CREATE POLICY "clients_select_policy" ON clients
    FOR SELECT USING (true);

-- Only admins can manage clients
CREATE POLICY "clients_insert_policy" ON clients
    FOR INSERT WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "clients_update_policy" ON clients
    FOR UPDATE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    ) WITH CHECK (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

CREATE POLICY "clients_delete_policy" ON clients
    FOR DELETE USING (
        auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- ============================================
-- 7. VERIFY ALL TABLES NOW HAVE RLS ENABLED
-- ============================================

SELECT 'Final RLS status for all tables:' as info;
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
ORDER BY tablename;

-- Show all RLS policies
SELECT 'All RLS policies:' as info;
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
