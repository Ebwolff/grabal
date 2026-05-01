# 🏗️ Arquitetura do GramBal Investimentos SaaS

Esta nota serve como referência principal da nossa stack de tecnologia para garantir que futuros desenvolvimentos sigam o padrão correto.

## 🖥️ Frontend
- **Framework:** Next.js (React) com App Router.
- **Estilização & UI:** Componentes modulares, incluindo o nosso `DataTable` padrão e sistema de alertas `Toast` espalhados pelas páginas de formulários. A padronização de tabelas exige o uso da classe `table-striped`.
- **Conectividade:** Utilizamos instâncias do Supabase configuradas em `src/lib/supabase/client.ts` e `server.ts` para requisições.

## ⚙️ Backend
- **Framework Principal:** NestJS.
- **Autenticação:** Supabase Auth com validação de tokens JWT. O sistema suporta multi-tenancy.
- **Controle de Acesso:** RBAC (Role-Based Access Control). O perfil do usuário (`custom_roles`) é gerenciado cuidadosamente devido a regras de RLS (Row Level Security), utilizando Edge Functions/Workarounds mapeados quando necessário.

## 🗄️ Banco de Dados
- **Banco e Host:** PostgreSQL hospedado no Supabase.
- **ORM:** Prisma (`prisma/schema.prisma`).
- **Padrão de Chave Primária:** Todas as chaves primárias devem utilizar UUID com default `gen_random_uuid()` no PostgreSQL.
