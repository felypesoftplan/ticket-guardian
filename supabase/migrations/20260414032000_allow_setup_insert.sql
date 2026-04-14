-- Temporary fix: Allow anyone to insert the first admin user (during setup)
-- This will be removed after the admin user is created

DROP POLICY "Admin can insert users" ON public.users;

CREATE POLICY "Allow insert for setup" ON public.users
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- For future inserts, only admin can create users
-- We'll update this policy after testing
