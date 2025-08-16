-- Fix Missing Stripe Customer Issue
-- This script addresses the "No such customer: 'cus_Sn3TsTd8HKsRTR'" error

-- Step 1: Check the current state of the problematic customer
SELECT 'Current state of the problematic customer:' as info;
SELECT 
    sc.id,
    sc.user_id,
    sc.customer_id,
    sc.created_at,
    sc.updated_at,
    p.email,
    p.first_name,
    p.last_name
FROM stripe_customers sc
LEFT JOIN profiles p ON sc.user_id = p.id
WHERE sc.customer_id = 'cus_Sn3TsTd8HKsRTR';

-- Step 2: Check if there are any other customers with this user_id
SELECT 'All customers for this user:' as info;
SELECT 
    sc.id,
    sc.user_id,
    sc.customer_id,
    sc.created_at,
    sc.updated_at,
    p.email,
    p.first_name,
    p.last_name
FROM stripe_customers sc
LEFT JOIN profiles p ON sc.user_id = p.id
WHERE sc.user_id = (
    SELECT user_id 
    FROM stripe_customers 
    WHERE customer_id = 'cus_Sn3TsTd8HKsRTR'
    LIMIT 1
);

-- Step 3: Remove the invalid customer reference
-- This will allow the edge function to create a new customer
DELETE FROM stripe_customers 
WHERE customer_id = 'cus_Sn3TsTd8HKsRTR';

-- Step 4: Verify the fix
SELECT 'After fix - customers for this user:' as info;
SELECT 
    sc.id,
    sc.user_id,
    sc.customer_id,
    sc.created_at,
    sc.updated_at,
    p.email,
    p.first_name,
    p.last_name
FROM stripe_customers sc
LEFT JOIN profiles p ON sc.user_id = p.id
WHERE sc.user_id = (
    SELECT user_id 
    FROM stripe_customers 
    WHERE customer_id = 'cus_Sn3TsTd8HKsRTR'
    LIMIT 1
);

-- Step 5: Check for any other invalid customer references
SELECT 'Checking for other potentially invalid customer references:' as info;
SELECT 
    sc.id,
    sc.user_id,
    sc.customer_id,
    sc.created_at,
    p.email
FROM stripe_customers sc
LEFT JOIN profiles p ON sc.user_id = p.id
WHERE sc.customer_id LIKE 'cus_%'
ORDER BY sc.created_at DESC
LIMIT 10;
