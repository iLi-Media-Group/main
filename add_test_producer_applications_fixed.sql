-- Add Test Producer Applications (Fixed Data Types)
-- This script adds some test applications with correct data types

-- First, check if there are any applications
SELECT 'Current Applications Count:' as info;
SELECT COUNT(*) as total_applications FROM producer_applications;

-- Add test applications if there are none
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
    -- New individual instrument fields
    instrument_one,
    instrument_one_proficiency,
    instrument_two,
    instrument_two_proficiency,
    instrument_three,
    instrument_three_proficiency,
    instrument_four,
    instrument_four_proficiency,
    -- New recording artists fields
    records_artists,
    artist_example_link,
    -- Original fields
    sample_use,
    splice_use,
    loop_use,
    ai_generated_music,
    artist_collab,
    business_entity,
    pro_affiliation,
    additional_info,
    status,
    review_tier,
    auto_disqualified,
    created_at
) VALUES 
(
    'John Producer',
    'john.producer@example.com',
    'Hip Hop',
    'R&B',
    '5',
    'Logic Pro, Ableton',
    'solo',
    '3-5 tracks per week',
    'https://open.spotify.com/artist/test1',
    'Piano',
    'pro',
    'Drums',
    'intermediate',
    'Guitar',
    'beginner',
    NULL,
    NULL,
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
    'new',
    NULL,
    false,
    NOW() - INTERVAL '2 days'
),
(
    'Sarah Beatmaker',
    'sarah.beatmaker@example.com',
    'Pop',
    'Electronic',
    '3',
    'FL Studio, Pro Tools',
    'small_team',
    '2-3 tracks per week',
    'https://open.spotify.com/artist/test2',
    'Guitar',
    'intermediate',
    'Bass',
    'pro',
    'Synthesizer',
    'intermediate',
    NULL,
    NULL,
    'No',
    NULL,
    'No',
    'Yes',
    'Yes',
    'Sometimes',
    'No',
    'No',
    'BMI',
    'Upcoming producer with fresh sound',
    'new',
    NULL,
    false,
    NOW() - INTERVAL '1 day'
),
(
    'Mike Composer',
    'mike.composer@example.com',
    'Film Score',
    'Classical',
    '8',
    'Cubase, Logic Pro',
    'solo',
    '1-2 tracks per week',
    'https://open.spotify.com/artist/test3',
    'Piano',
    'pro',
    'Strings',
    'pro',
    'Orchestra',
    'intermediate',
    NULL,
    NULL,
    'Yes',
    'Film Production Company',
    'No',
    'No',
    'No',
    'No',
    'Yes',
    'Yes',
    'SESAC',
    'Film composer with orchestral experience',
    'invited',
    'tier_1',
    false,
    NOW() - INTERVAL '3 days'
)
ON CONFLICT DO NOTHING;

-- Verify the applications were added
SELECT 'Applications After Adding Test Data:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

-- Count by status
SELECT 'Applications by Status:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC; 