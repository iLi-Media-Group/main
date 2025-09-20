-- Safe migration script for existing track moods
-- Run this AFTER running create_mood_tables_safe.sql

-- First, let's check what the moods column actually contains
SELECT 
    'Sample moods data' as info,
    t.id,
    t.title,
    t.moods,
    pg_typeof(t.moods) as mood_column_type
FROM tracks t 
WHERE t.moods IS NOT NULL 
LIMIT 5;

-- Create a function to safely migrate moods
CREATE OR REPLACE FUNCTION migrate_track_moods()
RETURNS void AS $$
DECLARE
    track_record RECORD;
    mood_name TEXT;
    sub_mood_record RECORD;
    mood_array TEXT[];
BEGIN
    -- Loop through all tracks that have moods
    FOR track_record IN 
        SELECT id, moods 
        FROM tracks 
        WHERE moods IS NOT NULL 
        AND moods != '{}' 
        AND moods != '[]'
        AND moods != ''
    LOOP
        -- Handle different possible formats of the moods column
        IF pg_typeof(track_record.moods) = 'text[]'::regtype THEN
            -- It's already a text array
            mood_array := track_record.moods;
        ELSIF pg_typeof(track_record.moods) = 'text'::regtype THEN
            -- It's a text field, try to parse it as JSON array
            BEGIN
                mood_array := string_to_array(track_record.moods, ',');
            EXCEPTION
                WHEN OTHERS THEN
                    -- If parsing fails, treat it as a single mood
                    mood_array := ARRAY[track_record.moods];
            END;
        ELSE
            -- Unknown type, skip this record
            RAISE NOTICE 'Unknown mood column type for track %: %', track_record.id, pg_typeof(track_record.moods);
            CONTINUE;
        END IF;
        
        -- Loop through each mood in the track's moods array
        FOREACH mood_name IN ARRAY mood_array
        LOOP
            -- Clean up the mood name (remove quotes, trim whitespace)
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
                RAISE NOTICE 'Unmapped mood found: % for track %', mood_name, track_record.id;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migration
SELECT migrate_track_moods();

-- Clean up the function
DROP FUNCTION migrate_track_moods();

-- Show migration results
SELECT 
    'Migration completed' as status,
    COUNT(*) as total_tracks_with_moods,
    COUNT(CASE WHEN tm.track_id IS NOT NULL THEN 1 END) as tracks_migrated
FROM tracks t
LEFT JOIN track_moods tm ON t.id = tm.track_id
WHERE t.moods IS NOT NULL 
AND t.moods != '{}' 
AND t.moods != '[]'
AND t.moods != '';

-- Show sample of migrated data
SELECT 
    'Sample migrated data' as info,
    t.title,
    t.moods as original_moods,
    array_agg(sm.name ORDER BY sm.name) as new_moods
FROM tracks t
LEFT JOIN track_moods tm ON t.id = tm.track_id
LEFT JOIN sub_moods sm ON tm.sub_mood_id = sm.id
WHERE t.moods IS NOT NULL 
AND t.moods != '{}' 
AND t.moods != '[]'
AND t.moods != ''
GROUP BY t.id, t.title, t.moods
LIMIT 5;
