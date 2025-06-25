-- Fix the stripe_user_subscriptions view to use the correct table
-- Based on the error, the data is being inserted into 'subscriptions' table, not 'stripe_subscriptions'

-- Drop the existing view
DROP VIEW IF EXISTS stripe_user_subscriptions;

-- Recreate the view to use the 'subscriptions' table
CREATE OR REPLACE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (s.deleted_at IS NULL OR s.deleted_at IS NULL);

GRANT SELECT ON stripe_user_subscriptions TO authenticated;

-- Also update the stripe_user_orders view to be consistent
DROP VIEW IF EXISTS stripe_user_orders;

CREATE OR REPLACE VIEW stripe_user_orders WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    o.id as order_id,
    o.checkout_session_id,
    o.payment_intent_id,
    o.amount_subtotal,
    o.amount_total,
    o.currency,
    o.payment_status,
    o.status as order_status,
    o.created_at as order_date
FROM stripe_customers c
LEFT JOIN stripe_orders o ON c.customer_id = o.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (o.deleted_at IS NULL OR o.deleted_at IS NULL);

GRANT SELECT ON stripe_user_orders TO authenticated; 