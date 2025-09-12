-- Create Producer Follows System
-- This system allows clients to follow producers and receive email notifications

-- Create producer_follows table
CREATE TABLE IF NOT EXISTS producer_follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email_notifications_enabled BOOLEAN DEFAULT false,
    followed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique follow relationship
    UNIQUE(follower_id, producer_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_producer_follows_follower_id ON producer_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_producer_follows_producer_id ON producer_follows(producer_id);
CREATE INDEX IF NOT EXISTS idx_producer_follows_followed_at ON producer_follows(followed_at);
CREATE INDEX IF NOT EXISTS idx_producer_follows_email_enabled ON producer_follows(email_notifications_enabled);

-- Enable RLS
ALTER TABLE producer_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for producer_follows
DROP POLICY IF EXISTS "Users can view their own follows" ON producer_follows;
DROP POLICY IF EXISTS "Users can manage their own follows" ON producer_follows;
DROP POLICY IF EXISTS "Producers can view their followers" ON producer_follows;

CREATE POLICY "Users can view their own follows" ON producer_follows
    FOR SELECT USING (auth.uid() = follower_id);

CREATE POLICY "Users can manage their own follows" ON producer_follows
    FOR ALL USING (auth.uid() = follower_id);

CREATE POLICY "Producers can view their followers" ON producer_follows
    FOR SELECT USING (auth.uid() = producer_id);

-- Grant permissions
GRANT ALL ON producer_follows TO authenticated;

-- Function to toggle follow status
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

-- Function to unfollow a producer
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

-- Function to get user's followed producers
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

-- Function to get producer's followers
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

-- Function to check if user is following a producer
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION toggle_producer_follow(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION unfollow_producer(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_followed_producers(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_producer_followers(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_following_producer(UUID) TO authenticated;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_producer_follows_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_producer_follows_updated_at
    BEFORE UPDATE ON producer_follows
    FOR EACH ROW
    EXECUTE FUNCTION update_producer_follows_updated_at();

-- Insert sample data for testing (optional)
-- INSERT INTO producer_follows (follower_id, producer_id, email_notifications_enabled)
-- SELECT 
--     (SELECT id FROM profiles WHERE account_type = 'client' LIMIT 1),
--     (SELECT id FROM profiles WHERE account_type = 'producer' LIMIT 1),
--     true
-- WHERE EXISTS (SELECT 1 FROM profiles WHERE account_type = 'client')
--   AND EXISTS (SELECT 1 FROM profiles WHERE account_type = 'producer');

SELECT 'Producer follows system created successfully' as status;
