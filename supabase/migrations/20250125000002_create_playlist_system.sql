-- Create Playlist System for Music Supervisors
-- This system allows producers to create and share playlists with music supervisors

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    company_name VARCHAR(255),
    logo_url TEXT,
    photo_url TEXT,
    is_public BOOLEAN DEFAULT true,
    slug VARCHAR(100) UNIQUE NOT NULL, -- User-friendly URL slug
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create playlist_tracks junction table
CREATE TABLE IF NOT EXISTS playlist_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0, -- For ordering tracks
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(playlist_id, track_id)
);

-- Create playlist_views table for analytics
CREATE TABLE IF NOT EXISTS playlist_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
    viewer_ip INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_playlists_producer_id ON playlists(producer_id);
CREATE INDEX IF NOT EXISTS idx_playlists_slug ON playlists(slug);
CREATE INDEX IF NOT EXISTS idx_playlists_public ON playlists(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist_id ON playlist_tracks(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_track_id ON playlist_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_playlist_tracks_position ON playlist_tracks(playlist_id, position);
CREATE INDEX IF NOT EXISTS idx_playlist_views_playlist_id ON playlist_views(playlist_id);

-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for playlists
CREATE POLICY "Producers can manage their own playlists" ON playlists
    FOR ALL USING (auth.uid() = producer_id);

CREATE POLICY "Anyone can view public playlists" ON playlists
    FOR SELECT USING (is_public = true);

-- RLS Policies for playlist_tracks
CREATE POLICY "Producers can manage tracks in their playlists" ON playlist_tracks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

CREATE POLICY "Anyone can view tracks in public playlists" ON playlist_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_tracks.playlist_id 
            AND playlists.is_public = true
        )
    );

-- RLS Policies for playlist_views (allow anonymous views)
CREATE POLICY "Allow anonymous playlist views" ON playlist_views
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Producers can view analytics for their playlists" ON playlist_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM playlists 
            WHERE playlists.id = playlist_views.playlist_id 
            AND playlists.producer_id = auth.uid()
        )
    );

-- Function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_playlist_slug(playlist_name TEXT, producer_id UUID)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convert name to slug format
    base_slug := lower(regexp_replace(playlist_name, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '\s+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    -- If empty after processing, use default
    IF base_slug = '' THEN
        base_slug := 'playlist';
    END IF;
    
    final_slug := base_slug;
    
    -- Check if slug exists and append number if needed
    WHILE EXISTS (SELECT 1 FROM playlists WHERE slug = final_slug AND producer_id = playlists.producer_id) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_playlist_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_playlist_updated_at
    BEFORE UPDATE ON playlists
    FOR EACH ROW
    EXECUTE FUNCTION update_playlist_updated_at();
