# Fluxo de desenvolvimento — lyx-front-bi-template

> **Público:** dev novo no time, dev voltando ao projeto, AI/agente lendo pra entender.
> Se já é veterano no projeto, pula direto pra [Cheat sheet](#cheat-sheet) no fim.

---

## Visão geral em 30 segundos

Modelo de branches:

```
main      ◄─── deploy automático em prod (Dokploy)
  ▲
  │ PR (precisa 1 approve + CI verde)
  │
develop   ◄─── branch de integração (default; novas PRs caem aqui)
  ▲
  │ PR (precisa 1 approve + CI verde)
  │
feat/*    ◄─── sua branch local de feature
```

Fluxo:

```
1. Cria branch local (feat/<nome>) a partir de develop   →  você
2. Codifica + roda local                                  →  você
3. Abre PR de feat/<nome> → develop                       →  você
4. CI valida (lint, typecheck, build, test, audit)        →  GitHub Actions
5. Review aprova (1 approve obrigatório)                  →  outra pessoa do time
6. Merge em develop                                        →  você (ou auto-merge)
7. Quando estiver pronto pra prod: PR develop → main      →  você
8. Review aprova de novo                                   →  outra pessoa
9. Merge em main                                           →  trigger automático
10. Dokploy builda nova imagem + faz cutover              →  Dokploy
11. Container novo responde                                →  Dokploy
```

Você nunca precisa rodar nada manual em prod. Sua máquina nunca toca o servidor de prod.

---

## A regra de ouro

> **Toda mudança vai por PR. Sem exceção.**

Isso significa:
- Você **nunca** faz push direto em `main` ou `develop`.
- Você **nunca** edita código em prod via SSH.
- Toda mudança passa por CI + review.

---

## O ciclo passo-a-passo

### Passo 1 — Crie sua branch a partir de `develop`

```bash
git fetch origin
git checkout develop
git pull
git checkout -b feat/dashboard-novo
```

Convenção de nome: `feat/...`, `fix/...`, `refactor/...`, `docs/...`, `chore/...`.

**Importante:** sempre saia de `develop`, não de `main`. `main` representa o estado de prod; `develop` é integração ativa.

### Passo 2 — Suba o ambiente local

Pré-requisitos: monolito rodando localmente em `:3000` (auth API) **OU** apontar `NEXT_PUBLIC_AUTH_URL` pra `https://api.lyxai.com.br`. Setup completo no `README.md`.

```bash
cp .env.example .env.local
npm install
npm run dev                      # next dev em :3002
```

### Passo 3 — Codifique a feature

Edite o que precisar em `src/`. Veja `AGENTS.md` seção "Como adicionar dashboard/página nova" se for adicionar visualização.

**Test-first quando aplicável:**
- Helpers/lib novos com lógica condicional → spec primeiro, implementa depois
- Componente puramente visual → pode ir sem spec
- Hook customizado com side-effect (queries Supabase com transformação) → spec

### Passo 4 — Rode localmente os checks antes de push

```bash
npm run audit:all
```

Roda em sequência: lint + typecheck + test + coverage gate + deps check. Falhou? Corrige antes de push.

### Passo 5 — Commit + push

```bash
git add .
git commit -m "feat(dashboard): adiciona KPI de receita mensal"
git push -u origin feat/dashboard-novo
```

### Passo 6 — Abra o PR contra `develop`

```bash
gh pr create --base develop --fill
```

(Como `develop` é a default branch, `--base develop` pode ser omitido.)

### Passo 7 — Espere o CI ficar verde

`.github/workflows/pr.yml` dispara automaticamente. Ele:

1. Faz checkout do código
2. Instala Node + dependências
3. Roda `npm run lint` (ESLint)
4. Roda `npm run typecheck` (TypeScript strict)
5. Roda `npm run build` (Next production build)
6. Roda `npm run test:coverage` (Vitest + V8 coverage)
7. Roda `npm run coverage:gate` (continue-on-error em Fase 1 — warn)
8. Roda `npm run deps:check` (dependency-cruiser — ciclos bloqueiam)
9. Faz upload do `coverage/` como artifact
10. Valida sync de `AGENTS.md` ↔ CLAUDE.md/.cursorrules/copilot-instructions.md

`audit-report.yml` dispara em paralelo e comenta um resumo dos hotspots no PR.

Tudo verde → PR pronto pra review.

> Se algum check tá vermelho, **NÃO mergeie**. Branch protection bloqueia automaticamente.

### Passo 8 — Review

Outra pessoa revisa código. Comentários inline, mudanças solicitadas, etc.

Coisas que reviewer presta atenção:
- Lógica nova tem spec?
- Componente client vs server (`'use client'` correto)?
- Query Supabase com RLS apropriada (read-only, sem mutations)?
- Não tá adicionando dep fora da stack listada no AGENTS.md?

### Passo 9 — Merge em `develop`

Quando aprovada (1 approve mínimo) e CI verde, mergeie. Padrão recomendado: **Squash and merge** (1 commit limpo em develop por feature).

Aqui sua feature está em `develop` mas **ainda NÃO em prod**.

### Passo 10 — Promova `develop` → `main`

Quando develop estiver estável:

```bash
gh pr create --base main --head develop --title "release: <descrição>" --body "PRs incluídas: ..."
```

Esse PR também precisa **1 approve + CI verde**. Geralmente é uma PR maior — bom momento pra alguém revisar holisticamente.

### Passo 11 — Deploy automático

Push em main (após o merge) triggera Dokploy: pull do código, build da imagem Docker (Next standalone), troca container. Tempo típico: ~3-5min.

Não tem migration de banco neste repo. O front consome `api.lyxai.com.br` (auth — monolito) e Supabase (dados analíticos via PostgREST).

---

## Workflow de testes

```bash
npm run test                     # Roda toda a suite (single run)
npm run test:watch               # Watch mode
npm run test:coverage            # Com coverage report (lcov)
```

**Onde escrever testes:**
- Co-located: `src/lib/foo.spec.ts` ao lado de `src/lib/foo.ts`.
- Fixtures: `src/**/__fixtures__/<nome>.fixtures.ts`.

**Pattern básico:**

```ts
import { describe, it, expect } from 'vitest';
import { meuHelper } from './my-helper';

describe('meuHelper', () => {
  it('faz X quando Y', () => {
    const result = meuHelper(input);
    expect(result).toBe(expected);
  });
});
```

**Regra de ouro pra código novo:** todo helper/lib com lógica condicional precisa de `*.spec.ts` no mesmo PR.

**Mock policy:** internos sempre real. Mocks só pra fetch externo (Better Auth API, Supabase client, dados externos).

---

## Cheat sheet

### Comandos de dev

| Quando | Comando | O que faz |
|---|---|---|
| Primeira vez no projeto | `cp .env.example .env.local && npm install` | Setup |
| Começar a trabalhar | `npm run dev` | Next dev em :3002 |
| Build local | `npm run build` | Next production build |
| Antes de commit | `npm run audit:all` | Lint + typecheck + test + coverage + deps |
| Test em watch | `npm run test:watch` | Vitest watch mode |
| Editou AGENTS.md | `npm run sync-agents` | Propaga pros 3 alvos |

### Convenções de PR

- **Título:** `<tipo>(<escopo>): <resumo curto>` — ex.: `feat(dashboard): adiciona KPI de receita`
- **Tipos:** `feat`, `fix`, `refactor`, `docs`, `chore`, `test`, `perf`, `ci`
- **Escopos comuns:** `auth`, `dashboard`, `ui`, `lib`, `queries`, `ci`, `infra`
- **PR pequeno > PR grande.** Se passou de 400 linhas modificadas, pense se dá pra dividir.

---

## FAQ

**P: Por que precisa do monolito rodando em local?**
R: Auth (Better Auth) vive no monolito. O BI delega login/sessão/membership pra ele. Sem monolito local você pode apontar `NEXT_PUBLIC_AUTH_URL` pra `https://api.lyxai.com.br` e usar usuário dev real.

**P: Tem migration nesse repo?**
R: Não. Banco analítico (Supabase self-host) é gerenciado fora deste repo. Auth + users moram no monolito.

**P: Como rodar com dados reais do Supabase?**
R: Preencher `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` no `.env.local`. Hooks em `src/lib/queries.ts` consomem via `@supabase/supabase-js`.

**P: Por que o coverage gate é global (não per-module)?**
R: Template ainda não tem fronteira clara de módulos. Forks que crescerem podem migrar pra per-module.

---

## Referências

- [`AGENTS.md`](../AGENTS.md) — regras pra agentes/AI
- [`docs/AUDITORIA_AUTOMATIZADA.md`](AUDITORIA_AUTOMATIZADA.md) — detalhe da CI
- [`README.md`](../README.md) — quickstart + como usar como template
