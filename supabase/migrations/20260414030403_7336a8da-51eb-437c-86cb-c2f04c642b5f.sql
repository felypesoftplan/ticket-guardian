
-- Fix overly permissive insert policies
DROP POLICY "Create anexos" ON public.chamado_anexos;
CREATE POLICY "Create anexos" ON public.chamado_anexos FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id AND (
    public.get_user_role(auth.uid()) IN ('admin', 'gestor')
    OR (public.get_user_role(auth.uid()) = 'suporte' AND c.setor_id = (SELECT setor_id FROM public.users WHERE id = auth.uid()))
    OR c.solicitante_id = auth.uid()
  ))
);

DROP POLICY "Create historico" ON public.historico_chamados;
CREATE POLICY "Create historico" ON public.historico_chamados FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.chamados c WHERE c.id = chamado_id AND (
    public.get_user_role(auth.uid()) IN ('admin', 'gestor')
    OR (public.get_user_role(auth.uid()) = 'suporte' AND c.setor_id = (SELECT setor_id FROM public.users WHERE id = auth.uid()))
    OR c.solicitante_id = auth.uid()
  ))
);

-- Restrict storage listing to authenticated users only
DROP POLICY "Public read chamados storage" ON storage.objects;
CREATE POLICY "Authenticated read chamados storage" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'chamados');
