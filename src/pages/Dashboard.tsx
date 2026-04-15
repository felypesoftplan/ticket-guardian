import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Clock, Ticket, CheckCircle2 } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from 'recharts';

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316'];

interface Chamado {
  id: string;
  created_at: string;
  status_id: string;
  prioridade_id: string;
  setor_id: string;
  solicitante_id: string;
  responsavel_id: string | null;
  modulo_sider: string | null;
  sla_vencimento: string | null;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [chamados, setChamados] = useState<Chamado[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [prioridades, setPrioridades] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterSetor, setFilterSetor] = useState('all');
  const [filterYear, setFilterYear] = useState(String(new Date().getFullYear()));

  useEffect(() => {
    Promise.all([
      supabase.from('chamados').select('id, created_at, status_id, prioridade_id, setor_id, solicitante_id, responsavel_id, modulo_sider, sla_vencimento'),
      supabase.from('statuses').select('*').order('ordem'),
      supabase.from('prioridades').select('*').order('nivel'),
      supabase.from('setores').select('*'),
      supabase.from('users').select('id, name'),
    ]).then(([cRes, sRes, pRes, setRes, uRes]) => {
      setChamados(cRes.data || []);
      setStatuses(sRes.data || []);
      setPrioridades(pRes.data || []);
      setSetores(setRes.data || []);
      setUsers(uRes.data || []);
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    let data = chamados;
    if (filterSetor !== 'all') data = data.filter(c => c.setor_id === filterSetor);
    if (filterYear !== 'all') data = data.filter(c => new Date(c.created_at).getFullYear() === parseInt(filterYear));
    return data;
  }, [chamados, filterSetor, filterYear]);

  const finalIds = statuses.filter(s => s.final).map(s => s.id);
  const now = new Date();
  const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

  const stats = useMemo(() => {
    let totalAberto = 0, emAtraso = 0, vencendo2Dias = 0, totalFechado = 0;
    filtered.forEach(c => {
      if (finalIds.includes(c.status_id)) { totalFechado++; }
      else {
        totalAberto++;
        if (c.sla_vencimento) {
          const sla = new Date(c.sla_vencimento);
          if (sla < now) emAtraso++;
          else if (sla < in2Days) vencendo2Dias++;
        }
      }
    });
    return { totalAberto, emAtraso, vencendo2Dias, totalFechado };
  }, [filtered, finalIds]);

  // Chart: Chamados por mês (linha)
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    filtered.forEach(c => {
      const d = new Date(c.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = (months[key] || 0) + 1;
    });
    return Object.entries(months).sort().map(([month, count]) => ({
      month: month.split('-').reverse().join('/'),
      chamados: count,
    }));
  }, [filtered]);

  // Chart: Por status
  const byStatus = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => { map[c.status_id] = (map[c.status_id] || 0) + 1; });
    return statuses.map(s => ({ name: s.nome, value: map[s.id] || 0, color: s.cor })).filter(s => s.value > 0);
  }, [filtered, statuses]);

  // Chart: Por prioridade
  const byPrioridade = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => { map[c.prioridade_id] = (map[c.prioridade_id] || 0) + 1; });
    return prioridades.map(p => ({ name: p.nome, value: map[p.id] || 0, color: p.cor })).filter(p => p.value > 0);
  }, [filtered, prioridades]);

  // Chart: Por responsável (top 10)
  const byResponsavel = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => { if (c.responsavel_id) map[c.responsavel_id] = (map[c.responsavel_id] || 0) + 1; });
    return Object.entries(map)
      .map(([id, count]) => ({ name: users.find(u => u.id === id)?.name || 'Desconhecido', count }))
      .sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filtered, users]);

  // Chart: Por solicitante (top 10)
  const bySolicitante = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => { map[c.solicitante_id] = (map[c.solicitante_id] || 0) + 1; });
    return Object.entries(map)
      .map(([id, count]) => ({ name: users.find(u => u.id === id)?.name || 'Desconhecido', count }))
      .sort((a, b) => b.count - a.count).slice(0, 10);
  }, [filtered, users]);

  // Chart: Por módulo SIDER
  const byModuloSider = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach(c => { if (c.modulo_sider) map[c.modulo_sider] = (map[c.modulo_sider] || 0) + 1; });
    return Object.entries(map).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [filtered]);

  const years = useMemo(() => {
    const s = new Set(chamados.map(c => String(new Date(c.created_at).getFullYear())));
    return Array.from(s).sort().reverse();
  }, [chamados]);

  const cards = [
    { title: 'Chamados Abertos', value: stats.totalAberto, icon: Ticket, color: 'text-primary' },
    { title: 'Em Atraso', value: stats.emAtraso, icon: AlertTriangle, color: 'text-destructive' },
    { title: 'Vencendo em 2 dias', value: stats.vencendo2Dias, icon: Clock, color: 'text-warning' },
    { title: 'Fechados', value: stats.totalFechado, icon: CheckCircle2, color: 'text-success' },
  ];

  const tooltipStyle = { backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Bem-vindo, {profile?.name}</p>
        </div>
        <div className="flex gap-2">
          <Select value={filterSetor} onValueChange={setFilterSetor}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Setor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Setores</SelectItem>
              {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterYear} onValueChange={setFilterYear}>
            <SelectTrigger className="w-[100px]"><SelectValue placeholder="Ano" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(card => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${card.color}`}>
                {loading ? '...' : card.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Chamados por Mês</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line type="monotone" dataKey="chamados" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ fill: 'hsl(var(--primary))' }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Por Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {byStatus.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Por Prioridade</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={byPrioridade} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {byPrioridade.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Por Responsável (Top 10)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byResponsavel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Por Solicitante (Top 10)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={bySolicitante} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={100} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {byModuloSider.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Por Módulo SIDER</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={byModuloSider}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <Tooltip contentStyle={tooltipStyle} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
