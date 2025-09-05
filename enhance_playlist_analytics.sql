-- Enhance Playlist Analytics System
-- Run this in Supabase SQL Editor to add more comprehensive analytics tracking

-- Add additional columns to playlist_views table for better analytics
ALTER TABLE playlist_views 
ADD COLUMN IF NOT EXISTS referrer TEXT,
ADD COLUMN IF NOT EXISTS user_agent TEXT,
ADD COLUMN IF NOT EXISTS device_type TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS time_on_page INTEGER DEFAULT 0, -- in seconds
ADD COLUMN IF NOT EXISTS tracks_played INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_duration INTEGER DEFAULT 0; -- in seconds

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_playlist_views_analytics 
ON playlist_views(playlist_id, viewed_at, viewer_ip, device_type, country);

-- Create a function to update device type based on user agent
CREATE OR REPLACE FUNCTION update_device_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Determine device type based on user agent
  IF NEW.user_agent IS NOT NULL THEN
    IF NEW.user_agent ILIKE '%mobile%' OR NEW.user_agent ILIKE '%android%' OR NEW.user_agent ILIKE '%iphone%' THEN
      NEW.device_type := 'Mobile';
    ELSIF NEW.user_agent ILIKE '%tablet%' OR NEW.user_agent ILIKE '%ipad%' THEN
      NEW.device_type := 'Tablet';
    ELSE
      NEW.device_type := 'Desktop';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set device type
DROP TRIGGER IF EXISTS trigger_update_device_type ON playlist_views;
CREATE TRIGGER trigger_update_device_type
  BEFORE INSERT ON playlist_views
  FOR EACH ROW
  EXECUTE FUNCTION update_device_type();

-- Create a function to get playlist analytics with enhanced data
CREATE OR REPLACE FUNCTION get_playlist_analytics(
  p_playlist_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_views BIGINT,
  unique_visitors BIGINT,
  total_track_plays BIGINT,
  avg_time_on_page NUMERIC,
  views_by_day JSON,
  track_plays JSON,
  views_by_hour JSON,
  top_referrers JSON,
  device_types JSON,
  countries JSON
) AS $$
DECLARE
  start_date TIMESTAMP;
BEGIN
  start_date := NOW() - INTERVAL '1 day' * p_days;
  
  RETURN QUERY
  WITH view_stats AS (
    SELECT 
      COUNT(*) as total_views,
      COUNT(DISTINCT viewer_ip) as unique_visitors,
      COALESCE(SUM(tracks_played), 0) as total_track_plays,
      COALESCE(AVG(time_on_page), 0) as avg_time_on_page
    FROM playlist_views 
    WHERE playlist_id = p_playlist_id 
    AND viewed_at >= start_date
  ),
  daily_views AS (
    SELECT 
      DATE(viewed_at) as date,
      COUNT(*) as views
    FROM playlist_views 
    WHERE playlist_id = p_playlist_id 
    AND viewed_at >= start_date
    GROUP BY DATE(viewed_at)
    ORDER BY date
  ),
  hourly_views AS (
    SELECT 
      EXTRACT(HOUR FROM viewed_at) as hour,
      COUNT(*) as views
    FROM playlist_views 
    WHERE playlist_id = p_playlist_id 
    AND viewed_at >= start_date
    GROUP BY EXTRACT(HOUR FROM viewed_at)
    ORDER BY hour
  ),
  referrer_stats AS (
    SELECT 
      COALESCE(referrer, 'Direct') as source,
      COUNT(*) as views
    FROM playlist_views 
    WHERE playlist_id = p_playlist_id 
    AND viewed_at >= start_date
    GROUP BY referrer
    ORDER BY views DESC
    LIMIT 10
  ),
  device_stats AS (
    SELECT 
      COALESCE(device_type, 'Unknown') as device,
      COUNT(*) as views
    FROM playlist_views 
    WHERE playlist_id = p_playlist_id 
    AND viewed_at >= start_date
    GROUP BY device_type
    ORDER BY views DESC
  ),
  country_stats AS (
    SELECT 
      COALESCE(country, 'Unknown') as country,
      COUNT(*) as views
    FROM playlist_views 
    WHERE playlist_id = p_playlist_id 
    AND viewed_at >= start_date
    GROUP BY country
    ORDER BY views DESC
    LIMIT 10
  )
  SELECT 
    vs.total_views,
    vs.unique_visitors,
    vs.total_track_plays,
    vs.avg_time_on_page,
    (SELECT json_agg(json_build_object('date', date, 'views', views)) FROM daily_views),
    '[]'::json, -- Track plays will be implemented separately
    (SELECT json_agg(json_build_object('hour', hour::text, 'views', views)) FROM hourly_views),
    (SELECT json_agg(json_build_object('source', source, 'views', views)) FROM referrer_stats),
    (SELECT json_agg(json_build_object('device', device, 'views', views)) FROM device_stats),
    (SELECT json_agg(json_build_object('country', country, 'views', views)) FROM country_stats)
  FROM view_stats vs;
END;
$$ LANGUAGE plpgsql;

-- Create a function to record track plays (for future implementation)
CREATE OR REPLACE FUNCTION record_track_play(
  p_playlist_id UUID,
  p_track_id UUID,
  p_viewer_ip INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Update the most recent view for this IP and playlist
  UPDATE playlist_views 
  SET tracks_played = tracks_played + 1
  WHERE playlist_id = p_playlist_id 
  AND viewer_ip = p_viewer_ip
  AND viewed_at >= NOW() - INTERVAL '1 hour'
  ORDER BY viewed_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_playlist_analytics(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION record_track_play(UUID, UUID, INET) TO authenticated;

-- Verify the enhancements
SELECT 'Playlist Analytics Enhanced' as status;
