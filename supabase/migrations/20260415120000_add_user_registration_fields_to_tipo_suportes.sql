-- Add dynamic form fields for user registration types to tipo_suportes table

ALTER TABLE public.tipo_suportes
ADD COLUMN campo_nome_completo TEXT,
ADD COLUMN campo_cpf TEXT,
ADD COLUMN campo_usuario_sei TEXT,
ADD COLUMN campo_email_expresso TEXT,
ADD COLUMN campo_telefone TEXT,
ADD COLUMN campo_modulos TEXT,
ADD COLUMN campo_nome_rt TEXT,
ADD COLUMN campo_numero_art TEXT,
ADD COLUMN campo_cpf_rt TEXT,
ADD COLUMN campo_numero_registro TEXT,
ADD COLUMN campo_email_corporativo TEXT,
ADD COLUMN campo_cnpj_empresa TEXT;

COMMENT ON COLUMN public.tipo_suportes.campo_nome_completo IS 'Campo de Nome completo para Cadastrar Usuário | Internos';
COMMENT ON COLUMN public.tipo_suportes.campo_cpf IS 'Campo de CPF para Cadastrar Usuário | Internos';
COMMENT ON COLUMN public.tipo_suportes.campo_usuario_sei IS 'Campo de Usuário SEI para Cadastrar Usuário | Internos';
COMMENT ON COLUMN public.tipo_suportes.campo_email_expresso IS 'Campo de E-mail Expresso para Cadastrar Usuário | Internos';
COMMENT ON COLUMN public.tipo_suportes.campo_telefone IS 'Campo de Telefone para Cadastrar Usuário | Internos';
COMMENT ON COLUMN public.tipo_suportes.campo_modulos IS 'Campo de Módulos para Cadastrar Usuário | Internos';
COMMENT ON COLUMN public.tipo_suportes.campo_nome_rt IS 'Campo de Nome do RT para Cadastrar Usuário | Externos';
COMMENT ON COLUMN public.tipo_suportes.campo_numero_art IS 'Campo de Número da ART para Cadastrar Usuário | Externos';
COMMENT ON COLUMN public.tipo_suportes.campo_cpf_rt IS 'Campo de CPF do RT para Cadastrar Usuário | Externos';
COMMENT ON COLUMN public.tipo_suportes.campo_numero_registro IS 'Campo de Número do Registro Profissional para Cadastrar Usuário | Externos';
COMMENT ON COLUMN public.tipo_suportes.campo_email_corporativo IS 'Campo de E-mail corporativo para Cadastrar Usuário | Externos';
COMMENT ON COLUMN public.tipo_suportes.campo_cnpj_empresa IS 'Campo de CNPJ da empresa para Cadastrar Usuário | Externos';
