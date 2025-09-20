-- Test Auto-Rejection Logic
-- This script adds a test application that should be auto-rejected

-- Add a test application that should be auto-rejected
-- (uses AI-generated music, which is a disqualifier)
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
    instrument_three,
    instrument_three_proficiency,
    instrument_four,
    instrument_four_proficiency,
    records_artists,
    artist_example_link,
    sample_use,
    splice_use,
    loop_use,
    ai_generated_music,  -- This should trigger auto-rejection
    artist_collab,
    business_entity,
    pro_affiliation,
    additional_info,
    status,
    review_tier,
    auto_disqualified,
    created_at
) VALUES (
    'AI Music Producer',
    'ai.music@example.com',
    'Electronic',
    'Pop',
    '2',
    'FL Studio',
    'solo',
    '1-2 tracks per week',
    'https://open.spotify.com/artist/ai-test',
    'Synthesizer',
    'intermediate',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    'No',
    NULL,
    'Yes',
    'Yes',
    'Frequently',
    'Yes',  -- This should trigger auto-rejection
    'No',
    'No',
    'BMI',
    'Producer who uses AI to generate music',
    'new',
    NULL,
    false,
    NOW() - INTERVAL '1 hour'
);

-- Verify the application was added
SELECT 'Test Application Added:' as info;
SELECT 
    id,
    name,
    email,
    ai_generated_music,
    status,
    is_auto_rejected,
    created_at
FROM producer_applications 
WHERE email = 'ai.music@example.com';

-- Check all applications by status
SELECT 'All Applications by Status:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;

-- Check for auto-rejected applications
SELECT 'Auto-Rejected Applications:' as info;
SELECT 
    name,
    email,
    status,
    is_auto_rejected,
    ai_generated_music,
    created_at
FROM producer_applications 
WHERE is_auto_rejected = true OR ai_generated_music = 'Yes'; 