import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createUser, deleteUser } from '@/lib/user-api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface User {
  id: string; name: string; username: string; email: string; role: string; ativo: boolean;
}

interface Setor { id: string; nome: string; }

export default function AdminUsuarios() {
  const [users, setUsers] = useState<User[]>([]);
  const [userSetores, setUserSetores] = useState<Record<string, Setor[]>>({});
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editSetores, setEditSetores] = useState<string[]>([]);
  const [newUserForm, setNewUserForm] = useState({
    name: '', username: '', email: '', password: '', role: 'usuario', ativo: true
  });
  const [newSetores, setNewSetores] = useState<string[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase.from('users').select('*');
      setUsers(usersData || []);
      if (usersData) {
        const map: Record<string, Setor[]> = {};
        for (const user of usersData) {
          const { data } = await supabase.from('user_setores').select('setor_id, setores(id, nome)').eq('user_id', user.id);
          map[user.id] = data?.map((x: any) => x.setores) || [];
        }
        setUserSetores(map);
      }
      const { data: setoresData } = await supabase.from('setores').select('*');
      setSetores(setoresData || []);
    } finally { setLoading(false); }
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await supabase.from('users').update({
        name: editingUser.name, username: editingUser.username, email: editingUser.email, role: editingUser.role, ativo: editingUser.ativo,
      }).eq('id', editingUser.id);
      await supabase.from('user_setores').delete().eq('user_id', editingUser.id);
      if (editSetores.length > 0) {
        await supabase.from('user_setores').insert(editSetores.map(id => ({ user_id: editingUser.id, setor_id: id })));
      }
      toast({ title: 'Atualizado!' });
      setIsEditOpen(false);
      await loadData();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleCreateUser = async () => {
    if (!newUserForm.name || !newUserForm.username || !newUserForm.email || !newUserForm.password) {
      toast({ title: 'Preecha todos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const result = await createUser(newUserForm);
      if (newSetores.length > 0) {
        await supabase.from('user_setores').insert(newSetores.map(id => ({ user_id: result.user.id, setor_id: id })));
      }
      toast({ title: 'Criado!' });
      setIsCreateOpen(false);
      setNewUserForm({ name: '', username: '', email: '', password: '', role: 'usuario', ativo: true });
      setNewSetores([]);
      await loadData();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    setDeleting(true);
    try {
      await deleteUser(id);
      toast({ title: 'Deletado!' });
      setDeleteId(null);
      await loadData();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally { setDeleting(false); }
  };

  const roleLabels = { admin: 'Admin', suporte: 'Suporte', gestor: 'Gestor', usuario: 'Usuário' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nome</Label><Input value={newUserForm.name} onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })} /></div>
              <div><Label>Usuário</Label><Input value={newUserForm.username} onChange={e => setNewUserForm({ ...newUserForm, username: e.target.value })} /></div>
              <div><Label>Email</Label><Input value={newUserForm.email} onChange={e => setNewUserForm({ ...newUserForm, email: e.target.value })} /></div>
              <div><Label>Senha</Label><Input type="password" value={newUserForm.password} onChange={e => setNewUserForm({ ...newUserForm, password: e.target.value })} /></div>
              <div className="flex gap-2 justify-end"><Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button><Button onClick={handleCreateUser} disabled={saving}>Criar</Button></div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Ações</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {loading ? <TableRow><TableCell colSpan={3} className="text-center py-4"><Loader2 className="h-4 w-4 animate-spin" /></TableCell></TableRow> : users.length === 0 ? <TableRow><TableCell colSpan={3} className="text-center py-4">Sem usuários</TableCell></TableRow> : users.map(u => ( <TableRow key={u.id}><TableCell>{u.name}</TableCell><TableCell>{u.email}</TableCell><TableCell><div className="flex gap-1"><Button size="icon" variant="ghost" onClick={() => setDeleteId(u.id)}><Trash2 className="h-4 w-4" /></Button></div></TableCell></TableRow>))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Deletar?</AlertDialogTitle></AlertDialogHeader>
          <div className="flex justify-end gap-2"><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => handleDelete(deleteId!)} disabled={deleting}>Deletar</AlertDialogAction></div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
