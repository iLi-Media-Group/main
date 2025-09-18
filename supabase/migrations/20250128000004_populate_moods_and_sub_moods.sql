-- Populate moods and sub_moods tables with existing data structure
-- This migration populates the new tables with the current MOODS_CATEGORIES structure

-- 1. Insert main mood categories
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

-- 2. Insert sub-moods for each main mood category
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
