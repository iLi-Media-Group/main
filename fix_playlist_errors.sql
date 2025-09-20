-- Fix playlist-related database errors
-- This script addresses the 400 and 406 errors when viewing playlists

-- ============================================
-- 1. CHECK AND FIX PLAYLIST_FAVORITES TABLE
-- ============================================

-- Check if playlist_favorites table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'playlist_favorites') THEN
        CREATE TABLE playlist_favorites (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
            favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, playlist_id)
        );
        RAISE NOTICE 'Created playlist_favorites table';
    ELSE
        RAISE NOTICE 'playlist_favorites table already exists';
    END IF;
END $$;

-- ============================================
-- 2. CREATE OR REPLACE GET_USER_FAVORITED_PLAYLISTS FUNCTION
-- ============================================

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
-- 3. CREATE OR REPLACE TOGGLE_PLAYLIST_FAVORITE FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION toggle_playlist_favorite(p_playlist_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_is_favorited BOOLEAN;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Check if already favorited
    SELECT EXISTS(
        SELECT 1 FROM playlist_favorites 
        WHERE user_id = v_user_id AND playlist_id = p_playlist_id
    ) INTO v_is_favorited;
    
    IF v_is_favorited THEN
        -- Remove from favorites
        DELETE FROM playlist_favorites 
        WHERE user_id = v_user_id AND playlist_id = p_playlist_id;
        RETURN FALSE;
    ELSE
        -- Add to favorites
        INSERT INTO playlist_favorites (user_id, playlist_id)
        VALUES (v_user_id, p_playlist_id);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. SET UP ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on playlist-related tables
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_favorites ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public playlists are viewable by everyone" ON playlists;
DROP POLICY IF EXISTS "Users can view own playlists" ON playlists;
DROP POLICY IF EXISTS "Users can manage own playlists" ON playlists;

-- Create new policies
CREATE POLICY "Public playlists are viewable by everyone" ON playlists
    FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view own playlists" ON playlists
    FOR SELECT USING (auth.uid() = producer_id);

CREATE POLICY "Users can manage own playlists" ON playlists
    FOR ALL USING (auth.uid() = producer_id);

-- Playlist tracks policies
DROP POLICY IF EXISTS "Playlist tracks are viewable for public playlists" ON playlist_tracks;
DROP POLICY IF EXISTS "Users can manage own playlist tracks" ON playlist_tracks;

CREATE POLICY "Playlist tracks are viewable for public playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.is_public = true
        )
    );

CREATE POLICY "Users can manage own playlist tracks" ON playlist_tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

-- Playlist favorites policies
DROP POLICY IF EXISTS "Users can view own favorites" ON playlist_favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON playlist_favorites;

CREATE POLICY "Users can view own favorites" ON playlist_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own favorites" ON playlist_favorites
    FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- 5. GRANT PERMISSIONS
-- ============================================

GRANT EXECUTE ON FUNCTION get_user_favorited_playlists(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_playlist_favorite(UUID) TO authenticated;

-- ============================================
-- 6. VERIFICATION
-- ============================================

SELECT 'Database functions and policies updated successfully!' as status;

-- Test the functions
SELECT 'Testing get_user_favorited_playlists function...' as test;
SELECT COUNT(*) as function_test_result FROM get_user_favorited_playlists(10);

SELECT 'Testing toggle_playlist_favorite function...' as test;
-- This will only work if there's a valid playlist_id to test with
