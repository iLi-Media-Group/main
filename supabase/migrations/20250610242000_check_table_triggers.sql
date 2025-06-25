-- Check for triggers and table relationships that might be causing the insert issue

-- Check if there are any triggers on stripe_subscriptions table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'stripe_subscriptions'
ORDER BY trigger_name;

-- Check if there are any triggers on subscriptions table
SELECT 
  trigger_name,
  event_manipulation,
  action_statement,
  action_timing
FROM information_schema.triggers 
WHERE event_object_table = 'subscriptions'
ORDER BY trigger_name;

-- Check if there are any foreign key relationships that might be causing issues
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND (tc.table_name = 'stripe_subscriptions' OR tc.table_name = 'subscriptions')
ORDER BY tc.table_name, kcu.column_name;

-- Check the actual table structure of both tables
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name IN ('stripe_subscriptions', 'subscriptions')
ORDER BY table_name, ordinal_position;

-- Check if there are any views that might be interfering
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_name LIKE '%subscription%'
ORDER BY table_name; 