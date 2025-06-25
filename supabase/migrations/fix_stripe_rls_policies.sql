/*
  # Fix Stripe RLS Policies
  
  This migration adds missing RLS policies for existing Stripe tables
  to ensure the service role can properly insert subscription data.
*/

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Service role can manage customer data" ON stripe_customers;
DROP POLICY IF EXISTS "Users can view their own subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Service role can manage subscription data" ON stripe_subscriptions;
DROP POLICY IF EXISTS "Users can view their own order data" ON stripe_orders;
DROP POLICY IF EXISTS "Service role can manage order data" ON stripe_orders;

-- Create RLS policies for stripe_customers
CREATE POLICY "Users can view their own customer data"
    ON stripe_customers
    FOR SELECT
    TO authenticated
    USING (user_id = auth.uid() AND deleted_at IS NULL);

CREATE POLICY "Service role can manage customer data"
    ON stripe_customers
    FOR ALL
    TO service_role
    USING (true);

-- Create RLS policies for stripe_subscriptions
CREATE POLICY "Users can view their own subscription data"
    ON stripe_subscriptions
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Service role can manage subscription data"
    ON stripe_subscriptions
    FOR ALL
    TO service_role
    USING (true);

-- Create RLS policies for stripe_orders
CREATE POLICY "Users can view their own order data"
    ON stripe_orders
    FOR SELECT
    TO authenticated
    USING (
        customer_id IN (
            SELECT customer_id
            FROM stripe_customers
            WHERE user_id = auth.uid() AND deleted_at IS NULL
        )
        AND deleted_at IS NULL
    );

CREATE POLICY "Service role can manage order data"
    ON stripe_orders
    FOR ALL
    TO service_role
    USING (true);

-- Ensure the views exist and are properly configured
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
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND (s.deleted_at IS NULL OR s.deleted_at IS NULL);

GRANT SELECT ON stripe_user_subscriptions TO authenticated;

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