-- Run Producer Applications Fix
-- This script will populate all missing data and calculate proper scores

-- First, let's see what we have
SELECT 'Current state before fix:' as info;
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN quiz_score > 0 THEN 1 END) as applications_with_scores,
    COUNT(CASE WHEN ranking_score > 0 THEN 1 END) as applications_with_rankings,
    COUNT(CASE WHEN is_auto_rejected = TRUE THEN 1 END) as auto_rejected,
    COUNT(CASE WHEN quiz_completed = TRUE THEN 1 END) as quiz_completed,
    ROUND(AVG(ranking_score)) as average_ranking_score,
    MAX(ranking_score) as highest_ranking_score
FROM producer_applications;

-- Run the ranking calculation function
SELECT 'Running ranking calculation...' as info;
SELECT calculate_producer_ranking_scores();

-- Show results after calculation
SELECT 'Results after ranking calculation:' as info;
SELECT 
    id,
    name,
    email,
    quiz_score,
    ranking_score,
    is_auto_rejected,
    rejection_reason,
    status,
    created_at
FROM producer_applications
ORDER BY ranking_score DESC, created_at DESC;

-- Final summary
SELECT 'Final summary:' as info;
SELECT 
    COUNT(*) as total_applications,
    COUNT(CASE WHEN quiz_score > 0 THEN 1 END) as applications_with_scores,
    COUNT(CASE WHEN ranking_score > 0 THEN 1 END) as applications_with_rankings,
    COUNT(CASE WHEN is_auto_rejected = TRUE THEN 1 END) as auto_rejected,
    COUNT(CASE WHEN quiz_completed = TRUE THEN 1 END) as quiz_completed,
    ROUND(AVG(ranking_score)) as average_ranking_score,
    MAX(ranking_score) as highest_ranking_score
FROM producer_applications;

-- Show sample data for debugging
SELECT 'Sample application data for debugging:' as info;
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
    sample_use,
    splice_use,
    loop_use,
    ai_generated_music,
    artist_collab,
    business_entity,
    pro_affiliation,
    quiz_score,
    ranking_score,
    is_auto_rejected,
    rejection_reason,
    signed_to_label,
    signed_to_publisher,
    signed_to_manager,
    entity_collects_payment,
    production_master_percentage,
    status,
    created_at
FROM producer_applications
LIMIT 3;
