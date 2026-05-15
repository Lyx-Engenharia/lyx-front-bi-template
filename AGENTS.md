# AGENTS.md — lyx-front-bi-template

> Fonte única de regras pra agentes de IA (Claude Code, Cursor, Copilot, Aider).
> **Não edite os arquivos copiados** (CLAUDE.md, .cursorrules, .github/copilot-instructions.md).
> Edite ESTE arquivo e rode `npm run sync-agents`.

## TL;DR

**Este repo é um TEMPLATE.** Vai ser clonado pra criar projetos de Business Intelligence novos. Quanto antes a régua de qualidade estiver no template, mais propaga pros forks.

Stack:

- **Next.js 16** + **React 19** + **TypeScript** strict
- **Better Auth** client (cookie cross-subdomain `.lyxai.com.br`) — login delegado ao monolito Lyx
- **Supabase** (`@supabase/ssr` + `@supabase/supabase-js`) — fonte de dados analíticos (read-only via PostgREST + RLS)
- **TanStack React Query** pra hooks de fetch
- **Radix UI** primitives + convenções shadcn/ui
- **Recharts** pra dashboards
- **react-hook-form** + **@hookform/resolvers** + **zod** pra forms
- **Lucide** ícones, **date-fns** datas, **sonner** toasts
- **Lyx Design System v2** (`tw-animate-css`, `tailwind-merge`, tokens em `globals.css`)

Auditoria automatizada no CI: ESLint (complexity/max-lines/cognitive — warn), `dependency-cruiser` (ciclos — error), coverage gate global (warn), bot que comenta hotspots no PR.

## Setup local

Pré-requisitos:
- Node ≥ 20.18
- Monolito `lyx-monolith` rodando em `:3000` (auth API) — opcional se mockar
- Supabase self-host BI acessível (ou anon key fake pra UI work)

```bash
git clone <repo>
cd lyx-front-bi-template
cp .env.example .env.local
# editar:
#   NEXT_PUBLIC_AUTH_URL=https://api.lyxai.com.br (ou http://localhost:3000)
#   NEXT_PUBLIC_SUPABASE_URL=https://bi.seu-servidor.com.br
#   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key BI>
npm install
npm run dev                      # next dev em :3002
```

## Workflow

Modelo de branches: **`feat/*` → PR → `develop` → PR → `main` → deploy**.

1. Sai de `develop`: `git checkout develop && git pull && git checkout -b feat/<nome>`
2. Codifica + roda local (`npm run dev`)
3. **Abre PR contra `develop`** → CI valida (`pr.yml`: lint + typecheck + build + test + coverage gate + deps check) → 1 approve obrigatório → merge
4. **Quando pronto pra prod**: abre PR `develop` → `main` → 1 approve obrigatório → merge
5. **Merge em `main`** → Dokploy builda imagem Docker (Next.js standalone) e troca container

Detalhado em [`docs/DEV_WORKFLOW.md`](docs/DEV_WORKFLOW.md).

## Regras invioláveis

- 🔒 **Auth delega tudo pro monolito.** Nada de login local, hash de senha, sessão local. Sign-in faz `POST /api/auth/sign-in/email` no monolito. Membership da org `bi` é validada em login.
- 🔒 **Supabase é read-only.** Dados de BI consumidos via PostgREST + RLS. Sem mutations a partir deste front (BI = analítico). Use views/tabelas com RLS pública pra `anon` ou autenticado.
- 🔒 **Sem JWT Supabase emitido por Better Auth.** Padrão simples: anon key + RLS. Não tente "amarrar" sessão do monolito ao Supabase com JWT — descartado.
- 🔒 **NEXT_PUBLIC_*** vars inlinam em build. Sempre passa ARG no `Dockerfile` build OU usa hardcoded pra URL canônica. `||` (não `??`) pra cobrir caso `""`.
- 🔒 **`'use client'` só quando necessário.** Default é server component. Hooks do React Query (`useQuery`) precisam de client; layout/page server-side ok.
- 🔒 **Sem mexer em arquitetura base** (Next App Router, Radix, Tailwind v4). Adicionar lib nova precisa justificativa no PR.

## Estrutura

```
src/
├── app/
│   ├── layout.tsx              Providers + fonts
│   ├── globals.css             tokens Lyx DS v2
│   ├── page.tsx                redirect → /login
│   ├── login/page.tsx          POST sign-in/email no monolito + valida membership 'bi'
│   └── dashboard/
│       ├── layout.tsx          sidebar BI
│       └── page.tsx            KPIs + charts + tabela (mock)
├── components/
│   ├── ui/                     Radix primitives (button, card, dialog, ...)
│   ├── providers.tsx           QueryClientProvider + ThemeProvider
│   ├── theme-toggle.tsx
│   └── lyx-modal.tsx
└── lib/
    ├── auth-client.ts          Better Auth client + isMembroBI()
    ├── supabase.ts             createSupabaseBrowser / createSupabaseServer
    ├── queries.ts              hooks Supabase (useKpiVendas, ...)
    └── utils.ts                cn, etc.
```

## Como usar como template

```bash
# Clone fora do diretório git original
cp -r /caminho/lyx-front-bi-template ~/meu-bi-novo
cd ~/meu-bi-novo
rm -rf .git node_modules
git init -q && git add -A && git commit -q -m "init from lyx-front-bi-template"

npm install
cp .env.example .env.local
# editar vars

npm run dev
```

