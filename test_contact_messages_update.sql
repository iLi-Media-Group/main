-- Test script to check contact messages update functionality
-- Run this in Supabase SQL Editor

-- 1. Check current contact messages
SELECT id, name, email, status, created_at 
FROM contact_messages 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Try to update a message (replace with actual message ID)
-- UPDATE contact_messages 
-- SET status = 'read' 
-- WHERE id = 'af5cab6c-c0dd-47fa-bce2-5a3bf60c475f';

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'contact_messages';

-- 4. Check if we're authenticated as admin
SELECT auth.uid(), auth.jwt() ->> 'email' as current_user_email;

-- 5. Check if current user has admin role
SELECT p.id, p.email, p.account_type 
FROM profiles p 
WHERE p.id = auth.uid(); 