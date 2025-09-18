-- Compare Modal Sections to Database Table Structure
-- This will help us identify what fields are missing from the modal

-- First, get the complete table structure
SELECT '=== COMPLETE TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications' 
ORDER BY ordinal_position;

-- Now let's see what data we have for the new applications
SELECT '=== NEW APPLICATIONS DATA ===' as info;
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
    instruments,
    instrument_one,
    instrument_one_proficiency,
    instrument_two,
    instrument_two_proficiency,
    instrument_three,
    instrument_three_proficiency,
    instrument_four,
    instrument_four_proficiency,
    sample_use,
    splice_use,
    loop_use,
    ai_generated_music,
    artist_collab,
    business_entity,
    pro_affiliation,
    additional_info,
    records_artists,
    artist_example_link,
    sync_licensing_course,
    quiz_question_1,
    quiz_question_2,
    quiz_question_3,
    quiz_question_4,
    quiz_question_5,
    quiz_score,
    quiz_total_questions,
    quiz_completed,
    signed_to_label,
    label_relationship_explanation,
    signed_to_publisher,
    publisher_relationship_explanation,
    signed_to_manager,
    manager_relationship_explanation,
    entity_collects_payment,
    payment_collection_explanation,
    production_master_percentage,
    ranking_score,
    ranking_breakdown,
    is_auto_rejected,
    rejection_reason,
    manual_review,
    manual_review_approved,
    requires_review,
    status,
    created_at
FROM producer_applications 
WHERE status = 'new' 
   OR status IS NULL
ORDER BY created_at DESC;

-- Check for any missing fields that should be in the modal
SELECT '=== FIELDS THAT MIGHT BE MISSING ===' as info;
SELECT 
    'first_name' as field_name,
    COUNT(CASE WHEN first_name IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'last_name' as field_name,
    COUNT(CASE WHEN last_name IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'phone' as field_name,
    COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'experience_level' as field_name,
    COUNT(CASE WHEN experience_level IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'genres' as field_name,
    COUNT(CASE WHEN genres IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'equipment' as field_name,
    COUNT(CASE WHEN equipment IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'social_media_links' as field_name,
    COUNT(CASE WHEN social_media_links IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'portfolio_links' as field_name,
    COUNT(CASE WHEN portfolio_links IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'why_join' as field_name,
    COUNT(CASE WHEN why_join IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'admin_notes' as field_name,
    COUNT(CASE WHEN admin_notes IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'spotify_link' as field_name,
    COUNT(CASE WHEN spotify_link IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'best_track_link' as field_name,
    COUNT(CASE WHEN best_track_link IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'instrument_proficiency' as field_name,
    COUNT(CASE WHEN instrument_proficiency IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'has_business_entity' as field_name,
    COUNT(CASE WHEN has_business_entity IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'auto_disqualified' as field_name,
    COUNT(CASE WHEN auto_disqualified IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications
UNION ALL
SELECT 
    'review_tier' as field_name,
    COUNT(CASE WHEN review_tier IS NOT NULL THEN 1 END) as has_data,
    COUNT(*) as total
FROM producer_applications;
