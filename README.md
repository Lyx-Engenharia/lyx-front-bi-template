# Lyx Front BI Template

Template Next.js 16 + Lyx Design System v2, variante **Business Intelligence**.

## Diferença vs `lyx-front-template`

| Camada | Sistema normal | BI |
|---|---|---|
| Autenticação | Better Auth + setActive org | Better Auth + check membership `bi` |
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

## Auth flow

```
1. /login → POST sign-in/email no monolith
2. Cookie sessão setada (cross-subdomain se .lyxai.com.br)
3. authClient.organization.list() → valida membership slug='bi'
4. Aprovado → /dashboard | Negado → signOut + erro
```

Sem `setActive`. BI = read-only.

## Data flow

```
Client Component
  ↓ useQuery (TanStack)
lib/queries.ts (useKpiVendas, useSerieTemporal, useRanking)
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
│   ├── globals.css             tokens 52W
│   ├── page.tsx                redirect /login
│   ├── login/page.tsx          valida membership 'bi'
│   └── dashboard/
│       ├── layout.tsx          sidebar BI (Vendas/Operação/Relatórios)
│       └── page.tsx            KPIs + 4 charts + tabela (mock)
├── components/                 DS Lyx completo
└── lib/
    ├── auth-client.ts          Better Auth + isMembroBI()
    ├── supabase.ts             createSupabaseBrowser / Server
    ├── queries.ts              hooks Supabase
    └── utils.ts
```

## Personalizar

| Quero mudar | Onde |
|---|---|
| Brand "MeuBI" | `BRAND` em login + dashboard layout |
| Cor accent | `app/globals.css` `--accent` |
| Nav items | `navOperacional` em dashboard/layout.tsx |
| Queries reais | `lib/queries.ts` — nome de views/tabelas |
| URLs | `.env.local` |

## Components BI prontos (no `dashboard/page.tsx`)

- KpiCard destaque (accent + delta)
- KpiCard normal (delta verde/vermelho)
- ChartCard wrapper
- Area / Pie / Line / Bar charts
- Tabela analítica `.lyx-table`

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
