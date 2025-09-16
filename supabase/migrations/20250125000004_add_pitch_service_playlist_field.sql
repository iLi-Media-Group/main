-- Add pitch service identification to playlists table
-- This allows us to identify playlists created for pitch services and show agent contact info

-- Add is_pitch_service field to playlists table
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS is_pitch_service BOOLEAN DEFAULT false;

-- Add pitch_service_agent_id field to store the agent who created the pitch service playlist
ALTER TABLE playlists 
ADD COLUMN IF NOT EXISTS pitch_service_agent_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for better performance when querying pitch service playlists
CREATE INDEX IF NOT EXISTS idx_playlists_pitch_service ON playlists(is_pitch_service) WHERE is_pitch_service = true;

-- Add comment for documentation
COMMENT ON COLUMN playlists.is_pitch_service IS 'Indicates if this playlist was created for pitch services';
COMMENT ON COLUMN playlists.pitch_service_agent_id IS 'ID of the agent/admin who created this pitch service playlist';
