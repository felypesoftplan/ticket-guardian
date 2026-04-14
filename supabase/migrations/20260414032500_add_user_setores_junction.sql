-- Create user_setores junction table for many-to-many relationship
CREATE TABLE public.user_setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  setor_id UUID REFERENCES public.setores(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, setor_id)
);

ALTER TABLE public.user_setores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_setores
CREATE POLICY "All can read user_setores" ON public.user_setores
FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Admin can insert user_setores" ON public.user_setores
FOR INSERT TO authenticated
WITH CHECK (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can update user_setores" ON public.user_setores
FOR UPDATE TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

CREATE POLICY "Admin can delete user_setores" ON public.user_setores
FOR DELETE TO authenticated
USING (public.get_user_role(auth.uid()) = 'admin');

-- Helper function to get user setores
CREATE OR REPLACE FUNCTION public.get_user_setores(_user_id UUID)
RETURNS TABLE(id UUID, nome TEXT, cor TEXT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT s.id, s.nome, s.cor
  FROM public.setores s
  INNER JOIN public.user_setores us ON s.id = us.setor_id
  WHERE us.user_id = _user_id
  ORDER BY s.nome
$$;

-- Migrate existing setor_id to user_setores for users that have a setor
INSERT INTO public.user_setores (user_id, setor_id)
SELECT id, setor_id FROM public.users WHERE setor_id IS NOT NULL
ON CONFLICT (user_id, setor_id) DO NOTHING;
