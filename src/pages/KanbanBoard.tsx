import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { PrioridadeBadge } from '@/components/PrioridadeBadge';
import { SlaBadge } from '@/components/SlaBadge';
import { Loader2 } from 'lucide-react';

interface KanbanCard {
  id: string;
  titulo: string;
  sla_vencimento: string | null;
  prioridade: { nome: string; cor: string } | null;
  solicitante: { name: string } | null;
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

  useEffect(() => {
    const fetch = async () => {
      const { data: statuses } = await supabase.from('statuses').select('*').order('ordem');
      const { data: chamados } = await supabase
        .from('chamados')
        .select(`
          id, titulo, sla_vencimento, status_id,
          prioridade:prioridades(nome, cor),
          solicitante:users!chamados_solicitante_id_fkey(name)
        `);

      const cols: Column[] = (statuses || []).map(s => ({
        id: s.id,
        nome: s.nome,
        cor: s.cor,
        final: s.final || false,
        cards: ((chamados || []) as any[])
          .filter(c => c.status_id === s.id)
          .map(c => ({ id: c.id, titulo: c.titulo, sla_vencimento: c.sla_vencimento, prioridade: c.prioridade, solicitante: c.solicitante })),
      }));
      setColumns(cols);
      setLoading(false);
    };
    fetch();
  }, []);

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
                  <div className="flex items-center justify-between gap-2">
                    {card.prioridade && <PrioridadeBadge nome={card.prioridade.nome} cor={card.prioridade.cor} />}
                    <SlaBadge slaVencimento={card.sla_vencimento} statusFinal={col.final} />
                  </div>
                  <p className="text-xs text-muted-foreground">{card.solicitante?.name}</p>
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
