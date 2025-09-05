-- Populate moods table with all mood categories and sub-moods
-- This ensures the database has all the moods that were previously hardcoded

-- Clear existing moods data
DELETE FROM moods;

-- Insert all moods with their categories
INSERT INTO moods (id, name, display_name, category) VALUES
-- Happy & Upbeat
(gen_random_uuid(), 'energetic', 'Energetic', 'Happy & Upbeat'),
(gen_random_uuid(), 'uplifting', 'Uplifting', 'Happy & Upbeat'),
(gen_random_uuid(), 'joyful', 'Joyful', 'Happy & Upbeat'),
(gen_random_uuid(), 'cheerful', 'Cheerful', 'Happy & Upbeat'),
(gen_random_uuid(), 'playful', 'Playful', 'Happy & Upbeat'),
(gen_random_uuid(), 'optimistic', 'Optimistic', 'Happy & Upbeat'),
(gen_random_uuid(), 'excited', 'Excited', 'Happy & Upbeat'),
(gen_random_uuid(), 'celebratory', 'Celebratory', 'Happy & Upbeat'),
(gen_random_uuid(), 'triumphant', 'Triumphant', 'Happy & Upbeat'),
(gen_random_uuid(), 'bouncy', 'Bouncy', 'Happy & Upbeat'),
(gen_random_uuid(), 'bright', 'Bright', 'Happy & Upbeat'),
(gen_random_uuid(), 'carefree', 'Carefree', 'Happy & Upbeat'),
(gen_random_uuid(), 'euphoric', 'Euphoric', 'Happy & Upbeat'),
(gen_random_uuid(), 'lively', 'Lively', 'Happy & Upbeat'),

-- Calm & Relaxing
(gen_random_uuid(), 'peaceful', 'Peaceful', 'Calm & Relaxing'),
(gen_random_uuid(), 'serene', 'Serene', 'Calm & Relaxing'),
(gen_random_uuid(), 'soothing', 'Soothing', 'Calm & Relaxing'),
(gen_random_uuid(), 'meditative', 'Meditative', 'Calm & Relaxing'),
(gen_random_uuid(), 'dreamy', 'Dreamy', 'Calm & Relaxing'),
(gen_random_uuid(), 'gentle', 'Gentle', 'Calm & Relaxing'),
(gen_random_uuid(), 'tranquil', 'Tranquil', 'Calm & Relaxing'),
(gen_random_uuid(), 'ethereal', 'Ethereal', 'Calm & Relaxing'),
(gen_random_uuid(), 'laid back', 'Laid Back', 'Calm & Relaxing'),
(gen_random_uuid(), 'floating', 'Floating', 'Calm & Relaxing'),
(gen_random_uuid(), 'mellow', 'Mellow', 'Calm & Relaxing'),
(gen_random_uuid(), 'soft', 'Soft', 'Calm & Relaxing'),
(gen_random_uuid(), 'cozy', 'Cozy', 'Calm & Relaxing'),
(gen_random_uuid(), 'chill', 'Chill', 'Calm & Relaxing'),

-- Epic & Heroic
(gen_random_uuid(), 'dramatic', 'Dramatic', 'Epic & Heroic'),
(gen_random_uuid(), 'majestic', 'Majestic', 'Epic & Heroic'),
(gen_random_uuid(), 'victorious', 'Victorious', 'Epic & Heroic'),
(gen_random_uuid(), 'grand', 'Grand', 'Epic & Heroic'),
(gen_random_uuid(), 'inspirational', 'Inspirational', 'Epic & Heroic'),
(gen_random_uuid(), 'cinematic', 'Cinematic', 'Epic & Heroic'),
(gen_random_uuid(), 'monumental', 'Monumental', 'Epic & Heroic'),
(gen_random_uuid(), 'glorious', 'Glorious', 'Epic & Heroic'),
(gen_random_uuid(), 'adventurous', 'Adventurous', 'Epic & Heroic'),
(gen_random_uuid(), 'powerful', 'Powerful', 'Epic & Heroic'),

