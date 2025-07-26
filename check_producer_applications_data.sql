-- Check Producer Applications Data
-- This script shows what applications exist and their statuses

-- 1. Check if there are any applications at all
SELECT 'Total Applications:' as info;
SELECT COUNT(*) as total_applications FROM producer_applications;

-- 2. Show all applications with their statuses
SELECT 'All Applications with Status:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    created_at,
    primary_genre
FROM producer_applications 
ORDER BY created_at DESC;

-- 3. Count applications by status
SELECT 'Applications by Status:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;

-- 4. Check for applications with null status
SELECT 'Applications with NULL Status:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
WHERE status IS NULL;

-- 5. Check for applications that should show in 'new' tab
SELECT 'Applications for "New" Tab:' as info;
SELECT 
    id,
    name,
    email,
    status,
    review_tier,
    created_at
FROM producer_applications 
WHERE status = 'new' AND review_tier IS NULL;

-- 6. Check table structure to see what columns exist
SELECT 'Table Structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications'
ORDER BY ordinal_position; 