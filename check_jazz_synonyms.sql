-- Check what jazz synonyms exist in the database
SELECT 'Current jazz synonyms:' as info;
SELECT term, synonyms FROM search_synonyms WHERE term LIKE '%jazz%' OR synonyms::text LIKE '%jazz%';

-- Check if jazz tracks exist
SELECT 'Jazz tracks in database:' as info;
SELECT COUNT(*) as jazz_track_count FROM tracks 
WHERE genres::text LIKE '%jazz%' OR sub_genres::text LIKE '%jazz%';

-- Show some jazz tracks
SELECT 'Sample jazz tracks:' as info;
SELECT id, title, genres, sub_genres FROM tracks 
WHERE genres::text LIKE '%jazz%' OR sub_genres::text LIKE '%jazz%'
LIMIT 5;
