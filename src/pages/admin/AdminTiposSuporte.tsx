import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

function TipoSuporteForm({ item, setItem, classes, setores, setoresRelacionados, setSetoresRelacionados }: any) {
  const isUserRegistrationInternal = item?.nome?.includes('Cadastrar Usuário') && item?.nome?.includes('Internos');
  const isUserRegistrationExternal = item?.nome?.includes('Cadastrar Usuário') && item?.nome?.includes('Externos');

  return (
    <div className="space-y-4">
      <div><Label>Nome</Label><Input value={item?.nome || ''} onChange={e => setItem({ ...item, nome: e.target.value })} /></div>
      <div><Label>Prazo (dias úteis)</Label><Input type="number" min={1} max={365} value={item?.prazo_dias_uteis || 5} onChange={e => setItem({ ...item, prazo_dias_uteis: parseInt(e.target.value) })} /></div>
      <div>
        <Label>Classe de Suporte</Label>
        <Select value={item?.classe_suporte_id || '-'} onValueChange={v => setItem({ ...item, classe_suporte_id: v === '-' ? '' : v })}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {item?.classe_suporte_id ? null : <SelectItem value="-">Selecione</SelectItem>}
            {classes.map((c: any) => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Setores</Label>
        <div className="space-y-2 mt-2 max-h-48 overflow-y-auto border rounded-md p-2">
          {setores.map((s: any) => (
            <div key={s.id} className="flex items-center gap-2">
              <Checkbox
                checked={setoresRelacionados.includes(s.id)}
                onCheckedChange={checked => {
                  setSetoresRelacionados((prev: string[]) =>
                    checked ? [...prev, s.id] : prev.filter(id => id !== s.id)
                  );
                }}
              />
              <span className="text-sm">{s.nome}</span>
            </div>
          ))}
        </div>
      </div>

      {isUserRegistrationInternal && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Campos específicos - Cadastrar Usuário | Internos</h4>
          <div><Label>👤 Nome completo</Label><Input value={item?.campo_nome_completo || ''} onChange={e => setItem({ ...item, campo_nome_completo: e.target.value })} /></div>
          <div><Label>🪪 CPF</Label><Input value={item?.campo_cpf || ''} onChange={e => setItem({ ...item, campo_cpf: e.target.value })} /></div>
          <div><Label>💻 Usuário SEI</Label><Input value={item?.campo_usuario_sei || ''} onChange={e => setItem({ ...item, campo_usuario_sei: e.target.value })} /></div>
          <div><Label>📧 E-mail Expresso</Label><Input value={item?.campo_email_expresso || ''} onChange={e => setItem({ ...item, campo_email_expresso: e.target.value })} /></div>
          <div><Label>📞 Telefone</Label><Input value={item?.campo_telefone || ''} onChange={e => setItem({ ...item, campo_telefone: e.target.value })} /></div>
          <div><Label>🧩 Módulos que precisa de acesso (SMO, SGF e/ou SCO)</Label><Input value={item?.campo_modulos || ''} onChange={e => setItem({ ...item, campo_modulos: e.target.value })} /></div>
        </div>
      )}

      {isUserRegistrationExternal && (
        <div className="border-t pt-4">
          <h4 className="font-semibold mb-3">Campos específicos - Cadastrar Usuário | Externos (RT)</h4>
          <div><Label>👤 Nome completo do RT</Label><Input value={item?.campo_nome_rt || ''} onChange={e => setItem({ ...item, campo_nome_rt: e.target.value })} /></div>
          <div><Label>📄 Número da ART (referente à designação de RT do contrato)</Label><Input value={item?.campo_numero_art || ''} onChange={e => setItem({ ...item, campo_numero_art: e.target.value })} /></div>
          <div><Label>🆔 CPF do RT</Label><Input value={item?.campo_cpf_rt || ''} onChange={e => setItem({ ...item, campo_cpf_rt: e.target.value })} /></div>
          <div><Label>🏛️ Número do Registro Profissional (CREA/CAU)</Label><Input value={item?.campo_numero_registro || ''} onChange={e => setItem({ ...item, campo_numero_registro: e.target.value })} /></div>
          <div><Label>📧 E-mail corporativo (para recebimento de senha)</Label><Input value={item?.campo_email_corporativo || ''} onChange={e => setItem({ ...item, campo_email_corporativo: e.target.value })} /></div>
          <div><Label>🏢 CNPJ da empresa contratada</Label><Input value={item?.campo_cnpj_empresa || ''} onChange={e => setItem({ ...item, campo_cnpj_empresa: e.target.value })} /></div>
        </div>
      )}

      <div className="flex items-center gap-2"><Switch checked={item?.ativo ?? true} onCheckedChange={v => setItem({ ...item, ativo: v })} /><Label>Ativo</Label></div>
    </div>
  );
}

export default function AdminTiposSuporte() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const [classes, setClasses] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [setoresRelacionados, setSetoresRelacionados] = useState<string[]>([]);

  const [filterSetor, setFilterSetor] = useState('');
  const [filterClasse, setFilterClasse] = useState('');
  const [filterNome, setFilterNome] = useState('');

  const fetchData = async () => {
    setLoading(true);
    const [tiposRes, classesRes, setoresRes] = await Promise.all([
      supabase.from('tipo_suportes').select('*').order('nome'),
      supabase.from('classe_suportes').select('*').eq('ativo', true),
      supabase.from('setores').select('*').eq('ativo', true),
    ]);
    setItems(tiposRes.data || []);
    setClasses(classesRes.data || []);
    setSetores(setoresRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const getSetorNamesForTipo = async (tipoId: string) => {
    const { data } = await supabase.from('setor_tipo_suporte').select('setor_id').eq('tipo_suporte_id', tipoId);
    const ids = (data || []).map((d: any) => d.setor_id);
    return ids;
  };

  const handleOpenEdit = async (item: any) => {
    const relatedSetores = await getSetorNamesForTipo(item.id);
    setSetoresRelacionados(relatedSetores);
    setEditItem(item);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const { id, created_at, updated_at, ...rest } = editItem;
      
      // Filter to only include fields with actual values (exclude empty strings and undefined)
      const dataToSave = Object.fromEntries(
        Object.entries(rest).filter(([_key, value]) => value !== '' && value !== null && value !== undefined)
      );

      if (id) {
        const { error } = await supabase.from('tipo_suportes').update(dataToSave).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from('tipo_suportes').insert(dataToSave).select().single();
        if (error) throw error;
        editItem.id = data.id;
      }

      await supabase.from('setor_tipo_suporte').delete().eq('tipo_suporte_id', editItem.id);
      if (setoresRelacionados.length > 0) {
        await supabase.from('setor_tipo_suporte').insert(
          setoresRelacionados.map(sid => ({ setor_id: sid, tipo_suporte_id: editItem.id }))
        );
      }

      toast({ title: 'Salvo com sucesso!' });
      setIsOpen(false);
      setEditItem(null);
      setSetoresRelacionados([]);
      await fetchData();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este item?')) return;
    try {
      await supabase.from('setor_tipo_suporte').delete().eq('tipo_suporte_id', id);
      const { error } = await supabase.from('tipo_suportes').delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Excluído!' });
      await fetchData();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  };

  const getClasseNome = (classeId: string) => classes.find(c => c.id === classeId)?.nome || '—';

  const getSetorNomesList = (tipoId: string) => {
    const relatedSetores = items.find(i => i.id === tipoId)?._setorIds || [];
    return relatedSetores.map((id: string) => setores.find(s => s.id === id)?.nome).filter(Boolean).join(', ') || '—';
  };

  const filteredItems = items.filter(item => {
    const matchesNome = item.nome.toLowerCase().includes(filterNome.toLowerCase());
    const matchesClasse = !filterClasse || item.classe_suporte_id === filterClasse;
    const matchesSetor = !filterSetor || (item._setorIds || []).includes(filterSetor);
    return matchesNome && matchesClasse && matchesSetor;
  });

  const enrichedItems = filteredItems.map(item => ({
    ...item,
    _setorIds: items.find(i => i.id === item.id)?._setorIds || [],
  }));

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Tipos de Suporte</h1>
        <Dialog open={isOpen} onOpenChange={open => { setIsOpen(open); if (!open) { setEditItem(null); setSetoresRelacionados([]); } }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditItem({ nome: '', ativo: true, prazo_dias_uteis: 5, classe_suporte_id: '' }); setSetoresRelacionados([]); setIsOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem?.id ? 'Editar' : 'Criar'} Tipo de Suporte</DialogTitle>
            </DialogHeader>
            <TipoSuporteForm item={editItem} setItem={setEditItem} classes={classes} setores={setores} setoresRelacionados={setoresRelacionados} setSetoresRelacionados={setSetoresRelacionados} />
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => { setIsOpen(false); setEditItem(null); setSetoresRelacionados([]); }}>Cancelar</Button>
              <Button onClick={handleSave} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3 border rounded-lg p-4 bg-muted/30">
        <h3 className="font-semibold">Filtros</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Nome</Label>
            <Input placeholder="Filtrar por nome..." value={filterNome} onChange={e => setFilterNome(e.target.value)} />
          </div>
          <div>
            <Label>Classe de Suporte</Label>
            <Select value={filterClasse || '-'} onValueChange={v => setFilterClasse(v === '-' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Todas" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Todas</SelectItem>
                {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Setor</Label>
            <Select value={filterSetor || '-'} onValueChange={v => setFilterSetor(v === '-' ? '' : v)}>
              <SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="-">Todos</SelectItem>
                {setores.map(s => <SelectItem key={s.id} value={s.id}>{s.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Classe</TableHead>
              <TableHead>Setores</TableHead>
              <TableHead>Prazo (dias)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {enrichedItems.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum tipo de suporte encontrado</TableCell></TableRow>
            ) : enrichedItems.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nome}</TableCell>
                <TableCell>{getClasseNome(item.classe_suporte_id)}</TableCell>
                <TableCell className="text-sm">{getSetorNomesList(item.id)}</TableCell>
                <TableCell>{item.prazo_dias_uteis}</TableCell>
                <TableCell><Badge variant={item.ativo ? 'default' : 'secondary'}>{item.ativo ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => handleOpenEdit(item)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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

