-- Apply instruments migration to remote database
-- This script creates the instruments and sub_instruments tables

-- Create instruments table
CREATE TABLE IF NOT EXISTS instruments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create sub_instruments table
CREATE TABLE IF NOT EXISTS sub_instruments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instrument_id UUID NOT NULL REFERENCES instruments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(instrument_id, name)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_instruments_name ON instruments(name);
CREATE INDEX IF NOT EXISTS idx_sub_instruments_instrument_id ON sub_instruments(instrument_id);
CREATE INDEX IF NOT EXISTS idx_sub_instruments_name ON sub_instruments(name);

-- Add comments for documentation
COMMENT ON TABLE instruments IS 'Main instrument categories (e.g., Strings, Brass, Percussion)';
COMMENT ON TABLE sub_instruments IS 'Specific instruments within each category (e.g., Violin, Trumpet, Drums)';
COMMENT ON COLUMN instruments.name IS 'Internal name (lowercase with underscores)';
COMMENT ON COLUMN instruments.display_name IS 'User-friendly display name';
COMMENT ON COLUMN sub_instruments.name IS 'Internal name (lowercase with underscores)';
COMMENT ON COLUMN sub_instruments.display_name IS 'User-friendly display name';

-- Enable Row Level Security
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_instruments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for instruments table
CREATE POLICY "Instruments are viewable by everyone" ON instruments
  FOR SELECT USING (true);

CREATE POLICY "Instruments are insertable by admins" ON instruments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Instruments are updatable by admins" ON instruments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Instruments are deletable by admins" ON instruments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Create RLS policies for sub_instruments table
CREATE POLICY "Sub instruments are viewable by everyone" ON sub_instruments
  FOR SELECT USING (true);

CREATE POLICY "Sub instruments are insertable by admins" ON sub_instruments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Sub instruments are updatable by admins" ON sub_instruments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

CREATE POLICY "Sub instruments are deletable by admins" ON sub_instruments
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type = 'admin'
    )
  );

-- Insert some default instruments and sub-instruments
INSERT INTO instruments (name, display_name) VALUES
  ('strings', 'Strings'),
  ('brass', 'Brass'),
  ('woodwind', 'Woodwind'),
  ('percussion', 'Percussion'),
  ('keyboard', 'Keyboard'),
  ('guitar', 'Guitar'),
  ('bass', 'Bass'),
  ('drums', 'Drums'),
  ('vocals', 'Vocals'),
  ('electronic', 'Electronic')
ON CONFLICT (name) DO NOTHING;

-- Insert sub-instruments for each category
INSERT INTO sub_instruments (instrument_id, name, display_name) 
SELECT i.id, 'violin', 'Violin' FROM instruments i WHERE i.name = 'strings'
UNION ALL
SELECT i.id, 'viola', 'Viola' FROM instruments i WHERE i.name = 'strings'
UNION ALL
SELECT i.id, 'cello', 'Cello' FROM instruments i WHERE i.name = 'strings'
UNION ALL
SELECT i.id, 'double_bass', 'Double Bass' FROM instruments i WHERE i.name = 'strings'
UNION ALL
SELECT i.id, 'trumpet', 'Trumpet' FROM instruments i WHERE i.name = 'brass'
UNION ALL
SELECT i.id, 'trombone', 'Trombone' FROM instruments i WHERE i.name = 'brass'
UNION ALL
SELECT i.id, 'french_horn', 'French Horn' FROM instruments i WHERE i.name = 'brass'
UNION ALL
SELECT i.id, 'tuba', 'Tuba' FROM instruments i WHERE i.name = 'brass'
UNION ALL
SELECT i.id, 'flute', 'Flute' FROM instruments i WHERE i.name = 'woodwind'
UNION ALL
SELECT i.id, 'clarinet', 'Clarinet' FROM instruments i WHERE i.name = 'woodwind'
UNION ALL
SELECT i.id, 'oboe', 'Oboe' FROM instruments i WHERE i.name = 'woodwind'
UNION ALL
SELECT i.id, 'bassoon', 'Bassoon' FROM instruments i WHERE i.name = 'woodwind'
UNION ALL
SELECT i.id, 'drums', 'Drums' FROM instruments i WHERE i.name = 'percussion'
UNION ALL
SELECT i.id, 'cymbals', 'Cymbals' FROM instruments i WHERE i.name = 'percussion'
UNION ALL
SELECT i.id, 'timpani', 'Timpani' FROM instruments i WHERE i.name = 'percussion'
UNION ALL
SELECT i.id, 'piano', 'Piano' FROM instruments i WHERE i.name = 'keyboard'
UNION ALL
SELECT i.id, 'organ', 'Organ' FROM instruments i WHERE i.name = 'keyboard'
UNION ALL
SELECT i.id, 'synthesizer', 'Synthesizer' FROM instruments i WHERE i.name = 'keyboard'
UNION ALL
SELECT i.id, 'acoustic_guitar', 'Acoustic Guitar' FROM instruments i WHERE i.name = 'guitar'
UNION ALL
SELECT i.id, 'electric_guitar', 'Electric Guitar' FROM instruments i WHERE i.name = 'guitar'
UNION ALL
SELECT i.id, 'classical_guitar', 'Classical Guitar' FROM instruments i WHERE i.name = 'guitar'
UNION ALL
SELECT i.id, 'acoustic_bass', 'Acoustic Bass' FROM instruments i WHERE i.name = 'bass'
UNION ALL
SELECT i.id, 'electric_bass', 'Electric Bass' FROM instruments i WHERE i.name = 'bass'
UNION ALL
SELECT i.id, 'upright_bass', 'Upright Bass' FROM instruments i WHERE i.name = 'bass'
UNION ALL
SELECT i.id, 'drum_kit', 'Drum Kit' FROM instruments i WHERE i.name = 'drums'
UNION ALL
SELECT i.id, 'electronic_drums', 'Electronic Drums' FROM instruments i WHERE i.name = 'drums'
UNION ALL
SELECT i.id, 'lead_vocals', 'Lead Vocals' FROM instruments i WHERE i.name = 'vocals'
UNION ALL
SELECT i.id, 'backing_vocals', 'Backing Vocals' FROM instruments i WHERE i.name = 'vocals'
UNION ALL
SELECT i.id, 'choir', 'Choir' FROM instruments i WHERE i.name = 'vocals'
UNION ALL
SELECT i.id, 'drum_machine', 'Drum Machine' FROM instruments i WHERE i.name = 'electronic'
UNION ALL
SELECT i.id, 'sampler', 'Sampler' FROM instruments i WHERE i.name = 'electronic'
UNION ALL
SELECT i.id, 'sequencer', 'Sequencer' FROM instruments i WHERE i.name = 'electronic'
ON CONFLICT (instrument_id, name) DO NOTHING;
