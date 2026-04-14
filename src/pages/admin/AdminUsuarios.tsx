import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface UserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  setor_id: string;
  ativo: boolean;
  setor?: { nome: string };
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [editUser, setEditUser] = useState<any>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('*, setor:setores(nome)');
    setUsers((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []));
  }, []);

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      if (editUser.isNew) {
        // Create auth user first, then profile
        // Note: Creating users requires admin API; for now, we'll create via Supabase Auth
        // This is a limitation - in production, use an edge function
        toast({ title: 'Para criar usuários, use a função de registro ou uma edge function', variant: 'destructive' });
      } else {
        const { error } = await supabase.from('users').update({
          name: editUser.name,
          username: editUser.username,
          email: editUser.email,
          role: editUser.role,
          setor_id: editUser.setor_id,
          ativo: editUser.ativo,
        }).eq('id', editUser.id);
        if (error) throw error;
        toast({ title: 'Usuário atualizado!' });
      }
      setIsOpen(false);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    suporte: 'Suporte',
    gestor: 'Gestor',
    usuario: 'Usuário',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[80px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="outline">{roleLabels[u.role] || u.role}</Badge></TableCell>
                <TableCell>{u.setor?.nome}</TableCell>
                <TableCell><Badge variant={u.ativo ? 'default' : 'secondary'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                <TableCell>
                  <Dialog open={isOpen && editUser?.id === u.id} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditUser(null); }}>
                    <DialogTrigger asChild>
                      <Button size="icon" variant="ghost" onClick={() => { setEditUser(u); setIsOpen(true); }}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
                      {editUser && (
                        <div className="space-y-4 py-4">
                          <div><Label>Nome</Label><Input value={editUser.name} onChange={e => setEditUser({ ...editUser, name: e.target.value })} /></div>
                          <div><Label>Username</Label><Input value={editUser.username} onChange={e => setEditUser({ ...editUser, username: e.target.value })} /></div>
                          <div><Label>Email</Label><Input value={editUser.email} onChange={e => setEditUser({ ...editUser, email: e.target.value })} /></div>
                          <div>
                            <Label>Role</Label>
                            <Select value={editUser.role} onValueChange={v => setEditUser({ ...editUser, role: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="suporte">Suporte</SelectItem>
                                <SelectItem value="gestor">Gestor</SelectItem>
                                <SelectItem value="usuario">Usuário</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Setor</Label>
                            <Select value={editUser.setor_id} onValueChange={v => setEditUser({ ...editUser, setor_id: v })}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch checked={editUser.ativo} onCheckedChange={v => setEditUser({ ...editUser, ativo: v })} />
                            <Label>Ativo</Label>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button onClick={handleSave} disabled={saving}>
                              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                              Salvar
                            </Button>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
