-- Find where function_calculate_audio_duration_pg is being called from
-- This will help identify the root cause of the track upload failure

-- ============================================
-- 1. CHECK FOR TRIGGERS THAT CALL THIS FUNCTION
-- ============================================

SELECT 
    'TRIGGER' as source_type,
    t.trigger_name,
    t.event_manipulation,
    t.action_statement,
    t.action_timing
FROM information_schema.triggers t
WHERE t.action_statement LIKE '%function_calculate_audio_duration_pg%'
   OR t.action_statement LIKE '%duration%';

-- ============================================
-- 2. CHECK FOR CHECK CONSTRAINTS
-- ============================================

SELECT 
    'CHECK CONSTRAINT' as source_type,
    c.conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'tracks'
  AND c.contype = 'c'
  AND pg_get_constraintdef(c.oid) LIKE '%duration%';

-- ============================================
-- 3. CHECK FOR DEFAULT VALUES THAT CALL FUNCTIONS
-- ============================================

SELECT 
    'DEFAULT VALUE' as source_type,
    column_name,
    column_default
FROM information_schema.columns
WHERE table_name = 'tracks'
  AND column_name = 'duration'
  AND column_default IS NOT NULL;

-- ============================================
-- 4. CHECK FOR ANY FUNCTION CALLS IN TABLE DEFINITIONS
-- ============================================

SELECT 
    'TABLE DEFINITION' as source_type,
    'tracks' as table_name,
    'Check if duration column has function-based default' as note;

-- ============================================
-- 5. SEARCH ALL FUNCTIONS FOR REFERENCES
-- ============================================

SELECT 
    'FUNCTION REFERENCE' as source_type,
    p.proname as function_name,
    p.prosrc as function_source
FROM pg_proc p
WHERE p.prosrc LIKE '%function_calculate_audio_duration_pg%';

-- ============================================
-- 6. CHECK FOR ANY VIEWS THAT MIGHT CALL THIS
-- ============================================

SELECT 
    'VIEW' as source_type,
    v.table_name,
    v.view_definition
FROM information_schema.views v
WHERE v.view_definition LIKE '%function_calculate_audio_duration_pg%'
   OR v.view_definition LIKE '%duration%';

-- ============================================
-- 7. SUMMARY
-- ============================================

SELECT 'Search complete. Check results above to find where the function is being called.' as summary;
