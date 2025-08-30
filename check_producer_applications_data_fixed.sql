-- Check Producer Applications Data (FIXED)
-- This script checks the current data and fixes any issues

-- ============================================
-- 1. CHECK CURRENT DATA
-- ============================================

-- Check all applications
SELECT 
    'All applications' as check_item,
    COUNT(*) as count
FROM producer_applications;

-- Check applications by status
SELECT 
    'Applications by status' as check_item,
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status;

-- Show all applications with their data
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    is_auto_rejected,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

-- ============================================
-- 2. FIX DATA ISSUES
-- ============================================

-- Update all applications to have proper status and data
UPDATE producer_applications 
SET 
    status = 'new',
    review_tier = NULL,
    is_auto_rejected = false;

-- Update name field if it's null
UPDATE producer_applications 
SET name = COALESCE(name, 'Sample User')
WHERE name IS NULL;

-- ============================================
-- 3. ADD MORE SAMPLE DATA IF NEEDED
-- ============================================

-- Add more sample applications if table is empty or has few records
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM producer_applications) < 2 THEN
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
            sample_use,
            splice_use,
            loop_use,
            status,
            review_tier,
            is_auto_rejected
        ) VALUES 
        (
            'John Doe',
            'sample@example.com',
            'Hip Hop',
            'R&B',
            4,
            'Ableton Live',
            'solo',
            8,
            'https://open.spotify.com/artist/sample',
            'Yes',
            'Yes',
            'Yes',
            'new',
            NULL,
            false
        ),
        (
            'Jane Smith',
            'producer@example.com',
            'Pop',
            'Electronic',
            7,
            'Logic Pro',
            'small_team',
            15,
            'https://open.spotify.com/artist/producer',
            'Yes',
            'No',
            'Yes',
            'new',
            NULL,
            false
        ),
        (
            'Mike Johnson',
            'beatmaker@example.com',
            'Trap',
            'Hip Hop',
            2,
            'FL Studio',
            'solo',
            3,
            'https://open.spotify.com/artist/beatmaker',
            'No',
            'Yes',
            'No',
            'new',
            NULL,
            false
        );
    END IF;
END $$;

-- ============================================
-- 4. VERIFY THE FIXES
-- ============================================

-- Check final data
SELECT 
    'Final applications count' as check_item,
    COUNT(*) as count
FROM producer_applications;

-- Check applications that match the API query
SELECT 
    'Matching API query' as check_item,
    COUNT(*) as count
FROM producer_applications 
WHERE status = 'new' 
AND review_tier IS NULL 
AND is_auto_rejected = false;

-- Show final data
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    is_auto_rejected,
    created_at
FROM producer_applications 
ORDER BY created_at DESC; 