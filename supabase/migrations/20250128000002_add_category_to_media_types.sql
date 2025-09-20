-- Add category and display_name fields to media_types table
-- This migration adds the category field that the DynamicMediaType interface expects

-- Add category and display_name columns to media_types table
ALTER TABLE media_types ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE media_types ADD COLUMN IF NOT EXISTS display_name TEXT;

-- Update existing media types with categories based on the hardcoded data
UPDATE media_types SET 
  category = CASE 
    WHEN name IN ('TV Shows', 'Films', 'Commercials', 'Documentaries', 'Music Videos', 'YouTube', 'TikTok', 'Instagram', 'Social Media') THEN 'Video Media'
    WHEN name IN ('Podcasts', 'Radio', 'Audiobooks', 'Voice-overs', 'Background Music') THEN 'Audio Media'
    WHEN name IN ('Video Games', 'Apps', 'Websites', 'Presentations') THEN 'Digital Media'
    WHEN name IN ('Live Events', 'Theater', 'Concerts', 'Performances') THEN 'Live Events'
    ELSE 'Other'
  END,
  display_name = INITCAP(name)
WHERE category IS NULL OR display_name IS NULL;

-- Set display_name to be the same as name if it's still null
UPDATE media_types SET display_name = INITCAP(name) WHERE display_name IS NULL;

-- Create index on category for better performance
CREATE INDEX IF NOT EXISTS idx_media_types_category ON media_types(category);

-- Add RLS policy for media_types table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'media_types' AND policyname = 'Media types are viewable by everyone') THEN
    CREATE POLICY "Media types are viewable by everyone" ON media_types
      FOR SELECT USING (true);
  END IF;
END $$;
