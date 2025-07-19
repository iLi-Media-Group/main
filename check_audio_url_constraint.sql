-- Check the valid_audio_url constraint that's causing track upload failures

-- 1. Check what the constraint is
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conname = 'valid_audio_url';

-- 2. Check the tracks table structure to understand the audio_url field
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'tracks' 
  AND column_name = 'audio_url';

-- 3. Check recent failed insertions to see what audio_url values are being rejected
-- (This might not show much, but worth checking)

-- 4. Show the constraint definition in detail
SELECT 
  tc.constraint_name,
  tc.table_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_name = 'valid_audio_url';

-- 5. If the constraint is too restrictive, we can drop and recreate it
-- Uncomment the lines below if you want to drop the constraint:

-- ALTER TABLE tracks DROP CONSTRAINT IF EXISTS valid_audio_url;

-- 6. Create a more permissive constraint (uncomment if needed):
-- ALTER TABLE tracks ADD CONSTRAINT valid_audio_url 
-- CHECK (audio_url IS NOT NULL AND audio_url != '');

-- 7. Or remove the constraint entirely if it's not needed:
-- ALTER TABLE tracks DROP CONSTRAINT IF EXISTS valid_audio_url; 