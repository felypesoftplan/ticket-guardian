# Ticket Guardian - Próximos Passos

## ✅ Status Atual

**Aplicação:** Rodando com sucesso em http://localhost:8080/
- Arquivo corrupto (`AdminUsuarios.tsx`) foi reparado
- Build passou sem erros

**Código pronto para deploy:**
- ✅ `src/lib/user-api.ts` - Wrapper das Edge Functions
- ✅ `supabase/functions/create-user/index.ts` - Edge Function para criar usuários
- ✅ `supabase/functions/delete-user/index.ts` - Edge Function para deletar usuários
- ✅ `src/pages/admin/AdminUsuarios.tsx` - UI do admin refatorada

**Migrations criadas (mas não ativadas):**
- ✅ `supabase/migrations/20260414031500_fix_login_rls.sql` - Corrige RLS para login
- ✅ `supabase/migrations/20260414032500_add_user_setores_junction.sql` - Cria tabela de relacionamento many-to-many

---

## 🔧 Próximos Passos (Manual no Supabase)

### 1. Deploy das Edge Functions

Abra o terminal no seu projeto e execute:

```bash
supabase functions deploy create-user
supabase functions deploy delete-user
```

Ou se estiver usando Bun (conforme seu package.json):

```bash
bun supabase functions deploy create-user
bun supabase functions deploy delete-user
```

### 2. Aplicar Migrations no Supabase

Acesse [Supabase Dashboard](https://supabase.com/dashboard) → seu projeto → SQL Editor

**Opção A - Via Dashboard SQL Editor:**
1. Copie o conteúdo de `supabase/migrations/20260414031500_fix_login_rls.sql`
2. Cole no SQL Editor
3. Execute
4. Repita para `supabase/migrations/20260414032500_add_user_setores_junction.sql`

**Opção B - Via CLI (Recomendado):**
```bash
cd c:\Dev\ticket-guardian
bun supabase db push
```
Isso irá executar todas as migrations pendentes automaticamente.

---

## 🧪 Teste Completo da Feature

### 1. Verificar Login com Admin Existente

**Credenciais do Admin:**
- Email: `admin@ticketguardian.com`
- Senha: (A que você criou no Dashboard)
- UUID: `8b8bbf6d-2975-4b2b-867e-d07d465d30ac`

**Passos:**
1. Abra http://localhost:8080/
2. Clique em "Admin" no menu lateral
3. Clique em "Usuários"
4. Você deve ver a lista de usuários (deve incluir o admin)

### 2. Criar Novo Usuário

1. Na página de Usuários, clique no botão "Novo"
2. Preencha:
   - Nome: Sistema de Apoio
   - Email: sistema@ticketguardian.com
   - Senha: SenhaForte123!
3. Clique "Criar"
4. Você deve receber notificação de sucesso
5. O novo usuário deve aparecer na tabela

### 3. Deletar Usuário

1. Na tabela de usuários, clique no ícone da lixeira do usuário criado
2. Confirme a exclusão no diálogo
3. O usuário deve desaparecer da lista

### 4. Atribuir Múltiplos Setores

Essa feature está pronta na UI, mas depende das migrations serem aplicadas:

1. Na tabela, seria possível editar um usuário
2. Selecionar múltiplos setores com checkboxes
3. Salvar as alterações

---

## 📋 Checklist de Implementação

- [x] Usuário Admin criado (`8b8bbf6d-2975-4b2b-867e-d07d465d30ac`)
- [x] RLS e login funcionando
- [x] AdminUsuarios.tsx implementado e compilando
- [x] Edge Functions (create-user e delete-user) codificadas
- [x] user-api.ts wrapper criado
- [x] Migrations SQL preparadas
- [ ] **Edge Functions PUBLICADAS no Supabase**
- [ ] **Migrations APLICADAS no banco**
- [ ] Testes manuais realizados

---

## 🚀 Ao Completar Setup

Após executar os passos acima, a aplicação terá:

✅ Autenticação funcional com admin
✅ CRUD de usuários (Create, Read, Update, Delete)
✅ Atribuição de múltiplos setores por usuário
✅ UI responsiva com dialogs de confirmação
✅ Notificações de sucesso/erro
✅ Controle baseado em roles (admin pode gerenciar usuários)

---

## 🐛 Troubleshooting

### "Function not found" ao criar/deletar usuário
- Verifique se as edge functions foram publicadas com `supabase functions deploy`
- Reinicie o servidor dev (`npm run dev`)

### Erro ao aplicar migrations
- Verifique permissões no Supabase (precisa ser admin da conta)
- Confira se não há migrations já aplicadas com o mesmo nome

### Login ainda mostra "Usuário não encontrado"
- Verifique se a migration `fix_login_rls.sql` foi aplicada
- Confira se o usuário admin foi criado corretamente

---

**Autor:** Ticket Guardian Setup Assistant
**Data:** 2025-04-14
