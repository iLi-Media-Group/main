-- Check Rights Agreements Table Structure
-- This will help us see if this is the correct table for music rights

SELECT 'Rights agreements table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'rights_agreements'
ORDER BY ordinal_position;

-- Check if there are any existing records to understand the data structure
SELECT 'Sample rights agreements data:' as info;
SELECT * FROM rights_agreements LIMIT 3;
