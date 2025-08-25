-- Complete mood restructure migration
-- This migration creates the new mood structure and migrates existing data

-- 1. Create moods table (main mood categories)
CREATE TABLE IF NOT EXISTS moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create sub_moods table (individual mood descriptors)
CREATE TABLE IF NOT EXISTS sub_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mood_id UUID NOT NULL REFERENCES moods(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mood_id, name)
);

-- 3. Create track_moods junction table to link tracks to their selected sub-moods
CREATE TABLE IF NOT EXISTS track_moods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    track_id UUID NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
    sub_mood_id UUID NOT NULL REFERENCES sub_moods(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(track_id, sub_mood_id)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sub_moods_mood_id ON sub_moods(mood_id);
CREATE INDEX IF NOT EXISTS idx_track_moods_track_id ON track_moods(track_id);
CREATE INDEX IF NOT EXISTS idx_track_moods_sub_mood_id ON track_moods(sub_mood_id);

-- 5. Enable RLS on new tables
ALTER TABLE moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE sub_moods ENABLE ROW LEVEL SECURITY;
ALTER TABLE track_moods ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS policies for moods table
CREATE POLICY "moods_select_policy" ON moods
    FOR SELECT USING (true);

CREATE POLICY "moods_insert_policy" ON moods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "moods_update_policy" ON moods
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "moods_delete_policy" ON moods
    FOR DELETE USING (auth.role() = 'authenticated');

-- 7. Create RLS policies for sub_moods table
CREATE POLICY "sub_moods_select_policy" ON sub_moods
    FOR SELECT USING (true);

CREATE POLICY "sub_moods_insert_policy" ON sub_moods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "sub_moods_update_policy" ON sub_moods
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "sub_moods_delete_policy" ON sub_moods
    FOR DELETE USING (auth.role() = 'authenticated');

-- 8. Create RLS policies for track_moods table
CREATE POLICY "track_moods_select_policy" ON track_moods
    FOR SELECT USING (true);

CREATE POLICY "track_moods_insert_policy" ON track_moods
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "track_moods_update_policy" ON track_moods
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "track_moods_delete_policy" ON track_moods
    FOR DELETE USING (auth.role() = 'authenticated');

-- 9. Insert main mood categories
INSERT INTO moods (name, display_name, display_order) VALUES
('happy_upbeat', 'Happy & Upbeat', 1),
('sad_melancholic', 'Sad & Melancholic', 2),
('calm_relaxing', 'Calm & Relaxing', 3),
('dark_mysterious', 'Dark & Mysterious', 4),
('romantic_intimate', 'Romantic & Intimate', 5),
('aggressive_intense', 'Aggressive & Intense', 6),
('epic_heroic', 'Epic & Heroic', 7),
('quirky_fun', 'Quirky & Fun', 8),
('inspirational_hopeful', 'Inspirational & Hopeful', 9),
('mysterious_suspenseful', 'Mysterious & Suspenseful', 10),
('groovy_funky', 'Groovy & Funky', 11),
('otherworldly_fantasy', 'Otherworldly & Fantasy', 12)
ON CONFLICT (name) DO NOTHING;

-- 10. Insert sub-moods for each main mood category
-- Happy & Upbeat
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('joyful', 'Joyful', 1),
    ('energetic', 'Energetic', 2),
    ('cheerful', 'Cheerful', 3),
    ('playful', 'Playful', 4),
    ('optimistic', 'Optimistic', 5),
    ('excited', 'Excited', 6),
    ('celebratory', 'Celebratory', 7),
    ('triumphant', 'Triumphant', 8),
    ('uplifting', 'Uplifting', 9),
    ('bouncy', 'Bouncy', 10),
    ('bright', 'Bright', 11),
    ('carefree', 'Carefree', 12),
    ('euphoric', 'Euphoric', 13),
    ('lively', 'Lively', 14)
) AS sm(name, display_name, display_order)
WHERE m.name = 'happy_upbeat'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Sad & Melancholic
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('heartbroken', 'Heartbroken', 1),
    ('melancholy', 'Melancholy', 2),
    ('nostalgic', 'Nostalgic', 3),
    ('somber', 'Somber', 4),
    ('depressed', 'Depressed', 5),
    ('reflective', 'Reflective', 6),
    ('gloomy', 'Gloomy', 7),
    ('bitter', 'Bitter', 8),
    ('yearning', 'Yearning', 9),
    ('mournful', 'Mournful', 10),
    ('haunting', 'Haunting', 11),
    ('regretful', 'Regretful', 12),
    ('lonely', 'Lonely', 13),
    ('poignant', 'Poignant', 14)
) AS sm(name, display_name, display_order)
WHERE m.name = 'sad_melancholic'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Calm & Relaxing
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('peaceful', 'Peaceful', 1),
    ('serene', 'Serene', 2),
    ('soothing', 'Soothing', 3),
    ('meditative', 'Meditative', 4),
    ('dreamy', 'Dreamy', 5),
    ('gentle', 'Gentle', 6),
    ('tranquil', 'Tranquil', 7),
    ('ethereal', 'Ethereal', 8),
    ('laid_back', 'Laid Back', 9),
    ('floating', 'Floating', 10),
    ('mellow', 'Mellow', 11),
    ('soft', 'Soft', 12),
    ('cozy', 'Cozy', 13),
    ('chill', 'Chill', 14)
) AS sm(name, display_name, display_order)
WHERE m.name = 'calm_relaxing'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Dark & Mysterious
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('ominous', 'Ominous', 1),
    ('creepy', 'Creepy', 2),
    ('foreboding', 'Foreboding', 3),
    ('brooding', 'Brooding', 4),
    ('tense', 'Tense', 5),
    ('haunting', 'Haunting', 6),
    ('moody', 'Moody', 7),
    ('sinister', 'Sinister', 8),
    ('suspenseful', 'Suspenseful', 9),
    ('menacing', 'Menacing', 10),
    ('eerie', 'Eerie', 11),
    ('shadowy', 'Shadowy', 12)
) AS sm(name, display_name, display_order)
WHERE m.name = 'dark_mysterious'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Romantic & Intimate
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('loving', 'Loving', 1),
    ('passionate', 'Passionate', 2),
    ('sensual', 'Sensual', 3),
    ('tender', 'Tender', 4),
    ('intimate', 'Intimate', 5),
    ('lustful', 'Lustful', 6),
    ('heartfelt', 'Heartfelt', 7),
    ('longing', 'Longing', 8),
    ('sweet', 'Sweet', 9),
    ('sentimental', 'Sentimental', 10),
    ('gentle', 'Gentle', 11),
    ('warm', 'Warm', 12)
) AS sm(name, display_name, display_order)
WHERE m.name = 'romantic_intimate'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Aggressive & Intense
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('angry', 'Angry', 1),
    ('furious', 'Furious', 2),
    ('chaotic', 'Chaotic', 3),
    ('explosive', 'Explosive', 4),
    ('fierce', 'Fierce', 5),
    ('powerful', 'Powerful', 6),
    ('rebellious', 'Rebellious', 7),
    ('savage', 'Savage', 8),
    ('heavy', 'Heavy', 9),
    ('relentless', 'Relentless', 10),
    ('unstoppable', 'Unstoppable', 11),
    ('wild', 'Wild', 12)
) AS sm(name, display_name, display_order)
WHERE m.name = 'aggressive_intense'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Epic & Heroic
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('majestic', 'Majestic', 1),
    ('triumphant', 'Triumphant', 2),
    ('victorious', 'Victorious', 3),
    ('grand', 'Grand', 4),
    ('inspirational', 'Inspirational', 5),
    ('dramatic', 'Dramatic', 6),
    ('cinematic', 'Cinematic', 7),
    ('monumental', 'Monumental', 8),
    ('glorious', 'Glorious', 9),
    ('adventurous', 'Adventurous', 10),
    ('powerful', 'Powerful', 11)
) AS sm(name, display_name, display_order)
WHERE m.name = 'epic_heroic'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Quirky & Fun
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('wacky', 'Wacky', 1),
    ('silly', 'Silly', 2),
    ('funky', 'Funky', 3),
    ('playful', 'Playful', 4),
    ('bizarre', 'Bizarre', 5),
    ('eccentric', 'Eccentric', 6),
    ('whimsical', 'Whimsical', 7),
    ('goofy', 'Goofy', 8),
    ('zany', 'Zany', 9),
    ('cheerful', 'Cheerful', 10)
) AS sm(name, display_name, display_order)
WHERE m.name = 'quirky_fun'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Inspirational & Hopeful
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('motivational', 'Motivational', 1),
    ('encouraging', 'Encouraging', 2),
    ('uplifting', 'Uplifting', 3),
    ('aspirational', 'Aspirational', 4),
    ('bright', 'Bright', 5),
    ('confident', 'Confident', 6),
    ('positive', 'Positive', 7),
    ('driving', 'Driving', 8),
    ('determined', 'Determined', 9)
) AS sm(name, display_name, display_order)
WHERE m.name = 'inspirational_hopeful'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Mysterious & Suspenseful
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('enigmatic', 'Enigmatic', 1),
    ('secretive', 'Secretive', 2),
    ('cryptic', 'Cryptic', 3),
    ('suspenseful', 'Suspenseful', 4),
    ('intriguing', 'Intriguing', 5),
    ('tense', 'Tense', 6),
    ('unresolved', 'Unresolved', 7)
) AS sm(name, display_name, display_order)
WHERE m.name = 'mysterious_suspenseful'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Groovy & Funky
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('smooth', 'Smooth', 1),
    ('cool', 'Cool', 2),
    ('retro', 'Retro', 3),
    ('stylish', 'Stylish', 4),
    ('sassy', 'Sassy', 5),
    ('funky', 'Funky', 6),
    ('catchy', 'Catchy', 7),
    ('hypnotic', 'Hypnotic', 8)
) AS sm(name, display_name, display_order)
WHERE m.name = 'groovy_funky'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Otherworldly & Fantasy
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, sm.name, sm.display_name, sm.display_order
FROM moods m
CROSS JOIN (VALUES
    ('mystical', 'Mystical', 1),
    ('ethereal', 'Ethereal', 2),
    ('enchanted', 'Enchanted', 3),
    ('magical', 'Magical', 4),
    ('cosmic', 'Cosmic', 5),
    ('dreamlike', 'Dreamlike', 6),
    ('celestial', 'Celestial', 7),
    ('floating', 'Floating', 8)
) AS sm(name, display_name, display_order)
WHERE m.name = 'otherworldly_fantasy'
ON CONFLICT (mood_id, name) DO NOTHING;

