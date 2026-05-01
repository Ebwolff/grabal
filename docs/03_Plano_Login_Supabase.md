# Plano: Integração do Supabase Auth na Tela de Login

**Status:** Aguardando Aprovação

O objetivo desta implementação é conectar a interface estática atual da página de Login (`/login`) ao serviço de Autenticação do Supabase, permitindo que os usuários acessem o sistema de forma segura.

## Perguntas em Aberto (Open Questions)
1. Após o login com sucesso, devo redirecionar o usuário para a rota raiz `/` ou existe uma rota específica como `/dashboard`?
2. Quer que eu adicione um link de "Esqueci minha senha" ou mantemos a tela apenas com Login estrito por enquanto?
3. Você já possui um usuário de teste criado no seu painel do Supabase Auth para validarmos?

## Mudanças Propostas

### Frontend / Interface de Login

#### Arquivo: `frontend/src/app/login/page.tsx`
- Transformar os inputs estáticos de Email e Senha em componentes controlados (usando `useState`).
- Adicionar o cliente Supabase (`createBrowserClient` do nosso `src/lib/supabase/client.ts`).
- Implementar a função `supabase.auth.signInWithPassword`.
- Substituir o `<Link>` do botão por uma tag `<button>` que acione o submit do formulário e adicione um estado de `loading` (ex: spinner ou texto "Autenticando...").
- Disparar alertas (Toasts) usando a biblioteca que já configuramos no projeto para mensagens de "Erro nas credenciais" ou "Login efetuado com sucesso".
- Utilizar `useRouter` do `next/navigation` para redirecionamento após a autenticação.

## Plano de Verificação
- Tentar acessar com credenciais inválidas e validar se o Toast de erro "Credenciais Inválidas" aparece e o botão volta ao estado normal.
- Tentar acessar com credenciais válidas, validar se o botão entra em "loading" e, após o sucesso, se o sistema redireciona o usuário para a página principal.
