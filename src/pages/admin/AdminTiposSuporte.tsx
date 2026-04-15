import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AdminCrudPage } from '@/components/AdminCrudPage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';

function TipoSuporteForm({ item, setItem }: { item: any; setItem: (v: any) => void }) {
  const [classes, setClasses] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [selectedSetores, setSelectedSetores] = useState<string[]>([]);

  useEffect(() => {
    supabase.from('classe_suportes').select('*').eq('ativo', true).then(({ data }) => setClasses(data || []));
    supabase.from('setores').select('*').eq('ativo', true).then(({ data }) => setSetores(data || []));

    if (item?.id) {
      supabase.from('setor_tipo_suporte').select('setor_id').eq('tipo_suporte_id', item.id).then(({ data }) => {
        setSelectedSetores((data || []).map(d => d.setor_id));
      });
    }
  }, [item?.id]);

  useEffect(() => {
    setItem({ ...item, _selectedSetores: selectedSetores });
  }, [selectedSetores]);

  return (
    <>
      <div><Label>Nome</Label><Input value={item?.nome || ''} onChange={e => setItem({ ...item, nome: e.target.value })} /></div>
      <div><Label>Prazo (dias úteis)</Label><Input type="number" min={1} max={365} value={item?.prazo_dias_uteis || 5} onChange={e => setItem({ ...item, prazo_dias_uteis: parseInt(e.target.value) })} /></div>
      <div>
        <Label>Classe de Suporte</Label>
        <Select value={item?.classe_suporte_id || ''} onValueChange={v => setItem({ ...item, classe_suporte_id: v })}>
          <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
          <SelectContent>
            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Setores</Label>
        <div className="space-y-2 mt-2">
          {setores.map(s => (
            <div key={s.id} className="flex items-center gap-2">
              <Checkbox
                checked={selectedSetores.includes(s.id)}
                onCheckedChange={checked => {
                  setSelectedSetores(prev =>
                    checked ? [...prev, s.id] : prev.filter(id => id !== s.id)
                  );
                }}
              />
              <span className="text-sm">{s.nome}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2"><Switch checked={item?.ativo ?? true} onCheckedChange={v => setItem({ ...item, ativo: v })} /><Label>Ativo</Label></div>
    </>
  );
}

export default function AdminTiposSuporte() {
  const handleAfterSave = async (item: any, isNew: boolean) => {
    const setoresIds = item._selectedSetores || [];
    if (!isNew) {
      await (supabase.from('setor_tipo_suporte') as any).delete().eq('tipo_suporte_id', item.id);
    }
    if (setoresIds.length > 0) {
      await supabase.from('setor_tipo_suporte').insert(
        setoresIds.map((sid: string) => ({ setor_id: sid, tipo_suporte_id: item.id }))
      );
    }
  };

  return (
    <AdminCrudPage
      tableName="tipo_suportes"
      title="Tipos de Suporte"
      singularTitle="Tipo de Suporte"
      defaultItem={{ nome: '', ativo: true, prazo_dias_uteis: 5, classe_suporte_id: '' }}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'prazo_dias_uteis', label: 'Prazo (dias)' },
        { key: 'ativo', label: 'Status', render: (r) => <Badge variant={r.ativo ? 'default' : 'secondary'}>{r.ativo ? 'Ativo' : 'Inativo'}</Badge> },
      ]}
      formFields={(item, setItem) => <TipoSuporteForm item={item} setItem={setItem} />}
      onAfterSave={handleAfterSave}
    />
  );
}
