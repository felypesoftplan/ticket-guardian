import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const {
      chamado_id,
      mensagem,
      actor_id,
      solicitante_id,
      responsavel_id,
      user_ids,
      notify_admins_and_suporte,
      setor_id,
    } = body;

    if (!chamado_id || !mensagem) {
      return jsonResponse({ error: 'Missing chamado_id or mensagem' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Missing Supabase configuration' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('PUBLIC_APP_URL') || '';
    const chamadoLink = appUrl ? `${appUrl.replace(/\/$/, '')}/chamados/${chamado_id}` : '';

    // Build list of user IDs to notify
    const targets = new Set<string>();

    // Direct user_ids (legacy support)
    if (Array.isArray(user_ids)) {
      user_ids.forEach((uid: string) => targets.add(uid));
    }

    // Solicitante and responsavel
    if (solicitante_id && solicitante_id !== actor_id) targets.add(solicitante_id);
    if (responsavel_id && responsavel_id !== actor_id) targets.add(responsavel_id);

    // When a chamado is created, also notify admins and suporte of the setor
    if (notify_admins_and_suporte) {
      // Get all admins
      const { data: admins } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('role', 'admin')
        .eq('ativo', true);
      (admins || []).forEach((u: any) => {
        if (u.id !== actor_id) targets.add(u.id);
      });

      // Get suporte users that belong to the setor (via user_setores)
      if (setor_id) {
        const { data: setorUsers } = await supabaseAdmin
          .from('user_setores')
          .select('user_id')
          .eq('setor_id', setor_id);
        const suporteUserIds = (setorUsers || []).map((su: any) => su.user_id);

        if (suporteUserIds.length > 0) {
          const { data: suportes } = await supabaseAdmin
            .from('users')
            .select('id')
            .eq('role', 'suporte')
            .eq('ativo', true)
            .in('id', suporteUserIds);
          (suportes || []).forEach((u: any) => {
            if (u.id !== actor_id) targets.add(u.id);
          });
        }
      }
    }

    // Remove actor from notifications
    if (actor_id) targets.delete(actor_id);

    if (targets.size === 0) {
      return jsonResponse({ success: true, message: 'No targets to notify' });
    }

    const targetArray = Array.from(targets);

    // Create in-app notifications
    const inserts = targetArray.map(userId => ({
      user_id: userId,
      chamado_id,
      mensagem,
    }));
    await supabaseAdmin.from('notificacoes').insert(inserts);

    // Send email notifications
    const { data: users } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .in('id', targetArray);

    const recipients = (users || [])
      .filter((u: any) => u?.email)
      .map((u: any) => ({ email: u.email, name: u.name }));

    if (recipients.length === 0) {
      return jsonResponse({ success: true, message: 'Notifications created, no emails to send' });
    }

    // Try SendGrid first
    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const sendGridFrom = Deno.env.get('SENDGRID_FROM_EMAIL') || 'no-reply@helpder.com';

    if (sendGridApiKey) {
      const subject = '[Help DER] Atualização de chamado';
      const textContent = `${mensagem}\n\nAcesse o chamado${chamadoLink ? `: ${chamadoLink}` : ''}`;
      const htmlContent = buildEmailHtml(mensagem, chamadoLink);

      const emailBody = {
        personalizations: [{ to: recipients }],
        from: { email: sendGridFrom, name: 'Help DER' },
        subject,
        content: [
          { type: 'text/plain', value: textContent },
          { type: 'text/html', value: htmlContent },
        ],
      };

      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('SendGrid error:', errorText);
      }

      return jsonResponse({ success: true, message: `Notified ${targetArray.length} users, email sent` });
    }

    // If no SendGrid, try SMTP via Supabase (Resend)
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      const subject = '[Help DER] Atualização de chamado';
      const htmlContent = buildEmailHtml(mensagem, chamadoLink);

      for (const recipient of recipients) {
        try {
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'Help DER <onboarding@resend.dev>',
              to: [recipient.email],
              subject,
              html: htmlContent,
            }),
          });
        } catch (e) {
          console.error('Resend error for', recipient.email, e);
        }
      }

      return jsonResponse({ success: true, message: `Notified ${targetArray.length} users, email sent via Resend` });
    }

    return jsonResponse({ success: true, message: `Notified ${targetArray.length} users, email skipped (no email provider configured)` });
  } catch (error: any) {
    console.error('notify-chamado-update error:', error);
    return jsonResponse({ error: error.message || 'Unknown error' }, 500);
  }
});

function buildEmailHtml(mensagem: string, chamadoLink: string): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f1f5f9;font-family:Arial,sans-serif;">
  <div style="max-width:600px;margin:20px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
    <div style="background:#1e293b;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;">Help DER</h1>
      <p style="margin:4px 0 0;color:#94a3b8;font-size:13px;">Sistema de Suporte</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 16px;color:#0f172a;font-size:18px;">Atualização de Chamado</h2>
      <p style="margin:0 0 24px;color:#334155;font-size:15px;line-height:1.6;">${escapeHtml(mensagem)}</p>
      ${chamadoLink ? `
      <a href="${chamadoLink}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-size:14px;font-weight:600;">
        Abrir Chamado
      </a>` : ''}
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">Este email foi enviado automaticamente pelo Help DER. Não responda este email.</p>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
