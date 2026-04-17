import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/hooks/use-toast';
import { Loader2, Upload, Trash2, KeyRound, User as UserIcon } from 'lucide-react';
import { z } from 'zod';

const profileSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(100, 'Máximo 100 caracteres'),
  username: z.string().trim().min(3, 'Mínimo 3 caracteres').max(50, 'Máximo 50 caracteres')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Use apenas letras, números, . _ -'),
  email: z.string().trim().email('E-mail inválido').max(255),
  telefone: z.string().trim().max(30).optional().or(z.literal('')),
  setor_id: z.string().uuid().nullable().optional(),
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Mínimo 8 caracteres').max(72, 'Máximo 72 caracteres'),
  confirm: z.string(),
}).refine((d) => d.password === d.confirm, {
  message: 'As senhas não conferem',
  path: ['confirm'],
});

export default function Profile() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [setores, setSetores] = useState<Setor[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    telefone: '',
    setor_id: '' as string,
    avatar_url: '' as string | null,
  });
  const [pwd, setPwd] = useState({ password: '', confirm: '' });

  useEffect(() => {
    supabase.from('setores').select('id,nome').eq('ativo', true).order('nome').then(({ data }) => {
      if (data) setSetores(data);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    supabase.from('users').select('*').eq('id', user.id).single().then(({ data }) => {
      if (data) {
        setForm({
          name: data.name ?? '',
          username: data.username ?? '',
          email: data.email ?? '',
          telefone: (data as any).telefone ?? '',
          setor_id: data.setor_id ?? '',
          avatar_url: (data as any).avatar_url ?? null,
        });
      }
    });
  }, [user]);

  const initials = form.name?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || 'U';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const parsed = profileSchema.safeParse({
      ...form,
      setor_id: form.setor_id || null,
    });
    if (!parsed.success) {
      toast({ title: 'Erro de validação', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      // Update auth email if changed
      if (parsed.data.email !== user.email) {
        const { error: authErr } = await supabase.auth.updateUser({ email: parsed.data.email });
        if (authErr) throw authErr;
      }
      const { error } = await supabase.from('users').update({
        name: parsed.data.name,
        username: parsed.data.username,
        email: parsed.data.email,
        telefone: parsed.data.telefone || null,
        setor_id: parsed.data.setor_id || null,
      } as any).eq('id', user.id);
      if (error) throw error;
      toast({ title: 'Perfil atualizado', description: 'Suas informações foram salvas.' });
    } catch (err: any) {
      toast({ title: 'Erro ao salvar', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (file: File) => {
    if (!user) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Arquivo muito grande', description: 'Máximo 2MB.', variant: 'destructive' });
      return;
    }
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Formato inválido', description: 'Envie uma imagem.', variant: 'destructive' });
      return;
    }
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
      const { error: dbErr } = await supabase.from('users').update({ avatar_url: publicUrl } as any).eq('id', user.id);
      if (dbErr) throw dbErr;
      setForm(f => ({ ...f, avatar_url: publicUrl }));
      toast({ title: 'Foto atualizada' });
    } catch (err: any) {
      toast({ title: 'Erro no upload', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    if (!user) return;
    setUploadingAvatar(true);
    try {
      const { error } = await supabase.from('users').update({ avatar_url: null } as any).eq('id', user.id);
      if (error) throw error;
      setForm(f => ({ ...f, avatar_url: null }));
      toast({ title: 'Foto removida' });
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = passwordSchema.safeParse(pwd);
    if (!parsed.success) {
      toast({ title: 'Erro', description: parsed.error.issues[0].message, variant: 'destructive' });
      return;
    }
    setSavingPwd(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
      if (error) throw error;
      setPwd({ password: '', confirm: '' });
      toast({ title: 'Senha alterada com sucesso' });
    } catch (err: any) {
      toast({ title: 'Erro ao alterar senha', description: err.message, variant: 'destructive' });
    } finally {
      setSavingPwd(false);
    }
  };

  return (
    <div className="container max-w-3xl py-6 space-y-6">
      <div className="flex items-center gap-2">
        <UserIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Meu Perfil</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Foto de perfil</CardTitle>
          <CardDescription>JPG ou PNG, até 2MB.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {form.avatar_url && <AvatarImage src={form.avatar_url} alt={form.name} />}
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleAvatarUpload(f);
                e.target.value = '';
              }}
            />
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploadingAvatar}>
                {uploadingAvatar ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Enviar foto
              </Button>
              {form.avatar_url && (
                <Button type="button" variant="ghost" size="sm" onClick={handleAvatarRemove} disabled={uploadingAvatar}>
                  <Trash2 className="h-4 w-4" /> Remover
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Informações pessoais</CardTitle>
          <CardDescription>Atualize seus dados de cadastro.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input id="name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input id="username" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} maxLength={50} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input id="telefone" value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} placeholder="(81) 99999-0000" maxLength={30} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="setor">Setor (DER)</Label>
              <Select value={form.setor_id || 'none'} onValueChange={v => setForm({ ...form, setor_id: v === 'none' ? '' : v })}>
                <SelectTrigger id="setor"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhum</SelectItem>
                  {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Salvar alterações
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5" /> Alterar senha</CardTitle>
          <CardDescription>Mínimo 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input id="password" type="password" value={pwd.password} onChange={e => setPwd({ ...pwd, password: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar senha</Label>
              <Input id="confirm" type="password" value={pwd.confirm} onChange={e => setPwd({ ...pwd, confirm: e.target.value })} />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" disabled={savingPwd} variant="secondary">
                {savingPwd && <Loader2 className="h-4 w-4 animate-spin" />}
                Alterar senha
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
