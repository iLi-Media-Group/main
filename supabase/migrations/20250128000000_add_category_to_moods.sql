-- Add category field to moods table and populate with existing categories
-- This migration adds the category field that the DynamicMood interface expects

-- Add category column to moods table
ALTER TABLE moods ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE moods ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing moods with categories based on the hardcoded data
UPDATE moods SET 
  category = CASE 
    WHEN name IN ('energetic', 'uplifting', 'joyful', 'cheerful', 'playful', 'optimistic', 'excited', 'celebratory', 'triumphant', 'bouncy', 'bright', 'carefree', 'euphoric', 'lively') THEN 'Happy & Upbeat'
    WHEN name IN ('peaceful', 'serene', 'soothing', 'meditative', 'dreamy', 'gentle', 'tranquil', 'ethereal', 'laid back', 'floating', 'mellow', 'soft', 'cozy', 'chill') THEN 'Calm & Relaxing'
    WHEN name IN ('dramatic', 'majestic', 'triumphant', 'victorious', 'grand', 'inspirational', 'cinematic', 'monumental', 'glorious', 'adventurous', 'powerful') THEN 'Epic & Heroic'
    WHEN name IN ('romantic', 'loving', 'passionate', 'sensual', 'tender', 'intimate', 'lustful', 'heartfelt', 'longing', 'sweet', 'sentimental', 'warm') THEN 'Romantic & Intimate'
    WHEN name IN ('mysterious', 'ominous', 'creepy', 'foreboding', 'brooding', 'tense', 'haunting', 'moody', 'sinister', 'suspenseful', 'menacing', 'eerie', 'shadowy') THEN 'Dark & Mysterious'
    WHEN name IN ('funky', 'smooth', 'cool', 'retro', 'stylish', 'sassy', 'catchy', 'hypnotic') THEN 'Groovy & Funky'
    WHEN name IN ('melancholic', 'heartbroken', 'melancholy', 'nostalgic', 'somber', 'depressed', 'reflective', 'gloomy', 'bitter', 'yearning', 'mournful', 'regretful', 'lonely', 'poignant') THEN 'Sad & Melancholic'
    WHEN name IN ('angry', 'furious', 'chaotic', 'explosive', 'fierce', 'powerful', 'rebellious', 'savage', 'heavy', 'relentless', 'unstoppable', 'wild') THEN 'Aggressive & Intense'
    WHEN name IN ('wacky', 'silly', 'playful', 'bizarre', 'eccentric', 'whimsical', 'goofy', 'zany', 'cheerful') THEN 'Quirky & Fun'
    WHEN name IN ('motivational', 'encouraging', 'aspirational', 'confident', 'positive', 'driving', 'determined') THEN 'Inspirational & Hopeful'
    WHEN name IN ('enigmatic', 'secretive', 'cryptic', 'suspenseful', 'intriguing', 'unresolved') THEN 'Mysterious & Suspenseful'
    WHEN name IN ('mystical', 'ethereal', 'enchanted', 'magical', 'cosmic', 'dreamlike', 'celestial', 'floating') THEN 'Otherworldly & Fantasy'
    ELSE 'Other'
  END,
  display_name = INITCAP(name)
WHERE category IS NULL OR display_name IS NULL;

-- Set display_name to be the same as name if it's still null
UPDATE moods SET display_name = INITCAP(name) WHERE display_name IS NULL;

-- Create index on category for better performance
CREATE INDEX IF NOT EXISTS idx_moods_category ON moods(category);

-- Add RLS policy for moods table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'moods' AND policyname = 'Moods are viewable by everyone') THEN
    CREATE POLICY "Moods are viewable by everyone" ON moods
      FOR SELECT USING (true);
  END IF;
END $$;
