import { AdminCrudPage } from '@/components/AdminCrudPage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function AdminPrioridades() {
  return (
    <AdminCrudPage
      tableName="prioridades"
      title="Prioridades"
      orderBy="nivel"
      defaultItem={{ nome: '', nivel: 1, cor: '#3b82f6', prazo_dias_uteis: 5, ativo: true }}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'nivel', label: 'Nível' },
        { key: 'cor', label: 'Cor', render: (r) => <div className="h-6 w-6 rounded" style={{ backgroundColor: r.cor }} /> },
        { key: 'prazo_dias_uteis', label: 'Prazo (dias)' },
        { key: 'ativo', label: 'Status', render: (r) => <Badge variant={r.ativo ? 'default' : 'secondary'}>{r.ativo ? 'Ativo' : 'Inativo'}</Badge> },
      ]}
      formFields={(item, setItem) => (
        <>
          <div><Label>Nome</Label><Input value={item?.nome || ''} onChange={e => setItem({ ...item!, nome: e.target.value })} /></div>
          <div><Label>Nível</Label><Input type="number" min={1} max={10} value={item?.nivel || 1} onChange={e => setItem({ ...item!, nivel: parseInt(e.target.value) })} /></div>
          <div><Label>Cor</Label><Input type="color" value={item?.cor || '#3b82f6'} onChange={e => setItem({ ...item!, cor: e.target.value })} /></div>
          <div><Label>Prazo (dias úteis)</Label><Input type="number" min={1} max={365} value={item?.prazo_dias_uteis || 5} onChange={e => setItem({ ...item!, prazo_dias_uteis: parseInt(e.target.value) })} /></div>
          <div className="flex items-center gap-2"><Switch checked={item?.ativo ?? true} onCheckedChange={v => setItem({ ...item!, ativo: v })} /><Label>Ativo</Label></div>
        </>
      )}
    />
  );
}
