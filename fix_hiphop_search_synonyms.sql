-- Comprehensive Genre and Sub-Genre Search Synonyms
-- This ensures accurate search results for ALL genres and sub-genres

-- Main genre variations (cross-reference each other)
INSERT INTO search_synonyms (term, synonyms) 
VALUES 
  -- Hip-Hop variations
  ('hiphop', ARRAY['hip hop', 'hip-hop']),
  ('hip hop', ARRAY['hiphop', 'hip-hop']),
  ('hip-hop', ARRAY['hiphop', 'hip hop']),
  
  -- Country variations
  ('country', ARRAY['country music', 'country western']),
  ('country western', ARRAY['country', 'country music']),
  
  -- Rock variations
  ('rock', ARRAY['rock music', 'rock and roll']),
  ('rock and roll', ARRAY['rock', 'rock music']),
  
  -- R&B variations
  ('rnb', ARRAY['r&b', 'rhythm and blues']),
  ('r&b', ARRAY['rnb', 'rhythm and blues']),
  ('rhythm and blues', ARRAY['rnb', 'r&b']),
  
  -- Electronic variations
  ('edm', ARRAY['electronic dance music', 'electronic']),
  ('electronic dance music', ARRAY['edm', 'electronic']),
  ('electronic', ARRAY['edm', 'electronic dance music'])
ON CONFLICT (term) 
DO UPDATE SET 
  synonyms = EXCLUDED.synonyms;

-- Specific sub-genre synonyms (NO cross-referencing to main genres)
INSERT INTO search_synonyms (term, synonyms) 
VALUES 
  -- Hip-Hop sub-genres
  ('drill', ARRAY['drill rap', 'drill music', 'uk drill', 'chicago drill']),
  ('trap', ARRAY['trap rap', 'trap music', 'southern trap']),
  ('grime', ARRAY['grime rap', 'grime music', 'uk grime']),
  ('conscious', ARRAY['conscious rap', 'conscious hip hop']),
  ('gangsta', ARRAY['gangsta rap', 'gangster rap']),
  
  -- Country sub-genres
  ('honky tonk', ARRAY['honky-tonk', 'honkytonk', 'honky tonk country']),
  ('bluegrass', ARRAY['bluegrass music', 'traditional bluegrass']),
  ('outlaw', ARRAY['outlaw country', 'outlaw music']),
  ('nashville', ARRAY['nashville sound', 'nashville country']),
  
  -- Rock sub-genres
  ('classic rock', ARRAY['classic rock music', 'vintage rock']),
  ('hard rock', ARRAY['hard rock music', 'heavy rock']),
  ('soft rock', ARRAY['soft rock music', 'mellow rock']),
  ('punk', ARRAY['punk rock', 'punk music']),
  ('metal', ARRAY['heavy metal', 'metal music']),
  
  -- Electronic sub-genres
  ('techno', ARRAY['techno music', 'detroit techno']),
  ('house', ARRAY['house music', 'chicago house']),
  ('trance', ARRAY['trance music', 'progressive trance']),
  ('dubstep', ARRAY['dubstep music', 'british dubstep']),
  
  -- Jazz sub-genres
  ('bebop', ARRAY['bebop jazz', 'bebop music']),
  ('smooth jazz', ARRAY['smooth jazz music', 'contemporary jazz']),
  ('fusion', ARRAY['jazz fusion', 'fusion music']),
  
  -- Pop sub-genres
  ('indie pop', ARRAY['indie pop music', 'independent pop']),
  ('synthpop', ARRAY['synthpop music', 'synthesizer pop']),
  ('electropop', ARRAY['electropop music', 'electronic pop'])
ON CONFLICT (term) 
DO UPDATE SET 
  synonyms = EXCLUDED.synonyms;

-- Verify the changes
SELECT 'Hip-hop synonyms updated:' as status;
SELECT term, synonyms FROM search_synonyms WHERE term IN ('hiphop', 'hip hop', 'hip-hop');
