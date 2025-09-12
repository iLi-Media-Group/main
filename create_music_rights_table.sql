-- Create Music Rights Table
-- This table will store rights information for tracks

CREATE TABLE IF NOT EXISTS music_rights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  producer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  master_rights_owner TEXT,
  publishing_rights_owner TEXT,
  rights_holder_name TEXT,
  rights_holder_type TEXT,
  rights_holder_email TEXT,
  rights_holder_phone TEXT,
  rights_holder_address TEXT,
  split_sheet_url TEXT,
  participants JSONB DEFAULT '[]'::jsonb,
  co_signers JSONB DEFAULT '[]'::jsonb,
  rights_declaration_accepted BOOLEAN DEFAULT false,
  rights_declaration_accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_music_rights_track_id ON music_rights(track_id);
CREATE INDEX IF NOT EXISTS idx_music_rights_producer_id ON music_rights(producer_id);

-- Add RLS policies
ALTER TABLE music_rights ENABLE ROW LEVEL SECURITY;

-- Policy for producers to manage their own music rights
CREATE POLICY "Producers can manage their own music rights" ON music_rights
  FOR ALL USING (producer_id = auth.uid());

-- Policy for admins to manage all music rights
CREATE POLICY "Admins can manage all music rights" ON music_rights
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND account_type LIKE '%admin%'
    )
  );
