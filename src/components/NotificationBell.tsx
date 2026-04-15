import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';

interface Notificacao {
  id: string;
  chamado_id: string | null;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [open, setOpen] = useState(false);

  const fetchNotificacoes = async () => {
    if (!user) return;
    const { data } = await (supabase.from('notificacoes' as any) as any)
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);
    setNotificacoes((data || []) as Notificacao[]);
  };

  useEffect(() => {
    fetchNotificacoes();

    // Realtime subscription
    const channel = supabase
      .channel('notificacoes-' + user?.id)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `user_id=eq.${user?.id}`,
      }, () => {
        fetchNotificacoes();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const unreadCount = notificacoes.filter(n => !n.lida).length;

  const markAsRead = async (id: string) => {
    await (supabase.from('notificacoes' as any) as any).update({ lida: true }).eq('id', id);
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n));
  };

  const markAllAsRead = async () => {
    const unread = notificacoes.filter(n => !n.lida).map(n => n.id);
    if (unread.length === 0) return;
    for (const id of unread) {
      await (supabase.from('notificacoes' as any) as any).update({ lida: true }).eq('id', id);
    }
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
  };

  const handleClick = (n: Notificacao) => {
    markAsRead(n.id);
    if (n.chamado_id) {
      navigate(`/chamados/${n.chamado_id}`);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <span className="font-semibold text-sm">Notificações</span>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto py-1" onClick={markAllAsRead}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-[300px]">
          {notificacoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Sem notificações</p>
          ) : (
            notificacoes.map(n => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={`w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-accent/50 transition-colors ${!n.lida ? 'bg-accent/20' : ''}`}
              >
                <p className={`text-sm ${!n.lida ? 'font-medium' : 'text-muted-foreground'}`}>{n.mensagem}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleString('pt-BR')}
                </p>
              </button>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
