-- Add the final missing moods found in the remaining unmapped track
-- "eccentric" and "funky" from CRYSTAL LADDERS

-- Add "eccentric" to Quirky & Fun (if not already there)
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, 'eccentric', 'Eccentric', 11
FROM moods m
WHERE m.name = 'quirky_fun'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Add "funky" to Groovy & Funky (if not already there)
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, 'funky', 'Funky', 9
FROM moods m
WHERE m.name = 'groovy_funky'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Show what was added
SELECT 
    'Added final missing moods' as status,
    m.display_name as mood_category,
    sm.name as sub_mood_name,
    sm.display_name as sub_mood_display_name
FROM sub_moods sm
JOIN moods m ON sm.mood_id = m.id
WHERE sm.name IN ('eccentric', 'funky')
ORDER BY m.display_name, sm.name;

-- Now migrate the final track
INSERT INTO track_moods (track_id, sub_mood_id)
SELECT 
    t.id as track_id,
    sm.id as sub_mood_id
FROM tracks t
CROSS JOIN LATERAL jsonb_array_elements_text(t.moods::jsonb) AS mood_name
JOIN sub_moods sm ON sm.name = mood_name
WHERE t.title = 'CRYSTAL LADDERS'
AND mood_name IN ('eccentric', 'funky')
ON CONFLICT (track_id, sub_mood_id) DO NOTHING;

-- Verify the final migration is complete
SELECT 
    'Final verification' as status,
    COUNT(*) as total_tracks_with_moods,
    COUNT(CASE WHEN tm.track_id IS NOT NULL THEN 1 END) as tracks_migrated,
    COUNT(*) - COUNT(CASE WHEN tm.track_id IS NOT NULL THEN 1 END) as tracks_not_migrated
FROM tracks t
LEFT JOIN track_moods tm ON t.id = tm.track_id
WHERE t.moods IS NOT NULL 
AND t.moods != '{}' 
AND t.moods != '[]'
AND t.moods != '';

-- Show the final migrated data for CRYSTAL LADDERS
SELECT 
    'CRYSTAL LADDERS migration' as info,
    t.title,
    t.moods as original_moods,
    array_agg(sm.name ORDER BY sm.name) as new_moods
FROM tracks t
LEFT JOIN track_moods tm ON t.id = tm.track_id
LEFT JOIN sub_moods sm ON tm.sub_mood_id = sm.id
WHERE t.title = 'CRYSTAL LADDERS'
GROUP BY t.id, t.title, t.moods;

-- Success message
SELECT 'All track moods have been successfully migrated to the new structure!' as status;