-- 11. Migrate existing track moods to new structure
-- Create a function to safely migrate moods
CREATE OR REPLACE FUNCTION migrate_track_moods()
RETURNS void AS $$
DECLARE
    track_record RECORD;
    mood_name TEXT;
    sub_mood_record RECORD;
BEGIN
    -- Loop through all tracks that have moods
    FOR track_record IN 
        SELECT id, moods 
        FROM tracks 
        WHERE moods IS NOT NULL AND array_length(moods, 1) > 0
    LOOP
        -- Loop through each mood in the track's moods array
        FOREACH mood_name IN ARRAY track_record.moods
        LOOP
            -- Find the corresponding sub_mood record
            SELECT sm.id INTO sub_mood_record
            FROM sub_moods sm
            WHERE sm.name = mood_name
            LIMIT 1;
            
            -- If we found a matching sub_mood, create the track_moods relationship
            IF sub_mood_record.id IS NOT NULL THEN
                INSERT INTO track_moods (track_id, sub_mood_id)
                VALUES (track_record.id, sub_mood_record.id)
                ON CONFLICT (track_id, sub_mood_id) DO NOTHING;
            ELSE
                -- Log unmapped moods for manual review
                RAISE NOTICE 'Unmapped mood found: % for track %', mood_name, track_record.id;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_track_moods();

