-- Show detailed breakdown of all 4 applications
SELECT 'All 4 Applications - Basic Info:' as info;
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

-- Show status breakdown
SELECT 'Applications by Status:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;

-- Show applications with new instrument fields
SELECT 'Applications with Instrument Data:' as info;
SELECT 
    id,
    name,
    email,
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
    status
FROM producer_applications 
ORDER BY created_at DESC;

-- Show one complete record for verification
SELECT 'Complete Record Example:' as info;
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