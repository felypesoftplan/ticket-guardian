import { supabase } from '@/integrations/supabase/client';

/**
 * Creates in-app notifications and sends email for chamado updates.
 * Notifies the solicitante and responsavel (if any), excluding the actor.
 */
export async function notifyChamadoUpdate(
  chamadoId: string,
  actorId: string,
  mensagem: string,
  solicitanteId: string,
  responsavelId?: string | null
) {
  // Create in-app notifications for solicitante and responsavel
  const targets = new Set<string>();
  if (solicitanteId && solicitanteId !== actorId) targets.add(solicitanteId);
  if (responsavelId && responsavelId !== actorId) targets.add(responsavelId);

  const inserts = Array.from(targets).map(userId => ({
    user_id: userId,
    chamado_id: chamadoId,
    mensagem,
  }));

  if (inserts.length > 0) {
    await (supabase.from('notificacoes' as any) as any).insert(inserts);
  }

  // Send email via edge function (also notifies admins/suporte of the setor)
  try {
    await supabase.functions.invoke('notify-chamado-update', {
      body: {
        chamado_id: chamadoId,
        actor_id: actorId,
        solicitante_id: solicitanteId,
        responsavel_id: responsavelId,
        mensagem,
      },
    });
  } catch (error) {
    console.error('Falha ao enviar notificação por email:', error);
  }
}
