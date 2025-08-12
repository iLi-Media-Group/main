-- Targeted RLS Fix for Specific Tables
-- This script addresses only the tables that need RLS policies

-- ============================================
-- 1. ENABLE RLS ON DISABLED TABLES
-- ============================================

-- Enable RLS on tables that currently have it disabled
ALTER TABLE active_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE producer_invitations ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. ACTIVE_LICENSES POLICIES
-- ============================================
-- This table likely tracks active license agreements
-- Users should see their own licenses, admins see all

DROP POLICY IF EXISTS "Users can view their own active licenses" ON active_licenses;
CREATE POLICY "Users can view their own active licenses" ON active_licenses
    FOR SELECT USING (
        auth.uid() = user_id 
        OR auth.uid() = producer_id
    );

DROP POLICY IF EXISTS "Admins can view all active licenses" ON active_licenses;
CREATE POLICY "Admins can view all active licenses" ON active_licenses
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 3. MEMBERSHIP_REVENUE POLICIES
-- ============================================
-- This table likely tracks revenue from memberships
-- Admin-only access for financial data

DROP POLICY IF EXISTS "Admins can view membership revenue" ON membership_revenue;
CREATE POLICY "Admins can view membership revenue" ON membership_revenue
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

DROP POLICY IF EXISTS "Service role can manage membership revenue" ON membership_revenue;
CREATE POLICY "Service role can manage membership revenue" ON membership_revenue
    FOR ALL USING (auth.role() = 'service_role');

-- ============================================
-- 4. PRODUCER_INVITATIONS POLICIES
-- ============================================
-- This table tracks invitations sent to producers
-- Admins can manage, users can see their own invitations

DROP POLICY IF EXISTS "Users can view their own invitations" ON producer_invitations;
CREATE POLICY "Users can view their own invitations" ON producer_invitations
    FOR SELECT USING (
        auth.uid() = invited_by_id
        OR email = (SELECT email FROM profiles WHERE id = auth.uid())
    );

DROP POLICY IF EXISTS "Admins can manage producer invitations" ON producer_invitations;
CREATE POLICY "Admins can manage producer invitations" ON producer_invitations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 5. MEMBERSHIP_HISTORY POLICIES
-- ============================================
-- This table tracks membership changes over time
-- Users see their own history, admins see all

DROP POLICY IF EXISTS "Users can view their own membership history" ON membership_history;
CREATE POLICY "Users can view their own membership history" ON membership_history
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all membership history" ON membership_history;
CREATE POLICY "Admins can view all membership history" ON membership_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 6. MEMBERSHIPS POLICIES
-- ============================================
-- This table tracks current memberships
-- Users see their own, admins see all

DROP POLICY IF EXISTS "Users can view their own memberships" ON memberships;
CREATE POLICY "Users can view their own memberships" ON memberships
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all memberships" ON memberships;
CREATE POLICY "Admins can manage all memberships" ON memberships
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 7. PRODUCER_QUEUE POLICIES
-- ============================================
-- This table likely tracks producers in a queue for processing
-- Admin-only access for internal processing

DROP POLICY IF EXISTS "Admins can manage producer queue" ON producer_queue;
CREATE POLICY "Admins can manage producer queue" ON producer_queue
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 8. SERVICE_ONBOARDING_TOKENS POLICIES
-- ============================================
-- This table tracks tokens for service onboarding
-- Admin-only access for internal use

DROP POLICY IF EXISTS "Admins can manage onboarding tokens" ON service_onboarding_tokens;
CREATE POLICY "Admins can manage onboarding tokens" ON service_onboarding_tokens
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 9. STORAGE_BUCKETS POLICIES
-- ============================================
-- This table tracks storage bucket configuration
-- Admin-only access for system configuration

DROP POLICY IF EXISTS "Admins can manage storage buckets" ON storage_buckets;
CREATE POLICY "Admins can manage storage buckets" ON storage_buckets
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 10. SUBSCRIPTIONS POLICIES
-- ============================================
-- This table tracks user subscriptions
-- Users see their own, admins see all

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON subscriptions;
CREATE POLICY "Users can view their own subscriptions" ON subscriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON subscriptions;
CREATE POLICY "Admins can manage all subscriptions" ON subscriptions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND account_type = 'admin'
        )
    );

-- ============================================
-- 11. VERIFICATION
-- ============================================

-- Check final status of previously problematic tables
SELECT 'Final RLS status for fixed tables:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE 
        WHEN rowsecurity = true THEN '✅ RLS Enabled'
        ELSE '❌ RLS Disabled'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN (
        'active_licenses',
        'membership_revenue', 
        'producer_invitations',
        'membership_history',
        'memberships',
        'producer_queue',
        'service_onboarding_tokens',
        'storage_buckets',
        'subscriptions'
    )
ORDER BY tablename;

-- Check that all tables now have policies
SELECT 'Policy count for fixed tables:' as info;
SELECT 
    t.tablename,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN COUNT(p.policyname) > 0 THEN '✅ Has Policies'
        ELSE '⚠️ No Policies'
    END as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public' 
    AND t.tablename IN (
        'active_licenses',
        'membership_revenue', 
        'producer_invitations',
        'membership_history',
        'memberships',
        'producer_queue',
        'service_onboarding_tokens',
        'storage_buckets',
        'subscriptions'
    )
    AND t.rowsecurity = true
GROUP BY t.tablename
ORDER BY t.tablename;
