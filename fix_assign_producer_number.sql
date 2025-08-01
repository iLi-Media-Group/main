-- Fix function search path for assign_producer_number
-- Set explicit search path to prevent security issues

-- First, let's see the current function definition
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname = 'assign_producer_number';

-- Get the function signature
SELECT 
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    t.typname as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_type t ON p.prorettype = t.oid
WHERE n.nspname = 'public' 
AND p.proname = 'assign_producer_number'; 