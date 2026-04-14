import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

interface CreateUserRequest {
  name: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'suporte' | 'gestor' | 'usuario';
  setor_id?: string;
  ativo?: boolean;
}

const corsHeaders = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders,
  });

export async function onRequest(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // Get request body
    const body: CreateUserRequest = await req.json();

    // Validate input
    if (!body.name || !body.username || !body.email || !body.password || !body.role) {
      return jsonResponse({ error: 'Missing required fields: name, username, email, password, role' }, 400);
    }

    // Initialize Supabase admin client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return jsonResponse({ error: 'Missing Supabase configuration' }, 500);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return jsonResponse({ error: `Failed to create auth user: ${authError?.message}` }, 400);
    }

    // Create user profile
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .insert([
        {
          id: authData.user.id,
          name: body.name,
          username: body.username,
          email: body.email,
          role: body.role,
          setor_id: body.setor_id || null,
          ativo: body.ativo !== false,
        },
      ])
      .select()
      .single();

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return jsonResponse({ error: `Failed to create user profile: ${profileError.message}` }, 400);
    }

    return jsonResponse({
      success: true,
      user: profileData,
      message: 'Usuario criado com sucesso!',
    }, 201);
  } catch (error: any) {
    return jsonResponse({ error: error.message || 'Unknown error' }, 500);
  }
}
