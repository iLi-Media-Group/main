-- Fix Producer Applications System
-- Based on actual table structure analysis

-- Create a function to calculate ranking scores based on the actual data types
CREATE OR REPLACE FUNCTION calculate_producer_ranking_scores()
RETURNS void AS $$
DECLARE
    app_record RECORD;
    calc_ranking_score INTEGER;
    calc_is_auto_rejected BOOLEAN;
    calc_rejection_reason TEXT;
BEGIN
    FOR app_record IN SELECT * FROM producer_applications LOOP
        -- Start with base score
        calc_ranking_score := 0;
        
        -- Basic profile points (20 points possible)
        IF app_record.name IS NOT NULL AND app_record.name != '' THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        IF app_record.email IS NOT NULL AND app_record.email != '' THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        IF app_record.primary_genre IS NOT NULL AND app_record.primary_genre != '' THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        -- Years of experience points (integer field)
        IF app_record.years_experience IS NOT NULL AND app_record.years_experience > 0 THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        -- Production points (15 points possible)
        IF app_record.daws_used IS NOT NULL AND app_record.daws_used != '' THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        IF app_record.team_type IS NOT NULL AND app_record.team_type != '' THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        -- Tracks per week (integer field)
        IF app_record.tracks_per_week IS NOT NULL AND app_record.tracks_per_week > 0 THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        -- Business points (10 points possible)
        IF app_record.pro_affiliation IS NOT NULL AND app_record.pro_affiliation != 'None' THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        IF app_record.business_entity IS NOT NULL AND app_record.business_entity != '' THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        -- Quiz performance points (20 points possible)
        IF app_record.quiz_score >= 80 THEN
            calc_ranking_score := calc_ranking_score + 20;
        ELSIF app_record.quiz_score >= 60 THEN
            calc_ranking_score := calc_ranking_score + 15;
        ELSIF app_record.quiz_score >= 40 THEN
            calc_ranking_score := calc_ranking_score + 10;
        ELSIF app_record.quiz_score >= 20 THEN
            calc_ranking_score := calc_ranking_score + 5;
        END IF;
        
        -- Disqualifiers and penalties
        calc_is_auto_rejected := FALSE;
        calc_rejection_reason := '';
        
        -- Auto-reject for AI-generated music (boolean field)
        IF app_record.ai_generated_music = TRUE THEN
            calc_is_auto_rejected := TRUE;
            calc_rejection_reason := 'Uses AI-generated music';
            calc_ranking_score := 0; -- Zero out score for auto-rejected
        END IF;
        
        -- Penalties for using samples/loops (boolean fields)
        IF app_record.sample_use = TRUE THEN
            calc_ranking_score := calc_ranking_score - 5;
        END IF;
        
        IF app_record.splice_use = 'Yes' THEN
            calc_ranking_score := calc_ranking_score - 5;
        END IF;
        
        IF app_record.loop_use = 'Yes' THEN
            calc_ranking_score := calc_ranking_score - 5;
        END IF;
        
        -- Ensure score doesn't go below 0
        IF calc_ranking_score < 0 THEN
            calc_ranking_score := 0;
    END IF;
        
        -- Update the application
        UPDATE producer_applications 
        SET 
            ranking_score = ROUND(calc_ranking_score),
            is_auto_rejected = calc_is_auto_rejected,
            rejection_reason = CASE WHEN calc_is_auto_rejected THEN calc_rejection_reason ELSE NULL END,
            updated_at = NOW()
        WHERE id = app_record.id;
        
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the ranking calculation function
SELECT calculate_producer_ranking_scores();

-- Show the results after calculation
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
