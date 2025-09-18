-- Fix Missing RPC Functions
-- Run this in Supabase SQL Editor to create the missing functions

-- First, let's check if the producer_follows table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'producer_follows') THEN
        -- Create producer_follows table if it doesn't exist
        CREATE TABLE producer_follows (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            email_notifications_enabled BOOLEAN DEFAULT false,
            followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(follower_id, producer_id)
        );
        
        -- Create indexes
        CREATE INDEX idx_producer_follows_follower_id ON producer_follows(follower_id);
        CREATE INDEX idx_producer_follows_producer_id ON producer_follows(producer_id);
        CREATE INDEX idx_producer_follows_followed_at ON producer_follows(followed_at);
        CREATE INDEX idx_producer_follows_email_enabled ON producer_follows(email_notifications_enabled);
        
        -- Enable RLS
        ALTER TABLE producer_follows ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can view their own follows" ON producer_follows
            FOR SELECT USING (auth.uid() = follower_id);
        
        CREATE POLICY "Users can manage their own follows" ON producer_follows
            FOR ALL USING (auth.uid() = follower_id);
        
        CREATE POLICY "Producers can view their followers" ON producer_follows
            FOR SELECT USING (auth.uid() = producer_id);
        
        -- Grant permissions
        GRANT ALL ON producer_follows TO authenticated;
        
        RAISE NOTICE 'Created producer_follows table';
    ELSE
        RAISE NOTICE 'producer_follows table already exists';
    END IF;
END $$;

-- Create or replace the get_user_followed_producers function
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

-- Create or replace the toggle_producer_follow function
CREATE OR REPLACE FUNCTION toggle_producer_follow(p_producer_id UUID, p_enable_email_notifications BOOLEAN DEFAULT false)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_follower_id UUID;
    v_existing_follow UUID;
    v_is_following BOOLEAN;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Get follower profile ID (client)
    SELECT id INTO v_follower_id
    FROM profiles
    WHERE id = v_user_id AND account_type = 'client';
    
    IF v_follower_id IS NULL THEN
        RAISE EXCEPTION 'Only clients can follow producers';
    END IF;
    
    -- Check if already following
    SELECT id INTO v_existing_follow
    FROM producer_follows
    WHERE follower_id = v_follower_id AND producer_id = p_producer_id;
    
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
        VALUES (v_follower_id, p_producer_id, p_enable_email_notifications);
        v_is_following := true;
    END IF;
    
    RETURN v_is_following;
END;
$$;

-- Create or replace the unfollow_producer function
CREATE OR REPLACE FUNCTION unfollow_producer(p_producer_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_follower_id UUID;
    v_deleted_count INTEGER;
BEGIN
    -- Get current user ID
    v_user_id := auth.uid();
    
    -- Get follower profile ID (client)
    SELECT id INTO v_follower_id
    FROM profiles
    WHERE id = v_user_id AND account_type = 'client';
    
    IF v_follower_id IS NULL THEN
        RAISE EXCEPTION 'Only clients can unfollow producers';
    END IF;
    
    -- Delete the follow
    DELETE FROM producer_follows
    WHERE follower_id = v_follower_id AND producer_id = p_producer_id;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count > 0;
END;
$$;

-- Create or replace the is_following_producer function
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

-- Create or replace the get_producer_followers function
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION toggle_producer_follow(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_producer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_followed_producers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_producer_followers(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_following_producer(UUID) TO authenticated;

-- Check if playlist_favorites table exists and create get_user_favorited_playlists function
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'playlist_favorites') THEN
        -- Create playlist_favorites table if it doesn't exist
        CREATE TABLE playlist_favorites (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
            favorited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id, playlist_id)
        );
        
        -- Create indexes
        CREATE INDEX idx_playlist_favorites_user_id ON playlist_favorites(user_id);
        CREATE INDEX idx_playlist_favorites_playlist_id ON playlist_favorites(playlist_id);
        CREATE INDEX idx_playlist_favorites_favorited_at ON playlist_favorites(favorited_at);
        
        -- Enable RLS
        ALTER TABLE playlist_favorites ENABLE ROW LEVEL SECURITY;
        
        -- Create RLS policies
        CREATE POLICY "Users can manage their own favorites" ON playlist_favorites
            FOR ALL USING (auth.uid() = user_id);
        
        -- Grant permissions
        GRANT ALL ON playlist_favorites TO authenticated;
        
        RAISE NOTICE 'Created playlist_favorites table';
    ELSE
        RAISE NOTICE 'playlist_favorites table already exists';
    END IF;
END $$;

-- Create or replace the get_user_favorited_playlists function
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

-- Create or replace the toggle_playlist_favorite function
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

-- Verify the functions were created
SELECT 'RPC functions created successfully' as status;
