-- Check and fix user subscription data
-- Replace 'your-email@example.com' with the actual user's email

-- Check user profile
SELECT 
    id,
    email,
    membership_plan,
    account_type,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'your-email@example.com'; -- Replace with actual email

-- Check if user has a Stripe customer record
SELECT 
    sc.id,
    sc.user_id,
    sc.customer_id,
    p.email,
    p.membership_plan
FROM stripe_customers sc
JOIN profiles p ON sc.user_id = p.id
WHERE p.email = 'your-email@example.com'; -- Replace with actual email

-- Check stripe_subscriptions for this user
SELECT 
    ss.id,
    ss.customer_id,
    ss.subscription_id,
    ss.price_id,
    ss.status,
    ss.created_at,
    p.email,
    p.membership_plan
FROM stripe_subscriptions ss
JOIN stripe_customers sc ON ss.customer_id = sc.customer_id
JOIN profiles p ON sc.user_id = p.id
WHERE p.email = 'your-email@example.com'; -- Replace with actual email

-- Check recent webhook events
SELECT 
    id,
    event_type,
    event_id,
    metadata,
    status,
    created_at
FROM stripe_webhook_logs 
WHERE event_type IN ('checkout.session.completed', 'customer.subscription.created', 'customer.subscription.updated')
ORDER BY created_at DESC
LIMIT 10;

-- Manual fix: Update membership plan to Gold Access
-- Replace 'your-user-id' with the actual user ID from the first query
UPDATE profiles 
SET membership_plan = 'Gold Access'
WHERE id = 'your-user-id'::uuid; -- Replace with actual user ID

-- Check if there are any active subscriptions that should be linked
SELECT 
    ss.id,
    ss.customer_id,
    ss.subscription_id,
    ss.price_id,
    ss.status,
    ss.created_at
FROM stripe_subscriptions ss
WHERE ss.status = 'active'
ORDER BY ss.created_at DESC
LIMIT 10; 