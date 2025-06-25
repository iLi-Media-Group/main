-- Fix the stripe_user_subscriptions view to use correct column names
-- The subscriptions table uses 'stripe_subscription_id' not 'subscription_id'

-- Drop the existing view
DROP VIEW IF EXISTS stripe_user_subscriptions;

-- Recreate the view with correct column names
CREATE OR REPLACE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.stripe_subscription_id as subscription_id,
    s.status as subscription_status,
    s.membership_tier as plan_name,
    s.start_date as current_period_start,
    s.end_date as current_period_end,
    s.next_billing_date,
    s.payment_method as payment_method_brand,
    NULL as payment_method_last4  -- This field doesn't exist in subscriptions table
FROM stripe_customers c
LEFT JOIN subscriptions s ON c.user_id = s.user_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (s.deleted_at IS NULL OR s.deleted_at IS NULL);

GRANT SELECT ON stripe_user_subscriptions TO authenticated; 