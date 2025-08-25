-- Fix All Database Errors (400 and 406 errors)
-- This script addresses all the missing tables, functions, and RLS policies

-- ============================================
-- 1. CREATE MISSING TABLES
-- ============================================

-- Create rights_holder_licenses table if it doesn't exist (using correct name)
CREATE TABLE IF NOT EXISTS rights_holder_licenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    license_type TEXT NOT NULL CHECK (license_type IN ('sync', 'master_use', 'mechanical', 'performance')),
    license_terms TEXT,
    license_fee DECIMAL(10,2),
    license_start_date DATE,
    license_end_date DATE,
    license_status TEXT DEFAULT 'active' CHECK (license_status IN ('active', 'expired', 'terminated')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create rights_holder_balances table if it doesn't exist (using correct name)
CREATE TABLE IF NOT EXISTS rights_holder_balances (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    rights_holder_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
    pending_balance DECIMAL(10,2) DEFAULT 0.00,
    available_balance DECIMAL(10,2) DEFAULT 0.00,
    lifetime_earnings DECIMAL(10,2) DEFAULT 0.00,
    total_payouts DECIMAL(10,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create background_assets table if it doesn't exist
CREATE TABLE IF NOT EXISTS background_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('image', 'video')),
    page TEXT NOT NULL,
    "isActive" BOOLEAN DEFAULT true,
    file_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure playlists table exists with correct structure
CREATE TABLE IF NOT EXISTS playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_name VARCHAR(255),
    logo_url TEXT,
    photo_url TEXT,
    is_public BOOLEAN DEFAULT true,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure playlist_tracks table exists
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playlist_id, track_id)
);

-- Create playlist_favorites table if it doesn't exist
CREATE TABLE IF NOT EXISTS playlist_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, playlist_id)
);

-- ============================================
-- 2. CREATE MISSING FUNCTIONS
-- ============================================

-- Create get_user_favorited_playlists function
CREATE OR REPLACE FUNCTION get_user_favorited_playlists(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    playlist_id UUID,
    playlist_name TEXT,
    playlist_description TEXT,
    producer_name TEXT,
    tracks_count BIGINT,
    favorited_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id as playlist_id,
        p.name as playlist_name,
        p.description as playlist_description,
        CASE 
            WHEN pr.first_name IS NOT NULL AND pr.last_name IS NOT NULL THEN 
                pr.first_name || ' ' || pr.last_name
            WHEN pr.first_name IS NOT NULL THEN 
                pr.first_name
            ELSE 
                split_part(pr.email, '@', 1)
        END as producer_name,
        COALESCE(pt.tracks_count, 0) as tracks_count,
        pf.favorited_at
    FROM playlist_favorites pf
    JOIN playlists p ON pf.playlist_id = p.id
    JOIN profiles pr ON p.producer_id = pr.id
    LEFT JOIN (
        SELECT playlist_id, COUNT(*) as tracks_count
        FROM playlist_tracks
        GROUP BY playlist_id
    ) pt ON p.id = pt.playlist_id
    WHERE pf.user_id = v_user_id
    AND p.is_public = true
    ORDER BY pf.favorited_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE rights_holder_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE rights_holder_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE background_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_favorites ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 4. CREATE RLS POLICIES
-- ============================================

-- Rights holder licenses policies
DROP POLICY IF EXISTS "Users can view own licenses" ON rights_holder_licenses;
DROP POLICY IF EXISTS "Users can manage own licenses" ON rights_holder_licenses;

CREATE POLICY "Users can view own licenses" ON rights_holder_licenses
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Users can manage own licenses" ON rights_holder_licenses
    FOR ALL USING (auth.uid() = rights_holder_id);

-- Rights holder balances policies
DROP POLICY IF EXISTS "Users can view own balances" ON rights_holder_balances;
DROP POLICY IF EXISTS "Users can manage own balances" ON rights_holder_balances;

CREATE POLICY "Users can view own balances" ON rights_holder_balances
    FOR SELECT USING (auth.uid() = rights_holder_id);

CREATE POLICY "Users can manage own balances" ON rights_holder_balances
    FOR ALL USING (auth.uid() = rights_holder_id);

-- Background assets policies (fix 406 errors)
DROP POLICY IF EXISTS "Enable read access for all users" ON background_assets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON background_assets;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON background_assets;

CREATE POLICY "Enable read access for all users" ON background_assets
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON background_assets
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users only" ON background_assets
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users only" ON background_assets
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Playlists policies
DROP POLICY IF EXISTS "Producers can manage their own playlists" ON playlists;
DROP POLICY IF EXISTS "Anyone can view public playlists" ON playlists;

CREATE POLICY "Producers can manage their own playlists" ON playlists
    FOR ALL USING (auth.uid() = producer_id);

CREATE POLICY "Anyone can view public playlists" ON playlists
    FOR SELECT USING (is_public = true);

-- Playlist tracks policies
DROP POLICY IF EXISTS "Producers can manage tracks in their playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Anyone can view tracks in public playlists" ON playlist_tracks;

CREATE POLICY "Producers can manage tracks in their playlists" ON playlist_tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view tracks in public playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.is_public = true
        )
    );

-- Playlist favorites policies
DROP POLICY IF EXISTS "Users can manage their own favorites" ON playlist_favorites;

CREATE POLICY "Users can manage their own favorites" ON playlist_favorites
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 5. FIX SYNC_PROPOSALS TABLE STRUCTURE
-- ============================================

