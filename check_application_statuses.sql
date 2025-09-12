-- Check Application Statuses and Fix Null Values
SELECT 'Current Status Distribution:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;

-- Show all applications with their status
SELECT 'All Applications with Status:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
ORDER BY created_at DESC;

-- Check for null status values
SELECT 'Applications with NULL status:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
WHERE status IS NULL;

-- Fix null status values to 'new'
UPDATE producer_applications 
SET status = 'new' 
WHERE status IS NULL;

-- Verify the fix
SELECT 'After fixing NULL statuses:' as info;
SELECT 
    status,
    COUNT(*) as count
FROM producer_applications 
GROUP BY status
ORDER BY count DESC;

-- Show final state
SELECT 'Final Applications List:' as info;
SELECT 
    id,
    name,
    email,
    status,
    created_at
FROM producer_applications 
ORDER BY created_at DESC; 