-- Romantic & Intimate
(gen_random_uuid(), 'romantic', 'Romantic', 'Romantic & Intimate'),
(gen_random_uuid(), 'loving', 'Loving', 'Romantic & Intimate'),
(gen_random_uuid(), 'passionate', 'Passionate', 'Romantic & Intimate'),
(gen_random_uuid(), 'sensual', 'Sensual', 'Romantic & Intimate'),
(gen_random_uuid(), 'tender', 'Tender', 'Romantic & Intimate'),
(gen_random_uuid(), 'intimate', 'Intimate', 'Romantic & Intimate'),
(gen_random_uuid(), 'lustful', 'Lustful', 'Romantic & Intimate'),
(gen_random_uuid(), 'heartfelt', 'Heartfelt', 'Romantic & Intimate'),
(gen_random_uuid(), 'longing', 'Longing', 'Romantic & Intimate'),
(gen_random_uuid(), 'sweet', 'Sweet', 'Romantic & Intimate'),
(gen_random_uuid(), 'sentimental', 'Sentimental', 'Romantic & Intimate'),
(gen_random_uuid(), 'warm', 'Warm', 'Romantic & Intimate'),

-- Dark & Mysterious
(gen_random_uuid(), 'mysterious', 'Mysterious', 'Dark & Mysterious'),
(gen_random_uuid(), 'ominous', 'Ominous', 'Dark & Mysterious'),
(gen_random_uuid(), 'creepy', 'Creepy', 'Dark & Mysterious'),
(gen_random_uuid(), 'foreboding', 'Foreboding', 'Dark & Mysterious'),
(gen_random_uuid(), 'brooding', 'Brooding', 'Dark & Mysterious'),
(gen_random_uuid(), 'tense', 'Tense', 'Dark & Mysterious'),
(gen_random_uuid(), 'haunting', 'Haunting', 'Dark & Mysterious'),
(gen_random_uuid(), 'moody', 'Moody', 'Dark & Mysterious'),
(gen_random_uuid(), 'sinister', 'Sinister', 'Dark & Mysterious'),
(gen_random_uuid(), 'suspenseful', 'Suspenseful', 'Dark & Mysterious'),
(gen_random_uuid(), 'menacing', 'Menacing', 'Dark & Mysterious'),
(gen_random_uuid(), 'eerie', 'Eerie', 'Dark & Mysterious'),
(gen_random_uuid(), 'shadowy', 'Shadowy', 'Dark & Mysterious'),

-- Groovy & Funky
(gen_random_uuid(), 'funky', 'Funky', 'Groovy & Funky'),
(gen_random_uuid(), 'smooth', 'Smooth', 'Groovy & Funky'),
(gen_random_uuid(), 'cool', 'Cool', 'Groovy & Funky'),
(gen_random_uuid(), 'retro', 'Retro', 'Groovy & Funky'),
(gen_random_uuid(), 'stylish', 'Stylish', 'Groovy & Funky'),
(gen_random_uuid(), 'sassy', 'Sassy', 'Groovy & Funky'),
(gen_random_uuid(), 'catchy', 'Catchy', 'Groovy & Funky'),
(gen_random_uuid(), 'hypnotic', 'Hypnotic', 'Groovy & Funky'),

-- Sad & Melancholic
(gen_random_uuid(), 'melancholic', 'Melancholic', 'Sad & Melancholic'),
(gen_random_uuid(), 'heartbroken', 'Heartbroken', 'Sad & Melancholic'),
(gen_random_uuid(), 'melancholy', 'Melancholy', 'Sad & Melancholic'),
(gen_random_uuid(), 'nostalgic', 'Nostalgic', 'Sad & Melancholic'),
(gen_random_uuid(), 'somber', 'Somber', 'Sad & Melancholic'),
(gen_random_uuid(), 'depressed', 'Depressed', 'Sad & Melancholic'),
(gen_random_uuid(), 'reflective', 'Reflective', 'Sad & Melancholic'),
(gen_random_uuid(), 'gloomy', 'Gloomy', 'Sad & Melancholic'),
(gen_random_uuid(), 'bitter', 'Bitter', 'Sad & Melancholic'),
(gen_random_uuid(), 'yearning', 'Yearning', 'Sad & Melancholic'),
(gen_random_uuid(), 'mournful', 'Mournful', 'Sad & Melancholic'),
(gen_random_uuid(), 'regretful', 'Regretful', 'Sad & Melancholic'),
(gen_random_uuid(), 'lonely', 'Lonely', 'Sad & Melancholic'),
(gen_random_uuid(), 'poignant', 'Poignant', 'Sad & Melancholic'),

