-- Complete Genre Fix Script
-- This script will fix all genre-related issues

-- ============================================
-- 1. CREATE TABLES IF THEY DON'T EXIST
-- ============================================

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

-- ============================================
-- 2. FIX RLS POLICIES
-- ============================================

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage genres" ON genres;
DROP POLICY IF EXISTS "Admins can manage sub_genres" ON sub_genres;
DROP POLICY IF EXISTS "Admins and producers can read genres" ON genres;
DROP POLICY IF EXISTS "Admins and producers can read sub_genres" ON sub_genres;
DROP POLICY IF EXISTS "Admins can insert genres" ON genres;
DROP POLICY IF EXISTS "Admins can update genres" ON genres;
DROP POLICY IF EXISTS "Admins can delete genres" ON genres;
DROP POLICY IF EXISTS "Admins can insert sub_genres" ON sub_genres;
DROP POLICY IF EXISTS "Admins can update sub_genres" ON sub_genres;
DROP POLICY IF EXISTS "Admins can delete sub_genres" ON sub_genres;

-- Create new policies that allow both admins and producers to read genres
CREATE POLICY "Admins and producers can read genres" ON genres
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'producer', 'admin,producer')
    )
  );

-- Create policies that only allow admins to write to genres
CREATE POLICY "Admins can insert genres" ON genres
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

CREATE POLICY "Admins can update genres" ON genres
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

CREATE POLICY "Admins can delete genres" ON genres
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

-- Create new policies that allow both admins and producers to read sub_genres
CREATE POLICY "Admins and producers can read sub_genres" ON sub_genres
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'producer', 'admin,producer')
    )
  );

-- Create policies that only allow admins to write to sub_genres
CREATE POLICY "Admins can insert sub_genres" ON sub_genres
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

CREATE POLICY "Admins can update sub_genres" ON sub_genres
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

CREATE POLICY "Admins can delete sub_genres" ON sub_genres
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.account_type IN ('admin', 'admin,producer')
    )
  );

-- ============================================
-- 3. INSERT GENRES IF TABLE IS EMPTY
-- ============================================

-- Insert main genres only if the table is empty
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM genres LIMIT 1) THEN
        INSERT INTO genres (name, display_name) VALUES 
        ('hip_hop_rap', 'Hip-Hop / Rap'),
        ('rnb_soul', 'R&B / Soul'),
        ('pop', 'Pop'),
        ('rock', 'Rock'),
        ('electronic_dance', 'Electronic / Dance'),
        ('jazz', 'Jazz'),
        ('classical_orchestral', 'Classical / Orchestral'),
        ('world_global', 'World / Global'),
        ('religious_inspirational', 'Religious / Inspirational'),
        ('childrens_family', 'Children''s / Family'),
        ('country_folk_americana', 'Country / Folk / Americana'),
        ('other_licensing', 'Other Useful Licensing Genres');
    END IF;
END $$;

-- ============================================
-- 4. INSERT SUB-GENRES IF TABLE IS EMPTY
-- ============================================

-- Insert sub-genres for Hip-Hop / Rap
INSERT INTO sub_genres (genre_id, name, display_name) 
SELECT g.id, 'old_school', 'Old School' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'boom_bap', 'Boom Bap' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'trap', 'Trap' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'drill', 'Drill' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'lo_fi_hip_hop', 'Lo-fi Hip-Hop' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'conscious_rap', 'Conscious Rap' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'west_coast_gfunk', 'West Coast / G-Funk' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'east_coast', 'East Coast' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'dirty_south', 'Dirty South' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'grime', 'Grime' FROM genres g WHERE g.name = 'hip_hop_rap'
UNION ALL
SELECT g.id, 'alternative_hip_hop', 'Alternative Hip-Hop' FROM genres g WHERE g.name = 'hip_hop_rap'
ON CONFLICT (genre_id, name) DO NOTHING;

-- Insert sub-genres for R&B / Soul
INSERT INTO sub_genres (genre_id, name, display_name) 
SELECT g.id, 'contemporary_rnb', 'Contemporary R&B' FROM genres g WHERE g.name = 'rnb_soul'
UNION ALL
SELECT g.id, 'neo_soul', 'Neo-Soul' FROM genres g WHERE g.name = 'rnb_soul'
UNION ALL
SELECT g.id, 'quiet_storm', 'Quiet Storm' FROM genres g WHERE g.name = 'rnb_soul'
UNION ALL
SELECT g.id, 'funk', 'Funk' FROM genres g WHERE g.name = 'rnb_soul'
UNION ALL
SELECT g.id, 'motown', 'Motown' FROM genres g WHERE g.name = 'rnb_soul'
UNION ALL
SELECT g.id, 'classic_soul', 'Classic Soul' FROM genres g WHERE g.name = 'rnb_soul'
UNION ALL
SELECT g.id, 'indie_rnb', 'Indie R&B' FROM genres g WHERE g.name = 'rnb_soul'
UNION ALL
SELECT g.id, 'bedroom_rnb', 'Bedroom R&B' FROM genres g WHERE g.name = 'rnb_soul'
ON CONFLICT (genre_id, name) DO NOTHING;

