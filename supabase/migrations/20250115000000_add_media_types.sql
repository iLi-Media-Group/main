-- Add media types table for Deep Media Search feature
CREATE TABLE IF NOT EXISTS media_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL, -- 'video', 'audio', 'digital', 'other'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add media type associations table
CREATE TABLE IF NOT EXISTS track_media_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    media_type_id UUID NOT NULL REFERENCES media_types(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(track_id, media_type_id)
);

-- Insert default media types
INSERT INTO media_types (name, description, category) VALUES
-- Video Media
('TV Shows', 'Television series and programs', 'video'),
('Films', 'Feature films and movies', 'video'),
('Commercials', 'Advertising and promotional content', 'video'),
('Documentaries', 'Non-fiction film content', 'video'),
('Music Videos', 'Music video productions', 'video'),
('YouTube', 'YouTube videos and content', 'video'),
('TikTok', 'TikTok videos and short-form content', 'video'),
('Instagram', 'Instagram video content', 'video'),
('Social Media', 'Other social media video content', 'video'),

-- Audio Media
('Podcasts', 'Podcast episodes and series', 'audio'),
('Radio', 'Radio broadcasts and programming', 'audio'),
('Audiobooks', 'Audio book productions', 'audio'),
('Voice-overs', 'Voice-over and narration work', 'audio'),
('Background Music', 'Background and ambient audio', 'audio'),

-- Digital Media
('Video Games', 'Video game soundtracks and audio', 'digital'),
('Apps', 'Mobile and web application audio', 'digital'),
('Websites', 'Website background music and audio', 'digital'),
('Presentations', 'Presentation and slideshow audio', 'digital'),

-- Other Media
('Live Events', 'Live performances and events', 'other'),
('Corporate', 'Corporate and business content', 'other'),
('Educational', 'Educational and training content', 'other'),
('Sports', 'Sports and athletic content', 'other'),
('News', 'News and current events content', 'other');

-- Add RLS policies for media_types
ALTER TABLE media_types ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read media types
CREATE POLICY "Allow read access to media types" ON media_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can modify media types
CREATE POLICY "Allow admin access to media types" ON media_types
    FOR ALL USING (auth.uid() IN (
        SELECT id FROM profiles WHERE account_type = 'admin'
    ));

-- Add RLS policies for track_media_types
ALTER TABLE track_media_types ENABLE ROW LEVEL SECURITY;

-- Allow track owners and admins to manage their track media types
CREATE POLICY "Allow track owners to manage media types" ON track_media_types
    FOR ALL USING (
        auth.uid() = (SELECT producer_id FROM tracks WHERE id = track_media_types.track_id)
        OR auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Allow clients with deep media search feature to read track media types
CREATE POLICY "Allow clients with deep media search to read track media types" ON track_media_types
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM white_label_features wlf
            JOIN profiles p ON p.id = wlf.client_id
            WHERE wlf.feature_name = 'deep_media_search'
            AND wlf.is_enabled = true
            AND p.id = auth.uid()
        )
        OR auth.uid() IN (SELECT id FROM profiles WHERE account_type = 'admin')
    );

-- Create indexes for performance
CREATE INDEX idx_track_media_types_track_id ON track_media_types(track_id);
CREATE INDEX idx_track_media_types_media_type_id ON track_media_types(media_type_id);
CREATE INDEX idx_media_types_category ON media_types(category);

-- Add function to get tracks with media types for clients with feature
CREATE OR REPLACE FUNCTION get_tracks_with_media_types(client_id UUID)
RETURNS TABLE (
    track_id UUID,
    title TEXT,
    producer_id UUID,
    media_types TEXT[]
) AS $$
BEGIN
    -- Check if client has deep media search feature enabled
    IF EXISTS (
        SELECT 1 FROM white_label_features 
        WHERE client_id = $1 
        AND feature_name = 'deep_media_search' 
        AND is_enabled = true
    ) THEN
        RETURN QUERY
        SELECT 
            t.id as track_id,
            t.title,
            t.producer_id,
            ARRAY_AGG(mt.name) as media_types
        FROM tracks t
        LEFT JOIN track_media_types tmt ON t.id = tmt.track_id
        LEFT JOIN media_types mt ON tmt.media_type_id = mt.id
        WHERE t.status = 'approved'
        GROUP BY t.id, t.title, t.producer_id;
    ELSE
        -- Return tracks without media types if feature not enabled
        RETURN QUERY
        SELECT 
            t.id as track_id,
            t.title,
            t.producer_id,
            ARRAY[]::TEXT[] as media_types
        FROM tracks t
        WHERE t.status = 'approved';
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 