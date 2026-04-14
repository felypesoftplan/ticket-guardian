
-- Create app_role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'suporte', 'gestor', 'usuario');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Setores
CREATE TABLE public.setores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  ativo BOOLEAN DEFAULT true,
  email_responsavel TEXT,
  cor TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.setores ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_setores_updated_at BEFORE UPDATE ON public.setores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Users table (profiles linked to auth.users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role app_role NOT NULL DEFAULT 'usuario',
  setor_id UUID REFERENCES public.setores(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User roles table (for RLS helper function)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checks
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Helper: get user role from users table
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = _user_id
$$;

-- Statuses
CREATE TABLE public.statuses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  ordem INTEGER NOT NULL DEFAULT 0,
  inicial BOOLEAN DEFAULT false,
  final BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_statuses_updated_at BEFORE UPDATE ON public.statuses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Prioridades
CREATE TABLE public.prioridades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  nivel INTEGER NOT NULL DEFAULT 1,
  cor TEXT NOT NULL DEFAULT '#3b82f6',
  prazo_dias_uteis INTEGER NOT NULL DEFAULT 5,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.prioridades ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_prioridades_updated_at BEFORE UPDATE ON public.prioridades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Classes de Suporte
CREATE TABLE public.classe_suportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT UNIQUE NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.classe_suportes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_classe_suportes_updated_at BEFORE UPDATE ON public.classe_suportes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tipos de Suporte
CREATE TABLE public.tipo_suportes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  ativo BOOLEAN DEFAULT true,
  prazo_dias_uteis INTEGER NOT NULL DEFAULT 5,
  classe_suporte_id UUID REFERENCES public.classe_suportes(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.tipo_suportes ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_tipo_suportes_updated_at BEFORE UPDATE ON public.tipo_suportes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Junction: setor_tipo_suporte
CREATE TABLE public.setor_tipo_suporte (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setor_id UUID NOT NULL REFERENCES public.setores(id) ON DELETE CASCADE,
  tipo_suporte_id UUID NOT NULL REFERENCES public.tipo_suportes(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(setor_id, tipo_suporte_id)
);
ALTER TABLE public.setor_tipo_suporte ENABLE ROW LEVEL SECURITY;

-- Chamados
CREATE TABLE public.chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL CHECK (char_length(titulo) >= 5 AND char_length(titulo) <= 255),
  descricao TEXT NOT NULL CHECK (char_length(descricao) >= 10),
  setor_id UUID NOT NULL REFERENCES public.setores(id),
  tipo_suporte_id UUID NOT NULL REFERENCES public.tipo_suportes(id),
  prioridade_id UUID NOT NULL REFERENCES public.prioridades(id),
  status_id UUID NOT NULL REFERENCES public.statuses(id),
  solicitante_id UUID NOT NULL REFERENCES public.users(id),
  responsavel_id UUID REFERENCES public.users(id),
  assumido_em TIMESTAMPTZ,
  sla_vencimento TIMESTAMPTZ,
  finalizado_em TIMESTAMPTZ,
  modulo_sider TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.chamados ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_chamados_updated_at BEFORE UPDATE ON public.chamados FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_chamados_status ON public.chamados(status_id);
CREATE INDEX idx_chamados_setor ON public.chamados(setor_id);
CREATE INDEX idx_chamados_solicitante ON public.chamados(solicitante_id);
CREATE INDEX idx_chamados_responsavel ON public.chamados(responsavel_id);
CREATE INDEX idx_chamados_prioridade ON public.chamados(prioridade_id);

-- Chamado Anexos
CREATE TABLE public.chamado_anexos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  nome_original TEXT NOT NULL,
  caminho TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.chamado_anexos ENABLE ROW LEVEL SECURITY;

-- Historico Chamados
CREATE TABLE public.historico_chamados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chamado_id UUID NOT NULL REFERENCES public.chamados(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  acao TEXT NOT NULL,
  descricao TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.historico_chamados ENABLE ROW LEVEL SECURITY;

-- Storage bucket for attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('chamados', 'chamados', true);

-- RLS POLICIES

-- Users
CREATE POLICY "Authenticated users can read users" ON public.users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert users" ON public.users FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can update users" ON public.users FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin' OR auth.uid() = id);
CREATE POLICY "Admin can delete users" ON public.users FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- User roles
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can update roles" ON public.user_roles FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Setores
CREATE POLICY "All can read setores" ON public.setores FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert setores" ON public.setores FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can update setores" ON public.setores FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can delete setores" ON public.setores FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Statuses
CREATE POLICY "All can read statuses" ON public.statuses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert statuses" ON public.statuses FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can update statuses" ON public.statuses FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can delete statuses" ON public.statuses FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Prioridades
CREATE POLICY "All can read prioridades" ON public.prioridades FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert prioridades" ON public.prioridades FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can update prioridades" ON public.prioridades FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can delete prioridades" ON public.prioridades FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Classe suportes
CREATE POLICY "All can read classe_suportes" ON public.classe_suportes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert classe_suportes" ON public.classe_suportes FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can update classe_suportes" ON public.classe_suportes FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can delete classe_suportes" ON public.classe_suportes FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Tipo suportes
CREATE POLICY "All can read tipo_suportes" ON public.tipo_suportes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert tipo_suportes" ON public.tipo_suportes FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can update tipo_suportes" ON public.tipo_suportes FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can delete tipo_suportes" ON public.tipo_suportes FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Setor tipo suporte
CREATE POLICY "All can read setor_tipo_suporte" ON public.setor_tipo_suporte FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can insert setor_tipo_suporte" ON public.setor_tipo_suporte FOR INSERT TO authenticated WITH CHECK (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can update setor_tipo_suporte" ON public.setor_tipo_suporte FOR UPDATE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can delete setor_tipo_suporte" ON public.setor_tipo_suporte FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Chamados
CREATE POLICY "Read chamados" ON public.chamados FOR SELECT TO authenticated USING (
  public.get_user_role(auth.uid()) IN ('admin', 'gestor')
  OR (public.get_user_role(auth.uid()) = 'suporte' AND setor_id = (SELECT setor_id FROM public.users WHERE id = auth.uid()))
  OR solicitante_id = auth.uid()
);
CREATE POLICY "Create chamados" ON public.chamados FOR INSERT TO authenticated WITH CHECK (
  solicitante_id = auth.uid()
  OR public.get_user_role(auth.uid()) IN ('admin', 'gestor')
);
CREATE POLICY "Update chamados" ON public.chamados FOR UPDATE TO authenticated USING (
  public.get_user_role(auth.uid()) IN ('admin', 'gestor')
  OR (public.get_user_role(auth.uid()) = 'suporte' AND setor_id = (SELECT setor_id FROM public.users WHERE id = auth.uid()))
  OR solicitante_id = auth.uid()
);
CREATE POLICY "Admin can delete chamados" ON public.chamados FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Chamado anexos
CREATE POLICY "Read anexos" ON public.chamado_anexos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id AND (
    public.get_user_role(auth.uid()) IN ('admin', 'gestor')
    OR (public.get_user_role(auth.uid()) = 'suporte' AND c.setor_id = (SELECT setor_id FROM public.users WHERE id = auth.uid()))
    OR c.solicitante_id = auth.uid()
  ))
);
CREATE POLICY "Create anexos" ON public.chamado_anexos FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Delete anexos" ON public.chamado_anexos FOR DELETE TO authenticated USING (public.get_user_role(auth.uid()) = 'admin');

-- Historico
CREATE POLICY "Read historico" ON public.historico_chamados FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id AND (
    public.get_user_role(auth.uid()) IN ('admin', 'gestor')
    OR (public.get_user_role(auth.uid()) = 'suporte' AND c.setor_id = (SELECT setor_id FROM public.users WHERE id = auth.uid()))
    OR c.solicitante_id = auth.uid()
  ))
);
CREATE POLICY "Create historico" ON public.historico_chamados FOR INSERT TO authenticated WITH CHECK (true);

-- Storage policies
CREATE POLICY "Public read chamados storage" ON storage.objects FOR SELECT USING (bucket_id = 'chamados');
CREATE POLICY "Authenticated upload chamados" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'chamados');
CREATE POLICY "Admin delete chamados storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'chamados' AND public.get_user_role(auth.uid()) = 'admin');
