-- Create Playlist Favorites System
-- Run this in Supabase SQL Editor to add playlist favoriting functionality

-- Create the playlist_favorites table
CREATE TABLE IF NOT EXISTS playlist_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, playlist_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlist_favorites_user_id ON playlist_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_favorites_playlist_id ON playlist_favorites(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_favorites_favorited_at ON playlist_favorites(favorited_at);

-- Enable RLS
ALTER TABLE playlist_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own playlist favorites" ON playlist_favorites;
DROP POLICY IF EXISTS "Users can manage their own playlist favorites" ON playlist_favorites;

CREATE POLICY "Users can view their own playlist favorites" ON playlist_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own playlist favorites" ON playlist_favorites
    FOR ALL USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT ALL ON playlist_favorites TO authenticated;

-- Create function to toggle playlist favorite
CREATE OR REPLACE FUNCTION toggle_playlist_favorite(p_playlist_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User not authenticated';
    END IF;
    
    -- Check if playlist exists and is public
    IF NOT EXISTS (SELECT 1 FROM playlists WHERE id = p_playlist_id AND is_public = true) THEN
        RAISE EXCEPTION 'Playlist not found or not public';
    END IF;
    
    -- Check if already favorited
    SELECT EXISTS(SELECT 1 FROM playlist_favorites WHERE user_id = v_user_id AND playlist_id = p_playlist_id) INTO v_exists;
    
    IF v_exists THEN
        -- Remove from favorites
        DELETE FROM playlist_favorites WHERE user_id = v_user_id AND playlist_id = p_playlist_id;
        RETURN FALSE;
    ELSE
        -- Add to favorites
        INSERT INTO playlist_favorites (user_id, playlist_id) VALUES (v_user_id, p_playlist_id);
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION toggle_playlist_favorite(UUID) TO authenticated;

-- Create function to get user's favorited playlists
CREATE OR REPLACE FUNCTION get_user_favorited_playlists(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    playlist_id UUID,
    playlist_name TEXT,
    playlist_description TEXT,
    producer_name TEXT,
    tracks_count BIGINT,
    favorited_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
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
    WHERE pf.user_id = auth.uid()
    AND p.is_public = true
    ORDER BY pf.favorited_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_user_favorited_playlists(INTEGER) TO authenticated;

-- Verify the setup
SELECT 'Playlist favorites system created successfully' as status;
