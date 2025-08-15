-- Fix Data Type Mismatch in RPC Functions
-- Run this in Supabase SQL Editor

-- Drop the existing function first (required for return type changes)
DROP FUNCTION IF EXISTS get_user_followed_producers(INTEGER);

-- Create get_user_followed_producers function with correct data types
CREATE OR REPLACE FUNCTION get_user_followed_producers(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    producer_id UUID,
    producer_name TEXT,
    producer_email TEXT,
    company_name TEXT,
    avatar_path TEXT,
    total_tracks BIGINT,  -- Changed from INTEGER to BIGINT
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

-- Test the function
SELECT 
    'get_user_followed_producers test:' as test,
    COUNT(*) as result_count
FROM get_user_followed_producers(10);

SELECT 'Data type mismatch fixed successfully!' as status;
