-- Add Test Producer Applications
-- This script adds some test applications if there are none in the database

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
    instruments,
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
    '3-5',
    'https://open.spotify.com/artist/test1',
    'Piano, Drums',
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
    '2-3',
    'https://open.spotify.com/artist/test2',
    'Guitar, Bass',
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
    '1-2',
    'https://open.spotify.com/artist/test3',
    'Piano, Strings',
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