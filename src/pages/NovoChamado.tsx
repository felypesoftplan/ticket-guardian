import { useState, useEffect, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { calculateSLA } from '@/lib/sla';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Loader2, User, CreditCard, Monitor, Mail, Phone, Settings, FileText, Building, Building2, FormInput } from 'lucide-react';

export default function NovoChamado() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const userSetorId = profile?.setor_id;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'gestor';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Options
  const [setores, setSetores] = useState<any[]>([]);
  const [tipoSuportes, setTipoSuportes] = useState<any[]>([]);
  const [prioridades, setPrioridades] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [classeSuportes, setClasseSuportes] = useState<any[]>([]);

  // Form data
  const [setorId, setSetorId] = useState('');
  const [tipoSuporteId, setTipoSuporteId] = useState('');
  const [prioridadeId, setPrioridadeId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [solicitanteId, setSolicitanteId] = useState('');
  const [moduloSider, setModuloSider] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);

  // User registration fields
  const [campoNomeCompleto, setCampoNomeCompleto] = useState('');
  const [campoCpf, setCampoCpf] = useState('');
  const [campoUsuarioSei, setCampoUsuarioSei] = useState('');
  const [campoEmailExpresso, setCampoEmailExpresso] = useState('');
  const [campoTelefone, setCampoTelefone] = useState('');
  const [campoModulos, setCampoModulos] = useState('');
  const [campoNomeRt, setCampoNomeRt] = useState('');
  const [campoNumeroArt, setCampoNumeroArt] = useState('');
  const [campoCpfRt, setCampoCpfRt] = useState('');
  const [campoNumeroRegistro, setCampoNumeroRegistro] = useState('');
  const [campoEmailCorporativo, setCampoEmailCorporativo] = useState('');
  const [campoCnpjEmpresa, setCampoCnpjEmpresa] = useState('');

  const modulosSider = [
    { value: 'SCO', label: 'SCO - Composição de Custos e Orçamento de Obras' },
    { value: 'SMO', label: 'SMO - Gestão de Contratos e Medições de Obras' },
    { value: 'SGF', label: 'SGF - Gerenciamento Financeiro e Orçamentário' },
    { value: 'MIG', label: 'MIG - Informações Gerenciais' },
  ];
  const [classeId, setClasseId] = useState('');

  const isSider = setores.find(s => s.id === setorId)?.nome === 'SIDER';
  const canChooseSolicitante = profile?.role === 'admin' || profile?.role === 'gestor';

  // Check if selected tipo suporte is for user registration
  const selectedTipoSuporte = tipoSuportes.find(t => t.id === tipoSuporteId);
  const isUserRegistrationInternal = selectedTipoSuporte?.nome?.includes('Cadastrar Usuário') && selectedTipoSuporte?.nome?.includes('Internos');
  const isUserRegistrationExternal = selectedTipoSuporte?.nome?.includes('Cadastrar Usuário') && selectedTipoSuporte?.nome?.includes('Externos');
  const isUserRegistration = isUserRegistrationInternal || isUserRegistrationExternal;

  useEffect(() => {
    const fetch = async () => {
      // If user has setor_id and is not admin, only fetch their setor
      let setoresQuery = supabase.from('setores').select('*').eq('ativo', true);
      if (userSetorId && !isAdmin) {
        setoresQuery = setoresQuery.eq('id', userSetorId);
      }

      const [setoresRes, prioridadesRes, usersRes, classeRes] = await Promise.all([
        setoresQuery,
        supabase.from('prioridades').select('*').eq('ativo', true).order('nivel'),
        supabase.from('users').select('id, name').eq('ativo', true),
        supabase.from('classe_suportes').select('*').eq('ativo', true),
      ]);
      setSetores(setoresRes.data || []);
      setPrioridades(prioridadesRes.data || []);
      setUsuarios(usersRes.data || []);
      setClasseSuportes(classeRes.data || []);
      
      // If user has a setor and not admin, auto-select their setor
      if (userSetorId && !isAdmin && setoresRes.data && setoresRes.data.length > 0) {
        setSetorId(userSetorId);
      }
    };
    fetch();
  }, [userSetorId, isAdmin]);

  useEffect(() => {
    if (!setorId) return;
    const fetchTipos = async () => {
      const { data: junctions } = await supabase
        .from('setor_tipo_suporte')
        .select('tipo_suporte_id')
        .eq('setor_id', setorId);

      if (junctions && junctions.length > 0) {
        const ids = junctions.map(j => j.tipo_suporte_id);
        let query = supabase.from('tipo_suportes').select('*').eq('ativo', true).in('id', ids);
        if (isSider && classeId) {
          query = query.eq('classe_suporte_id', classeId);
        }
        const { data } = await query;
        setTipoSuportes(data || []);
      } else {
        setTipoSuportes([]);
      }
    };
    fetchTipos();
  }, [setorId, classeId, isSider]);

  useEffect(() => {
    if (user && !canChooseSolicitante) {
      setSolicitanteId(user.id);
    }
  }, [user, canChooseSolicitante]);

  // Clear user registration fields when tipo suporte changes
  useEffect(() => {
    if (!isUserRegistration) {
      setCampoNomeCompleto('');
      setCampoCpf('');
      setCampoUsuarioSei('');
      setCampoEmailExpresso('');
      setCampoTelefone('');
      setCampoModulos('');
      setCampoNomeRt('');
      setCampoNumeroArt('');
      setCampoCpfRt('');
      setCampoNumeroRegistro('');
      setCampoEmailCorporativo('');
      setCampoCnpjEmpresa('');
    }
  }, [tipoSuporteId, isUserRegistration]);

  const handleAttachmentChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setAttachments(files);
  };

  const uploadAttachments = async (chamadoId: string) => {
    if (attachments.length === 0) return;

    for (const file of attachments) {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
      const filePath = `chamados/${chamadoId}/${Date.now()}-${safeFileName}`;
      const { error: uploadError } = await supabase.storage.from('chamados').upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

      if (uploadError) {
        throw uploadError;
      }

      const { error: insertError } = await supabase.from('chamado_anexos').insert({
        chamado_id: chamadoId,
        nome_original: file.name,
        caminho: filePath,
      });

      if (insertError) {
        throw insertError;
      }
    }
  };

  const handleSubmit = async () => {
    // Validate title only if not user registration (which generates title automatically)
    if (!isUserRegistration && (!titulo || titulo.length < 5)) {
      toast({ title: 'Título deve ter pelo menos 5 caracteres', variant: 'destructive' });
      return;
    }
    if (!isUserRegistration && (!descricao || descricao.length < 10)) {
      toast({ title: 'Descrição deve ter pelo menos 10 caracteres', variant: 'destructive' });
      return;
    }

    // Validate user registration fields if applicable
    if (isUserRegistration) {
      if (isUserRegistrationInternal) {
        if (!campoNomeCompleto || !campoCpf || !campoUsuarioSei || !campoEmailExpresso || !campoTelefone || !campoModulos) {
          toast({ title: 'Todos os campos de cadastro de usuário interno são obrigatórios', variant: 'destructive' });
          return;
        }
      } else if (isUserRegistrationExternal) {
        if (!campoNomeRt || !campoNumeroArt || !campoCpfRt || !campoNumeroRegistro || !campoEmailCorporativo || !campoCnpjEmpresa) {
          toast({ title: 'Todos os campos de cadastro de usuário externo são obrigatórios', variant: 'destructive' });
          return;
        }
      }
    }

    setLoading(true);
    try {
      // Generate title and description for user registration
      let finalTitulo = titulo;
      let finalDescricao = descricao || '';

      if (isUserRegistration) {
        if (isUserRegistrationInternal) {
          finalTitulo = `Criação de usuário ${campoNomeCompleto}`;
          finalDescricao = `Solicitação de criação de usuário interno:\n\n` +
            `• Nome completo: ${campoNomeCompleto}\n` +
            `• CPF: ${campoCpf}\n` +
            `• Usuário SEI: ${campoUsuarioSei}\n` +
            `• E-mail Expresso: ${campoEmailExpresso}\n` +
            `• Telefone: ${campoTelefone}\n` +
            `• Módulos que precisa de acesso: ${campoModulos}`;
          if (descricao) {
            finalDescricao += `\n\nObservações adicionais: ${descricao}`;
          }
        } else if (isUserRegistrationExternal) {
          finalTitulo = `Criação de usuário ${campoNomeRt}`;
          finalDescricao = `Solicitação de criação de usuário externo (RT):\n\n` +
            `• Nome completo do RT: ${campoNomeRt}\n` +
            `• Número da ART: ${campoNumeroArt}\n` +
            `• CPF do RT: ${campoCpfRt}\n` +
            `• Número do Registro Profissional: ${campoNumeroRegistro}\n` +
            `• E-mail corporativo: ${campoEmailCorporativo}\n` +
            `• CNPJ da empresa contratada: ${campoCnpjEmpresa}`;
          if (descricao) {
            finalDescricao += `\n\nObservações adicionais: ${descricao}`;
          }
        }
      }
      // Get initial status
      const { data: statusInicial } = await supabase
        .from('statuses')
        .select('id')
        .eq('inicial', true)
        .single();

      if (!statusInicial) throw new Error('Status inicial não encontrado');

      // Get priority and tipo suporte for SLA
      const selectedPrioridade = prioridades.find(p => p.id === prioridadeId);
      const selectedTipo = tipoSuportes.find(t => t.id === tipoSuporteId);

      const slaVencimento = calculateSLA(
        new Date(),
        selectedPrioridade?.prazo_dias_uteis || 5,
        selectedTipo?.prazo_dias_uteis || 5
      );

      const { data: chamado, error } = await supabase
        .from('chamados')
        .insert({
          titulo: finalTitulo,
          descricao: finalDescricao,
          setor_id: setorId,
          tipo_suporte_id: tipoSuporteId,
          prioridade_id: prioridadeId,
          status_id: statusInicial.id,
          solicitante_id: solicitanteId || user!.id,
          sla_vencimento: slaVencimento.toISOString(),
          modulo_sider: isSider ? moduloSider : null,
        })
        .select()
        .single();

      if (error) throw error;

      // Create history entry
      await supabase.from('historico_chamados').insert({
        chamado_id: chamado.id,
        user_id: user!.id,
        acao: 'criado',
        descricao: 'Chamado criado',
      });

      await uploadAttachments(chamado.id);

      toast({ title: 'Chamado criado com sucesso!' });
      navigate(`/chamados/${chamado.id}`);
    } catch (err: any) {
      toast({ title: 'Erro ao criar chamado', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const totalSteps = isSider ? 6 : 4;

  const renderStep = () => {
    if (isSider) {
      switch (step) {
        case 1:
          return (
            <div className="space-y-4">
              <Label>Setor</Label>
              {userSetorId && !isAdmin && setores.length === 1 ? (
                <div className="p-3 rounded-md bg-muted text-sm font-medium">{setores[0]?.nome || 'Seu setor'}</div>
              ) : (
                <Select value={setorId} onValueChange={v => { setSetorId(v); setTipoSuporteId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>
                    {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>
          );
        case 2:
          return (
            <div className="space-y-4">
              <Label>Módulo SIDER</Label>
              <Select value={moduloSider} onValueChange={setModuloSider}>
                <SelectTrigger><SelectValue placeholder="Selecione o módulo" /></SelectTrigger>
                <SelectContent>
                  {modulosSider.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          );
        case 3:
          return (
            <div className="space-y-4">
              <Label>Classe de Suporte</Label>
              <Select value={classeId} onValueChange={setClasseId}>
                <SelectTrigger><SelectValue placeholder="Selecione a classe" /></SelectTrigger>
                <SelectContent>
                  {classeSuportes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          );
        case 4:
          return (
            <div className="space-y-4">
              <Label>Tipo de Suporte</Label>
              <Select value={tipoSuporteId} onValueChange={setTipoSuporteId}>
                <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                <SelectContent>
                  {tipoSuportes.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          );
        case 5:
          return renderDetailsStep();
        case 6:
          return renderPrioridadeStep();
      }
    } else {
      switch (step) {
        case 1:
          return (
            <div className="space-y-4">
              <div>
                <Label>Setor</Label>
                {userSetorId && !isAdmin && setores.length === 1 ? (
                  <div className="p-3 rounded-md bg-muted text-sm font-medium">{setores[0]?.nome || 'Seu setor'}</div>
                ) : (
                  <Select value={setorId} onValueChange={v => { setSetorId(v); setTipoSuporteId(''); }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                    <SelectContent>
                      {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              </div>
              {setorId && (
                <div>
                  <Label>Tipo de Suporte</Label>
                  <Select value={tipoSuporteId} onValueChange={setTipoSuporteId}>
                    <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                    <SelectContent>
                      {tipoSuportes.map(t => <SelectItem key={t.id} value={t.id}>{t.nome}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        case 2:
          return renderDetailsStep();
        case 3:
          return renderPrioridadeStep();
        case 4:
          return renderReviewStep();
      }
    }
  };

  const renderDetailsStep = () => (
    <div className="space-y-4">
      {isUserRegistration && (
        <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4 flex items-center gap-2">
            <FormInput className="h-5 w-5" />
            Formulário de {isUserRegistrationInternal ? 'Criação de Usuário Interno' : 'Criação de Usuário Externo (RT)'}
          </h3>
          
          {isUserRegistrationInternal && (
            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome completo *
                </Label>
                <Input value={campoNomeCompleto} onChange={e => setCampoNomeCompleto(e.target.value)} placeholder="Nome completo do usuário" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  CPF *
                </Label>
                <Input value={campoCpf} onChange={e => setCampoCpf(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Usuário SEI *
                </Label>
                <Input value={campoUsuarioSei} onChange={e => setCampoUsuarioSei(e.target.value)} placeholder="Usuário no sistema SEI" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail Expresso *
                </Label>
                <Input type="email" value={campoEmailExpresso} onChange={e => setCampoEmailExpresso(e.target.value)} placeholder="email@der.pe.gov.br" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefone *
                </Label>
                <Input value={campoTelefone} onChange={e => setCampoTelefone(e.target.value)} placeholder="(81) 99999-9999" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Módulos que precisa de acesso *
                </Label>
                <Input value={campoModulos} onChange={e => setCampoModulos(e.target.value)} placeholder="SMO, SGF e/ou SCO" />
              </div>
            </div>
          )}

          {isUserRegistrationExternal && (
            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nome completo do RT *
                </Label>
                <Input value={campoNomeRt} onChange={e => setCampoNomeRt(e.target.value)} placeholder="Nome completo do Responsável Técnico" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Número da ART *
                </Label>
                <Input value={campoNumeroArt} onChange={e => setCampoNumeroArt(e.target.value)} placeholder="Número da Anotação de Responsabilidade Técnica" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  CPF do RT *
                </Label>
                <Input value={campoCpfRt} onChange={e => setCampoCpfRt(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Número do Registro Profissional *
                </Label>
                <Input value={campoNumeroRegistro} onChange={e => setCampoNumeroRegistro(e.target.value)} placeholder="Número do CREA/CAU" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-mail corporativo *
                </Label>
                <Input type="email" value={campoEmailCorporativo} onChange={e => setCampoEmailCorporativo(e.target.value)} placeholder="email@empresa.com" />
              </div>
              <div>
                <Label className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  CNPJ da empresa contratada *
                </Label>
                <Input value={campoCnpjEmpresa} onChange={e => setCampoCnpjEmpresa(e.target.value)} placeholder="00.000.000/0000-00" />
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <Label>Título {isUserRegistration ? '(Será gerado automaticamente)' : '*'}</Label>
        <Input 
          value={titulo} 
          onChange={e => setTitulo(e.target.value)} 
          placeholder={isUserRegistration ? "Será preenchido automaticamente" : "Mín 5 caracteres"} 
          maxLength={255}
          disabled={isUserRegistration}
        />
      </div>
      <div>
        <Label>Descrição {isUserRegistration ? '(Observações adicionais)' : '*'}</Label>
        <Textarea 
          value={descricao} 
          onChange={e => setDescricao(e.target.value)} 
          placeholder={isUserRegistration ? "Observações adicionais (opcional)" : "Mín 10 caracteres"} 
          rows={4}
        />
      </div>
      <div>
        <Label>Anexos</Label>
        <Input type="file" accept="image/*" multiple onChange={handleAttachmentChange} />
        {attachments.length > 0 && (
          <div className="space-y-2 mt-2">
            <p className="text-sm text-muted-foreground">Arquivos selecionados:</p>
            {attachments.map((file, index) => (
              <div key={index} className="flex items-center justify-between rounded-md border border-input px-3 py-2">
                <span className="truncate text-sm">{file.name}</span>
                <Button variant="outline" size="sm" type="button" onClick={() => setAttachments(prev => prev.filter((_, i) => i !== index))}>
                  Remover
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      {canChooseSolicitante && (
        <div>
          <Label>Solicitante</Label>
          <Select value={solicitanteId} onValueChange={setSolicitanteId}>
            <SelectTrigger><SelectValue placeholder="Selecione o solicitante" /></SelectTrigger>
            <SelectContent>
              {usuarios.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );

  const renderPrioridadeStep = () => (
    <div className="space-y-4">
      <Label>Prioridade</Label>
      <Select value={prioridadeId} onValueChange={setPrioridadeId}>
        <SelectTrigger><SelectValue placeholder="Selecione a prioridade" /></SelectTrigger>
        <SelectContent>
          {prioridades.map(p => (
            <SelectItem key={p.id} value={p.id}>
              <span style={{ color: p.cor }}>{p.nome}</span> — {p.prazo_dias_uteis} dia(s)
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const renderReviewStep = () => {
    const setor = setores.find(s => s.id === setorId);
    const tipo = tipoSuportes.find(t => t.id === tipoSuporteId);
    const prio = prioridades.find(p => p.id === prioridadeId);
    return (
      <div className="space-y-3">
        <h3 className="font-semibold">Resumo</h3>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <span className="text-muted-foreground">Setor:</span><span>{setor?.nome}</span>
          <span className="text-muted-foreground">Tipo:</span><span>{tipo?.nome}</span>
          <span className="text-muted-foreground">Prioridade:</span><span>{prio?.nome}</span>
          <span className="text-muted-foreground">Título:</span><span>{titulo}</span>
        </div>
      </div>
    );
  };

  const canNext = () => {
    if (isSider) {
      switch (step) {
        case 1: return !!setorId;
        case 2: return !!moduloSider;
        case 3: return !!classeId;
        case 4: return !!tipoSuporteId;
        case 5: {
          // Validate user registration fields if applicable
          if (isUserRegistration) {
            if (isUserRegistrationInternal) {
              return !!campoNomeCompleto && !!campoCpf && !!campoUsuarioSei && !!campoEmailExpresso && !!campoTelefone && !!campoModulos;
            } else if (isUserRegistrationExternal) {
              return !!campoNomeRt && !!campoNumeroArt && !!campoCpfRt && !!campoNumeroRegistro && !!campoEmailCorporativo && !!campoCnpjEmpresa;
            }
          }
          // For non-user registration, require title and description
          return !isUserRegistration ? (titulo.length >= 5 && descricao.length >= 10) : true;
        }
        case 6: return !!prioridadeId;
      }
    } else {
      switch (step) {
        case 1: return !!setorId && !!tipoSuporteId;
        case 2: {
          // Validate user registration fields if applicable
          if (isUserRegistration) {
            if (isUserRegistrationInternal) {
              return !!campoNomeCompleto && !!campoCpf && !!campoUsuarioSei && !!campoEmailExpresso && !!campoTelefone && !!campoModulos;
            } else if (isUserRegistrationExternal) {
              return !!campoNomeRt && !!campoNumeroArt && !!campoCpfRt && !!campoNumeroRegistro && !!campoEmailCorporativo && !!campoCnpjEmpresa;
            }
          }
          // For non-user registration, require title and description
          return !isUserRegistration ? (titulo.length >= 5 && descricao.length >= 10) : true;
        }
        case 3: return !!prioridadeId;
        case 4: return true;
      }
    }
    return false;
  };

  const isLastStep = step === totalSteps;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Button variant="ghost" onClick={() => navigate('/chamados')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Novo Chamado — Etapa {step} de {totalSteps}</CardTitle>
          <div className="flex gap-1 mt-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i < step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderStep()}

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
              Anterior
            </Button>
            {isLastStep ? (
              <Button onClick={handleSubmit} disabled={!canNext() || loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Chamado
              </Button>
            ) : (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()}>
                Próximo
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
