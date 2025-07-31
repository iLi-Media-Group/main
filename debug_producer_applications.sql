-- Debug Producer Applications Access
-- This script helps diagnose why producer applications might not be showing

-- ============================================
-- 1. CHECK YOUR ACCOUNT TYPE
-- ============================================

SELECT 
    'Your account details' as check_item,
    email,
    account_type,
    created_at
FROM profiles 
WHERE email = 'knockriobeats@gmail.com';

-- ============================================
-- 2. CHECK FEATURE FLAGS
-- ============================================

-- Check white_label_features table
SELECT 
    'white_label_features' as table_name,
    client_id,
    feature_name,
    is_enabled
FROM white_label_features 
WHERE feature_name = 'producer_onboarding';

-- Check white_label_clients table
SELECT 
    'white_label_clients' as table_name,
    id,
    display_name,
    producer_onboarding_enabled,
    producer_onboarding_paid
FROM white_label_clients;

-- ============================================
-- 3. CHECK PRODUCER APPLICATIONS DATA
-- ============================================

-- Check if applications exist
SELECT 
    'producer_applications count' as check_item,
    COUNT(*) as count
FROM producer_applications;

-- Show sample applications
SELECT 
    id,
    email,
    first_name,
    last_name,
    status,
    created_at
FROM producer_applications 
ORDER BY created_at DESC 
LIMIT 5;

-- ============================================
-- 4. CHECK RLS POLICIES
-- ============================================

-- Check producer_applications policies
SELECT 
    'producer_applications policies' as check_item,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename = 'producer_applications';

-- ============================================
-- 5. TEST ACCESS AS YOUR USER
-- ============================================

-- This simulates what the React app would see
-- (Note: This runs as the database user, not your auth user)
SELECT 
    'Can access producer_applications' as test_name,
    COUNT(*) as accessible_count
FROM producer_applications;

-- ============================================
-- 6. CHECK AUTHENTICATION STATUS
-- ============================================

-- Check if you're properly authenticated
SELECT 
    'Current auth user' as check_item,
    auth.uid() as user_id,
    auth.role() as role; 