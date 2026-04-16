import { useEffect, useState, type ChangeEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { StatusBadge } from '@/components/StatusBadge';
import { PrioridadeBadge } from '@/components/PrioridadeBadge';
import { SlaBadge } from '@/components/SlaBadge';
import { ArrowLeft, UserPlus, CheckCircle2, XCircle, Clock, MessageSquare, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { calculateSLA } from '@/lib/sla';
import { notifyChamadoUpdate } from '@/lib/notifications';

export default function ChamadoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { toast } = useToast();

  const [chamado, setChamado] = useState<any>(null);
  const [historico, setHistorico] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [observacao, setObservacao] = useState('');
  const [attachmentFiles, setAttachmentFiles] = useState<File[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchChamado = async () => {
    const { data } = await supabase
      .from('chamados')
      .select(`
        *,
        setor:setores(nome),
        tipo_suporte:tipo_suportes(nome),
        prioridade:prioridades(nome, cor, prazo_dias_uteis),
        status:statuses(nome, cor, final, inicial),
        solicitante:users!chamados_solicitante_id_fkey(name),
        responsavel:users!chamados_responsavel_id_fkey(name),
        anexos:chamado_anexos(id, nome_original, caminho, created_at)
      `)
      .eq('id', id)
      .single();
    setChamado(data);
  };

  const fetchHistorico = async () => {
    const { data } = await supabase
      .from('historico_chamados')
      .select('*, usuario:users(name)')
      .eq('chamado_id', id)
      .order('created_at', { ascending: false });
    setHistorico(data || []);
  };

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchChamado(), fetchHistorico()]);
      const statusRes = await supabase.from('statuses').select('*').order('ordem');
      setStatuses(statusRes.data || []);
      setLoading(false);
    };
    load();
  }, [id]);

  // Fetch criado_por name if different from solicitante
  const [criadoPorName, setCriadoPorName] = useState<string | null>(null);
  useEffect(() => {
    if (!chamado?.criado_por_id || chamado.criado_por_id === chamado.solicitante_id) {
      setCriadoPorName(null);
      return;
    }
    supabase.from('users').select('name').eq('id', chamado.criado_por_id).single().then(({ data }) => {
      setCriadoPorName(data?.name || null);
    });
  }, [chamado?.criado_por_id, chamado?.solicitante_id]);

  const getStatusByName = (nome: string) => statuses.find(s => s.nome === nome);

  const canAssume = () => {
    if (!chamado || !profile) return false;
    return (
      (profile.role === 'suporte' || profile.role === 'admin') &&
      !chamado.responsavel_id &&
      chamado.status?.inicial
    );
  };

  const canApprove = () => {
    if (!chamado || !profile || !user) return false;
    const aguardando = getStatusByName('Aguardando Aprovação');
    return chamado.status_id === aguardando?.id && chamado.solicitante_id === user.id;
  };

  const handleAssume = async () => {
    setActionLoading(true);
    try {
      const emAtendimento = getStatusByName('Em Atendimento');
      if (!emAtendimento) throw new Error('Status "Em Atendimento" não encontrado');

      const sla = calculateSLA(
        new Date(),
        chamado.prioridade?.prazo_dias_uteis || 5,
        5
      );

      await supabase.from('chamados').update({
        responsavel_id: user!.id,
        assumido_em: new Date().toISOString(),
        status_id: emAtendimento.id,
        sla_vencimento: sla.toISOString(),
      }).eq('id', id);

      await supabase.from('historico_chamados').insert({
        chamado_id: id!,
        user_id: user!.id,
        acao: 'assumido',
        descricao: `Chamado assumido por ${profile!.name}`,
      });
      await notifyChamadoUpdate(id!, user!.id, `Chamado assumido por ${profile!.name}`, chamado.solicitante_id, chamado.responsavel_id);
      toast({ title: 'Chamado assumido!' });
      await fetchChamado();
      await fetchHistorico();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (newStatusName: string, descricao: string) => {
    setActionLoading(true);
    try {
      const newStatus = getStatusByName(newStatusName);
      if (!newStatus) throw new Error(`Status "${newStatusName}" não encontrado`);

      const update: any = { status_id: newStatus.id };
      if (newStatus.final) update.finalizado_em = new Date().toISOString();

      await supabase.from('chamados').update(update).eq('id', id);
      await supabase.from('historico_chamados').insert({
        chamado_id: id!,
        user_id: user!.id,
        acao: 'status_alterado',
        descricao,
      });
      await notifyChamadoUpdate(id!, user!.id, `Status alterado: ${descricao}`, chamado.solicitante_id, chamado.responsavel_id);
      toast({ title: 'Status atualizado!' });
      await fetchChamado();
      await fetchHistorico();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleObservacao = async () => {
    if (!observacao.trim()) return;
    setActionLoading(true);
    try {
      await supabase.from('historico_chamados').insert({
        chamado_id: id!,
        user_id: user!.id,
        acao: 'observacao',
        descricao: observacao,
      });
      await notifyChamadoUpdate(id!, user!.id, `Nova observação: ${observacao.substring(0, 80)}${observacao.length > 80 ? '...' : ''}`, chamado.solicitante_id, chamado.responsavel_id);
      setObservacao('');
      toast({ title: 'Observação adicionada!' });
      await fetchHistorico();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const canUploadAttachments = () => {
    if (!chamado || !user) return false;
    return user.id === chamado.solicitante_id || user.id === chamado.responsavel_id;
  };

  const sortedHistorico = [...historico].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const handleAttachmentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files ? Array.from(event.target.files) : [];
    setAttachmentFiles(files);
  };

  const handleUploadAttachments = async () => {
    if (!attachmentFiles.length || !chamado) return;
    setActionLoading(true);
    try {
      const uploadPromises = attachmentFiles.map(async file => {
        const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_');
        const filePath = `chamados/${id}/${Date.now()}-${safeFileName}`;
        const { error: uploadError } = await supabase.storage.from('chamados').upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
        if (uploadError) throw uploadError;
        const { error: insertError } = await supabase.from('chamado_anexos').insert({
          chamado_id: id!,
          nome_original: file.name,
          caminho: filePath,
        });
        if (insertError) throw insertError;
      });

      await Promise.all(uploadPromises);

      const descricao = attachmentFiles.length === 1
        ? `Anexo adicionado: ${attachmentFiles[0].name}`
        : `Anexos adicionados: ${attachmentFiles.length}`;

      await supabase.from('historico_chamados').insert({
        chamado_id: id!,
        user_id: user!.id,
        acao: 'anexo',
        descricao,
      });

      await notifyChamadoUpdate(id!, user!.id, descricao, chamado.solicitante_id, chamado.responsavel_id);
      setAttachmentFiles([]);
      toast({ title: 'Anexos enviados com sucesso!' });
      await fetchChamado();
      await fetchHistorico();
    } catch (err: any) {
      toast({ title: 'Erro ao enviar anexos', description: err.message, variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (!chamado) return <div className="text-center p-8 text-muted-foreground">Chamado não encontrado</div>;

  const emAtendimento = getStatusByName('Em Atendimento');
  const aguardandoAprov = getStatusByName('Aguardando Aprovação');
  const naoAprovado = getStatusByName('Não Aprovado');

  const canFinalize = profile?.role === 'suporte' || profile?.role === 'admin';
  const isEmAtendimento = chamado.status_id === emAtendimento?.id;
  const isNaoAprovado = chamado.status_id === naoAprovado?.id;

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Button variant="ghost" onClick={() => navigate('/chamados')}>
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <CardTitle className="text-xl">{chamado.titulo}</CardTitle>
            <div className="flex gap-2 flex-wrap">
              {chamado.status && <StatusBadge nome={chamado.status.nome} cor={chamado.status.cor} />}
              {chamado.prioridade && <PrioridadeBadge nome={chamado.prioridade.nome} cor={chamado.prioridade.cor} />}
              <SlaBadge slaVencimento={chamado.sla_vencimento} statusFinal={chamado.status?.final || false} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div><span className="text-muted-foreground">Setor:</span> {chamado.setor?.nome}</div>
            <div><span className="text-muted-foreground">Tipo de Suporte:</span> {chamado.tipo_suporte?.nome}</div>
            <div><span className="text-muted-foreground">Solicitante:</span> {chamado.solicitante?.name}</div>
            {criadoPorName && (
              <div><span className="text-muted-foreground">Criado por:</span> {criadoPorName}</div>
            )}
            <div><span className="text-muted-foreground">Responsável:</span> {chamado.responsavel?.name || 'Não atribuído'}</div>
            <div><span className="text-muted-foreground">Criado em:</span> {new Date(chamado.created_at).toLocaleString('pt-BR')}</div>
            {chamado.sla_vencimento && (
              <div><span className="text-muted-foreground">SLA:</span> {new Date(chamado.sla_vencimento).toLocaleString('pt-BR')}</div>
            )}
            {chamado.modulo_sider && (
              <div><span className="text-muted-foreground">Módulo SIDER:</span> {chamado.modulo_sider}</div>
            )}
          </div>

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Descrição</h3>
            <p className="text-sm whitespace-pre-wrap">{chamado.descricao}</p>
          </div>

          {chamado.anexos && chamado.anexos.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Anexos</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {chamado.anexos.map((anexo: any) => {
                  const publicUrl = supabase.storage.from('chamados').getPublicUrl(anexo.caminho).data?.publicUrl;
                  return (
                    <a
                      key={anexo.id}
                      href={publicUrl || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-lg border border-input overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      {publicUrl?.match(/\.(png|jpe?g|gif|webp|bmp)$/i) ? (
                        <img src={publicUrl} alt={anexo.nome_original} className="h-40 w-full object-cover" />
                      ) : (
                        <div className="flex h-40 items-center justify-center bg-muted text-sm text-muted-foreground">
                          {anexo.nome_original}
                        </div>
                      )}
                      <div className="p-3 text-sm font-medium">{anexo.nome_original}</div>
                    </a>
                  );
                })}
              </div>
            </div>
          )}

          {canUploadAttachments() && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Adicionar arquivos</h3>
                <Input type="file" multiple onChange={handleAttachmentChange} />
              </div>
              {attachmentFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Arquivos selecionados:</div>
                  <div className="space-y-2">
                    {attachmentFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between rounded-md border border-input px-3 py-2 text-sm">
                        <span className="truncate">{file.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setAttachmentFiles(prev => prev.filter((_, i) => i !== index))}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-end">
                <Button
                  type="button"
                  onClick={handleUploadAttachments}
                  disabled={attachmentFiles.length === 0 || actionLoading}
                >
                  {actionLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Enviar arquivos
                </Button>
              </div>
            </div>
          )}

          <Separator />

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            {canAssume() && (
              <Button onClick={handleAssume} disabled={actionLoading}>
                <UserPlus className="mr-2 h-4 w-4" /> Assumir
              </Button>
            )}
            {canFinalize && isEmAtendimento && (
              <Button onClick={() => handleStatusChange('Aguardando Aprovação', 'Chamado enviado para aprovação')} disabled={actionLoading}>
                <Clock className="mr-2 h-4 w-4" /> Enviar para Aprovação
              </Button>
            )}
            {canFinalize && isNaoAprovado && (
              <Button onClick={() => handleStatusChange('Em Atendimento', 'Chamado retomado após reprovação')} disabled={actionLoading}>
                Retomar Atendimento
              </Button>
            )}
            {canApprove() && (
              <>
                <Button onClick={() => handleStatusChange('Fechado', 'Solução aprovada pelo solicitante')} disabled={actionLoading} className="bg-success hover:bg-success/90">
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Aprovar
                </Button>
                <Button variant="destructive" onClick={() => handleStatusChange('Não Aprovado', 'Solução reprovada pelo solicitante')} disabled={actionLoading}>
                  <XCircle className="mr-2 h-4 w-4" /> Reprovar
                </Button>
              </>
            )}
          </div>

          <Separator />

          {/* Observação */}
          <div className="space-y-3">
            <h3 className="font-semibold">Adicionar Observação</h3>
            <Textarea value={observacao} onChange={e => setObservacao(e.target.value)} placeholder="Escreva uma observação..." rows={3} />
            <Button onClick={handleObservacao} disabled={!observacao.trim() || actionLoading} variant="secondary">
              <MessageSquare className="mr-2 h-4 w-4" /> Adicionar
            </Button>
          </div>

          <Separator />

          {/* Histórico */}
          <div>
            <h3 className="font-semibold mb-4">Histórico</h3>
            <div className="space-y-4">
              {sortedHistorico.map((h, index) => {
                const initials = h.usuario?.name
                  ? h.usuario.name
                      .split(' ')
                      .map((part: string) => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()
                  : 'U';
                const stepNumber = index + 1;
                const actionLabel = h.acao === 'observacao' ? 'Observação'
                  : h.acao === 'assumido' ? 'Assumido'
                  : h.acao === 'status_alterado' ? 'Mudança de Status'
                  : h.acao === 'anexo' ? 'Anexo'
                  : 'Registro';

                return (
                  <div key={h.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-primary-foreground text-sm">{initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{h.usuario?.name || 'Usuário'}</span>
                            <span className="rounded-full border border-input px-2 py-0.5 text-[11px] uppercase text-muted-foreground">{actionLabel}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Passo {stepNumber}</span>
                            <span>•</span>
                            <span>{new Date(h.created_at).toLocaleString('pt-BR')}</span>
                          </div>
                        </div>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-foreground">{h.descricao || 'Sem descrição adicional.'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              {sortedHistorico.length === 0 && (
                <p className="text-muted-foreground text-sm">Nenhum registro</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
