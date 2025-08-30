-- Simple Test Data Insert
-- This script will help us debug why the previous insert didn't work

-- First, let's see the exact table structure
SELECT 'Table Structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position;

-- Try a minimal insert with just required fields
SELECT 'Attempting minimal insert:' as info;
INSERT INTO producer_applications (
    name,
    email,
    primary_genre,
    status
) VALUES (
    'Test Producer',
    'test@example.com',
    'Hip Hop',
    'new'
);

-- Check if it worked
SELECT 'After minimal insert:' as info;
SELECT COUNT(*) as total_count FROM producer_applications;

-- Show the inserted record
SELECT 'Inserted record:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
WHERE email = 'test@example.com';

-- If that worked, let's try the full insert
SELECT 'Attempting full insert:' as info;
INSERT INTO producer_applications (
    name,
    email,
    primary_genre,
    secondary_genre,
    years_experience,
    daws_used,
    team_type,
    tracks_per_week,
    spotify_link,
    instrument_one,
    instrument_one_proficiency,
    instrument_two,
    instrument_two_proficiency,
    records_artists,
    artist_example_link,
    sample_use,
    splice_use,
    loop_use,
    ai_generated_music,
    artist_collab,
    business_entity,
    pro_affiliation,
    additional_info,
    status
) VALUES (
    'John Producer',
    'john.producer@example.com',
    'Hip Hop',
    'R&B',
    5,
    'Logic Pro, Ableton',
    'solo',
    4,
    'https://open.spotify.com/artist/test1',
    'Piano',
    'pro',
    'Drums',
    'intermediate',
    'Yes',
    'John Smith - Hip Hop Artist',
    'Yes',
    'Yes',
    'Sometimes',
    'No',
    'Yes',
    'Yes',
    'ASCAP',
    'Experienced producer looking for sync opportunities',
    'new'
);

-- Check final count
SELECT 'Final count:' as info;
SELECT COUNT(*) as total_count FROM producer_applications;

-- Show all records
SELECT 'All records:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
ORDER BY created_at DESC; 