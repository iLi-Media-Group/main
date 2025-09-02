-- Check RLS Policies Only
SELECT '=== TRACKS TABLE RLS POLICIES ===' as section;
SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'tracks' ORDER BY policyname;

SELECT '=== PROFILES TABLE RLS POLICIES ===' as section;
SELECT policyname, permissive, roles, cmd, qual FROM pg_policies WHERE tablename = 'profiles' ORDER BY policyname;

SELECT '=== RLS STATUS ===' as section;
SELECT tablename, rowsecurity as rls_enabled FROM pg_tables WHERE tablename IN ('tracks', 'profiles') ORDER BY tablename;
