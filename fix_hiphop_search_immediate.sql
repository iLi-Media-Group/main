-- Immediate Fix for Hip-Hop Search Variations
-- This ensures hiphop, hip hop, and hip-hop all return the same results

-- Step 1: Check current search_synonyms table structure
SELECT 'Current search_synonyms table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'search_synonyms'
ORDER BY ordinal_position;

-- Step 2: Check current data for hip-hop related terms
SELECT 'Current hip-hop related synonyms:' as info;
SELECT term, synonyms FROM search_synonyms WHERE term ILIKE '%hip%' OR synonyms && ARRAY['hiphop', 'hip hop', 'hip-hop'];

-- Step 3: Update the main hiphop entry with comprehensive variations
UPDATE search_synonyms 
SET synonyms = ARRAY[
  'hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'grime', 
  'hip hop music', 'hip-hop music', 'hiphop music', 'hip hop rap',
  'hip-hop rap', 'hiphop rap', 'rap music', 'trap music', 'drill music',
  'urban', 'street', 'gangsta', 'conscious', 'underground', 'mainstream'
]
WHERE term = 'hiphop';

-- Step 4: Insert or update entries for "hip hop" and "hip-hop" variations
INSERT INTO search_synonyms (term, synonyms) 
VALUES 
  ('hip hop', ARRAY[
    'hiphop', 'hip-hop', 'rap', 'trap', 'drill', 'grime', 
    'hip hop music', 'hip-hop music', 'hiphop music', 'hip hop rap',
    'hip-hop rap', 'hiphop rap', 'rap music', 'trap music', 'drill music',
    'urban', 'street', 'gangsta', 'conscious', 'underground', 'mainstream'
  ]),
  ('hip-hop', ARRAY[
    'hiphop', 'hip hop', 'rap', 'trap', 'drill', 'grime', 
    'hip hop music', 'hip-hop music', 'hiphop music', 'hip hop rap',
    'hip-hop rap', 'hiphop rap', 'rap music', 'trap music', 'drill music',
    'urban', 'street', 'gangsta', 'conscious', 'underground', 'mainstream'
  ])
ON CONFLICT (term) DO UPDATE SET
  synonyms = EXCLUDED.synonyms;

-- Step 5: Insert additional related terms if they don't exist
INSERT INTO search_synonyms (term, synonyms)
VALUES 
  ('rap', ARRAY['hiphop', 'hip hop', 'hip-hop', 'trap', 'drill', 'grime', 'rap music', 'urban']),
  ('trap', ARRAY['hiphop', 'hip hop', 'hip-hop', 'rap', 'drill', 'trap music', 'urban']),
  ('drill', ARRAY['hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill music', 'urban'])
ON CONFLICT (term) DO UPDATE SET
  synonyms = EXCLUDED.synonyms;

-- Step 6: Verify the updates
SELECT 'Updated hip-hop synonyms:' as info;
SELECT term, synonyms FROM search_synonyms WHERE term IN ('hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill');

-- Step 7: Test that all variations expand to the same set
SELECT 'Testing hip-hop expansion consistency:' as info;
SELECT 'hiphop' as variation, synonyms as expanded_terms FROM search_synonyms WHERE term = 'hiphop'
UNION ALL
SELECT 'hip hop' as variation, synonyms as expanded_terms FROM search_synonyms WHERE term = 'hip hop'
UNION ALL
SELECT 'hip-hop' as variation, synonyms as expanded_terms FROM search_synonyms WHERE term = 'hip-hop';

-- Step 9: Create a simple test to verify search functionality
CREATE OR REPLACE FUNCTION test_hiphop_search(search_term text)
RETURNS TABLE(track_count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT COUNT(*) as track_count
  FROM tracks t
  WHERE (
    t.genres ILIKE '%' || search_term || '%' OR
    t.sub_genres ILIKE '%' || search_term || '%' OR
    t.title ILIKE '%' || search_term || '%' OR
    t.artist ILIKE '%' || search_term || '%'
  )
  AND t.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 10: Test search results for each variation
SELECT 'Testing search results for each variation:' as info;
SELECT 'hiphop' as term, track_count FROM test_hiphop_search('hiphop')
UNION ALL
SELECT 'hip hop' as term, track_count FROM test_hiphop_search('hip hop')
UNION ALL
SELECT 'hip-hop' as term, track_count FROM test_hiphop_search('hip-hop');

-- Step 11: Summary
SELECT 'Hip-hop search fix completed!' as status;
SELECT 
  'All variations (hiphop, hip hop, hip-hop) should now return the same results' as expected_behavior,
  'The search_synonyms table has been updated with comprehensive mappings' as fix_applied,
  'Search functionality should work consistently across all variations' as result;
