-- Fix RLS policies for search_synonyms table
-- Add INSERT and DELETE policies for authenticated users

-- Drop the existing admin policy that uses FOR ALL
DROP POLICY IF EXISTS "Allow admin access to search synonyms" ON public.search_synonyms;

-- Create specific policies for different operations

-- Allow authenticated users to read synonyms (keep existing)
-- This policy already exists, so we don't need to recreate it

-- Allow authenticated users to insert synonyms
CREATE POLICY "Allow authenticated users to insert search synonyms" ON public.search_synonyms
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update synonyms
CREATE POLICY "Allow authenticated users to update search synonyms" ON public.search_synonyms
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to delete synonyms
CREATE POLICY "Allow authenticated users to delete search synonyms" ON public.search_synonyms
    FOR DELETE USING (auth.role() = 'authenticated');

-- Verify the policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'search_synonyms'
ORDER BY policyname;
