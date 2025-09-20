-- Fix Media Types and Instruments for Track Upload Form
-- Run this in Supabase SQL Editor to ensure all data is properly set up

-- 1. Ensure media_types table exists with proper structure
CREATE TABLE IF NOT EXISTS media_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES media_types(id) ON DELETE CASCADE,
    is_parent BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Ensure instrument_categories table exists
CREATE TABLE IF NOT EXISTS instrument_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Ensure instruments table exists
CREATE TABLE IF NOT EXISTS instruments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert basic media types if they don't exist
INSERT INTO media_types (name, description, category, is_parent, display_order) VALUES
-- Video Media
('TV Shows', 'Television series and programs', 'video', true, 1),
('Films', 'Feature films and movies', 'video', true, 2),
('Commercials', 'Advertising and promotional content', 'video', true, 3),
('Documentaries', 'Non-fiction film content', 'video', true, 4),
('Music Videos', 'Music video productions', 'video', true, 5),
('YouTube', 'YouTube videos and content', 'video', true, 6),
('TikTok', 'TikTok videos and short-form content', 'video', true, 7),
('Instagram', 'Instagram video content', 'video', true, 8),
('Social Media', 'Other social media video content', 'video', true, 9),

-- Audio Media
('Podcasts', 'Podcast episodes and series', 'audio', true, 10),
('Radio', 'Radio broadcasts and programming', 'audio', true, 11),
('Audiobooks', 'Audio book productions', 'audio', true, 12),
('Voice-overs', 'Voice-over and narration work', 'audio', true, 13),
('Background Music', 'Background and ambient audio', 'audio', true, 14),

-- Digital Media
('Video Games', 'Video game soundtracks and audio', 'digital', true, 15),
('Apps', 'Mobile and web application audio', 'digital', true, 16),
('Websites', 'Website background music and audio', 'digital', true, 17),
('Presentations', 'Presentation and slideshow audio', 'digital', true, 18)
ON CONFLICT (name) DO NOTHING;

-- 5. Insert basic instrument categories if they don't exist
INSERT INTO instrument_categories (name, display_name) VALUES
('drums', 'Drums & Percussion'),
('bass', 'Bass'),
('guitar', 'Guitar'),
('keys', 'Keys & Piano'),
('strings', 'Strings'),
('brass', 'Brass'),
('woodwind', 'Woodwind'),
('synth', 'Synthesizers'),
('vocal', 'Vocals'),
('fx', 'Effects & Samples')
ON CONFLICT (name) DO NOTHING;

-- 6. Insert basic instruments if they don't exist
INSERT INTO instruments (name, display_name, category) VALUES
-- Drums & Percussion
('drums', 'Drums', 'drums'),
('kick', 'Kick Drum', 'drums'),
('snare', 'Snare Drum', 'drums'),
('hihat', 'Hi-Hat', 'drums'),
('crash', 'Crash Cymbal', 'drums'),
('ride', 'Ride Cymbal', 'drums'),
('tom', 'Tom Toms', 'drums'),
('percussion', 'Percussion', 'drums'),

-- Bass
('bass', 'Bass', 'bass'),
('electric_bass', 'Electric Bass', 'bass'),
('acoustic_bass', 'Acoustic Bass', 'bass'),
('synth_bass', 'Synth Bass', 'bass'),

-- Guitar
('guitar', 'Guitar', 'guitar'),
('electric_guitar', 'Electric Guitar', 'guitar'),
('acoustic_guitar', 'Acoustic Guitar', 'guitar'),
('bass_guitar', 'Bass Guitar', 'guitar'),
('lead_guitar', 'Lead Guitar', 'guitar'),
('rhythm_guitar', 'Rhythm Guitar', 'guitar'),

-- Keys & Piano
('piano', 'Piano', 'keys'),
('electric_piano', 'Electric Piano', 'keys'),
('organ', 'Organ', 'keys'),
('synth', 'Synthesizer', 'keys'),
('keyboard', 'Keyboard', 'keys'),

-- Strings
('violin', 'Violin', 'strings'),
('viola', 'Viola', 'strings'),
('cello', 'Cello', 'strings'),
('double_bass', 'Double Bass', 'strings'),
('harp', 'Harp', 'strings'),

-- Brass
('trumpet', 'Trumpet', 'brass'),
('trombone', 'Trombone', 'brass'),
('saxophone', 'Saxophone', 'brass'),
('french_horn', 'French Horn', 'brass'),

-- Woodwind
('flute', 'Flute', 'woodwind'),
('clarinet', 'Clarinet', 'woodwind'),
('oboe', 'Oboe', 'woodwind'),
('bassoon', 'Bassoon', 'woodwind'),

-- Vocals
('vocals', 'Vocals', 'vocal'),
('lead_vocals', 'Lead Vocals', 'vocal'),
('backing_vocals', 'Backing Vocals', 'vocal'),
('choir', 'Choir', 'vocal'),

-- Effects & Samples
('fx', 'Effects', 'fx'),
('samples', 'Samples', 'fx'),
('loops', 'Loops', 'fx')
ON CONFLICT (name) DO NOTHING;

-- 7. Enable RLS and add policies
ALTER TABLE media_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE instrument_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

-- Media types policies
DROP POLICY IF EXISTS "Allow read access to media types" ON media_types;
CREATE POLICY "Allow read access to media types" ON media_types
FOR SELECT USING (true);

-- Instrument categories policies
DROP POLICY IF EXISTS "Allow read access to instrument categories" ON instrument_categories;
CREATE POLICY "Allow read access to instrument categories" ON instrument_categories
FOR SELECT USING (true);

-- Instruments policies
DROP POLICY IF EXISTS "Allow read access to instruments" ON instruments;
CREATE POLICY "Allow read access to instruments" ON instruments
FOR SELECT USING (true);

-- 8. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_media_types_category ON media_types(category);
CREATE INDEX IF NOT EXISTS idx_media_types_parent_id ON media_types(parent_id);
CREATE INDEX IF NOT EXISTS idx_media_types_is_parent ON media_types(is_parent);
CREATE INDEX IF NOT EXISTS idx_media_types_display_order ON media_types(display_order);

CREATE INDEX IF NOT EXISTS idx_instruments_category ON instruments(category);
CREATE INDEX IF NOT EXISTS idx_instrument_categories_name ON instrument_categories(name);

-- 9. Verify the data
SELECT 'Media Types' as table_name, COUNT(*) as count FROM media_types
UNION ALL
SELECT 'Instrument Categories' as table_name, COUNT(*) as count FROM instrument_categories
UNION ALL
SELECT 'Instruments' as table_name, COUNT(*) as count FROM instruments;
