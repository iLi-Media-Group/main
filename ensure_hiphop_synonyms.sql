-- Ensure Hip-Hop Search Variations Work Consistently
-- This script ensures that "hiphop", "hip hop", and "hip-hop" all return the same results

-- First, let's check what's currently in the search_synonyms table
SELECT 'Current synonyms for hip-hop variations:' as info;
SELECT term, synonyms FROM search_synonyms WHERE term IN ('hiphop', 'hip hop', 'hip-hop');

-- Insert or update hip-hop variations to ensure consistency
INSERT INTO search_synonyms (term, synonyms) 
VALUES 
  ('hiphop', ARRAY['hip hop', 'hip-hop', 'hip_hop_rap', 'rap', 'trap', 'drill', 'grime']),
  ('hip hop', ARRAY['hiphop', 'hip-hop', 'hip_hop_rap', 'rap', 'trap', 'drill', 'grime']),
  ('hip-hop', ARRAY['hiphop', 'hip hop', 'hip_hop_rap', 'rap', 'trap', 'drill', 'grime'])
ON CONFLICT (term) 
DO UPDATE SET 
  synonyms = EXCLUDED.synonyms,
  updated_at = NOW();

-- Verify the changes
SELECT 'Updated synonyms for hip-hop variations:' as info;
SELECT term, synonyms FROM search_synonyms WHERE term IN ('hiphop', 'hip hop', 'hip-hop');

-- Test the search expansion
SELECT 'Testing search expansion for hiphop:' as test;
SELECT 'hiphop' as search_term, ARRAY_AGG(DISTINCT unnest(synonyms)) as expanded_terms 
FROM search_synonyms WHERE term = 'hiphop';

SELECT 'Testing search expansion for hip hop:' as test;
SELECT 'hip hop' as search_term, ARRAY_AGG(DISTINCT unnest(synonyms)) as expanded_terms 
FROM search_synonyms WHERE term = 'hip hop';

SELECT 'Testing search expansion for hip-hop:' as test;
SELECT 'hip-hop' as search_term, ARRAY_AGG(DISTINCT unnest(synonyms)) as expanded_terms 
FROM search_synonyms WHERE term = 'hip-hop';
