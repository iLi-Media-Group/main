-- Create music_rights table to store rights information for tracks
-- This allows producers to provide rights holder information when uploading tracks

-- Create the music_rights table
CREATE TABLE IF NOT EXISTS music_rights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Rights ownership information
  master_rights_owner VARCHAR(255) NOT NULL,
  publishing_rights_owner VARCHAR(255) NOT NULL,
  
  -- Rights holder details (if different from producer)
  rights_holder_name VARCHAR(255),
  rights_holder_type VARCHAR(50) CHECK (rights_holder_type IN ('producer', 'record_label', 'publisher', 'other')),
  rights_holder_email VARCHAR(255),
  rights_holder_phone VARCHAR(50),
  rights_holder_address TEXT,
  
  -- Rights verification
  rights_verified BOOLEAN DEFAULT false,
  rights_verification_date TIMESTAMP WITH TIME ZONE,
  rights_verification_notes TEXT,
  
  -- Split sheet information
  split_sheet_url TEXT,
  split_sheet_verified BOOLEAN DEFAULT false,
  
  -- Co-signers and participants (stored as JSON)
  participants JSONB DEFAULT '[]',
  co_signers JSONB DEFAULT '[]',
  
  -- Rights declaration
  rights_declaration_accepted BOOLEAN DEFAULT false,
  rights_declaration_accepted_at TIMESTAMP WITH TIME ZONE,
  
  -- Status
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_rights_track_id ON music_rights(track_id);
CREATE INDEX IF NOT EXISTS idx_music_rights_producer_id ON music_rights(producer_id);
CREATE INDEX IF NOT EXISTS idx_music_rights_status ON music_rights(status);
CREATE INDEX IF NOT EXISTS idx_music_rights_rights_verified ON music_rights(rights_verified);

-- Create a trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_music_rights_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_music_rights_updated_at
  BEFORE UPDATE ON music_rights
  FOR EACH ROW
  EXECUTE FUNCTION update_music_rights_updated_at();

-- Enable RLS
ALTER TABLE music_rights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Producers can view their own rights records
CREATE POLICY "Producers can view own music rights" ON music_rights
  FOR SELECT USING (
    auth.uid() = producer_id
  );

-- Producers can insert their own rights records
CREATE POLICY "Producers can insert own music rights" ON music_rights
  FOR INSERT WITH CHECK (
    auth.uid() = producer_id
  );

-- Producers can update their own rights records
CREATE POLICY "Producers can update own music rights" ON music_rights
  FOR UPDATE USING (
    auth.uid() = producer_id
  );

-- Producers can delete their own rights records
CREATE POLICY "Producers can delete own music rights" ON music_rights
  FOR DELETE USING (
    auth.uid() = producer_id
  );

-- Admins can view all rights records
CREATE POLICY "Admins can view all music rights" ON music_rights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'admin'
    )
  );

-- Admins can update all rights records
CREATE POLICY "Admins can update all music rights" ON music_rights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.account_type = 'admin'
    )
  );

-- Grant permissions
GRANT ALL ON music_rights TO authenticated;
GRANT USAGE ON SEQUENCE music_rights_id_seq TO authenticated;

-- Add a comment to document the table
COMMENT ON TABLE music_rights IS 'Stores rights information for tracks uploaded by producers, allowing them to specify rights ownership and holder details';
