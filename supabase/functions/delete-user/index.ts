import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

export async function onRequest(req: Request): Promise<Response> {
  // Allow only DELETE requests
  if (req.method !== 'DELETE') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get user ID from request body
    const body = await req.json();
    const userId = body.id;

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Missing user id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Delete from user_setores (will cascade)
    await supabaseAdmin
      .from('user_setores')
      .delete()
      .eq('user_id', userId);

    // Delete auth user (this will cascade to users table)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      return new Response(
        JSON.stringify({ error: `Failed to delete user: ${error.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Usuário deletado com sucesso',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
