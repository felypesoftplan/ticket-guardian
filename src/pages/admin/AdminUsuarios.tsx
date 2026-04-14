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

interface UserRow {
  id: string;
  name: string;
  username: string;
  email: string;
  role: string;
  ativo: boolean;
}

interface UserSetor {
  id: string;
  nome: string;
  cor?: string;
}

export default function AdminUsuarios() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [userSetores, setUserSetores] = useState<Record<string, UserSetor[]>>({});
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const [editUser, setEditUser] = useState<any>(null);
  const [editUserSetores, setEditUserSetores] = useState<string[]>([]);
  const [newUser, setNewUser] = useState<any>({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'usuario',
    setores: [],
    ativo: true,
  });
  const [newUserSetores, setNewUserSetores] = useState<string[]>([]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('users').select('*');
      setUsers((data as any) || []);

      // Fetch setores for each user
      if (data) {
        const setoresMap: Record<string, UserSetor[]> = {};
        for (const user of data) {
          const { data: setoresData } = await supabase
            .from('user_setores')
            .select('setor_id, setores(id, nome, cor)')
            .eq('user_id', user.id);
          
          setoresMap[user.id] = setoresData?.map((us: any) => us.setores) || [];
        }
        setUserSetores(setoresMap);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    supabase.from('setores').select('*').then(({ data }) => setSetores(data || []));
  }, []);

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('users').update({
        name: editUser.name,
        username: editUser.username,
        email: editUser.email,
        role: editUser.role,
        ativo: editUser.ativo,
      }).eq('id', editUser.id);
      
      if (error) throw error;

      // Update user setores
      await supabase.from('user_setores').delete().eq('user_id', editUser.id);
      
      if (editUserSetores.length > 0) {
        const setoresData = editUserSetores.map(setorId => ({
          user_id: editUser.id,
          setor_id: setorId,
        }));
        
        const { error: setoresError } = await supabase
          .from('user_setores')
          .insert(setoresData);
        
        if (setoresError) throw setoresError;
      }

      toast({ title: 'Usuário atualizado!' });
      setIsOpen(false);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      toast({ title: 'Erro', description: 'Preecha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const result = await createUser({
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        ativo: newUser.ativo,
      });

      // Add user setores
      if (newUserSetores.length > 0) {
        const setoresData = newUserSetores.map(setorId => ({
          user_id: result.user.id,
          setor_id: setorId,
        }));
        
        const { error: setoresError } = await supabase
          .from('user_setores')
          .insert(setoresData);
        
        if (setoresError) throw setoresError;
      }

      toast({ title: 'Sucesso!', description: 'Usuário criado com sucesso' });
      setIsNewDialogOpen(false);
      setNewUser({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'usuario',
        setores: [],
        ativo: true,
      });
      setNewUserSetores([]);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao criar usuário', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    setDeleting(true);
    try {
      await deleteUser(userId);
      toast({ title: 'Sucesso!', description: 'Usuário deletado com sucesso' });
      setDeleteUserId(null);
      await fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao deletar usuário', description: err.message, variant: 'destructive' });
    } finally {
      setDeleting(false);
    }
  };

  const toggleSetorSelection = (setorId: string, isSelected: string[]) => {
    if (isSelected.includes(setorId)) {
      setEditUserSetores(isSelected.filter(id => id !== setorId));
    } else {
      setEditUserSetores([...isSelected, setorId]);
    }
  };

  const toggleNewUserSetorSelection = (setorId: string) => {
    if (newUserSetores.includes(setorId)) {
      setNewUserSetores(newUserSetores.filter(id => id !== setorId));
    } else {
      setNewUserSetores([...newUserSetores, setorId]);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: 'Admin',
    suporte: 'Suporte',
    gestor: 'Gestor',
    usuario: 'Usuário',
  };

  const getSetorBadges = (userId: string) => {
    const userSetoresList = userSetores[userId] || [];
    if (userSetoresList.length === 0) {
      return <span className="text-gray-500">Nenhum setor</span>;
    }
    return (
      <div className="flex gap-1 flex-wrap">
        {userSetoresList.map(s => (
          <Badge key={s.id} variant="secondary">{s.nome}</Badge>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuários</h1>
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input 
                  placeholder="Nome completo"
                  value={newUser.name} 
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })} 
                />
              </div>
              <div>
                <Label>Username *</Label>
                <Input 
                  placeholder="username"
                  value={newUser.username} 
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })} 
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email"
                  placeholder="email@example.com"
                  value={newUser.email} 
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })} 
                />
              </div>
              <div>
                <Label>Senha *</Label>
                <Input 
                  type="password"
                  placeholder="Senha forte"
                  value={newUser.password} 
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })} 
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Setores (pode selecionar múltiplos)</Label>
                <div className="mt-2 space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {setores.length === 0 ? (
                    <p className="text-sm text-gray-500">Nenhum setor disponível</p>
                  ) : (
                    setores.map(s => (
                      <div key={s.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`new-setor-${s.id}`}
                          checked={newUserSetores.includes(s.id)}
                          onChange={() => toggleNewUserSetorSelection(s.id)}
                          className="rounded"
                        />
                        <label htmlFor={`new-setor-${s.id}`} className="cursor-pointer flex-1">
                          {s.nome}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={newUser.ativo} 
                  onCheckedChange={v => setNewUser({ ...newUser, ativo: v })} 
                />
                <Label>Ativo</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateNewUser} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Usuário
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Setores</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Nenhum usuário cadastrado
                </TableCell>
              </TableRow>
            ) : users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[u.role] || u.role}</Badge>
                </TableCell>
                <TableCell>
                  {getSetorBadges(u.id)}
                </TableCell>
                <TableCell>
                  <Badge variant={u.ativo ? 'default' : 'secondary'}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Dialog 
                      open={isOpen && editUser?.id === u.id} 
                      onOpenChange={(open) => { 
                        setIsOpen(open); 
                        if (!open) {
                          setEditUser(null);
                          setEditUserSetores([]);
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button 
                          size="icon" 
                          variant="ghost"
                          title="Editar"
                          onClick={() => {
                            setEditUser(u);
                            setEditUserSetores(userSetores[u.id]?.map(s => s.id) || []);
                            setIsOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Editar Usuário</DialogTitle>
                        </DialogHeader>
                        {editUser && (
                          <div className="space-y-4 py-4">
                            <div>
                              <Label>Nome</Label>
                              <Input 
                                value={editUser.name} 
                                onChange={e => setEditUser({ ...editUser, name: e.target.value })} 
                              />
                            </div>
                            <div>
                              <Label>Username</Label>
                              <Input 
                                value={editUser.username} 
                                onChange={e => setEditUser({ ...editUser, username: e.target.value })} 
                              />
                            </div>
                            <div>
                              <Label>Email</Label>
                              <Input 
                                value={editUser.email} 
                                onChange={e => setEditUser({ ...editUser, email: e.target.value })} 
                              />
                            </div>
                            <div>
                              <Label>Role</Label>
                              <Select value={editUser.role} onValueChange={v => setEditUser({ ...editUser, role: v })}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  <SelectItem value="suporte">Suporte</SelectItem>
                                  <SelectItem value="gestor">Gestor</SelectItem>
                                  <SelectItem value="usuario">Usuário</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label>Setores (pode selecionar múltiplos)</Label>
                              <div className="mt-2 space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                                {setores.length === 0 ? (
                                  <p className="text-sm text-gray-500">Nenhum setor disponível</p>
                                ) : (
                                  setores.map(s => (
                                    <div key={s.id} className="flex items-center gap-2">
                                      <input
                                        type="checkbox"
                                        id={`setor-${s.id}`}
                                        checked={editUserSetores.includes(s.id)}
                                        onChange={() => toggleSetorSelection(s.id, editUserSetores)}
                                        className="rounded"
                                      />
                                      <label htmlFor={`setor-${s.id}`} className="cursor-pointer flex-1">
                                        {s.nome}
                                      </label>
                                    </div>
                                  ))
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch 
                                checked={editUser.ativo} 
                                onCheckedChange={v => setEditUser({ ...editUser, ativo: v })} 
                              />
                              <Label>Ativo</Label>
                            </div>
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                onClick={() => setIsOpen(false)}
                                disabled={saving}
                              >
                                Cancelar
                              </Button>
                              <Button onClick={handleSave} disabled={saving}>
                                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Salvar
                              </Button>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <AlertDialog open={deleteUserId === u.id} onOpenChange={(open) => {
                      if (!open) setDeleteUserId(null);
                    }}>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deletar Usuário?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você tem certeza que deseja deletar o usuário <strong>{u.name}</strong>? Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <div className="flex justify-end gap-2">
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction 
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Deletar
                          </AlertDialogAction>
                        </div>
                      </AlertDialogContent>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        title="Deletar"
                        onClick={() => setDeleteUserId(u.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { createUser } from '@/lib/user-api';
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
  const [isNewDialogOpen, setIsNewDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [editUser, setEditUser] = useState<any>(null);
  const [newUser, setNewUser] = useState<any>({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'usuario',
    setor_id: '',
    ativo: true,
  });

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
        // This shouldn't happen now, but keep for safety
        toast({ title: 'Use o botão "Novo Usuário" para criar novos usuários', variant: 'destructive' });
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

  const handleCreateNewUser = async () => {
    if (!newUser.name || !newUser.username || !newUser.email || !newUser.password) {
      toast({ title: 'Erro', description: 'Preecha todos os campos obrigatórios', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      await createUser({
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        setor_id: newUser.setor_id || undefined,
        ativo: newUser.ativo,
      });
      toast({ title: 'Sucesso!', description: 'Usuário criado com sucesso' });
      setIsNewDialogOpen(false);
      setNewUser({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'usuario',
        setor_id: '',
        ativo: true,
      });
      await fetchUsers();
    } catch (err: any) {
      toast({ title: 'Erro ao criar usuário', description: err.message, variant: 'destructive' });
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
        <Dialog open={isNewDialogOpen} onOpenChange={setIsNewDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label>Nome *</Label>
                <Input 
                  placeholder="Nome completo"
                  value={newUser.name} 
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })} 
                />
              </div>
              <div>
                <Label>Username *</Label>
                <Input 
                  placeholder="username"
                  value={newUser.username} 
                  onChange={e => setNewUser({ ...newUser, username: e.target.value })} 
                />
              </div>
              <div>
                <Label>Email *</Label>
                <Input 
                  type="email"
                  placeholder="email@example.com"
                  value={newUser.email} 
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })} 
                />
              </div>
              <div>
                <Label>Senha *</Label>
                <Input 
                  type="password"
                  placeholder="Senha forte"
                  value={newUser.password} 
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })} 
                />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={newUser.role} onValueChange={v => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="gestor">Gestor</SelectItem>
                    <SelectItem value="suporte">Suporte</SelectItem>
                    <SelectItem value="usuario">Usuário</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Setor</Label>
                <Select value={newUser.setor_id} onValueChange={v => setNewUser({ ...newUser, setor_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um setor" />
                  </SelectTrigger>
                  <SelectContent>
                    {setores.map(s => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Switch 
                  checked={newUser.ativo} 
                  onCheckedChange={v => setNewUser({ ...newUser, ativo: v })} 
                />
                <Label>Ativo</Label>
              </div>
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsNewDialogOpen(false)}
                  disabled={saving}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateNewUser} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Usuário
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                </TableCell>
              </TableRow>
            ) : users.map(u => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell>{u.username}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Badge variant="outline">{roleLabels[u.role] || u.role}</Badge>
                </TableCell>
                <TableCell>{u.setor?.nome}</TableCell>
                <TableCell>
                  <Badge variant={u.ativo ? 'default' : 'secondary'}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Dialog 
                    open={isOpen && editUser?.id === u.id} 
                    onOpenChange={(open) => { 
                      setIsOpen(open); 
                      if (!open) setEditUser(null); 
                    }}
                  >
                    <DialogTrigger asChild>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => { 
                          setEditUser(u); 
                          setIsOpen(true); 
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Editar Usuário</DialogTitle>
                      </DialogHeader>
                      {editUser && (
                        <div className="space-y-4 py-4">
                          <div>
                            <Label>Nome</Label>
                            <Input 
                              value={editUser.name} 
                              onChange={e => setEditUser({ ...editUser, name: e.target.value })} 
                            />
                          </div>
                          <div>
                            <Label>Username</Label>
                            <Input 
                              value={editUser.username} 
                              onChange={e => setEditUser({ ...editUser, username: e.target.value })} 
                            />
                          </div>
                          <div>
                            <Label>Email</Label>
                            <Input 
                              value={editUser.email} 
                              onChange={e => setEditUser({ ...editUser, email: e.target.value })} 
                            />
                          </div>
                          <div>
                            <Label>Role</Label>
                            <Select value={editUser.role} onValueChange={v => setEditUser({ ...editUser, role: v })}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
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
                              <SelectTrigger>
                                <SelectValue placeholder="Nenhum setor" />
                              </SelectTrigger>
                              <SelectContent>
                                {setores.map(s => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.nome}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center gap-2">
                            <Switch 
                              checked={editUser.ativo} 
                              onCheckedChange={v => setEditUser({ ...editUser, ativo: v })} 
                            />
                            <Label>Ativo</Label>
                          </div>
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => setIsOpen(false)}
                              disabled={saving}
                            >
                              Cancelar
                            </Button>
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
