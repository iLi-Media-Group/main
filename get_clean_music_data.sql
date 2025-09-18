-- Clean list of all music data
-- This gives you a simple, organized view of all your music categories

-- ========================================
-- GENRES
-- ========================================
SELECT 'GENRES' as category, name as item FROM genres ORDER BY name;

-- ========================================
-- SUB-GENRES  
-- ========================================
SELECT 'SUB-GENRES' as category, name as item FROM sub_genres ORDER BY name;

-- ========================================
-- MOODS
-- ========================================
SELECT 'MOODS' as category, name as item FROM moods ORDER BY name;

-- ========================================
-- INSTRUMENT CATEGORIES
-- ========================================
SELECT 'INSTRUMENT CATEGORIES' as category, name as item FROM instrument_categories ORDER BY name;

-- ========================================
-- INSTRUMENTS (with categories)
-- ========================================
SELECT 
    'INSTRUMENTS' as category,
    i.name as item,
    ic.name as subcategory
FROM instruments i
JOIN instrument_categories ic ON i.category_id = ic.id
ORDER BY ic.name, i.name;

-- ========================================
-- COMPLETE LIST (all in one view)
-- ========================================
SELECT 'GENRE' as type, name as value, NULL as category FROM genres
UNION ALL
SELECT 'SUB-GENRE' as type, name as value, NULL as category FROM sub_genres  
UNION ALL
SELECT 'MOOD' as type, name as value, NULL as category FROM moods
UNION ALL
SELECT 'INSTRUMENT_CATEGORY' as type, name as value, NULL as category FROM instrument_categories
UNION ALL
SELECT 'INSTRUMENT' as type, i.name as value, ic.name as category 
FROM instruments i
JOIN instrument_categories ic ON i.category_id = ic.id
ORDER BY type, value;
