# Plano: Proteção de Rotas com Middleware (Supabase)

**Status:** Aguardando Aprovação

O problema atual é que as nossas páginas (como o Dashboard) estão "públicas" porque ainda não configuramos um **Middleware (Guarda de Rotas)** no Next.js. Atualmente, o servidor não verifica a sessão antes de entregar a tela.

## Perguntas em Aberto
- Você concorda em bloquear **toda** a aplicação? Se houver alguma outra página que precise ficar pública (como uma landing page ou termos de uso), me avise para eu colocá-la na lista de exceções.

## Mudanças Propostas

### Backend / Auth Helpers
#### Arquivo: `frontend/src/lib/supabase/middleware.ts`
- Criaremos um arquivo utilitário `updateSession` usando a documentação oficial do `@supabase/ssr` para gerenciar e renovar os cookies de sessão com segurança na borda (Edge).

### Next.js Edge
#### Arquivo: `frontend/src/middleware.ts`
- Criaremos o Middleware oficial do Next.js na pasta `src/`.
- Ele interceptará todas as requisições para as rotas da aplicação (ignorando imagens e arquivos estáticos).
- **Regras de Negócio:**
  1. Sem sessão ativa + tentou acessar `/` (ou qualquer rota) -> Redireciona para `/login`.
  2. Com sessão ativa + tentou acessar `/login` -> Redireciona para `/`.

## Plano de Verificação
1. Tentar acessar a raiz (`/`) em uma janela anônima e verificar o bloqueio.
2. Fazer o login para receber os cookies e validar a liberação da navegação.
