-- Check Tracks Table Schema and Data Type Issues
-- This will identify potential causes of 400 errors beyond RLS

-- ============================================
-- 1. CHECK TABLE STRUCTURE
-- ============================================

-- Show complete tracks table structure
SELECT 'Complete tracks table structure:' as info;
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns 
WHERE table_name = 'tracks' 
ORDER BY ordinal_position;

-- ============================================
-- 2. CHECK FOR MISSING COLUMNS
-- ============================================

-- Check if all required columns for rights holder upload exist
SELECT 'Checking for required columns for rights holder upload:' as info;

-- Required columns for the upload form
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'track_producer_id') 
    THEN '✅ track_producer_id exists' 
    ELSE '❌ track_producer_id MISSING' 
  END as status
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'title') 
    THEN '✅ title exists' 
    ELSE '❌ title MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'artist') 
    THEN '✅ artist exists' 
    ELSE '❌ artist MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'genres') 
    THEN '✅ genres exists' 
    ELSE '❌ genres MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'sub_genres') 
    THEN '✅ sub_genres exists' 
    ELSE '❌ sub_genres MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'moods') 
    THEN '✅ moods exists' 
    ELSE '❌ moods MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'bpm') 
    THEN '✅ bpm exists' 
    ELSE '❌ bpm MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'key') 
    THEN '✅ key exists' 
    ELSE '❌ key MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'duration') 
    THEN '✅ duration exists' 
    ELSE '❌ duration MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'description') 
    THEN '✅ description exists' 
    ELSE '❌ description MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'audio_url') 
    THEN '✅ audio_url exists' 
    ELSE '❌ audio_url MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'image_url') 
    THEN '✅ image_url exists' 
    ELSE '❌ image_url MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'instruments') 
    THEN '✅ instruments exists' 
    ELSE '❌ instruments MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'media_usage') 
    THEN '✅ media_usage exists' 
    ELSE '❌ media_usage MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'has_vocals') 
    THEN '✅ has_vocals exists' 
    ELSE '❌ has_vocals MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'is_sync_only') 
    THEN '✅ is_sync_only exists' 
    ELSE '❌ is_sync_only MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'master_rights_owner') 
    THEN '✅ master_rights_owner exists' 
    ELSE '❌ master_rights_owner MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'publishing_rights_owner') 
    THEN '✅ publishing_rights_owner exists' 
    ELSE '❌ publishing_rights_owner MISSING' 
  END
UNION ALL
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tracks' AND column_name = 'status') 
    THEN '✅ status exists' 
    ELSE '❌ status MISSING' 
  END;

-- ============================================
-- 3. CHECK DATA TYPE ISSUES
-- ============================================

-- Check data types for potential mismatches
SELECT 'Checking data types for potential issues:' as info;

-- Array fields that should be TEXT[] but might be TEXT
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'ARRAY' THEN '✅ Correct array type'
    WHEN data_type = 'text' AND column_name IN ('genres', 'sub_genres', 'moods', 'instruments', 'media_usage') THEN '❌ Should be TEXT[] not TEXT'
    ELSE 'ℹ️ ' || data_type
  END as status
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name IN ('genres', 'sub_genres', 'moods', 'instruments', 'media_usage');

-- Numeric fields that should be INTEGER but might be TEXT
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'integer' THEN '✅ Correct integer type'
    WHEN data_type = 'text' AND column_name IN ('bpm', 'duration') THEN '❌ Should be INTEGER not TEXT'
    ELSE 'ℹ️ ' || data_type
  END as status
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name IN ('bpm', 'duration');

-- Boolean fields
SELECT 
  column_name,
  data_type,
  CASE 
    WHEN data_type = 'boolean' THEN '✅ Correct boolean type'
    WHEN data_type = 'text' AND column_name IN ('has_vocals', 'is_sync_only') THEN '❌ Should be BOOLEAN not TEXT'
    ELSE 'ℹ️ ' || data_type
  END as status
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND column_name IN ('has_vocals', 'is_sync_only');

-- ============================================
-- 4. CHECK NOT NULL CONSTRAINTS
-- ============================================

-- Check which fields are NOT NULL (required)
SELECT 'Checking NOT NULL constraints:' as info;
SELECT 
  column_name,
  is_nullable,
  CASE 
    WHEN is_nullable = 'NO' THEN '❌ Required field - must be provided'
    ELSE '✅ Optional field'
  END as status
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND is_nullable = 'NO'
ORDER BY column_name;

-- ============================================
-- 5. CHECK FOREIGN KEY CONSTRAINTS
-- ============================================

-- Check foreign key constraints
SELECT 'Checking foreign key constraints:' as info;
SELECT 
  tc.constraint_name,
  tc.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  CASE 
    WHEN tc.is_nullable = 'NO' THEN '❌ Required foreign key'
    ELSE '✅ Optional foreign key'
  END as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'tracks';

-- ============================================
-- 6. CHECK FOR TRIGGERS THAT MIGHT INTERFERE
-- ============================================

-- Check for triggers that might cause issues
SELECT 'Checking triggers on tracks table:' as info;
SELECT 
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'tracks';

-- ============================================
-- 7. TEST DATA INSERT SIMULATION
-- ============================================

-- Simulate the data that would be sent by the rights holder upload form
SELECT 'Testing data structure for rights holder upload:' as info;

-- Show what the insert data should look like
SELECT 
  'Expected insert data structure:' as info,
  'track_producer_id: UUID' as field1,
  'title: TEXT (required)' as field2,
  'artist: TEXT (required)' as field3,
  'genres: TEXT[] (array of strings)' as field4,
  'sub_genres: TEXT[] (array of strings)' as field5,
  'moods: TEXT[] (array of strings)' as field6,
  'bpm: INTEGER' as field7,
  'key: TEXT' as field8,
  'duration: INTEGER' as field9,
  'description: TEXT' as field10,
  'audio_url: TEXT' as field11,
  'image_url: TEXT' as field12,
  'instruments: TEXT[] (array of strings)' as field13,
  'media_usage: TEXT[] (array of strings)' as field14,
  'has_vocals: BOOLEAN' as field15,
  'is_sync_only: BOOLEAN' as field16,
  'master_rights_owner: TEXT' as field17,
  'publishing_rights_owner: TEXT' as field18,
  'status: TEXT' as field19;

-- ============================================
-- 8. SUMMARY AND RECOMMENDATIONS
-- ============================================

SELECT 'Schema validation summary:' as info;

-- Count potential issues
SELECT 
  'Missing columns:' as issue_type,
  COUNT(*) as count
FROM (
  SELECT column_name FROM (
    VALUES 
      ('track_producer_id'), ('title'), ('artist'), ('genres'), ('sub_genres'),
      ('moods'), ('bpm'), ('key'), ('duration'), ('description'), ('audio_url'),
      ('image_url'), ('instruments'), ('media_usage'), ('has_vocals'), 
      ('is_sync_only'), ('master_rights_owner'), ('publishing_rights_owner'), ('status')
  ) AS required_columns(column_name)
  WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tracks' AND column_name = required_columns.column_name
  )
) AS missing_columns

UNION ALL

SELECT 
  'Wrong data types:' as issue_type,
  COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'tracks' 
AND (
  (column_name IN ('genres', 'sub_genres', 'moods', 'instruments', 'media_usage') AND data_type != 'ARRAY')
  OR (column_name IN ('bpm', 'duration') AND data_type != 'integer')
  OR (column_name IN ('has_vocals', 'is_sync_only') AND data_type != 'boolean')
);

SELECT 'Schema validation completed. Check the results above for any issues.' as final_note;
