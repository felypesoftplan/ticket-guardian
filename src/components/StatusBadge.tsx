import { Badge } from '@/components/ui/badge';

interface StatusBadgeProps {
  nome: string;
  cor: string;
}

export function StatusBadge({ nome, cor }: StatusBadgeProps) {
  return (
    <Badge
      style={{ backgroundColor: cor, color: '#fff' }}
      className="font-medium"
    >
      {nome}
    </Badge>
  );
}
