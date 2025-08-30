-- Run the producer applications fix immediately
-- This will populate all missing data and calculate proper scores

-- Run the ranking calculation function
SELECT calculate_producer_ranking_scores();

-- Show the results
SELECT 
    id,
    name,
    email,
    status,
    quiz_score,
    ranking_score,
    is_auto_rejected,
    created_at
FROM producer_applications
ORDER BY created_at DESC;
