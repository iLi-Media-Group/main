-- Extract all data for Algolia JSON creation
-- This script will get all genres, sub-genres, moods, and instruments

-- Get all genres
SELECT DISTINCT 
    'genre' as type,
    name as value
FROM genres 
ORDER BY name;

-- Get all sub-genres
SELECT DISTINCT 
    'sub_genre' as type,
    name as value
FROM sub_genres 
ORDER BY name;

-- Get all moods
SELECT DISTINCT 
    'mood' as type,
    name as value
FROM moods 
ORDER BY name;

-- Get all instrument categories
SELECT DISTINCT 
    'instrument_category' as type,
    ic.name as value
FROM instrument_categories ic
ORDER BY ic.name;

-- Get all instruments
SELECT DISTINCT 
    'instrument' as type,
    i.name as value,
    ic.name as category
FROM instruments i
JOIN instrument_categories ic ON i.category_id = ic.id
ORDER BY ic.name, i.name;

-- Get all data in one comprehensive view
SELECT 
    'genre' as type,
    name as value,
    NULL as category
FROM genres 
UNION ALL
SELECT 
    'sub_genre' as type,
    name as value,
    NULL as category
FROM sub_genres 
UNION ALL
SELECT 
    'mood' as type,
    name as value,
    NULL as category
FROM moods 
UNION ALL
SELECT 
    'instrument_category' as type,
    ic.name as value,
    NULL as category
FROM instrument_categories ic
UNION ALL
SELECT 
    'instrument' as type,
    i.name as value,
    ic.name as category
FROM instruments i
JOIN instrument_categories ic ON i.category_id = ic.id
ORDER BY type, value;
