-- Fix Search Synonyms Issue
-- This script ensures that hiphop, hip hop, and hip-hop all return the same results

-- Step 1: Check current synonyms data
SELECT 'Current search synonyms:' as info;
SELECT term, synonyms FROM search_synonyms WHERE term ILIKE '%hip%' OR synonyms && ARRAY['hiphop', 'hip hop', 'hip-hop'];

-- Step 2: Update the hiphop entry to ensure all variations are included
UPDATE search_synonyms 
SET synonyms = ARRAY['rap', 'trap', 'drill', 'grime', 'hip hop', 'hip-hop', 'hiphop', 'hip hop music', 'hip-hop music', 'hiphop music']
WHERE term = 'hiphop';

-- Step 3: Add reverse mappings to ensure all variations point to the same synonyms
-- This ensures that searching for "hip hop" or "hip-hop" will find the same results as "hiphop"

-- First, let's see if there are any existing entries for "hip hop" or "hip-hop"
SELECT 'Existing entries for hip hop variations:' as info;
SELECT term, synonyms FROM search_synonyms WHERE term IN ('hip hop', 'hip-hop');

-- Step 4: Insert or update entries for "hip hop" and "hip-hop" to point to the same synonyms
INSERT INTO search_synonyms (term, synonyms) 
VALUES 
  ('hip hop', ARRAY['rap', 'trap', 'drill', 'grime', 'hiphop', 'hip-hop', 'hip hop music', 'hip-hop music', 'hiphop music']),
  ('hip-hop', ARRAY['rap', 'trap', 'drill', 'grime', 'hiphop', 'hip hop', 'hip hop music', 'hip-hop music', 'hiphop music'])
ON CONFLICT (term) DO UPDATE SET
  synonyms = EXCLUDED.synonyms,
  updated_at = NOW();

-- Step 5: Verify the synonyms are correctly set
SELECT 'Updated search synonyms:' as info;
SELECT term, synonyms FROM search_synonyms WHERE term IN ('hiphop', 'hip hop', 'hip-hop');

-- Step 6: Test the synonym expansion by creating a test function
CREATE OR REPLACE FUNCTION test_synonym_expansion(search_term text)
RETURNS TABLE(term text, synonyms text[]) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.term,
    ss.synonyms
  FROM search_synonyms ss
  WHERE ss.term ILIKE '%' || search_term || '%'
     OR search_term = ANY(ss.synonyms)
     OR EXISTS (
       SELECT 1 FROM unnest(ss.synonyms) s 
       WHERE s ILIKE '%' || search_term || '%'
     );
END;
$$ LANGUAGE plpgsql;

-- Step 7: Test the synonym expansion for our target terms
SELECT 'Testing synonym expansion for hiphop:' as info;
SELECT * FROM test_synonym_expansion('hiphop');

SELECT 'Testing synonym expansion for hip hop:' as info;
SELECT * FROM test_synonym_expansion('hip hop');

SELECT 'Testing synonym expansion for hip-hop:' as info;
SELECT * FROM test_synonym_expansion('hip-hop');

-- Step 8: Create a comprehensive synonym lookup function for the search API
CREATE OR REPLACE FUNCTION get_expanded_search_terms(search_terms text[])
RETURNS text[] AS $$
DECLARE
  expanded_terms text[] := '{}';
  term text;
  synonym_row record;
BEGIN
  -- Add original terms
  expanded_terms := search_terms;
  
  -- For each search term, find all related synonyms
  FOREACH term IN ARRAY search_terms
  LOOP
    -- Find direct matches (term is a main term)
    FOR synonym_row IN 
      SELECT term as main_term, synonyms 
      FROM search_synonyms 
      WHERE term ILIKE '%' || term || '%'
    LOOP
      expanded_terms := expanded_terms || synonym_row.main_term;
      expanded_terms := expanded_terms || synonym_row.synonyms;
    END LOOP;
    
    -- Find reverse matches (term is a synonym)
    FOR synonym_row IN 
      SELECT term as main_term, synonyms 
      FROM search_synonyms 
      WHERE term = ANY(synonyms) OR EXISTS (
        SELECT 1 FROM unnest(synonyms) s 
        WHERE s ILIKE '%' || term || '%'
      )
    LOOP
      expanded_terms := expanded_terms || synonym_row.main_term;
      expanded_terms := expanded_terms || synonym_row.synonyms;
    END LOOP;
  END LOOP;
  
  -- Remove duplicates and return
  RETURN ARRAY(
    SELECT DISTINCT unnest(expanded_terms)
    ORDER BY unnest(expanded_terms)
  );
END;
$$ LANGUAGE plpgsql;

-- Step 9: Test the comprehensive synonym expansion
SELECT 'Testing comprehensive synonym expansion:' as info;
SELECT get_expanded_search_terms(ARRAY['hiphop']) as hiphop_terms;
SELECT get_expanded_search_terms(ARRAY['hip hop']) as hip_hop_terms;
SELECT get_expanded_search_terms(ARRAY['hip-hop']) as hip_hyphen_hop_terms;

-- Step 10: Summary of the fix
SELECT 'Summary of the synonym fix:' as info;
SELECT 
  'All variations of hip hop should now return the same results' as fix_description,
  'hiphop, hip hop, hip-hop will all expand to the same synonym set' as expected_behavior,
  'Search results should be consistent across all variations' as result;
