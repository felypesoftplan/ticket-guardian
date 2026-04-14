import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fjzpwginefftvjihmzbv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqenB3Z2luZWZmdHZqaWhtemJ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMjYyOTEsImV4cCI6MjA5MTcwMjI5MX0.n6J0f7u_7yIQePxoI4b1zYI-DNpheTWYHKhWrDlkBq0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUser() {
  try {
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          id: '8b8bbf6d-2975-4b2b-867e-d07d465d30ac',
          name: 'Administrador Sistema',
          username: 'admin',
          email: 'admin@ticketguardian.com',
          role: 'admin',
          ativo: true
        }
      ])
      .select();

    if (error) {
      console.error('❌ Erro ao criar usuário:', error);
    } else {
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('Dados inseridos:', data);
    }
  } catch (err) {
    console.error('❌ Erro geral:', err);
  }
}

createAdminUser();
