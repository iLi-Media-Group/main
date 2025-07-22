-- Fix membership plan update issue
-- Run this in your Supabase SQL Editor

-- First, let's check if the user exists in stripe_customers
-- Replace 'your-email@example.com' with the actual user's email
SELECT 
    p.id as user_id,
    p.email,
    p.membership_plan,
    sc.customer_id,
    ss.subscription_id,
    ss.price_id,
    ss.status as subscription_status
FROM profiles p
LEFT JOIN stripe_customers sc ON p.id = sc.user_id
LEFT JOIN stripe_subscriptions ss ON sc.customer_id = ss.customer_id
WHERE p.email = 'your-email@example.com'; -- Replace with actual email

-- Check if there are any active subscriptions for this user
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
WHERE ss.status = 'active'
ORDER BY ss.created_at DESC;

-- Manual fix: Update membership plan based on active subscription
-- Replace 'your-user-id' with the actual user ID
UPDATE profiles 
SET membership_plan = 'Gold Access'
WHERE id = 'your-user-id'::uuid; -- Replace with actual user ID

-- Check if the user has a Stripe customer record
-- If not, we need to create one
INSERT INTO stripe_customers (user_id, customer_id)
SELECT 
    p.id,
    'cus_xxxxxxxxxxxxx' -- Replace with actual Stripe customer ID
FROM profiles p
WHERE p.email = 'your-email@example.com' -- Replace with actual email
AND NOT EXISTS (
    SELECT 1 FROM stripe_customers sc WHERE sc.user_id = p.id
);

-- Check recent webhook events for this user's customer ID
SELECT 
    id,
    event_type,
    event_id,
    metadata,
    status,
    created_at
FROM stripe_webhook_logs 
WHERE metadata::text LIKE '%your-customer-id%' -- Replace with actual customer ID
ORDER BY created_at DESC
LIMIT 10;

-- Check if there are any subscription events that should have triggered updates
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