-- Clean up the function
DROP FUNCTION migrate_track_moods();

-- 12. Add a comment to the tracks table about the migration
COMMENT ON COLUMN tracks.moods IS 'DEPRECATED: This column contains legacy mood data. New tracks should use the track_moods junction table. This column will be removed in a future migration.';

-- 13. Create a view to help with the transition (shows both old and new mood data)
CREATE OR REPLACE VIEW track_moods_comparison AS
SELECT 
    t.id as track_id,
    t.title as track_title,
    t.moods as legacy_moods,
    array_agg(sm.name ORDER BY sm.name) as new_moods,
    array_agg(sm.display_name ORDER BY sm.display_name) as new_mood_display_names
FROM tracks t
LEFT JOIN track_moods tm ON t.id = tm.track_id
LEFT JOIN sub_moods sm ON tm.sub_mood_id = sm.id
WHERE t.moods IS NOT NULL AND array_length(t.moods, 1) > 0
GROUP BY t.id, t.title, t.moods
ORDER BY t.title;

-- 14. Create a function to get track moods in the new format
CREATE OR REPLACE FUNCTION get_track_moods(track_uuid UUID)
RETURNS TABLE(
    mood_id UUID,
    mood_name TEXT,
    mood_display_name TEXT,
    sub_mood_id UUID,
    sub_mood_name TEXT,
    sub_mood_display_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as mood_id,
        m.name as mood_name,
        m.display_name as mood_display_name,
        sm.id as sub_mood_id,
        sm.name as sub_mood_name,
        sm.display_name as sub_mood_display_name
    FROM track_moods tm
    JOIN sub_moods sm ON tm.sub_mood_id = sm.id
    JOIN moods m ON sm.mood_id = m.id
    WHERE tm.track_id = track_uuid
    ORDER BY m.display_order, sm.display_order;
END;
$$ LANGUAGE plpgsql;
