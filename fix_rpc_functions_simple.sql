-- Simplified RPC Functions Fix
-- Run this in Supabase SQL Editor to fix the 400 errors

-- Create or replace the get_user_followed_producers function (simplified)
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
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Return empty result if no user
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

-- Create or replace the toggle_producer_follow function (simplified)
CREATE OR REPLACE FUNCTION toggle_producer_follow(p_producer_id UUID, p_enable_email_notifications BOOLEAN DEFAULT false)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_existing_follow UUID;
    v_is_following BOOLEAN;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Return false if no user
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if already following
    SELECT id INTO v_existing_follow
    FROM producer_follows
    WHERE follower_id = v_user_id AND producer_id = p_producer_id;
    
    IF v_existing_follow IS NOT NULL THEN
        -- Update email notification preference
        UPDATE producer_follows
        SET email_notifications_enabled = p_enable_email_notifications,
            updated_at = NOW()
        WHERE id = v_existing_follow;
        v_is_following := true;
    ELSE
        -- Add new follow
        INSERT INTO producer_follows (follower_id, producer_id, email_notifications_enabled)
        VALUES (v_user_id, p_producer_id, p_enable_email_notifications);
        v_is_following := true;
    END IF;
    
    RETURN v_is_following;
END;
$$;

-- Create or replace the unfollow_producer function (simplified)
CREATE OR REPLACE FUNCTION unfollow_producer(p_producer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_deleted_count INTEGER;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Return false if no user
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Delete the follow
    DELETE FROM producer_follows
    WHERE follower_id = v_user_id AND producer_id = p_producer_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count > 0;
END;
$$;

-- Create or replace the is_following_producer function (simplified)
CREATE OR REPLACE FUNCTION is_following_producer(p_producer_id UUID)
RETURNS TABLE (
    is_following BOOLEAN,
    email_notifications_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Return false if no user
    IF v_user_id IS NULL THEN
        RETURN QUERY SELECT false as is_following, false as email_notifications_enabled;
        RETURN;
    END IF;
    
    RETURN QUERY
    SELECT 
        true as is_following,
        pf.email_notifications_enabled
    FROM producer_follows pf
    WHERE pf.follower_id = v_user_id AND pf.producer_id = p_producer_id;
    
    -- If no results, return false
    IF NOT FOUND THEN
        RETURN QUERY SELECT false as is_following, false as email_notifications_enabled;
    END IF;
END;
$$;

-- Create or replace the get_producer_followers function (simplified)
CREATE OR REPLACE FUNCTION get_producer_followers(p_producer_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    follower_id UUID,
    follower_name TEXT,
    follower_email TEXT,
    followed_at TIMESTAMP WITH TIME ZONE,
    email_notifications_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as follower_id,
        CONCAT(p.first_name, ' ', p.last_name) as follower_name,
        p.email as follower_email,
        pf.followed_at,
        pf.email_notifications_enabled
    FROM producer_follows pf
    JOIN profiles p ON pf.follower_id = p.id
    WHERE pf.producer_id = p_producer_id
    ORDER BY pf.followed_at DESC
    LIMIT p_limit;
END;
$$;

-- Create or replace the get_user_favorited_playlists function (simplified)
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
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Return empty result if no user
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

-- Create or replace the toggle_playlist_favorite function (simplified)
CREATE OR REPLACE FUNCTION toggle_playlist_favorite(p_playlist_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Return false if no user
    IF v_user_id IS NULL THEN
        RETURN false;
    END IF;
    
    -- Check if playlist exists and is public
    IF NOT EXISTS (SELECT 1 FROM playlists WHERE id = p_playlist_id AND is_public = true) THEN
        RETURN false;
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION toggle_producer_follow(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_producer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_followed_producers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_producer_followers(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_following_producer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_favorited_playlists(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_playlist_favorite(UUID) TO authenticated;

-- Verify the functions were created
SELECT 'Simplified RPC functions created successfully' as status;

