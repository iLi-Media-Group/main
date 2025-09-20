-- Add category and display_name fields to instruments table
-- This migration adds the category field that the DynamicInstrument interface expects

-- Add category and display_name columns to instruments table
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE instruments ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing instruments with categories based on the hardcoded data
UPDATE instruments SET 
  category = CASE 
    WHEN name IN ('acoustic guitar', 'electric guitar', 'bass guitar', 'ukulele', 'banjo', 'mandolin', 'harp', 'sitar', 'koto') THEN 'Strings'
    WHEN name IN ('piano', 'keyboard', 'organ', 'synthesizer', 'accordion', 'harpsichord', 'celesta', 'clavinet') THEN 'Keys'
    WHEN name IN ('drums', 'drum machine', 'percussion', 'bongos', 'congas', 'timbales', 'tambourine', 'shaker', 'cowbell', 'triangle', 'cymbals', 'gong') THEN 'Drums & Percussion'
    WHEN name IN ('saxophone', 'trumpet', 'trombone', 'flute', 'clarinet', 'oboe', 'bassoon', 'french horn', 'tuba', 'piccolo', 'recorder') THEN 'Woodwinds & Brass'
    WHEN name IN ('violin', 'viola', 'cello', 'double bass', 'string ensemble', 'orchestra') THEN 'Orchestral Strings'
    WHEN name IN ('vocals', 'choir', 'backing vocals', 'harmony vocals') THEN 'Vocals'
    WHEN name IN ('bass', 'sub bass', '808', 'bass synth') THEN 'Bass'
    WHEN name IN ('pad', 'atmosphere', 'ambient', 'texture', 'soundscape') THEN 'Atmosphere & Texture'
    WHEN name IN ('fx', 'sweep', 'riser', 'impact', 'whoosh', 'reverse') THEN 'Sound Effects'
    WHEN name IN ('sample', 'loop', 'break', 'vinyl', 'tape') THEN 'Samples & Loops'
    ELSE 'Other'
  END,
  display_name = INITCAP(name)
WHERE category IS NULL OR display_name IS NULL;

-- Set display_name to be the same as name if it's still null
UPDATE instruments SET display_name = INITCAP(name) WHERE display_name IS NULL;

-- Create index on category for better performance
CREATE INDEX IF NOT EXISTS idx_instruments_category ON instruments(category);

-- Add RLS policy for instruments table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'instruments' AND policyname = 'Instruments are viewable by everyone') THEN
    CREATE POLICY "Instruments are viewable by everyone" ON instruments
      FOR SELECT USING (true);
  END IF;
END $$;
