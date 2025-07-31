-- Check what tables currently exist
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename; 