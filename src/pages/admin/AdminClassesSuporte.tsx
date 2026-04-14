import { AdminCrudPage } from '@/components/AdminCrudPage';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

export default function AdminClassesSuporte() {
  return (
    <AdminCrudPage
      tableName="classe_suportes"
      title="Classes de Suporte"
      defaultItem={{ nome: '', descricao: '', ativo: true }}
      columns={[
        { key: 'nome', label: 'Nome' },
        { key: 'descricao', label: 'Descrição' },
        { key: 'ativo', label: 'Status', render: (r) => <Badge variant={r.ativo ? 'default' : 'secondary'}>{r.ativo ? 'Ativo' : 'Inativo'}</Badge> },
      ]}
      formFields={(item, setItem) => (
        <>
          <div><Label>Nome</Label><Input value={item?.nome || ''} onChange={e => setItem({ ...item!, nome: e.target.value })} /></div>
          <div><Label>Descrição</Label><Textarea value={item?.descricao || ''} onChange={e => setItem({ ...item!, descricao: e.target.value })} /></div>
          <div className="flex items-center gap-2"><Switch checked={item?.ativo ?? true} onCheckedChange={v => setItem({ ...item!, ativo: v })} /><Label>Ativo</Label></div>
        </>
      )}
    />
  );
}
