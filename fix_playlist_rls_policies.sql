-- Fix missing RLS policies for public playlist access
-- This adds the missing policies that allow anyone to view public playlists

-- Add policy for viewing public playlists
DROP POLICY IF EXISTS "Anyone can view public playlists" ON playlists;
CREATE POLICY "Anyone can view public playlists" ON playlists
    FOR SELECT USING (is_public = true);

-- Add policy for viewing tracks in public playlists
DROP POLICY IF EXISTS "Anyone can view tracks in public playlists" ON playlist_tracks;
CREATE POLICY "Anyone can view tracks in public playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.is_public = true
        )
    );

-- Add service role policy for playlists (if not exists)
DROP POLICY IF EXISTS "Service role can access all playlists" ON playlists;
CREATE POLICY "Service role can access all playlists" ON playlists
    FOR ALL USING (auth.role() = 'service_role');

-- Add service role policy for playlist_tracks (if not exists)
DROP POLICY IF EXISTS "Service role can access all playlist tracks" ON playlist_tracks;
CREATE POLICY "Service role can access all playlist tracks" ON playlist_tracks
    FOR ALL USING (auth.role() = 'service_role');

-- Verify the policies are working by testing a query
-- This should return the public playlist
SELECT 
    p.id,
    p.name,
    p.slug,
    p.is_public,
    p.creator_type,
    p.producer_id
FROM playlists p
WHERE p.slug = 'john-sama/test-list'
AND p.is_public = true;
