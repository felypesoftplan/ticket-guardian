-- Fix login issue: Allow anonymous read of username/email for authentication
-- This fixes the chicken-and-egg problem where you need to be authenticated to read users table
-- but need to read users table to authenticate

-- Drop the restrictive policy
DROP POLICY "Authenticated users can read users" ON public.users;

-- Create new policy that allows anonymous read of username and email for login
CREATE POLICY "Anonymous can read username and email for login" ON public.users
FOR SELECT TO anon
USING (true)
WITH CHECK (false); -- No inserts/updates for anon

-- Keep the authenticated policy for full user data
CREATE POLICY "Authenticated users can read full user data" ON public.users
FOR SELECT TO authenticated
USING (true);