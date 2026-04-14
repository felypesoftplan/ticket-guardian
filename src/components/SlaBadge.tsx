import { Badge } from '@/components/ui/badge';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface SlaBadgeProps {
  slaVencimento: string | null;
  statusFinal: boolean;
}

export function SlaBadge({ slaVencimento, statusFinal }: SlaBadgeProps) {
  if (statusFinal) {
    return (
      <Badge className="bg-success text-success-foreground gap-1">
        <CheckCircle2 className="h-3 w-3" />
        Resolvido
      </Badge>
    );
  }

  if (!slaVencimento) {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Sem prazo
      </Badge>
    );
  }

  const now = new Date();
  const vencimento = new Date(slaVencimento);
  const isVencido = now > vencimento;

  if (isVencido) {
    return (
      <Badge className="bg-destructive text-destructive-foreground gap-1">
        <AlertTriangle className="h-3 w-3" />
        Atrasado
      </Badge>
    );
  }

  return (
    <Badge className="bg-warning text-warning-foreground gap-1">
      <Clock className="h-3 w-3" />
      A vencer
    </Badge>
  );
}
