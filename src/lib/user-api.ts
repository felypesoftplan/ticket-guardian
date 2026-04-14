import { supabase } from '@/integrations/supabase/client';

interface CreateUserParams {
  name: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'suporte' | 'gestor' | 'usuario';
  setor_id?: string;
  ativo?: boolean;
}

interface CreateUserResponse {
  success: boolean;
  user: {
    id: string;
    name: string;
    username: string;
    email: string;
    role: string;
    setor_id: string | null;
    ativo: boolean;
  };
  message: string;
}

export async function createUser(params: CreateUserParams): Promise<CreateUserResponse> {
  try {
    const { data, error } = await supabase.functions.invoke('create-user', {
      body: params,
    });

    if (error) {
      throw new Error(error.message || 'Failed to create user');
    }

    return data as CreateUserResponse;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to create user');
  }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('delete-user', {
      body: { id: userId },
    });

    if (error) {
      throw new Error(error.message || 'Failed to delete user');
    }

    return data as { success: boolean; message: string };
  } catch (err: any) {
    throw new Error(err.message || 'Failed to delete user');
  }
}
