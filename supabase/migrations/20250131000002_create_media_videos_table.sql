-- Create media_videos table for Perfect For Your Media section
CREATE TABLE IF NOT EXISTS media_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  media_type TEXT NOT NULL CHECK (media_type IN ('television', 'podcast', 'youtube', 'other')),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to document the table purpose
COMMENT ON TABLE media_videos IS 'Videos for the Perfect For Your Media carousel section on homepage';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_media_videos_active_order ON media_videos(is_active, display_order);

-- Insert some default videos
INSERT INTO media_videos (title, description, youtube_url, media_type, display_order) VALUES
('Television Show Example', 'Example of our music being used in television programming', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'television', 1),
('Podcast Feature', 'Our music featured in a popular podcast', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'podcast', 2),
('YouTube Creator', 'Content creator using our music in their videos', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 'youtube', 3);