-- Insert sub-genres for Pop
INSERT INTO sub_genres (genre_id, name, display_name) 
SELECT g.id, 'electropop', 'Electropop' FROM genres g WHERE g.name = 'pop'
UNION ALL
SELECT g.id, 'dance_pop', 'Dance Pop' FROM genres g WHERE g.name = 'pop'
UNION ALL
SELECT g.id, 'indie_pop', 'Indie Pop' FROM genres g WHERE g.name = 'pop'
UNION ALL
SELECT g.id, 'k_pop', 'K-Pop' FROM genres g WHERE g.name = 'pop'
UNION ALL
SELECT g.id, 'synthpop', 'Synthpop' FROM genres g WHERE g.name = 'pop'
UNION ALL
SELECT g.id, 'teen_pop', 'Teen Pop' FROM genres g WHERE g.name = 'pop'
UNION ALL
SELECT g.id, 'power_pop', 'Power Pop' FROM genres g WHERE g.name = 'pop'
UNION ALL
SELECT g.id, 'art_pop', 'Art Pop' FROM genres g WHERE g.name = 'pop'
UNION ALL
SELECT g.id, 'hyperpop', 'Hyperpop' FROM genres g WHERE g.name = 'pop'
ON CONFLICT (genre_id, name) DO NOTHING;

-- Insert sub-genres for Rock
INSERT INTO sub_genres (genre_id, name, display_name) 
SELECT g.id, 'indie_rock', 'Indie Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'alternative_rock', 'Alternative Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'classic_rock', 'Classic Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'psychedelic_rock', 'Psychedelic Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'pop_rock', 'Pop Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'garage_rock', 'Garage Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'hard_rock', 'Hard Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'punk_rock', 'Punk Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'progressive_rock', 'Progressive Rock' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'metal', 'Metal (Heavy, Death, Black, etc.)' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'emo_post_hardcore', 'Emo / Post-Hardcore' FROM genres g WHERE g.name = 'rock'
UNION ALL
SELECT g.id, 'ska', 'Ska' FROM genres g WHERE g.name = 'rock'
ON CONFLICT (genre_id, name) DO NOTHING;

-- Insert sub-genres for Electronic / Dance
INSERT INTO sub_genres (genre_id, name, display_name) 
SELECT g.id, 'edm', 'EDM' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'house', 'House (Deep, Tech, Electro, Tropical)' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'techno', 'Techno' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'drum_and_bass', 'Drum and Bass (DNB)' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'jungle', 'Jungle' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'dubstep', 'Dubstep' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'trance', 'Trance (Progressive, Psytrance)' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'chillstep_chillwave', 'Chillstep / Chillwave' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'synthwave_retrowave', 'Synthwave / Retrowave' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'future_bass', 'Future Bass' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'big_room', 'Big Room' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'idm', 'IDM (Intelligent Dance Music)' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'ambient_electronic', 'Ambient Electronic' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'glitch', 'Glitch' FROM genres g WHERE g.name = 'electronic_dance'
UNION ALL
SELECT g.id, 'bass_music', 'Bass Music' FROM genres g WHERE g.name = 'electronic_dance'
ON CONFLICT (genre_id, name) DO NOTHING;

-- ============================================
-- 5. VERIFICATION
-- ============================================

-- Check the results
SELECT '=== GENRE COUNT ===' as info;
SELECT COUNT(*) as total_genres FROM genres;

SELECT '=== SUB-GENRE COUNT ===' as info;
SELECT COUNT(*) as total_sub_genres FROM sub_genres;

SELECT '=== SAMPLE GENRES ===' as info;
SELECT name, display_name FROM genres ORDER BY display_name LIMIT 5;

SELECT '=== SAMPLE SUB-GENRES ===' as info;
SELECT 
  g.display_name as genre,
  sg.display_name as sub_genre
FROM sub_genres sg
JOIN genres g ON sg.genre_id = g.id
ORDER BY g.display_name, sg.display_name
LIMIT 10;

SELECT '=== RLS POLICIES ===' as info;
SELECT 
  tablename,
  policyname,
  cmd
FROM pg_policies 
WHERE tablename IN ('genres', 'sub_genres')
ORDER BY tablename, policyname; 