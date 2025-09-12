-- Add Playlist Favorites System
-- Run this in Supabase SQL Editor to add the missing playlist favorites functionality

-- Create playlist_favorites table
CREATE TABLE IF NOT EXISTS playlist_favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
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

-- RLS Policies for playlist_favorites
DROP POLICY IF EXISTS "Users can manage their own favorites" ON playlist_favorites;
CREATE POLICY "Users can manage their own favorites" ON playlist_favorites
    FOR ALL USING (auth.uid() = user_id);

-- RPC Function to get user's favorited playlists
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
        CONCAT(prof.first_name, ' ', prof.last_name) as producer_name,
        COUNT(pt.id) as tracks_count,
        pf.favorited_at
    FROM playlist_favorites pf
    JOIN playlists p ON pf.playlist_id = p.id
    JOIN profiles prof ON p.producer_id = prof.id
    LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
    WHERE pf.user_id = auth.uid()
    GROUP BY p.id, p.name, p.description, prof.first_name, prof.last_name, pf.favorited_at
    ORDER BY pf.favorited_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC Function to toggle playlist favorite status
CREATE OR REPLACE FUNCTION toggle_playlist_favorite(p_playlist_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    existing_favorite UUID;
    is_favorited BOOLEAN;
BEGIN
    -- Check if playlist exists and is public
    IF NOT EXISTS (SELECT 1 FROM playlists WHERE id = p_playlist_id AND is_public = true) THEN
        RAISE EXCEPTION 'Playlist not found or not public';
    END IF;

    -- Check if user already favorited this playlist
    SELECT id INTO existing_favorite
    FROM playlist_favorites
    WHERE user_id = auth.uid() AND playlist_id = p_playlist_id;

    IF existing_favorite IS NOT NULL THEN
        -- Remove from favorites
        DELETE FROM playlist_favorites
        WHERE user_id = auth.uid() AND playlist_id = p_playlist_id;
        is_favorited := false;
    ELSE
        -- Add to favorites
        INSERT INTO playlist_favorites (user_id, playlist_id)
        VALUES (auth.uid(), p_playlist_id);
        is_favorited := true;
    END IF;

    RETURN is_favorited;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the table and functions were created
SELECT 'Playlist Favorites' as table_name, COUNT(*) as count FROM playlist_favorites;
