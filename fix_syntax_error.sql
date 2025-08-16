-- Fix RPC Functions with Correct Syntax
-- Run this in Supabase SQL Editor

-- Create or replace get_user_followed_producers function
CREATE OR REPLACE FUNCTION get_user_followed_producers(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    producer_id UUID,
    producer_name TEXT,
    producer_email TEXT,
    company_name TEXT,
    avatar_path TEXT,
    total_tracks INTEGER,
    followed_at TIMESTAMP WITH TIME ZONE,
    email_notifications_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    v_user_id := auth.uid();
    
    IF v_user_id IS NULL THEN
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        p.id as producer_id,
        CONCAT(p.first_name, ' ', p.last_name) as producer_name,
        p.email as producer_email,
        p.company_name,
        p.avatar_path,
        COALESCE(track_stats.total_tracks, 0) as total_tracks,
        pf.followed_at,
        pf.email_notifications_enabled
    FROM producer_follows pf
    JOIN profiles p ON pf.producer_id = p.id
    LEFT JOIN (
        SELECT 
            track_producer_id,
            COUNT(*) as total_tracks
        FROM tracks
        WHERE deleted_at IS NULL
        GROUP BY track_producer_id
    ) track_stats ON p.id = track_stats.track_producer_id
    WHERE pf.follower_id = v_user_id
    ORDER BY pf.followed_at DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_followed_producers(INTEGER) TO authenticated;

-- Create or replace get_user_favorited_playlists function
CREATE OR REPLACE FUNCTION get_user_favorited_playlists(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    playlist_id UUID,
    playlist_name TEXT,
    playlist_description TEXT,
    producer_name TEXT,
    tracks_count BIGINT,
    favorited_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_favorited_playlists(INTEGER) TO authenticated;

-- Test the functions
SELECT 'Testing functions...' as info;

-- Test get_user_followed_producers
SELECT 
    'get_user_followed_producers test:' as test,
    COUNT(*) as result_count
FROM get_user_followed_producers(10);

-- Test get_user_favorited_playlists
SELECT 
    'get_user_favorited_playlists test:' as test,
    COUNT(*) as result_count
FROM get_user_favorited_playlists(10);

SELECT 'Functions created and tested successfully!' as status;