-- Aggressive & Intense
(gen_random_uuid(), 'angry', 'Angry', 'Aggressive & Intense'),
(gen_random_uuid(), 'furious', 'Furious', 'Aggressive & Intense'),
(gen_random_uuid(), 'chaotic', 'Chaotic', 'Aggressive & Intense'),
(gen_random_uuid(), 'explosive', 'Explosive', 'Aggressive & Intense'),
(gen_random_uuid(), 'fierce', 'Fierce', 'Aggressive & Intense'),
(gen_random_uuid(), 'rebellious', 'Rebellious', 'Aggressive & Intense'),
(gen_random_uuid(), 'savage', 'Savage', 'Aggressive & Intense'),
(gen_random_uuid(), 'heavy', 'Heavy', 'Aggressive & Intense'),
(gen_random_uuid(), 'relentless', 'Relentless', 'Aggressive & Intense'),
(gen_random_uuid(), 'unstoppable', 'Unstoppable', 'Aggressive & Intense'),
(gen_random_uuid(), 'wild', 'Wild', 'Aggressive & Intense'),

-- Quirky & Fun
(gen_random_uuid(), 'wacky', 'Wacky', 'Quirky & Fun'),
(gen_random_uuid(), 'silly', 'Silly', 'Quirky & Fun'),
(gen_random_uuid(), 'bizarre', 'Bizarre', 'Quirky & Fun'),
(gen_random_uuid(), 'eccentric', 'Eccentric', 'Quirky & Fun'),
(gen_random_uuid(), 'whimsical', 'Whimsical', 'Quirky & Fun'),
(gen_random_uuid(), 'goofy', 'Goofy', 'Quirky & Fun'),
(gen_random_uuid(), 'zany', 'Zany', 'Quirky & Fun'),

-- Inspirational & Hopeful
(gen_random_uuid(), 'motivational', 'Motivational', 'Inspirational & Hopeful'),
(gen_random_uuid(), 'encouraging', 'Encouraging', 'Inspirational & Hopeful'),
(gen_random_uuid(), 'aspirational', 'Aspirational', 'Inspirational & Hopeful'),
(gen_random_uuid(), 'confident', 'Confident', 'Inspirational & Hopeful'),
(gen_random_uuid(), 'positive', 'Positive', 'Inspirational & Hopeful'),
(gen_random_uuid(), 'driving', 'Driving', 'Inspirational & Hopeful'),
(gen_random_uuid(), 'determined', 'Determined', 'Inspirational & Hopeful'),

-- Mysterious & Suspenseful
(gen_random_uuid(), 'enigmatic', 'Enigmatic', 'Mysterious & Suspenseful'),
(gen_random_uuid(), 'secretive', 'Secretive', 'Mysterious & Suspenseful'),
(gen_random_uuid(), 'cryptic', 'Cryptic', 'Mysterious & Suspenseful'),
(gen_random_uuid(), 'intriguing', 'Intriguing', 'Mysterious & Suspenseful'),
(gen_random_uuid(), 'unresolved', 'Unresolved', 'Mysterious & Suspenseful'),

-- Otherworldly & Fantasy
(gen_random_uuid(), 'mystical', 'Mystical', 'Otherworldly & Fantasy'),
(gen_random_uuid(), 'enchanted', 'Enchanted', 'Otherworldly & Fantasy'),
(gen_random_uuid(), 'magical', 'Magical', 'Otherworldly & Fantasy'),
(gen_random_uuid(), 'cosmic', 'Cosmic', 'Otherworldly & Fantasy'),
(gen_random_uuid(), 'dreamlike', 'Dreamlike', 'Otherworldly & Fantasy'),
(gen_random_uuid(), 'celestial', 'Celestial', 'Otherworldly & Fantasy');

-- Verify the data was inserted
SELECT category, COUNT(*) as mood_count FROM moods GROUP BY category ORDER BY category;
