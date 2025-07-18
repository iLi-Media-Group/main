/*
  # Create Genre Management System

  1. New Tables
    - `genres` - Stores main music genres
      - `id` (uuid, primary key)
      - `name` (text, unique) - internal name (e.g., 'hip_hop')
      - `display_name` (text) - user-friendly name (e.g., 'Hip Hop')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `sub_genres` - Stores sub-genres associated with main genres
      - `id` (uuid, primary key)
      - `genre_id` (uuid, foreign key to genres)
      - `name` (text) - internal name (e.g., 'trap')
      - `display_name` (text) - user-friendly name (e.g., 'Trap')
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Add policies for admin access only
    - Add unique constraints for names
*/

-- Create genres table
CREATE TABLE IF NOT EXISTS genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sub_genres table
CREATE TABLE IF NOT EXISTS sub_genres (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  genre_id uuid NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(genre_id, name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_genres_name ON genres(name);
CREATE INDEX IF NOT EXISTS idx_sub_genres_genre_id ON sub_genres(genre_id);
CREATE INDEX IF NOT EXISTS idx_sub_genres_name ON sub_genres(name);

-- Enable Row Level Security
ALTER TABLE genres ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_genres ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage genres' AND tablename = 'genres'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can manage genres" ON genres
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
          )
        )
    $policy$;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins can manage sub_genres' AND tablename = 'sub_genres'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can manage sub_genres" ON sub_genres
        FOR ALL USING (
          EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.account_type = 'admin'
          )
        )
    $policy$;
  END IF;
END $$;

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_genres_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_genres_updated_at'
  ) THEN
    CREATE TRIGGER update_genres_updated_at
      BEFORE UPDATE ON genres
      FOR EACH ROW
      EXECUTE FUNCTION update_genres_updated_at();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_sub_genres_updated_at'
  ) THEN
    CREATE TRIGGER update_sub_genres_updated_at
      BEFORE UPDATE ON sub_genres
      FOR EACH ROW
      EXECUTE FUNCTION update_genres_updated_at();
  END IF;
END $$;

-- Insert default genres and sub-genres
INSERT INTO genres (name, display_name) VALUES
  ('hiphop', 'Hip Hop'),
  ('rnb', 'R&B'),
  ('pop', 'Pop'),
  ('rock', 'Rock'),
  ('electronic', 'Electronic'),
  ('jazz', 'Jazz'),
  ('classical', 'Classical'),
  ('world', 'World'),
  ('religious', 'Religious'),
  ('childrens', 'Children''s'),
  ('country', 'Country')
ON CONFLICT (name) DO NOTHING;

-- Insert default sub-genres
INSERT INTO sub_genres (genre_id, name, display_name) 
SELECT 
  g.id,
  sg.name,
  sg.display_name
FROM genres g
CROSS JOIN (
  VALUES 
    ('hiphop', 'trap', 'Trap'),
    ('hiphop', 'boom_bap', 'Boom Bap'),
    ('hiphop', 'lo_fi', 'Lo-Fi'),
    ('hiphop', 'drill', 'Drill'),
    ('hiphop', 'west_coast', 'West Coast'),
    ('hiphop', 'east_coast', 'East Coast'),
    ('rnb', 'soul', 'Soul'),
    ('rnb', 'neo_soul', 'Neo Soul'),
    ('rnb', 'contemporary', 'Contemporary'),
    ('rnb', 'gospel', 'Gospel'),
    ('pop', 'indie_pop', 'Indie Pop'),
    ('pop', 'synth_pop', 'Synth Pop'),
    ('pop', 'k_pop', 'K-Pop'),
    ('pop', 'dance_pop', 'Dance Pop'),
    ('rock', 'alternative', 'Alternative'),
    ('rock', 'indie_rock', 'Indie Rock'),
    ('rock', 'metal', 'Metal'),
    ('rock', 'punk', 'Punk'),
    ('electronic', 'house', 'House'),
    ('electronic', 'techno', 'Techno'),
    ('electronic', 'ambient', 'Ambient'),
    ('electronic', 'drum_and_bass', 'Drum & Bass'),
    ('electronic', 'dubstep', 'Dubstep'),
    ('jazz', 'smooth_jazz', 'Smooth Jazz'),
    ('jazz', 'bebop', 'Bebop'),
    ('jazz', 'fusion', 'Fusion'),
    ('jazz', 'contemporary', 'Contemporary'),
    ('classical', 'orchestral', 'Orchestral'),
    ('classical', 'chamber', 'Chamber'),
    ('classical', 'contemporary', 'Contemporary'),
    ('classical', 'minimalist', 'Minimalist'),
    ('world', 'latin', 'Latin'),
    ('world', 'african', 'African'),
    ('world', 'asian', 'Asian'),
    ('world', 'middle_eastern', 'Middle Eastern'),
    ('religious', 'gospel', 'Gospel'),
    ('religious', 'contemporary_christian', 'Contemporary Christian'),
    ('religious', 'worship', 'Worship'),
    ('religious', 'sacred', 'Sacred'),
    ('religious', 'spiritual', 'Spiritual'),
    ('childrens', 'playful', 'Playful'),
    ('childrens', 'whimsical', 'Whimsical'),
    ('childrens', 'educational', 'Educational'),
    ('childrens', 'nursery_rhyme', 'Nursery Rhyme'),
    ('childrens', 'lullaby', 'Lullaby'),
    ('childrens', 'adventure_fantasy', 'Adventure Fantasy'),
    ('childrens', 'silly_and_goofy', 'Silly & Goofy'),
    ('childrens', 'interactive', 'Interactive')
) AS sg(genre_name, name, display_name)
WHERE g.name = sg.genre_name
ON CONFLICT (genre_id, name) DO NOTHING; 