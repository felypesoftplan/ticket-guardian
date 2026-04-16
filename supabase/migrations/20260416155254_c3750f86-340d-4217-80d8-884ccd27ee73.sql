
ALTER TABLE public.chamados ADD COLUMN criado_por_id uuid REFERENCES public.users(id);

-- Backfill: set criado_por_id to solicitante_id for existing records
UPDATE public.chamados SET criado_por_id = solicitante_id WHERE criado_por_id IS NULL;
