-- Check all applications across different tables
-- This will help us understand what table the admin panel is using

-- Check producer_applications table
SELECT '=== PRODUCER_APPLICATIONS TABLE ===' as info;
SELECT 
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
    COUNT(CASE WHEN status = 'invited' THEN 1 END) as invited_count,
    COUNT(CASE WHEN status = 'onboarded' THEN 1 END) as onboarded_count,
    COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_count,
    COUNT(CASE WHEN status = 'save_for_later' THEN 1 END) as save_for_later_count,
    COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review_count
FROM producer_applications;

-- Show all applications in producer_applications
SELECT '=== ALL PRODUCER APPLICATIONS ===' as info;
SELECT 
    id,
    name,
    email,
    status,
    ranking_score,
    quiz_score,
    created_at
FROM producer_applications
ORDER BY created_at DESC;

-- Check if there are other application tables
SELECT '=== CHECKING FOR OTHER TABLES ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name LIKE '%application%' 
   OR table_name LIKE '%producer%' 
   OR table_name LIKE '%artist%'
ORDER BY table_name;

-- Check artist_applications table if it exists
SELECT '=== ARTIST_APPLICATIONS TABLE (if exists) ===' as info;
SELECT 
    COUNT(*) as total_count,
    COUNT(CASE WHEN status = 'new' THEN 1 END) as new_count,
    COUNT(CASE WHEN status = 'invited' THEN 1 END) as invited_count,
    COUNT(CASE WHEN status = 'onboarded' THEN 1 END) as onboarded_count,
    COUNT(CASE WHEN status = 'declined' THEN 1 END) as declined_count,
    COUNT(CASE WHEN status = 'save_for_later' THEN 1 END) as save_for_later_count,
    COUNT(CASE WHEN status = 'in_review' THEN 1 END) as in_review_count
FROM artist_applications;

-- Show all applications in artist_applications if it exists
SELECT '=== ALL ARTIST APPLICATIONS (if exists) ===' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM artist_applications
ORDER BY created_at DESC;

-- Check what the admin panel is actually querying
-- Look for any views or functions that might be used
SELECT '=== CHECKING FOR VIEWS ===' as info;
SELECT viewname 
FROM pg_views 
WHERE viewname LIKE '%application%' 
   OR viewname LIKE '%producer%' 
   OR viewname LIKE '%artist%';

-- Check for any functions that might be used
SELECT '=== CHECKING FOR FUNCTIONS ===' as info;
SELECT proname 
FROM pg_proc 
WHERE proname LIKE '%application%' 
   OR proname LIKE '%producer%' 
   OR proname LIKE '%artist%';
