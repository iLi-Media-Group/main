-- Check for tables with RLS disabled (unrestricted access)
-- This identifies security vulnerabilities

SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled - SECURITY RISK!'
    END as security_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename NOT LIKE 'pg_%'
    AND tablename NOT LIKE 'information_schema%'
    AND tablename NOT LIKE 'sql_%'
    AND rowsecurity = false
ORDER BY tablename;

-- Also check for tables with no RLS policies even if RLS is enabled
SELECT 
    t.schemaname,
    t.tablename,
    t.rowsecurity,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity = true AND COUNT(p.policyname) = 0 THEN '⚠️ RLS Enabled but NO POLICIES'
        WHEN t.rowsecurity = true AND COUNT(p.policyname) > 0 THEN '✅ RLS Enabled with Policies'
        ELSE '❌ RLS Disabled'
    END as security_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.tablename NOT LIKE 'pg_%'
    AND t.tablename NOT LIKE 'information_schema%'
    AND t.tablename NOT LIKE 'sql_%'
GROUP BY t.schemaname, t.tablename, t.rowsecurity
ORDER BY t.tablename;
