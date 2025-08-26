-- Comprehensive tracks table schema fix
-- This migration ensures all necessary columns exist for track uploads

-- Add missing columns that might not exist
ALTER TABLE tracks 
ADD COLUMN IF NOT EXISTS work_for_hire_contracts TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS contains_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contains_samples BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS contains_splice_loops BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS samples_cleared BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sample_clearance_notes TEXT,
ADD COLUMN IF NOT EXISTS master_rights_owner TEXT,
ADD COLUMN IF NOT EXISTS publishing_rights_owner TEXT,
ADD COLUMN IF NOT EXISTS participants JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS co_signers JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS rights_holder_name TEXT,
ADD COLUMN IF NOT EXISTS rights_holder_type TEXT CHECK (rights_holder_type IN ('producer', 'record_label', 'publisher', 'other')),
ADD COLUMN IF NOT EXISTS rights_holder_email TEXT,
ADD COLUMN IF NOT EXISTS rights_holder_phone TEXT,
ADD COLUMN IF NOT EXISTS rights_holder_address TEXT,
ADD COLUMN IF NOT EXISTS rights_declaration_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_clean_version BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS clean_version_of TEXT,
ADD COLUMN IF NOT EXISTS explicit_lyrics BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lyrics TEXT,
ADD COLUMN IF NOT EXISTS has_sting_ending BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_one_stop BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_vocals BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_sync_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instruments TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS media_usage TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS trackouts_url TEXT,
ADD COLUMN IF NOT EXISTS stems_url TEXT,
ADD COLUMN IF NOT EXISTS split_sheet_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN tracks.work_for_hire_contracts IS 'Array of URLs to work for hire contract PDF files';
COMMENT ON COLUMN tracks.contains_loops IS 'Whether the track contains loops';
COMMENT ON COLUMN tracks.contains_samples IS 'Whether the track contains samples';
COMMENT ON COLUMN tracks.contains_splice_loops IS 'Whether the track contains Splice loops';
COMMENT ON COLUMN tracks.samples_cleared IS 'Whether all samples are cleared';
COMMENT ON COLUMN tracks.sample_clearance_notes IS 'Notes about sample clearance';
COMMENT ON COLUMN tracks.master_rights_owner IS 'Owner of master rights';
COMMENT ON COLUMN tracks.publishing_rights_owner IS 'Owner of publishing rights';
COMMENT ON COLUMN tracks.participants IS 'JSON array of track participants';
COMMENT ON COLUMN tracks.co_signers IS 'JSON array of co-signers';
COMMENT ON COLUMN tracks.rights_holder_name IS 'Name of the rights holder';
COMMENT ON COLUMN tracks.rights_holder_type IS 'Type of rights holder';
COMMENT ON COLUMN tracks.rights_holder_email IS 'Email of the rights holder';
COMMENT ON COLUMN tracks.rights_holder_phone IS 'Phone of the rights holder';
COMMENT ON COLUMN tracks.rights_holder_address IS 'Address of the rights holder';
COMMENT ON COLUMN tracks.rights_declaration_accepted IS 'Whether rights declaration was accepted';
COMMENT ON COLUMN tracks.is_clean_version IS 'Whether this is a clean version of an explicit song';
COMMENT ON COLUMN tracks.clean_version_of IS 'ID of the explicit version this clean version is based on';
COMMENT ON COLUMN tracks.explicit_lyrics IS 'Whether the track contains explicit lyrics';
COMMENT ON COLUMN tracks.lyrics IS 'Song lyrics text';
COMMENT ON COLUMN tracks.has_sting_ending IS 'Whether the track has a sting ending';
COMMENT ON COLUMN tracks.is_one_stop IS 'Whether this is a one-stop track';
COMMENT ON COLUMN tracks.has_vocals IS 'Whether the track contains vocals';
COMMENT ON COLUMN tracks.is_sync_only IS 'Whether this track is sync-only (not for regular licensing)';
COMMENT ON COLUMN tracks.instruments IS 'Array of instruments used in the track';
COMMENT ON COLUMN tracks.media_usage IS 'Array of media usage types';
COMMENT ON COLUMN tracks.trackouts_url IS 'URL to trackouts file';
COMMENT ON COLUMN tracks.stems_url IS 'URL to stems file';
COMMENT ON COLUMN tracks.split_sheet_url IS 'URL to split sheet file';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tracks_work_for_hire_contracts ON tracks USING GIN (work_for_hire_contracts);
CREATE INDEX IF NOT EXISTS idx_tracks_instruments ON tracks USING GIN (instruments);
CREATE INDEX IF NOT EXISTS idx_tracks_media_usage ON tracks USING GIN (media_usage);
CREATE INDEX IF NOT EXISTS idx_tracks_has_vocals ON tracks (has_vocals);
CREATE INDEX IF NOT EXISTS idx_tracks_explicit_lyrics ON tracks (explicit_lyrics);
CREATE INDEX IF NOT EXISTS idx_tracks_is_sync_only ON tracks (is_sync_only);
CREATE INDEX IF NOT EXISTS idx_tracks_rights_holder_type ON tracks (rights_holder_type);
