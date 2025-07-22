-- Debug webhook logs and membership plan updates
-- Run this in your Supabase SQL Editor

-- Check recent webhook events
SELECT 
    id,
    event_type,
    event_id,
    metadata,
    status,
    created_at
FROM stripe_webhook_logs 
ORDER BY created_at DESC
LIMIT 20;

-- Check if there are any subscription events
SELECT 
    id,
    event_type,
    event_id,
    metadata,
    status,
    created_at
FROM stripe_webhook_logs 
WHERE event_type LIKE '%subscription%' OR event_type LIKE '%checkout%'
ORDER BY created_at DESC
LIMIT 10;

-- Check stripe_customers table to see if user is linked to Stripe customer
SELECT 
    sc.id,
    sc.user_id,
    sc.customer_id,
    p.email,
    p.membership_plan,
    sc.created_at
FROM stripe_customers sc
JOIN profiles p ON sc.user_id = p.id
ORDER BY sc.created_at DESC
LIMIT 10;

-- Check stripe_subscriptions table
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
ORDER BY ss.created_at DESC
LIMIT 10;

-- Check profiles table for membership plans
SELECT 
    id,
    email,
    membership_plan,
    account_type,
    created_at,
    updated_at
FROM profiles 
WHERE membership_plan IS NOT NULL
ORDER BY updated_at DESC
LIMIT 10;

-- Check if there are any recent checkout sessions
SELECT 
    id,
    checkout_session_id,
    payment_intent_id,
    customer_id,
    payment_status,
    status,
    metadata,
    created_at
FROM stripe_orders 
WHERE metadata->>'type' = 'subscription' OR metadata->>'type' IS NULL
ORDER BY created_at DESC
LIMIT 10; 