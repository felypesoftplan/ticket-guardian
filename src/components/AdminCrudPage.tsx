import { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';

interface CrudPageProps<T> {
  tableName: string;
  title: string;
  singularTitle?: string;
  columns: { key: string; label: string; render?: (row: T) => ReactNode }[];
  formFields: (item: T | null, setItem: (item: T | null) => void) => ReactNode;
  defaultItem: T;
  orderBy?: string;
  onAfterSave?: (item: T, isNew: boolean) => Promise<void>;
}

export function AdminCrudPage<T extends Record<string, any>>({
  tableName,
  title,
  singularTitle,
  columns,
  formFields,
  defaultItem,
  orderBy = 'created_at',
  onAfterSave,
}: CrudPageProps<T>) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [editItem, setEditItem] = useState<T | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const singular = singularTitle || title;

  const fetchItems = async () => {
    setLoading(true);
    const { data } = await supabase.from(tableName as any).select('*').order(orderBy);
    setItems((data as unknown as T[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleSave = async () => {
    if (!editItem) return;
    setSaving(true);
    try {
      const { id, created_at, updated_at, _selectedSetores, ...rest } = editItem;
      const isNew = !id;
      if (id) {
        const { error } = await supabase.from(tableName as any).update(rest as any).eq('id', id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from(tableName as any).insert(rest as any).select().single();
        if (error) throw error;
        if (onAfterSave && data) await onAfterSave(data as unknown as T, true);
      }
      if (!isNew && onAfterSave) await onAfterSave(editItem, false);
      toast({ title: 'Salvo com sucesso!' });
      setIsOpen(false);
      setEditItem(null);
      await fetchItems();
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este item?')) return;
    try {
      const { error } = await supabase.from(tableName as any).delete().eq('id', id);
      if (error) throw error;
      toast({ title: 'Excluído!' });
      await fetchItems();
    } catch (err: any) {
      toast({ title: 'Erro ao excluir', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditItem(defaultItem as T); setIsOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Novo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem?.id ? 'Editar' : 'Criar'} {singular}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {editItem && formFields(editItem, setEditItem)}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancelar</Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar
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
              {columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></TableCell></TableRow>
            ) : items.length === 0 ? (
              <TableRow><TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">Nenhum item</TableCell></TableRow>
            ) : items.map(item => (
              <TableRow key={item.id}>
                {columns.map(col => (
                  <TableCell key={col.key}>
                    {col.render ? col.render(item) : String(item[col.key] ?? '')}
                  </TableCell>
                ))}
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => { setEditItem(item); setIsOpen(true); }}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
