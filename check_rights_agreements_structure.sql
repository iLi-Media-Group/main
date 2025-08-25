-- Check Rights Agreements Table Structure
-- This will help us decide if we should use this table or create music_rights

SELECT 'Rights agreements table columns:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'rights_agreements'
ORDER BY ordinal_position;

-- Check if there are any existing records
SELECT 'Existing rights agreements count:' as info;
SELECT COUNT(*) as total_records FROM rights_agreements;

-- Check sample data if any exists
SELECT 'Sample rights agreements data:' as info;
SELECT * FROM rights_agreements LIMIT 2;
