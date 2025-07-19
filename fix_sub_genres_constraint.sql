-- Fix the valid_sub_genres constraint issue

-- 1. First, let's see what the constraint is actually checking
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_sub_genres';

-- 2. Check the tracks table structure for sub_genres field
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name = 'sub_genres';

-- 3. Show the constraint definition in detail
SELECT 
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_name = 'valid_sub_genres';

-- 4. Drop the problematic constraint
ALTER TABLE tracks DROP CONSTRAINT IF EXISTS valid_sub_genres;

-- 5. Verify the constraint is gone
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_sub_genres';

-- 6. Check if there are any other constraints on the tracks table that might cause issues
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'tracks'::regclass
  AND contype = 'c'  -- check constraints only
ORDER BY conname; 