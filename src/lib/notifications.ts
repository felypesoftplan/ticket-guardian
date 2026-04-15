import { supabase } from '@/integrations/supabase/client';

/**
 * Creates in-app notifications for relevant users when a chamado is updated.
 * Notifies the solicitante and responsavel (if any), excluding the actor.
 * Also attempts to send an email summary of the update using a server-side function.
 */
export async function notifyChamadoUpdate(
  chamadoId: string,
  actorId: string,
  mensagem: string,
  solicitanteId: string,
  responsavelId?: string | null
) {
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

  if (targets.size === 0) return;

  try {
    await supabase.functions.invoke('notify-chamado-update', {
      body: {
        chamado_id: chamadoId,
        user_ids: Array.from(targets),
        mensagem,
      },
    });
  } catch (error) {
    console.error('Falha ao enviar notificação por email:', error);
  }
}
