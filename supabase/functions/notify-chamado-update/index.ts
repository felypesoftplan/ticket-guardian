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

    const chamadoId = body?.chamado_id;
    const userIds = body?.user_ids;
    const mensagem = body?.mensagem;

    if (!chamadoId || !Array.isArray(userIds) || userIds.length === 0 || !mensagem) {
      return jsonResponse({ error: 'Missing required fields: chamado_id, user_ids, mensagem' }, 400);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Missing Supabase configuration' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('name, email')
      .in('id', userIds);

    if (usersError) {
      return jsonResponse({ error: usersError.message }, 500);
    }

    const recipients = (users || [])
      .filter((user: any) => user?.email)
      .map((user: any) => ({ email: user.email, name: user.name }));

    if (recipients.length === 0) {
      return jsonResponse({ success: true, message: 'No recipients found to send email' }, 200);
    }

    const sendGridApiKey = Deno.env.get('SENDGRID_API_KEY');
    const sendGridFrom = Deno.env.get('SENDGRID_FROM_EMAIL') || 'no-reply@helpder.com';
    const appUrl = Deno.env.get('APP_URL') || Deno.env.get('PUBLIC_APP_URL') || '';
    const chamadoLink = appUrl ? `${appUrl.replace(/\/$/, '')}/chamados/${chamadoId}` : undefined;

    if (!sendGridApiKey) {
      return jsonResponse({ success: true, message: 'Email skipped because SENDGRID_API_KEY is not configured' }, 200);
    }

    const subject = '[Help DER] Atualização de chamado';
    const textContent = `${mensagem}\n\nAcesse o chamado${chamadoLink ? `: ${chamadoLink}` : ''}`;
    const htmlContent = `<p>${mensagem}</p>${chamadoLink ? `<p><a href="${chamadoLink}">Abrir chamado</a></p>` : ''}`;

    const emailBody = {
      personalizations: [
        {
          to: recipients,
        },
      ],
      from: {
        email: sendGridFrom,
        name: 'Help DER',
      },
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
      return jsonResponse({ error: `SendGrid request failed: ${errorText}` }, 500);
    }

    return jsonResponse({ success: true, message: 'Email notifications sent' }, 200);
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Unknown error' }, 500);
  }
});
