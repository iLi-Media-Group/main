-- Simple Supabase connectivity test
-- This will help determine if the issue is with the connection or specific operations

-- Test 1: Basic connection
SELECT 'Connection test' as test_name, current_timestamp as test_time;

-- Test 2: Check if we can read from a simple table
SELECT COUNT(*) as total_tracks FROM tracks;

-- Test 3: Check if we can read from profiles
SELECT COUNT(*) as total_profiles FROM profiles;

-- If these work, the issue is likely with the INSERT operation specifically
-- If these fail, there's a broader connection/configuration issue
