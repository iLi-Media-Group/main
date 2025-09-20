-- Test Rights Holder Signup Process
-- This script tests the signup flow to identify any remaining issues

-- ============================================
-- 1. TEST AUTHENTICATION FLOW
-- ============================================

-- Check if we can create a test user (this would be done via Supabase Auth)
-- Note: This is just a verification that the auth system is working

-- ============================================
-- 2. TEST DATABASE INSERT PERMISSIONS
-- ============================================

-- Test inserting a rights holder record (simulate signup)
-- Note: This requires an actual user ID from auth.users
-- We'll use a placeholder to test the structure

-- Check if the rights_holders table accepts the expected data structure
SELECT 'Testing rights_holders table structure' as test_step;

-- Verify required columns exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'rights_holders' 
AND column_name IN ('id', 'email', 'rights_holder_type', 'company_name', 'legal_entity_name')
ORDER BY column_name;

-- ============================================
-- 3. TEST RLS POLICIES
-- ============================================

-- Check if RLS policies allow proper access
SELECT 'Testing RLS policies' as test_step;

-- List all policies for rights_holders table
SELECT policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename = 'rights_holders'
ORDER BY policyname;

-- List all policies for rights_holder_profiles table
SELECT policyname, cmd, permissive, roles, qual
FROM pg_policies 
WHERE tablename = 'rights_holder_profiles'
ORDER BY policyname;

-- ============================================
-- 4. TEST DATA VALIDATION
-- ============================================

-- Check if check constraints are working
SELECT 'Testing data validation constraints' as test_step;

-- Check rights_holder_type constraint
SELECT conname, pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'rights_holders'::regclass 
AND contype = 'c';

-- ============================================
-- 5. TEST FOREIGN KEY RELATIONSHIPS
-- ============================================

-- Check foreign key relationships
SELECT 'Testing foreign key relationships' as test_step;

SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('rights_holders', 'rights_holder_profiles');

-- ============================================
-- 6. SIMULATE SIGNUP DATA STRUCTURE
-- ============================================

-- Create a test record structure to verify the signup data format
SELECT 'Testing signup data structure' as test_step;

-- This shows what the signup form should send to the database
SELECT 
    'Sample signup data structure:' as info,
    'id: UUID (from auth.users)' as field1,
    'email: TEXT' as field2,
    'rights_holder_type: record_label OR publisher' as field3,
    'company_name: TEXT (required)' as field4,
    'legal_entity_name: TEXT (required)' as field5,
    'business_structure: sole_proprietorship|llc|corporation|partnership|other' as field6,
    'phone: TEXT (required)' as field7,
    'address_line_1: TEXT (required)' as field8,
    'city: TEXT (required)' as field9,
    'state: TEXT (required)' as field10,
    'postal_code: TEXT (required)' as field11,
    'country: TEXT (default: US)' as field12,
    'terms_accepted: BOOLEAN (required)' as field13,
    'rights_authority_declaration_accepted: BOOLEAN (required)' as field14;

-- ============================================
-- 7. VERIFY CURRENT DATA
-- ============================================

-- Check existing rights holder data
SELECT 'Current rights holders data' as test_step, 
       id, 
       email, 
       rights_holder_type, 
       company_name,
       verification_status,
       terms_accepted,
       rights_authority_declaration_accepted
FROM rights_holders
LIMIT 5;