Personalizar:
- Brand `MeuBI` → `src/components/ui/lyx-logo.tsx` + textos em login/layout
- Cor accent → `src/app/globals.css` (`--accent`)
- Nav sidebar → `src/app/dashboard/layout.tsx`
- Queries reais → `src/lib/queries.ts` (substituir mocks por views Supabase)

## Como adicionar dashboard/página nova

1. Criar `src/app/dashboard/<slug>/page.tsx` (server component default).
2. Se precisa de dados client-side, criar componente client em `src/components/dashboard/<slug>-view.tsx`.
3. Hook de query em `src/lib/queries.ts`: `useXxx()` usando `createSupabaseBrowser()` + `useQuery`.
4. Spec test (`*.spec.ts`) no mesmo PR pra lógica não-trivial (transformações, agregações).

## DON'T

- ❌ Auth local (hash de senha, sessão local, JWT próprio)
- ❌ Mutations no Supabase a partir deste front (BI = read-only)
- ❌ `console.log` em código de prod (use logger condicional ou nada)
- ❌ Commitar `.env`, `.env.local`
- ❌ Editar `CLAUDE.md`/`.cursorrules`/`.github/copilot-instructions.md` direto (edite `AGENTS.md` e rode `npm run sync-agents`)
- ❌ Importar Server-only API em client component (Next vai gritar)
- ❌ Adicionar lib fora da stack sem justificativa no PR
- ❌ Bypass coverage gate / lint sem comentário `// eslint-disable-next-line <regra> -- TODO(YYYY-MM-DD): <razão>`

## Disciplina de testes

**Stack:** Vitest + V8 coverage (lcov).

**Regra de ouro pra código novo:**
- Lógica de negócio nova (helpers em `src/lib/**`, queries com transformação, hooks com side-effects) → spec no mesmo PR.
- TDD recomendado: escreve teste primeiro, implementa depois.
- Componentes puros de UI: spec só se tiver lógica condicional não-trivial.

**Convenção:**
- Tests co-located: `*.spec.ts(x)` ao lado da implementação.
- Naming: `describe('Função/Componente', () => describe('cenário', () => it('comportamento esperado')))`.
- Fixtures hand-rolled em `src/**/__fixtures__/<nome>.fixtures.ts` se a suite precisar.

**Mock policy:**
- Mockar SÓ serviços externos (Better Auth fetch ao monolito, Supabase client, APIs externas).
- Lógica interna (helpers, transformações): NUNCA mock — sempre real.

**Coverage:** 50% lines target inicial (warn na Fase 1, bloqueante na Fase 2).

Detalhes da auditoria automatizada: [`docs/AUDITORIA_AUTOMATIZADA.md`](docs/AUDITORIA_AUTOMATIZADA.md).

## Auditoria automatizada (CI)

Toda PR contra `develop`/`main` roda:

| Check | Limite | Severidade | Bloqueia merge? |
|---|---|---|---|
| `lint` (ESLint) | regras Next padrão | error | Sim |
| `typecheck` (tsc strict) | sem erros | error | Sim |
| `build` (next build) | sucesso | error | Sim |
| `test` (Vitest) | sem falhas | error | Sim |
| `coverage:gate` lines | ≥ 50% global | warn (Fase 1) | Não |
| `coverage:gate` branches | ≥ 40% global | warn (Fase 1) | Não |
| `deps:check` ciclos | zero | error | Sim |
| `complexity` (ESLint) | ≤ 12 por função | warn (Fase 1) | Não |
| `cognitive-complexity` | ≤ 15 por função | warn (Fase 1) | Não |
| `max-lines` por arquivo | ≤ 500 | warn (Fase 1) | Não |
| `max-lines-per-function` | ≤ 80 | warn (Fase 1) | Não |

Bot do PR (`audit-report.yml`) comenta resumo + hotspots a cada push. Marker `<!-- audit-report -->` evita duplicar comentário.

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev` | Next dev server em :3002 |
| `npm run build` | Next production build |
| `npm run start` | Start do build (`npm run build` antes) |
| `npm run lint` | ESLint |
| `npm run typecheck` | tsc --noEmit |
| `npm run test` | Vitest (single run) |
| `npm run test:watch` | Vitest watch mode |
| `npm run test:coverage` | Vitest + lcov report |
| `npm run coverage:gate` | Avalia lcov contra thresholds (warn em Fase 1) |
| `npm run deps:check` | dependency-cruiser (ciclos + orphans) |
| `npm run audit:report` | Gera markdown consolidado dos checks |
| `npm run audit:all` | Roda tudo em sequência (lint + typecheck + test + coverage gate + deps) |
| `npm run sync-agents` | Copia AGENTS.md pros 3 alvos (CLAUDE/cursor/copilot) |

## Pré-requisitos manuais (admin do repo)

- **Branch protection** em `main` E `develop`: PR obrigatório, 1 approve, status check `validate` (do `pr.yml`) tem que passar, sem force push
- **Default branch:** `develop` (PRs novas caem aqui automaticamente)
- **Dokploy env (quando deployar):** `NEXT_PUBLIC_AUTH_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — passar como ARG no `docker build` pra inlinar em bundle.

## Referências

- [`docs/DEV_WORKFLOW.md`](docs/DEV_WORKFLOW.md) — fluxo PR → review → merge → deploy
- [`docs/AUDITORIA_AUTOMATIZADA.md`](docs/AUDITORIA_AUTOMATIZADA.md) — detalhe das checagens
- [`README.md`](README.md) — quickstart + como clonar como template
