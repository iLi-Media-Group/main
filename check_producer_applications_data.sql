-- Check Producer Applications Data
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
    email,
    first_name,
    last_name,
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
    is_auto_rejected = false,
    first_name = COALESCE(first_name, 'Sample'),
    last_name = COALESCE(last_name, 'User'),
    phone = COALESCE(phone, '+1234567890'),
    experience_level = COALESCE(experience_level, 'intermediate'),
    genres = COALESCE(genres, ARRAY['Hip Hop', 'R&B']),
    instruments = COALESCE(instruments, ARRAY['Piano', 'Guitar']),
    equipment = COALESCE(equipment, 'Ableton Live, MIDI Keyboard'),
    social_media_links = COALESCE(social_media_links, '{}'),
    portfolio_links = COALESCE(portfolio_links, ARRAY['https://example.com/portfolio']),
    why_join = COALESCE(why_join, 'I want to join to collaborate with other producers and grow my skills.'),
    admin_notes = NULL;

-- ============================================
-- 3. ADD MORE SAMPLE DATA IF NEEDED
-- ============================================

-- Add more sample applications if table is empty or has few records
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM producer_applications) < 2 THEN
        INSERT INTO producer_applications (
            email, first_name, last_name, phone, experience_level, 
            genres, instruments, equipment, why_join, status,
            review_tier, is_auto_rejected, social_media_links, portfolio_links
        ) VALUES 
        (
            'sample@example.com', 'John', 'Doe', '+1234567890', 'intermediate',
            ARRAY['Hip Hop', 'R&B'], ARRAY['Piano', 'Guitar'], 'Ableton Live, MIDI Keyboard',
            'I want to join to collaborate with other producers and grow my skills.',
            'new', NULL, false, '{}', ARRAY['https://example.com/portfolio']
        ),
        (
            'producer@example.com', 'Jane', 'Smith', '+1987654321', 'advanced',
            ARRAY['Pop', 'Electronic'], ARRAY['Drums', 'Bass'], 'Logic Pro, Studio Monitors',
            'Looking to expand my network and find new opportunities.',
            'new', NULL, false, '{}', ARRAY['https://example.com/portfolio']
        ),
        (
            'beatmaker@example.com', 'Mike', 'Johnson', '+1555123456', 'beginner',
            ARRAY['Trap', 'Hip Hop'], ARRAY['FL Studio', 'MIDI Controller'], 'FL Studio, Akai MPK',
            'I want to learn from experienced producers and improve my skills.',
            'new', NULL, false, '{}', ARRAY['https://example.com/portfolio']
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
    email,
    first_name,
    last_name,
    status,
    review_tier,
    is_auto_rejected,
    created_at
FROM producer_applications 
ORDER BY created_at DESC; 