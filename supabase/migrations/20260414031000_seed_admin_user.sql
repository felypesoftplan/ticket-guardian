-- Seed admin user
-- This migration creates an initial admin user for the system
-- Note: In production, use Supabase Dashboard or Edge Functions for user creation

DO $$
DECLARE
  admin_user_id UUID := gen_random_uuid();
BEGIN
  -- Insert into auth.users (this would normally be done via Supabase auth)
  -- For local development, this simulates user creation
  -- In production, create user via dashboard or API

  -- Insert profile into public.users
  INSERT INTO public.users (id, name, username, email, role, ativo)
  VALUES (
    admin_user_id,
    'Administrador Sistema',
    'admin',
    'admin@ticketguardian.com',
    'admin'::public.app_role,
    true
  );

  -- Note: You need to manually create the auth user with this ID and set password
  -- Via Supabase Dashboard: Authentication > Users > Add user
  -- Use email: admin@ticketguardian.com and set a password
  -- Then update the auth.users.id to match admin_user_id above

  RAISE NOTICE 'Admin user created with ID: %', admin_user_id;
  RAISE NOTICE 'Please create auth user with this ID in Supabase Dashboard and set password';
END
$$;