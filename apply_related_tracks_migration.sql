-- Apply related_tracks migration directly
-- This creates the related_tracks table and its RLS policies

-- Create related_tracks table
CREATE TABLE IF NOT EXISTS related_tracks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    related_track_id UUID REFERENCES tracks(id) ON DELETE CASCADE,
    relationship_type TEXT DEFAULT 'related' CHECK (relationship_type IN ('related', 'radio_version', 'instrumental', 'vocal_version', 'chorus_only', 'clean_version', 'explicit_version')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure a track can't be related to itself
    CONSTRAINT no_self_relation CHECK (track_id != related_track_id),
    
    -- Ensure unique relationships (no duplicate relationships between same tracks)
    CONSTRAINT unique_relationship UNIQUE (track_id, related_track_id)
);

-- Enable RLS on related_tracks
ALTER TABLE related_tracks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for related_tracks
-- Users can view related tracks for tracks they own or tracks that are public
DROP POLICY IF EXISTS "Users can view related tracks" ON related_tracks;
CREATE POLICY "Users can view related tracks" ON related_tracks
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = related_tracks.track_id 
            AND (tracks.track_producer_id = auth.uid() OR tracks.deleted_at IS NULL)
        )
    );

-- Users can insert related tracks for tracks they own
DROP POLICY IF EXISTS "Users can insert related tracks" ON related_tracks;
CREATE POLICY "Users can insert related tracks" ON related_tracks
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = related_tracks.track_id 
            AND tracks.track_producer_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = related_tracks.related_track_id 
            AND tracks.track_producer_id = auth.uid()
        )
    );

-- Users can update related tracks for tracks they own
DROP POLICY IF EXISTS "Users can update related tracks" ON related_tracks;
CREATE POLICY "Users can update related tracks" ON related_tracks
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = related_tracks.track_id 
            AND tracks.track_producer_id = auth.uid()
        )
    );

-- Users can delete related tracks for tracks they own
DROP POLICY IF EXISTS "Users can delete related tracks" ON related_tracks;
CREATE POLICY "Users can delete related tracks" ON related_tracks
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM tracks 
            WHERE tracks.id = related_tracks.track_id 
            AND tracks.track_producer_id = auth.uid()
        )
    );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_related_tracks_track_id ON related_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_related_tracks_related_track_id ON related_tracks(related_track_id);
CREATE INDEX IF NOT EXISTS idx_related_tracks_relationship_type ON related_tracks(relationship_type);

-- Add comments for documentation
COMMENT ON TABLE related_tracks IS 'Stores relationships between tracks (e.g., radio versions, instrumentals, etc.)';
COMMENT ON COLUMN related_tracks.relationship_type IS 'Type of relationship between tracks';
COMMENT ON COLUMN related_tracks.track_id IS 'The main track that has related tracks';
COMMENT ON COLUMN related_tracks.related_track_id IS 'The related track';
