# Lyx Front BI Template

Template Next.js 16 + Lyx Design System v2, variante **Business Intelligence**.

Padrão visual alinhado com `lyx-bi-principal`: sidebar dinâmica por categoria + filtro de permissão, cards/charts em shadcn semantic tokens, Approach A standalone (sem sessão compartilhada com o hub).

## Diferença vs `lyx-front-template`

| Camada | Sistema normal (CRUD) | BI |
|---|---|---|
| Autenticação | Better Auth + setActive org | Stub `requireUser` (Approach A) |
| Sidebar | 52W estática | `lyx-bi-principal` (categorias + permissões) |
| Cards/charts | 52W (`.lyx-card`, `.stat-card`) | shadcn (`<Card>`, tokens semânticos) |
| Dados | Fetch → monolith REST | **Supabase self-host** (read-only) |
| Páginas | CRUD forms + listas | Read-only: KPIs + charts + filtros |
| Stack extra | — | `@supabase/supabase-js` + `@supabase/ssr` + `date-fns` |
| Porta dev | 3001 | 3002 |

## Quickstart

```bash
cp -r ~/Projetos/lyx-front-bi-template ~/Projetos/meu-bi
cd ~/Projetos/meu-bi && rm -rf .git node_modules
git init -q && git add -A && git commit -q -m "init"

npm install
cp .env.example .env.local
# editar:
#   NEXT_PUBLIC_AUTH_URL=https://api.lyxai.com.br
#   NEXT_PUBLIC_SUPABASE_URL=https://bi.seu-servidor.com.br
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key BI>

npm run dev   # http://localhost:3002
```

## Sidebar / nav

Sidebar lê de `src/lib/dashboards.ts`:

```ts
export const dashboards: DashboardConfig[] = [
  dash("visao-geral",  { name: "Visão Geral",  category: "financeiro", ... }),
  dash("comercial",    { name: "Comercial",    category: "comercial", ... }),
  dash("financeiro",   { name: "Financeiro",   category: "financeiro", ... }),
]
```

Cada entry vira item na sidebar agrupado por `category` e filtrado por `requiredPermission`. Adicione/remova entries conforme o BI.

## Auth flow (Approach A — standalone)

```
1. Stub em src/lib/auth/current-user.ts retorna mock user bi_admin (todas permissões)
2. Dev substitui por chamada real ao Better Auth do monolith
3. requireUser() é usado no layout/server components pra proteger rotas
```

API igual à do `lyx-bi-principal` — quando virar Approach B (hub central com sessão compartilhada), só troca a implementação interna.

## Data flow

```
Client Component
  ↓ useQuery (TanStack)
src/lib/queries.ts
  ↓ createSupabaseBrowser()
Supabase JS SDK → Supabase self-host (PostgREST + RLS)
  ↓ SQL
Postgres analítico (views/tabelas BI)
```

## Estrutura

```
src/
├── app/
│   ├── layout.tsx              Providers + fonts
│   ├── globals.css             tokens shadcn
│   ├── page.tsx                redirect /login
│   ├── login/
│   │   ├── page.tsx
│   │   └── actions.ts          logoutAction stub
│   └── dashboard/
│       ├── layout.tsx          AuthProvider → SidebarProvider → AppShell
│       └── page.tsx            KPIs + 4 charts + tabela (mock, shadcn)
├── components/
│   ├── ui/                     shadcn base (15 componentes)
│   ├── auth/auth-provider.tsx
│   └── dashboard/
│       ├── sidebar.tsx
│       ├── sidebar-provider.tsx
│       ├── app-shell.tsx
│       ├── dashboard-header.tsx
│       └── greeting.tsx
├── hooks/
│   └── use-sidebar.ts
├── lib/
│   ├── auth-client.ts          Better Auth + isMembroBI()
│   ├── auth/                   stub Approach A
│   │   ├── index.ts
│   │   ├── current-user.ts
│   │   └── role-permissions.ts
│   ├── dashboards.ts           DashboardConfig[] do projeto
│   ├── supabase.ts             createSupabaseBrowser / Server
│   ├── queries.ts              hooks Supabase
│   └── utils.ts
└── types/
    └── dashboard.ts
```

## Personalizar

| Quero mudar | Onde |
|---|---|
| Brand | `BRAND` em login + dashboard-header |
| Cor accent | `src/app/globals.css` `--primary` |
| Itens da sidebar | `src/lib/dashboards.ts` |
| Auth real (Better Auth) | `src/lib/auth/current-user.ts` |
| Permissões/papéis | `src/lib/auth/role-permissions.ts` |
| Queries reais | `src/lib/queries.ts` |
| URLs | `.env.local` |

## Components BI prontos (no `dashboard/page.tsx`)

- KPI cards (shadcn `<Card>` + `bg-primary/10` icon)
- ChartCard wrapper (`<CardHeader>` + `<CardContent>`)
- Area / Pie / Line / Bar charts (cores via `var(--primary)`)
- Tabela com `bg-muted/50` header e `hover:bg-muted/30` rows

Mocks → substituir por `useQuery` no Supabase.

## RLS sugerida no Supabase

```sql
CREATE POLICY "select_public" ON kpi_vendas
  FOR SELECT TO anon USING (true);

CREATE POLICY "select_owner" ON ranking_view
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());
```

> Better Auth do monolith NÃO emite JWT Supabase. Padrão simples: anon key + RLS pública em views read-only.

## Build & Deploy

```bash
npm run build
docker compose up --build
```

Porta: 3002.

## Quando NÃO usar este template

- App precisa CRUD → `lyx-front-template`
- App consome só monolith → `lyx-front-template`
- BI hub central que lista outros BIs → use `lyx-bi-principal` direto (não duplicar)

## Evolução pra Approach B (hub centralizado)

Quando quiser que todos BIs compartilhem sessão com `lyx-bi-principal`:

1. Configura Better Auth cross-subdomain (cookie `.lyx.com.br`)
2. Centraliza `dashboards.ts` num pacote npm interno
3. Cada BI consome esse pacote em vez do `src/lib/dashboards.ts` local
4. `src/lib/auth/current-user.ts` aponta pra sessão única do hub

Componentes da sidebar/app-shell já são compatíveis — não reescrever nada.