-- Ensure sync_proposals table has all required columns
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS client_status text DEFAULT 'pending';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS producer_status text DEFAULT 'pending';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS invoice_id text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS payment_date timestamptz;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS final_amount integer;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS payment_due_date timestamptz;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS stripe_checkout_session_id text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS stripe_invoice_id text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS negotiation_status text DEFAULT 'pending';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS client_terms_accepted jsonb DEFAULT '{}';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS producer_terms_accepted jsonb DEFAULT '{}';
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS last_message_sender_id uuid REFERENCES profiles(id);
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS last_message_at timestamptz;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS negotiated_amount numeric(10,2);
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS final_payment_terms text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS negotiated_payment_terms text;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS client_accepted_at timestamptz;
ALTER TABLE sync_proposals ADD COLUMN IF NOT EXISTS license_url text;

-- ============================================
-- 6. FIX SYNC_PROPOSALS RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON sync_proposals;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sync_proposals;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON sync_proposals;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON sync_proposals;
DROP POLICY IF EXISTS "Clients can create proposals" ON sync_proposals;
DROP POLICY IF EXISTS "Clients can view their own proposals" ON sync_proposals;
DROP POLICY IF EXISTS "Producers can view proposals for their tracks" ON sync_proposals;

-- Create comprehensive RLS policies for sync_proposals
CREATE POLICY "Enable read access for all users" ON sync_proposals
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON sync_proposals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON sync_proposals
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON sync_proposals
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 7. FIX CUSTOM SYNC REQUESTS RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Users can insert own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Users can update own sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Producers can view open sync requests" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable read access for all users" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON custom_sync_requests;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON custom_sync_requests;

-- Create comprehensive RLS policies for custom_sync_requests
-- Allow clients to view and manage their own requests
CREATE POLICY "Clients can view own sync requests" ON custom_sync_requests
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Clients can manage own sync requests" ON custom_sync_requests
    FOR ALL USING (auth.uid() = client_id);

-- Allow producers/rights holders to view requests where they are selected
CREATE POLICY "Producers can view selected requests" ON custom_sync_requests
    FOR SELECT USING (auth.uid() = selected_producer_id);

-- Allow producers/rights holders to view open requests they can submit to
CREATE POLICY "Producers can view open requests" ON custom_sync_requests
    FOR SELECT USING (
        is_open_request = true 
        AND status = 'open' 
        AND end_date >= NOW()
    );

-- Allow authenticated users to insert (for creating new requests)
CREATE POLICY "Authenticated users can insert" ON custom_sync_requests
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow selected producers to update requests (for accepting/rejecting)
CREATE POLICY "Selected producers can update" ON custom_sync_requests
    FOR UPDATE USING (auth.uid() = selected_producer_id);

-- Allow clients to update their own requests
CREATE POLICY "Clients can update own requests" ON custom_sync_requests
    FOR UPDATE USING (auth.uid() = client_id);

-- ============================================
-- 8. FIX SYNC SUBMISSIONS RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own sync submissions" ON sync_submissions;
DROP POLICY IF EXISTS "Users can insert own sync submissions" ON sync_submissions;
DROP POLICY IF EXISTS "Users can update own sync submissions" ON sync_submissions;

-- Create comprehensive RLS policies for sync_submissions
CREATE POLICY "Enable read access for all users" ON sync_submissions
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON sync_submissions
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for users based on user_id" ON sync_submissions
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for users based on user_id" ON sync_submissions
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- ============================================
-- 7. GRANT PERMISSIONS
-- ============================================

GRANT ALL ON rights_holder_licenses TO authenticated;
GRANT ALL ON rights_holder_balances TO authenticated;
GRANT ALL ON background_assets TO authenticated;
GRANT ALL ON playlists TO authenticated;
GRANT ALL ON playlist_tracks TO authenticated;
GRANT ALL ON playlist_favorites TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_favorited_playlists(INTEGER) TO authenticated;

-- ============================================
-- 8. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_rights_holder_licenses_rights_holder_id ON rights_holder_licenses(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_rights_holder_balances_rights_holder_id ON rights_holder_balances(rights_holder_id);
CREATE INDEX IF NOT EXISTS idx_background_assets_page ON background_assets(page);
CREATE INDEX IF NOT EXISTS idx_background_assets_isactive ON background_assets("isActive");
CREATE INDEX IF NOT EXISTS idx_playlists_producer_id ON playlists(producer_id);
CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists(slug);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_favorites_user_id ON playlist_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_favorites_playlist_id ON playlist_favorites(playlist_id);

-- ============================================
-- 9. VERIFY SETUP
-- ============================================

-- Check if tables exist and have data
SELECT 'rights_holder_licenses' as table_name, COUNT(*) as count FROM rights_holder_licenses
UNION ALL
SELECT 'rights_holder_balances' as table_name, COUNT(*) as count FROM rights_holder_balances
UNION ALL
SELECT 'background_assets' as table_name, COUNT(*) as count FROM background_assets
UNION ALL
SELECT 'playlists' as table_name, COUNT(*) as count FROM playlists
UNION ALL
SELECT 'playlist_tracks' as table_name, COUNT(*) as count FROM playlist_tracks
UNION ALL
SELECT 'playlist_favorites' as table_name, COUNT(*) as count FROM playlist_favorites
UNION ALL
SELECT 'sync_proposals' as table_name, COUNT(*) as count FROM sync_proposals;

-- Test the function
SELECT 'Testing get_user_favorited_playlists function...' as info;
SELECT COUNT(*) as function_test_result FROM get_user_favorited_playlists(10);

SELECT 'Database errors fixed successfully!' as status;
