-- Add missing moods that were found in existing track data
-- Run this after the migration to ensure all existing moods are available

-- Add missing sub-moods that were found in the migration results

-- Add "savage" to Aggressive & Intense (if not already there)
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, 'savage', 'Savage', 13
FROM moods m
WHERE m.name = 'aggressive_intense'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Add "heavy" to Aggressive & Intense (if not already there)
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, 'heavy', 'Heavy', 14
FROM moods m
WHERE m.name = 'aggressive_intense'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Add "sensual" to Romantic & Intimate (if not already there)
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, 'sensual', 'Sensual', 13
FROM moods m
WHERE m.name = 'romantic_intimate'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Add "lustful" to Romantic & Intimate (if not already there)
INSERT INTO sub_moods (mood_id, name, display_name, display_order)
SELECT m.id, 'lustful', 'Lustful', 14
FROM moods m
WHERE m.name = 'romantic_intimate'
ON CONFLICT (mood_id, name) DO NOTHING;

-- Show what was added
SELECT 
    'Added missing moods' as status,
    m.display_name as mood_category,
    sm.name as sub_mood_name,
    sm.display_name as sub_mood_display_name
FROM sub_moods sm
JOIN moods m ON sm.mood_id = m.id
WHERE sm.name IN ('savage', 'heavy', 'sensual', 'lustful')
ORDER BY m.display_name, sm.name;

-- Now re-run the migration for any tracks that had unmapped moods
-- Create a function to migrate remaining unmapped moods
CREATE OR REPLACE FUNCTION migrate_remaining_moods()
RETURNS void AS $$
DECLARE
    track_record RECORD;
    mood_name TEXT;
    sub_mood_record RECORD;
    mood_array TEXT[];
BEGIN
    -- Loop through all tracks that have moods but no track_moods relationships
    FOR track_record IN 
        SELECT DISTINCT t.id, t.moods 
        FROM tracks t
        LEFT JOIN track_moods tm ON t.id = tm.track_id
        WHERE t.moods IS NOT NULL 
        AND t.moods != '{}' 
        AND t.moods != '[]'
        AND t.moods != ''
        AND tm.track_id IS NULL
    LOOP
        -- Handle different possible formats of the moods column
        IF pg_typeof(track_record.moods) = 'text[]'::regtype THEN
            mood_array := track_record.moods;
        ELSIF pg_typeof(track_record.moods) = 'text'::regtype THEN
            BEGIN
                mood_array := string_to_array(track_record.moods, ',');
            EXCEPTION
                WHEN OTHERS THEN
                    mood_array := ARRAY[track_record.moods];
            END;
        ELSE
            CONTINUE;
        END IF;
        
        -- Loop through each mood in the track's moods array
        FOREACH mood_name IN ARRAY mood_array
        LOOP
            -- Clean up the mood name
            mood_name := trim(both '"' from trim(mood_name));
            
            -- Skip empty moods
            IF mood_name = '' OR mood_name IS NULL THEN
                CONTINUE;
            END IF;
            
            -- Find the corresponding sub_mood record
            SELECT sm.id INTO sub_mood_record
            FROM sub_moods sm
            WHERE sm.name = mood_name
            LIMIT 1;
            
            -- If we found a matching sub_mood, create the track_moods relationship
            IF sub_mood_record.id IS NOT NULL THEN
                INSERT INTO track_moods (track_id, sub_mood_id)
                VALUES (track_record.id, sub_mood_record.id)
                ON CONFLICT (track_id, sub_mood_id) DO NOTHING;
            ELSE
                -- Log unmapped moods for manual review
                RAISE NOTICE 'Still unmapped mood found: % for track %', mood_name, track_record.id;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the remaining migration
SELECT migrate_remaining_moods();

-- Clean up the function
DROP FUNCTION migrate_remaining_moods();

-- Show final migration results
SELECT 
    'Final migration results' as status,
    COUNT(*) as total_tracks_with_moods,
    COUNT(CASE WHEN tm.track_id IS NOT NULL THEN 1 END) as tracks_migrated,
    COUNT(*) - COUNT(CASE WHEN tm.track_id IS NOT NULL THEN 1 END) as tracks_not_migrated
FROM tracks t
LEFT JOIN track_moods tm ON t.id = tm.track_id
WHERE t.moods IS NOT NULL 
AND t.moods != '{}' 
AND t.moods != '[]'
AND t.moods != '';

-- Show any remaining unmapped moods
SELECT 
    'Remaining unmapped moods' as info,
    t.title,
    t.moods as original_moods
FROM tracks t
LEFT JOIN track_moods tm ON t.id = tm.track_id
WHERE t.moods IS NOT NULL 
AND t.moods != '{}' 
AND t.moods != '[]'
AND t.moods != ''
AND tm.track_id IS NULL
LIMIT 10;
