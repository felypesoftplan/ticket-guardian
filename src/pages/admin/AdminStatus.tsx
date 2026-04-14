import { AdminCrudPage } from '@/components/AdminCrudPage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export default function AdminStatus() {
  return (
    <AdminCrudPage
      tableName="statuses"
      title="Status"
      orderBy="ordem"
      defaultItem={{ nome: '', cor: '#3b82f6', ordem: 0, inicial: false, final: false }}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'cor', label: 'Cor', render: (r) => <div className="h-6 w-6 rounded" style={{ backgroundColor: r.cor }} /> },
        { key: 'ordem', label: 'Ordem' },
        { key: 'inicial', label: 'Inicial', render: (r) => r.inicial ? '✅' : '' },
        { key: 'final', label: 'Final', render: (r) => r.final ? '✅' : '' },
      ]}
      formFields={(item, setItem) => (
        <>
          <div><Label>Nome</Label><Input value={item?.nome || ''} onChange={e => setItem({ ...item!, nome: e.target.value })} /></div>
          <div><Label>Cor</Label><Input type="color" value={item?.cor || '#3b82f6'} onChange={e => setItem({ ...item!, cor: e.target.value })} /></div>
          <div><Label>Ordem</Label><Input type="number" value={item?.ordem || 0} onChange={e => setItem({ ...item!, ordem: parseInt(e.target.value) })} /></div>
          <div className="flex items-center gap-2"><Switch checked={item?.inicial ?? false} onCheckedChange={v => setItem({ ...item!, inicial: v })} /><Label>Status Inicial</Label></div>
          <div className="flex items-center gap-2"><Switch checked={item?.final ?? false} onCheckedChange={v => setItem({ ...item!, final: v })} /><Label>Status Final</Label></div>
        </>
      )}
    />
  );
}
