-- Check if manual_review_approved column exists in producer_applications table
-- This might be causing issues if the frontend expects it but it doesn't exist

-- 1. Check if the column exists
SELECT 'Checking if manual_review_approved column exists...' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications' 
AND column_name = 'manual_review_approved';

-- 2. Check if manual_review column exists
SELECT 'Checking if manual_review column exists...' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'producer_applications' 
AND column_name = 'manual_review';

-- 3. Show all columns in producer_applications table
SELECT 'All columns in producer_applications table:' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'producer_applications' 
ORDER BY ordinal_position;
