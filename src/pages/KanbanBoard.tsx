import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PrioridadeBadge } from '@/components/PrioridadeBadge';
import { SlaBadge } from '@/components/SlaBadge';
import { Loader2 } from 'lucide-react';

interface KanbanCard {
  id: string;
  titulo: string;
  sla_vencimento: string | null;
  prioridade: { nome: string; cor: string } | null;
  solicitante: { name: string } | null;
  tipo_suporte: { nome: string } | null;
  responsavel: { name: string } | null;
  created_at: string;
}

interface Column {
  id: string;
  nome: string;
  cor: string;
  final: boolean;
  cards: KanbanCard[];
}

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { profile } = useAuth();
  const userSetorId = profile?.setor_id;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'gestor';

  useEffect(() => {
    const fetch = async () => {
      const { data: statuses } = await supabase.from('statuses').select('*').order('ordem');
      let query = supabase
        .from('chamados')
        .select(`
          id, titulo, sla_vencimento, status_id, created_at,
          prioridade:prioridades(nome, cor),
          solicitante:users!chamados_solicitante_id_fkey(name),
          tipo_suporte:tipo_suportes(nome),
          responsavel:users!chamados_responsavel_id_fkey(name)
        `);
      
      if (userSetorId && !isAdmin) {
        query = query.eq('setor_id', userSetorId);
      }
      
      const { data: chamados } = await query;

      const cols: Column[] = (statuses || []).map(s => ({
        id: s.id,
        nome: s.nome,
        cor: s.cor,
        final: s.final || false,
        cards: ((chamados || []) as any[])
          .filter(c => c.status_id === s.id)
          .map(c => ({ 
            id: c.id, 
            titulo: c.titulo, 
            sla_vencimento: c.sla_vencimento, 
            prioridade: c.prioridade, 
            solicitante: c.solicitante,
            tipo_suporte: c.tipo_suporte,
            responsavel: c.responsavel,
            created_at: c.created_at
          })),
      }));
      setColumns(cols);
      setLoading(false);
    };
    fetch();
  }, [userSetorId, isAdmin]);

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Kanban</h1>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map(col => (
          <div key={col.id} className="min-w-[280px] flex-shrink-0">
            <div className="rounded-t-lg px-3 py-2 text-sm font-semibold text-primary-foreground" style={{ backgroundColor: col.cor }}>
              {col.nome} ({col.cards.length})
            </div>
            <div className="bg-card border border-t-0 rounded-b-lg p-2 space-y-2 min-h-[200px]">
              {col.cards.map(card => (
                <div
                  key={card.id}
                  className="bg-background rounded-lg p-3 border cursor-pointer hover:border-primary/50 transition-colors space-y-2"
                  onClick={() => navigate(`/chamados/${card.id}`)}
                >
                  <p className="text-sm font-medium line-clamp-2">{card.titulo}</p>
                  
                  {/* Tipo de suporte */}
                  {card.tipo_suporte && (
                    <p className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                      {card.tipo_suporte.nome}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between gap-2">
                    {card.prioridade && <PrioridadeBadge nome={card.prioridade.nome} cor={card.prioridade.cor} />}
                    <SlaBadge slaVencimento={card.sla_vencimento} statusFinal={col.final} />
                  </div>
                  
                  {/* Responsável */}
                  {card.responsavel && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium">Responsável:</span> {card.responsavel.name}
                    </p>
                  )}
                  
                  {/* Data de criação */}
                  <p className="text-xs text-muted-foreground">
                    Criado: {new Date(card.created_at).toLocaleDateString('pt-BR')}
                  </p>
                  
                  {/* Solicitante */}
                  <p className="text-xs text-muted-foreground">
                    Solicitante: {card.solicitante?.name}
                  </p>
                </div>
              ))}
              {col.cards.length === 0 && (
                <p className="text-xs text-muted-foreground text-center py-4">Nenhum chamado</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
