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

export async function onRequest(req: Request): Promise<Response> {
  // Allow only POST requests
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Get request body
    const body: CreateUserRequest = await req.json();

    // Validate input
    if (!body.name || !body.username || !body.email || !body.password || !body.role) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, username, email, password, role' }),
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

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true, // Auto-confirm the user
    });

    if (authError || !authData.user) {
      return new Response(
        JSON.stringify({ error: `Failed to create auth user: ${authError?.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
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
          ativo: body.ativo !== false, // Default to true
        },
      ])
      .select()
      .single();

    if (profileError) {
      // If profile creation fails, we need to clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: `Failed to create user profile: ${profileError.message}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        user: profileData,
        message: 'Usuario criado com sucesso!',
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
