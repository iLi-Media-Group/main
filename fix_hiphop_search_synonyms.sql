-- Fix Hip-Hop Search Synonyms
-- This ensures "hiphop", "hip hop", and "hip-hop" all return the same results

-- Insert or update hip-hop variations in the search_synonyms table
INSERT INTO search_synonyms (term, synonyms) 
VALUES 
  ('hiphop', ARRAY['hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'grime']),
  ('hip hop', ARRAY['hiphop', 'hip-hop', 'rap', 'trap', 'drill', 'grime']),
  ('hip-hop', ARRAY['hiphop', 'hip hop', 'rap', 'trap', 'drill', 'grime'])
ON CONFLICT (term) 
DO UPDATE SET 
  synonyms = EXCLUDED.synonyms,
  updated_at = NOW();

-- Verify the changes
SELECT 'Hip-hop synonyms updated:' as status;
SELECT term, synonyms FROM search_synonyms WHERE term IN ('hiphop', 'hip hop', 'hip-hop');
