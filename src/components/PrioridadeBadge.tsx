import { Badge } from '@/components/ui/badge';

interface PrioridadeBadgeProps {
  nome: string;
  cor: string;
}

export function PrioridadeBadge({ nome, cor }: PrioridadeBadgeProps) {
  return (
    <Badge
      variant="outline"
      style={{ borderColor: cor, color: cor }}
      className="font-medium"
    >
      {nome}
    </Badge>
  );
}
