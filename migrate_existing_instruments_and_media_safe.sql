-- Safe migration script for existing track instruments and media usage
-- Run this AFTER running create_instruments_and_media_tables_safe.sql

-- First, let's check what the instruments and media_usage columns actually contain
SELECT
    'Sample instruments data' as info,
    t.id,
    t.title,
    t.instruments,
    pg_typeof(t.instruments) as instruments_column_type
FROM tracks t
WHERE t.instruments IS NOT NULL
LIMIT 5;

SELECT
    'Sample media usage data' as info,
    t.id,
    t.title,
    t.media_usage,
    pg_typeof(t.media_usage) as media_usage_column_type
FROM tracks t
WHERE t.media_usage IS NOT NULL
LIMIT 5;

-- Create a function to safely migrate instruments
CREATE OR REPLACE FUNCTION migrate_track_instruments()
RETURNS void AS $$
DECLARE
    track_record RECORD;
    instrument_name TEXT;
    instrument_record RECORD;
    instrument_array TEXT[];
BEGIN
    -- Loop through all tracks that have instruments
    FOR track_record IN
        SELECT id, instruments
        FROM tracks
        WHERE instruments IS NOT NULL
        AND instruments != '{}'
        AND instruments != '[]'
        AND instruments != ''
    LOOP
        -- Handle different possible formats of the instruments column
        IF pg_typeof(track_record.instruments) = 'text[]'::regtype THEN
            -- It's already a text array
            instrument_array := track_record.instruments;
        ELSIF pg_typeof(track_record.instruments) = 'text'::regtype THEN
            -- It's a text field, try to parse it as comma-separated
            BEGIN
                instrument_array := string_to_array(track_record.instruments, ',');
            EXCEPTION
                WHEN OTHERS THEN
                    -- If parsing fails, treat it as a single instrument
                    instrument_array := ARRAY[track_record.instruments];
            END;
        ELSE
            -- Unknown type, skip this record
            RAISE NOTICE 'Unknown instruments column type for track %: %', track_record.id, pg_typeof(track_record.instruments);
            CONTINUE;
        END IF;

        -- Loop through each instrument in the track's instruments array
        FOREACH instrument_name IN ARRAY instrument_array
        LOOP
            -- Clean up the instrument name (remove quotes, trim whitespace)
            instrument_name := trim(both '"' from trim(instrument_name));

            -- Skip empty instruments
            IF instrument_name = '' OR instrument_name IS NULL THEN
                CONTINUE;
            END IF;

            -- Find the corresponding instrument record
            SELECT i.id INTO instrument_record
            FROM instruments i
            WHERE i.name = instrument_name OR i.display_name = instrument_name
            LIMIT 1;

            -- If we found a matching instrument, create the track_instruments relationship
            IF instrument_record.id IS NOT NULL THEN
                INSERT INTO track_instruments (track_id, instrument_id)
                VALUES (track_record.id, instrument_record.id)
                ON CONFLICT (track_id, instrument_id) DO NOTHING;
            ELSE
                -- Log unmapped instruments for manual review
                RAISE NOTICE 'Unmapped instrument found: % for track %', instrument_name, track_record.id;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a function to safely migrate media usage
CREATE OR REPLACE FUNCTION migrate_track_media_usage()
RETURNS void AS $$
DECLARE
    track_record RECORD;
    media_type_name TEXT;
    media_type_record RECORD;
    media_type_array TEXT[];
