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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserRow {
  id: string; name: string; username: string; email: string; role: AppRole; ativo: boolean; setor_id: string | null;
}

interface Setor { id: string; nome: string; }

const roleLabels: Record<AppRole, string> = {
  admin: 'Admin',
  suporte: 'Suporte',
  gestor: 'Gestor',
  usuario: 'Usuário',
};

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSetoresMap, setUserSetoresMap] = useState<Record<string, string[]>>({});
  const [setores, setSetores] = useState<Setor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [editSetores, setEditSetores] = useState<string[]>([]);

  const [newUserForm, setNewUserForm] = useState({
    name: '', username: '', email: '', password: '', role: 'usuario' as AppRole, ativo: true,
  });
  const [newSetores, setNewSetores] = useState<string[]>([]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, setoresRes, userSetoresRes] = await Promise.all([
        supabase.from('users').select('*'),
        supabase.from('setores').select('id, nome').eq('ativo', true),
        supabase.from('user_setores' as any).select('user_id, setor_id'),
      ]);

      setUsers((usersRes.data || []) as unknown as UserRow[]);
      setSetores(setoresRes.data || []);

      const map: Record<string, string[]> = {};
      ((userSetoresRes.data || []) as any[]).forEach((row: any) => {
        if (!map[row.user_id]) map[row.user_id] = [];
        map[row.user_id].push(row.setor_id);
      });
      setUserSetoresMap(map);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    try {
      await supabase.from('users').update({
        name: editingUser.name, username: editingUser.username, email: editingUser.email, role: editingUser.role, ativo: editingUser.ativo,
      }).eq('id', editingUser.id);

      await (supabase.from('user_setores' as any) as any).delete().eq('user_id', editingUser.id);
      if (editSetores.length > 0) {
        await (supabase.from('user_setores' as any) as any).insert(editSetores.map(sid => ({ user_id: editingUser.id, setor_id: sid })));
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
      toast({ title: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const result = await createUser({
        ...newUserForm,
        role: newUserForm.role,
      });
      if (newSetores.length > 0) {
        await (supabase.from('user_setores' as any) as any).insert(newSetores.map(sid => ({ user_id: result.user.id, setor_id: sid })));
      }
      toast({ title: 'Usuário criado!' });
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

  const getSetorNames = (userId: string) => {
    const ids = userSetoresMap[userId] || [];
    return ids.map(id => setores.find(s => s.id === id)?.nome).filter(Boolean).join(', ') || '—';
  };

  const SetorCheckboxes = ({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) => (
    <div className="space-y-2 mt-1">
      {setores.map(s => (
        <div key={s.id} className="flex items-center gap-2">
          <Checkbox checked={selected.includes(s.id)} onCheckedChange={checked => onChange(checked ? [...selected, s.id] : selected.filter(id => id !== s.id))} />
          <span className="text-sm">{s.nome}</span>
        </div>
      ))}
    </div>
  );

  const UserFormFields = ({ form, setForm, isCreate, selectedSetores, setSelectedSetores }: any) => (
    <div className="space-y-3">
      <div><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
      <div><Label>Usuário</Label><Input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} /></div>
      <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
      {isCreate && <div><Label>Senha</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>}
      <div>
        <Label>Perfil</Label>
        <Select value={form.role} onValueChange={(v: AppRole) => setForm({ ...form, role: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {Object.entries(roleLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Setores</Label>
        <SetorCheckboxes selected={selectedSetores} onChange={setSelectedSetores} />
      </div>
      <div className="flex items-center gap-2">
        <Switch checked={form.ativo} onCheckedChange={v => setForm({ ...form, ativo: v })} />
        <Label>Ativo</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Usuário</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo Usuário</DialogTitle></DialogHeader>
            <UserFormFields form={newUserForm} setForm={setNewUserForm} isCreate selectedSetores={newSetores} setSelectedSetores={setNewSetores} />
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreateUser} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Usuário</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Setores</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum usuário</TableCell></TableRow>
            ) : users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell><Badge variant="outline">{roleLabels[u.role]}</Badge></TableCell>
                <TableCell className="text-sm">{getSetorNames(u.id)}</TableCell>
                <TableCell><Badge variant={u.ativo ? 'default' : 'secondary'}>{u.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditingUser(u); setEditSetores(userSetoresMap[u.id] || []); setIsEditOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(u.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={o => { setIsEditOpen(o); if (!o) setEditingUser(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle></DialogHeader>
          {editingUser && (
            <>
              <UserFormFields form={editingUser} setForm={setEditingUser} isCreate={false} selectedSetores={editSetores} setSelectedSetores={setEditSetores} />
              <div className="flex gap-2 justify-end mt-4">
                <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
                <Button onClick={handleEditSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Deseja realmente excluir este usuário?</AlertDialogTitle></AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => handleDelete(deleteId!)} disabled={deleting}>Excluir</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
