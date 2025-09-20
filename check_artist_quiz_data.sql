-- Check artist applications quiz data
-- Run this in Supabase SQL Editor to see what quiz data is actually stored

-- 1. Check all artist applications with quiz data
SELECT 'All artist applications with quiz data:' as info;
SELECT 
    id,
    name,
    email,
    status,
    quiz_question_1,
    quiz_question_2,
    quiz_question_3,
    quiz_question_4,
    quiz_question_5,
    quiz_score,
    quiz_total_questions,
    quiz_completed,
    created_at
FROM artist_applications
ORDER BY created_at DESC;

-- 2. Check for applications with null quiz data
SELECT 'Applications with null quiz data:' as info;
SELECT 
    id,
    name,
    email,
    quiz_question_1,
    quiz_question_2,
    quiz_question_3,
    quiz_question_4,
    quiz_question_5,
    quiz_score,
    quiz_completed
FROM artist_applications
WHERE quiz_question_1 IS NULL 
   OR quiz_question_2 IS NULL 
   OR quiz_question_3 IS NULL 
   OR quiz_question_4 IS NULL 
   OR quiz_question_5 IS NULL
   OR quiz_score IS NULL
   OR quiz_completed IS NULL;

-- 3. Check for applications with empty string quiz data
SELECT 'Applications with empty string quiz data:' as info;
SELECT 
    id,
    name,
    email,
    quiz_question_1,
    quiz_question_2,
    quiz_question_3,
    quiz_question_4,
    quiz_question_5,
    quiz_score,
    quiz_completed
FROM artist_applications
WHERE quiz_question_1 = '' 
   OR quiz_question_2 = '' 
   OR quiz_question_3 = '' 
   OR quiz_question_4 = '' 
   OR quiz_question_5 = ''
   OR quiz_score = 0;

-- 4. Count applications by quiz completion status
SELECT 'Applications by quiz completion status:' as info;
SELECT 
    quiz_completed,
    COUNT(*) as count
FROM artist_applications
GROUP BY quiz_completed;

-- 5. Check the most recent application in detail
SELECT 'Most recent application quiz data:' as info;
SELECT 
    id,
    name,
    email,
    sync_licensing_course,
    quiz_question_1,
    quiz_question_2,
    quiz_question_3,
    quiz_question_4,
    quiz_question_5,
    quiz_score,
    quiz_total_questions,
    quiz_completed,
    application_score,
    created_at
FROM artist_applications
ORDER BY created_at DESC
LIMIT 1;
