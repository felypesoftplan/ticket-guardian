import { AdminCrudPage } from '@/components/AdminCrudPage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';

export default function AdminSetores() {
  return (
    <AdminCrudPage
      tableName="setores"
      title="Setores"
      defaultItem={{ nome: '', ativo: true, email_responsavel: '', cor: '#3b82f6' }}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'cor', label: 'Cor', render: (r) => r.cor ? <div className="h-6 w-6 rounded" style={{ backgroundColor: r.cor }} /> : null },
        { key: 'ativo', label: 'Status', render: (r) => <Badge variant={r.ativo ? 'default' : 'secondary'}>{r.ativo ? 'Ativo' : 'Inativo'}</Badge> },
      ]}
      formFields={(item, setItem) => (
        <>
          <div><Label>Nome</Label><Input value={item?.nome || ''} onChange={e => setItem({ ...item!, nome: e.target.value })} /></div>
          <div><Label>Email Responsável</Label><Input value={item?.email_responsavel || ''} onChange={e => setItem({ ...item!, email_responsavel: e.target.value })} /></div>
          <div><Label>Cor</Label><Input type="color" value={item?.cor || '#3b82f6'} onChange={e => setItem({ ...item!, cor: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={item?.ativo ?? true} onCheckedChange={v => setItem({ ...item!, ativo: v })} /><Label>Ativo</Label></div>
        </>
      )}
    />
  );
}
