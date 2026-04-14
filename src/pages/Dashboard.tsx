import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Clock, Ticket, CheckCircle2 } from 'lucide-react';

interface DashboardStats {
  totalAberto: number;
  emAtraso: number;
  vencendo2Dias: number;
  totalFechado: number;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ totalAberto: 0, emAtraso: 0, vencendo2Dias: 0, totalFechado: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get all statuses to know which are final
        const { data: statuses } = await supabase.from('statuses').select('id, final');
        const finalIds = statuses?.filter(s => s.final).map(s => s.id) || [];
        const nonFinalIds = statuses?.filter(s => !s.final).map(s => s.id) || [];

        // Get chamados
        const { data: chamados } = await supabase.from('chamados').select('id, status_id, sla_vencimento');
        
        const now = new Date();
        const in2Days = new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000);

        let totalAberto = 0, emAtraso = 0, vencendo2Dias = 0, totalFechado = 0;

        chamados?.forEach(c => {
          if (finalIds.includes(c.status_id)) {
            totalFechado++;
          } else {
            totalAberto++;
            if (c.sla_vencimento) {
              const sla = new Date(c.sla_vencimento);
              if (sla < now) emAtraso++;
              else if (sla < in2Days) vencendo2Dias++;
            }
          }
        });

        setStats({ totalAberto, emAtraso, vencendo2Dias, totalFechado });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Chamados Abertos', value: stats.totalAberto, icon: Ticket, color: 'text-primary' },
    { title: 'Em Atraso', value: stats.emAtraso, icon: AlertTriangle, color: 'text-destructive' },
    { title: 'Vencendo em 2 dias', value: stats.vencendo2Dias, icon: Clock, color: 'text-warning' },
    { title: 'Fechados', value: stats.totalFechado, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bem-vindo, {profile?.name}</p>
      </div>

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
    </div>
  );
}
