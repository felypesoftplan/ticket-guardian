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
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function NovoChamado() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const modulosSider = [
    { value: 'SCO', label: 'SCO - Composição de Custos e Orçamento de Obras' },
    { value: 'SMO', label: 'SMO - Gestão de Contratos e Medições de Obras' },
    { value: 'SGF', label: 'SGF - Gerenciamento Financeiro e Orçamentário' },
    { value: 'MIG', label: 'MIG - Informações Gerenciais' },
  ];
  const [classeId, setClasseId] = useState('');

  const isSider = setores.find(s => s.id === setorId)?.nome === 'SIDER';
  const canChooseSolicitante = profile?.role === 'admin' || profile?.role === 'gestor';

  useEffect(() => {
    Promise.all([
      supabase.from('setores').select('*').eq('ativo', true),
      supabase.from('prioridades').select('*').eq('ativo', true).order('nivel'),
      supabase.from('users').select('id, name').eq('ativo', true),
      supabase.from('classe_suportes').select('*').eq('ativo', true),
    ]).then(([setoresRes, prioridadesRes, usersRes, classeRes]) => {
      setSetores(setoresRes.data || []);
      setPrioridades(prioridadesRes.data || []);
      setUsuarios(usersRes.data || []);
      setClasseSuportes(classeRes.data || []);
    });
  }, []);

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
    if (!titulo || titulo.length < 5) {
      toast({ title: 'Título deve ter pelo menos 5 caracteres', variant: 'destructive' });
      return;
    }
    if (!descricao || descricao.length < 10) {
      toast({ title: 'Descrição deve ter pelo menos 10 caracteres', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
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
          titulo,
          descricao,
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
              <Select value={setorId} onValueChange={v => { setSetorId(v); setTipoSuporteId(''); }}>
                <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                <SelectContent>
                  {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
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
                <Select value={setorId} onValueChange={v => { setSetorId(v); setTipoSuporteId(''); }}>
                  <SelectTrigger><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                  <SelectContent>
                    {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
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
      <div>
        <Label>Título</Label>
        <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Mín 5 caracteres" maxLength={255} />
      </div>
      <div>
        <Label>Descrição</Label>
        <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Mín 10 caracteres" rows={4} />
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
        case 5: return titulo.length >= 5 && descricao.length >= 10;
        case 6: return !!prioridadeId;
      }
    } else {
      switch (step) {
        case 1: return !!setorId && !!tipoSuporteId;
        case 2: return titulo.length >= 5 && descricao.length >= 10;
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
