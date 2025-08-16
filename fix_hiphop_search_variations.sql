-- Fix Hip-Hop Search Variations
-- This script updates the search_synonyms table to include comprehensive variations for hip-hop genres

-- Update existing hip-hop related synonyms with comprehensive variations
UPDATE search_synonyms 
SET synonyms = ARRAY[
  'hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill', 'grime', 
  'hip hop music', 'hip-hop music', 'hiphop music', 'hip hop rap',
  'hip-hop rap', 'hiphop rap', 'rap music', 'trap music', 'drill music',
  'urban', 'street', 'gangsta', 'conscious', 'underground', 'mainstream'
]
WHERE search_term IN ('hiphop', 'hip hop', 'hip-hop');

-- Insert additional variations if they don't exist
INSERT INTO search_synonyms (search_term, synonyms)
VALUES 
  ('rap', ARRAY['hiphop', 'hip hop', 'hip-hop', 'trap', 'drill', 'grime', 'rap music', 'urban']),
  ('trap', ARRAY['hiphop', 'hip hop', 'hip-hop', 'rap', 'drill', 'trap music', 'urban']),
  ('drill', ARRAY['hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill music', 'urban'])
ON CONFLICT (search_term) DO UPDATE SET
  synonyms = EXCLUDED.synonyms;

-- Create function to normalize genre terms
CREATE OR REPLACE FUNCTION normalize_genre_term(input_term text)
RETURNS text[] AS $$
BEGIN
  -- Convert to lowercase and add common variations
  RETURN ARRAY[
    lower(input_term),
    lower(replace(input_term, ' ', '')),
    lower(replace(input_term, ' ', '-')),
    lower(replace(input_term, ' ', '_')),
    lower(replace(input_term, '-', ' ')),
    lower(replace(input_term, '-', '')),
    lower(replace(input_term, '-', '_')),
    lower(replace(input_term, '_', ' ')),
    lower(replace(input_term, '_', '-')),
    lower(replace(input_term, '_', ''))
  ];
END;
$$ LANGUAGE plpgsql;

-- Create function to search tracks with variations
CREATE OR REPLACE FUNCTION search_tracks_with_variations(search_query text, genre_filter text DEFAULT NULL, limit_count int DEFAULT 50)
RETURNS TABLE(
  id uuid,
  title text,
  artist text,
  genres text,
  sub_genres text,
  match_score numeric
) AS $$
DECLARE
  normalized_terms text[];
  expanded_terms text[];
BEGIN
  -- Normalize the search query
  normalized_terms := normalize_genre_term(search_query);
  
  -- Get expanded terms from synonyms
  SELECT array_agg(DISTINCT unnest(synonyms)) INTO expanded_terms
  FROM search_synonyms 
  WHERE search_term = ANY(normalized_terms);
  
  -- Combine normalized and expanded terms
  expanded_terms := array_cat(normalized_terms, COALESCE(expanded_terms, ARRAY[]::text[]));
  
  RETURN QUERY
  SELECT 
    t.id,
    t.title,
    t.artist,
    t.genres,
    t.sub_genres,
    CASE 
      WHEN t.genres ILIKE ANY(expanded_terms) THEN 1.0
      WHEN t.sub_genres ILIKE ANY(expanded_terms) THEN 0.8
      WHEN t.title ILIKE '%' || search_query || '%' THEN 0.6
      WHEN t.artist ILIKE '%' || search_query || '%' THEN 0.4
      ELSE 0.1
    END as match_score
  FROM tracks t
  WHERE (
    t.genres ILIKE ANY(expanded_terms) OR
    t.sub_genres ILIKE ANY(expanded_terms) OR
    t.title ILIKE '%' || search_query || '%' OR
    t.artist ILIKE '%' || search_query || '%'
  )
  AND (genre_filter IS NULL OR t.genres ILIKE '%' || genre_filter || '%')
  ORDER BY match_score DESC, t.created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to get all related terms
CREATE OR REPLACE FUNCTION get_all_related_terms(search_term text)
RETURNS text[] AS $$
DECLARE
  result text[];
BEGIN
  SELECT array_agg(DISTINCT unnest(synonyms)) INTO result
  FROM search_synonyms 
  WHERE search_term ILIKE '%' || search_term || '%';
  
  RETURN COALESCE(result, ARRAY[]::text[]);
END;
$$ LANGUAGE plpgsql;

-- Test the updated synonyms
SELECT 'Testing hip-hop variations:' as test_info;
SELECT search_term, synonyms FROM search_synonyms WHERE search_term IN ('hiphop', 'hip hop', 'hip-hop', 'rap', 'trap', 'drill');

-- Test the normalization function
SELECT 'Testing normalization:' as test_info;
SELECT normalize_genre_term('hip hop');

-- Test the search function
SELECT 'Testing search function:' as test_info;
SELECT * FROM search_tracks_with_variations('hiphop', NULL, 5);

-- Test related terms
SELECT 'Testing related terms:' as test_info;
SELECT get_all_related_terms('hiphop');
