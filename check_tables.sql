-- Check what tables exist in your database
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Check for any mood-related tables
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE '%mood%'
ORDER BY tablename;

-- Check for any emotion-related tables
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE '%emotion%'
ORDER BY tablename;

-- Check for any feeling-related tables
SELECT 
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE '%feeling%'
ORDER BY tablename;
