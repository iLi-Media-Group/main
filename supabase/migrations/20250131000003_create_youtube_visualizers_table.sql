-- Create youtube_visualizers table for YouTube Visualizers page
CREATE TABLE IF NOT EXISTS youtube_visualizers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  youtube_url TEXT NOT NULL,
  thumbnail_url TEXT,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to document the table purpose
COMMENT ON TABLE youtube_visualizers IS 'YouTube visualizer videos for the public YouTube Visualizers page';

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_youtube_visualizers_active_order ON youtube_visualizers(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_youtube_visualizers_track_id ON youtube_visualizers(track_id);

-- Insert some default visualizer videos
INSERT INTO youtube_visualizers (title, description, youtube_url, display_order) VALUES
('Visualizer Example 1', 'Example of our music with visual effects', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1),
('Visualizer Example 2', 'Another example of our music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 2),
('Visualizer Example 3', 'Third example of music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 3),
('Visualizer Example 4', 'Fourth example of music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 4),
('Visualizer Example 5', 'Fifth example of music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 5),
('Visualizer Example 6', 'Sixth example of music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 6),
('Visualizer Example 7', 'Seventh example of music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 7),
('Visualizer Example 8', 'Eighth example of music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 8),
('Visualizer Example 9', 'Ninth example of music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 9),
('Visualizer Example 10', 'Tenth example of music visualization', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 10);
