-- Fix Admin/Producer Dual Role Access
-- This script ensures admins with dual roles can access all features

-- ============================================
-- 1. VERIFY YOUR ACCOUNT TYPE
-- ============================================

-- Check your current account type
SELECT 
    email,
    account_type,
    created_at
FROM profiles 
WHERE email LIKE '%@%'
ORDER BY created_at DESC;

-- ============================================
-- 2. ENSURE DUAL ROLE IS SET CORRECTLY
-- ============================================

-- Update your account to have dual role (replace with your actual email)
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email = 'knockriobeats@gmail.com';

-- Also update other admin accounts
UPDATE profiles 
SET account_type = 'admin,producer'
WHERE email IN ('info@mybeatfi.io', 'derykbanks@yahoo.com');

-- ============================================
-- 3. FIX RLS POLICIES FOR DUAL ROLE ACCESS
-- ============================================

-- Drop and recreate producer_applications policies to be more inclusive
DROP POLICY IF EXISTS "Admins can view all applications" ON producer_applications;
DROP POLICY IF EXISTS "Admins can update applications" ON producer_applications;

-- Create more inclusive policies for dual role admins
CREATE POLICY "Admins and producers can view all applications" ON producer_applications
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'producer' 
                OR profiles.account_type = 'admin,producer'
            )
        )
    );

CREATE POLICY "Admins and producers can update applications" ON producer_applications
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'producer' 
                OR profiles.account_type = 'admin,producer'
            )
        )
    );

-- ============================================
-- 4. FIX PRODUCER_RESOURCES POLICIES
-- ============================================

-- Drop and recreate producer_resources policies
DROP POLICY IF EXISTS "Allow admins to insert resources" ON producer_resources;
DROP POLICY IF EXISTS "Allow admins to update resources" ON producer_resources;
DROP POLICY IF EXISTS "Allow admins to delete resources" ON producer_resources;

-- Create more inclusive policies
CREATE POLICY "Admins and producers can insert resources" ON producer_resources
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'producer' 
                OR profiles.account_type = 'admin,producer'
            )
        )
    );

CREATE POLICY "Admins and producers can update resources" ON producer_resources
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'producer' 
                OR profiles.account_type = 'admin,producer'
            )
        )
    );

CREATE POLICY "Admins and producers can delete resources" ON producer_resources
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'producer' 
                OR profiles.account_type = 'admin,producer'
            )
        )
    );

-- ============================================
-- 5. FIX STORAGE POLICIES
-- ============================================

-- Drop and recreate storage policies
DROP POLICY IF EXISTS "Allow admins to upload to contracts-and-forms" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to update contracts-and-forms" ON storage.objects;
DROP POLICY IF EXISTS "Allow admins to delete contracts-and-forms" ON storage.objects;

-- Create more inclusive storage policies
CREATE POLICY "Admins and producers can upload to contracts-and-forms" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'contracts-and-forms' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'producer' 
                OR profiles.account_type = 'admin,producer'
            )
        )
    );

CREATE POLICY "Admins and producers can update contracts-and-forms" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'contracts-and-forms' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'producer' 
                OR profiles.account_type = 'admin,producer'
            )
        )
    );

CREATE POLICY "Admins and producers can delete contracts-and-forms" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'contracts-and-forms' 
        AND EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND (
                profiles.account_type = 'admin' 
                OR profiles.account_type = 'producer' 
                OR profiles.account_type = 'admin,producer'
            )
        )
    );

-- ============================================
-- 6. VERIFY FIXES
-- ============================================

-- Check your account type after the update
SELECT 
    'Your account type' as description,
    account_type as value
FROM profiles 
WHERE email = 'knockriobeats@gmail.com';

-- Check if you can access producer_applications
SELECT 
    'Can access producer_applications' as description,
    COUNT(*) as count
FROM producer_applications;

-- Check if you can access producer_resources
SELECT 
    'Can access producer_resources' as description,
    COUNT(*) as count
FROM producer_resources;

-- Check feature flags
SELECT 
    'producer_onboarding_enabled in clients' as description,
    COUNT(*) as count
FROM white_label_clients 
WHERE producer_onboarding_enabled = true; 