BEGIN
    -- Loop through all tracks that have media_usage
    FOR track_record IN
        SELECT id, media_usage
        FROM tracks
        WHERE media_usage IS NOT NULL
        AND media_usage != '{}'
        AND media_usage != '[]'
        AND media_usage != ''
    LOOP
        -- Handle different possible formats of the media_usage column
        IF pg_typeof(track_record.media_usage) = 'text[]'::regtype THEN
            -- It's already a text array
            media_type_array := track_record.media_usage;
        ELSIF pg_typeof(track_record.media_usage) = 'text'::regtype THEN
            -- It's a text field, try to parse it as comma-separated
            BEGIN
                media_type_array := string_to_array(track_record.media_usage, ',');
            EXCEPTION
                WHEN OTHERS THEN
                    -- If parsing fails, treat it as a single media type
                    media_type_array := ARRAY[track_record.media_usage];
            END;
        ELSE
            -- Unknown type, skip this record
            RAISE NOTICE 'Unknown media_usage column type for track %: %', track_record.id, pg_typeof(track_record.media_usage);
            CONTINUE;
        END IF;

        -- Loop through each media type in the track's media_usage array
        FOREACH media_type_name IN ARRAY media_type_array
        LOOP
            -- Clean up the media type name (remove quotes, trim whitespace)
            media_type_name := trim(both '"' from trim(media_type_name));

            -- Skip empty media types
            IF media_type_name = '' OR media_type_name IS NULL THEN
                CONTINUE;
            END IF;

            -- Find the corresponding media_type record
            SELECT mt.id INTO media_type_record
            FROM media_types mt
            WHERE mt.name = media_type_name OR mt.display_name = media_type_name
            LIMIT 1;

            -- If we found a matching media_type, create the track_media_types relationship
            IF media_type_record.id IS NOT NULL THEN
                INSERT INTO track_media_types (track_id, media_type_id)
                VALUES (track_record.id, media_type_record.id)
                ON CONFLICT (track_id, media_type_id) DO NOTHING;
            ELSE
                -- Log unmapped media types for manual review
                RAISE NOTICE 'Unmapped media type found: % for track %', media_type_name, track_record.id;
            END IF;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the migrations
SELECT migrate_track_instruments();
SELECT migrate_track_media_usage();

-- Clean up the functions
DROP FUNCTION migrate_track_instruments();
DROP FUNCTION migrate_track_media_usage();

-- Show migration results for instruments
SELECT
    'Instruments migration completed' as status,
    COUNT(*) as total_tracks_with_instruments,
    COUNT(CASE WHEN ti.track_id IS NOT NULL THEN 1 END) as tracks_migrated
FROM tracks t
LEFT JOIN track_instruments ti ON t.id = ti.track_id
WHERE t.instruments IS NOT NULL
AND t.instruments != '{}'
AND t.instruments != '[]'
AND t.instruments != '';

-- Show migration results for media usage
SELECT
    'Media usage migration completed' as status,
    COUNT(*) as total_tracks_with_media_usage,
    COUNT(CASE WHEN tmt.track_id IS NOT NULL THEN 1 END) as tracks_migrated
FROM tracks t
LEFT JOIN track_media_types tmt ON t.id = tmt.track_id
WHERE t.media_usage IS NOT NULL
AND t.media_usage != '{}'
AND t.media_usage != '[]'
AND t.media_usage != '';

-- Show sample of migrated instruments data
SELECT
    'Sample migrated instruments data' as info,
    t.title,
    t.instruments as original_instruments,
    array_agg(i.name ORDER BY i.name) as new_instruments
FROM tracks t
LEFT JOIN track_instruments ti ON t.id = ti.track_id
LEFT JOIN instruments i ON ti.instrument_id = i.id
WHERE t.instruments IS NOT NULL
AND t.instruments != '{}'
AND t.instruments != '[]'
AND t.instruments != ''
GROUP BY t.id, t.title, t.instruments
LIMIT 5;

-- Show sample of migrated media usage data
SELECT
    'Sample migrated media usage data' as info,
    t.title,
    t.media_usage as original_media_usage,
    array_agg(mt.name ORDER BY mt.name) as new_media_types
FROM tracks t
LEFT JOIN track_media_types tmt ON t.id = tmt.track_id
LEFT JOIN media_types mt ON tmt.media_type_id = mt.id
WHERE t.media_usage IS NOT NULL
AND t.media_usage != '{}'
AND t.media_usage != '[]'
AND t.media_usage != ''
GROUP BY t.id, t.title, t.media_usage
LIMIT 5;
