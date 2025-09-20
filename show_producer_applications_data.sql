-- Show all data in producer_applications table
SELECT 'All Producer Applications:' as info;

-- Show basic info for all records
SELECT 
    id,
    name,
    email,
    primary_genre,
    secondary_genre,
    years_experience,
    status,
    review_tier,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

-- Show detailed info for the first record
SELECT 'Detailed Info for First Record:' as info;
SELECT 
    id,
    name,
    email,
    primary_genre,
    secondary_genre,
    years_experience,
    daws_used,
    team_type,
    tracks_per_week,
    spotify_link,
    -- New instrument fields
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
FROM producer_applications 
ORDER BY created_at DESC 
LIMIT 1;

-- Count by status
SELECT 'Applications by Status:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;

-- Show total count
SELECT 'Total Applications:' as info;
SELECT COUNT(*) as total_count FROM producer_applications; 