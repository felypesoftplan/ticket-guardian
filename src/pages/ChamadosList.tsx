import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { StatusBadge } from '@/components/StatusBadge';
import { PrioridadeBadge } from '@/components/PrioridadeBadge';
import { SlaBadge } from '@/components/SlaBadge';
import { Plus, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface Chamado {
  id: string;
  titulo: string;
  created_at: string | null;
  sla_vencimento: string | null;
  setor: { nome: string } | null;
  prioridade: { nome: string; cor: string } | null;
  status: { nome: string; cor: string; final: boolean } | null;
  solicitante: { name: string } | null;
  responsavel: { name: string } | null;
}

export default function ChamadosList() {
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statuses, setStatuses] = useState<{ id: string; nome: string }[]>([]);
  const { profile } = useAuth();
  const navigate = useNavigate();
  const userSetorId = profile?.setor_id;
  const isAdmin = profile?.role === 'admin' || profile?.role === 'gestor';

  useEffect(() => {
    supabase.from('statuses').select('id, nome').order('ordem').then(({ data }) => {
      if (data) setStatuses(data);
    });
  }, []);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      let query = supabase
        .from('chamados')
        .select(`
          id, titulo, created_at, sla_vencimento,
          setor:setores(nome),
          prioridade:prioridades(nome, cor),
          status:statuses(nome, cor, final),
          solicitante:users!chamados_solicitante_id_fkey(name),
          responsavel:users!chamados_responsavel_id_fkey(name)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status_id', statusFilter);
      }

      // If user has a setor_id and is not admin, filter by their setor
      if (userSetorId && !isAdmin) {
        query = query.eq('setor_id', userSetorId);
      }

      const { data } = await query;
      setChamados((data as any) || []);
      setLoading(false);
    };
    fetch();
  }, [statusFilter, userSetorId, isAdmin]);

  const filtered = chamados.filter(c =>
    !search || c.titulo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Chamados</h1>
        <Button onClick={() => navigate('/chamados/novo')}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Chamado
        </Button>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {statuses.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Solicitante</TableHead>
              <TableHead>SLA</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((_, j) => (
                    <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Nenhum chamado encontrado
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(c => (
                <TableRow
                  key={c.id}
                  className="cursor-pointer hover:bg-accent/50"
                  onClick={() => navigate(`/chamados/${c.id}`)}
                >
                  <TableCell className="font-medium">{c.titulo}</TableCell>
                  <TableCell>{c.setor?.nome}</TableCell>
                  <TableCell>
                    {c.prioridade && <PrioridadeBadge nome={c.prioridade.nome} cor={c.prioridade.cor} />}
                  </TableCell>
                  <TableCell>
                    {c.status && <StatusBadge nome={c.status.nome} cor={c.status.cor} />}
                  </TableCell>
                  <TableCell>{c.solicitante?.name}</TableCell>
                  <TableCell>
                    <SlaBadge slaVencimento={c.sla_vencimento} statusFinal={c.status?.final || false} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
