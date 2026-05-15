# Auditoria automatizada de qualidade

Documento humano explicando as checagens automáticas que rodam em toda PR contra `develop`/`main`. Pra resumo curto, ver `AGENTS.md` seção "Auditoria automatizada (CI)".

## Pilares

### 1. Complexidade ciclomática (`complexity`)

Conta caminhos lógicos independentes numa função: cada `if`, `else if`, `case`, `&&`, `||`, `?:`, `catch`, loop adiciona +1. Função com CCN alta = difícil de testar (precisa cobrir N caminhos), difícil de revisar.

- **Threshold:** ≤ 12
- **Severidade Fase 1:** `warn` (não bloqueia merge)
- **Ferramenta:** regra built-in do ESLint
- **Fix típico:** extrair sub-função pra ramo do `if`; substituir nested if por early return; usar table lookup ao invés de switch gigante

### 2. Complexidade cognitiva (`sonarjs/cognitive-complexity`)

Variante moderna da CCN proposta pela SonarSource. Penaliza nesting (cada nível de aninhamento aumenta o score), ignora switch flat largo. Mais fiel à "dificuldade real de ler".

- **Threshold:** ≤ 15
- **Severidade Fase 1:** `warn`
- **Ferramenta:** `eslint-plugin-sonarjs`
- **Fix:** mesmas técnicas da CCN, com foco extra em achatar nesting

### 3. Tamanho de arquivo (`max-lines`)

- **Threshold:** ≤ 500 linhas (skipBlankLines, skipComments)
- **Severidade Fase 1:** `warn`
- **Excluídos:** `**/*.spec.{ts,tsx}`, `**/__fixtures__/**`
- **Fix:** quebrar em domínio (separar helpers, hooks, sub-componentes)

### 4. Tamanho de função (`max-lines-per-function`)

- **Threshold:** ≤ 80 linhas
- **Severidade Fase 1:** `warn`
- **Fix:** extrair helpers, hooks customizados, sub-componentes

### 5. Cobertura global (`coverage-gate.ts`)

Lê `coverage/lcov.info` (gerado por `npm run test:coverage` via Vitest + V8), agrega **globalmente**, compara com thresholds.

> **Por que global e não per-module:** este template ainda não tem fronteira clara de módulos. Forks que crescerem o bastante pra ter bounded contexts podem migrar pra per-module conforme o monolito faz.

**Thresholds:**
- **Lines:** ≥ 50% (default — `AUDIT_LINES_MIN`)
- **Branches:** ≥ 40% (default — `AUDIT_BRANCHES_MIN`)
- **Mode:** `AUDIT_GATE_MODE` (`warn` default — exit 0 mesmo violando; `error` — exit 1 se violar)

**Arquivos excluídos do cálculo** (sem lógica testável):
- Specs/tests: `*.spec.{ts,tsx}`, `*.test.{ts,tsx}`
- Declarações: `*.d.ts`, `src/types/**`
- Fixtures: `**/__fixtures__/**`
- Boilerplate Next App Router: `**/page.tsx`, `**/layout.tsx`, `**/loading.tsx`, `**/error.tsx`, `**/not-found.tsx`, `**/template.tsx`, `**/default.tsx`, `**/route.ts`, file-based metadata (`icon`, `opengraph-image`, `sitemap`, `robots`, `manifest`)
- Scripts: `scripts/**`

**Fix típico pra abaixo do threshold:**
- TDD em código novo (regra do AGENTS.md)
- Identificar helpers em `src/lib/**` sem `*.spec.ts` correspondente
- Mover lógica que está em components pra `lib/` e testar lá

**Nota sobre branches:** dependendo do reporter V8, branches podem não vir bem populados em projetos JSX/TSX. Quando `branchesFound === 0` global, o gate **ignora** branches automaticamente.

### 6. Ciclos de import (`dependency-cruiser` `no-circular`)

Detecta A→B→A. Bug latente: arquivos não podem ser carregados na ordem natural, ESM/bundler resolve com `undefined` em runtime.

- **Threshold:** zero ciclos
- **Severidade:** `error` desde dia 1 (sem cinza)
- **Fix:** extrair a peça compartilhada pra um terceiro arquivo

### 7. Orphans (`dependency-cruiser` `no-orphans`)

Arquivo sem importadores — provavelmente código morto.

- **Severidade:** `warn`
- **Exceções:** arquivos `*.spec.ts`, declarações `*.d.ts`, configs (`next.config`, `postcss.config`, `eslint.config`, `vitest.config`), `middleware.ts`, file-based routing do App Router (`page`, `layout`, `loading`, `error`, `not-found`, `template`, `default`, `route`, ícones/metadata), scripts, fixtures.
- **Fix:** importar de onde fizer sentido, ou deletar.

## Política pra exceções

Casos raros podem precisar de exceção. Use `// eslint-disable-next-line <regra>` **com TODO datado obrigatório**:

```ts
// TODO(2026-06-01): mover essa função pra shared/utils e remover este disable
// eslint-disable-next-line max-lines-per-function
function bigFunction() { ... }
```

PRs com `eslint-disable` sem TODO datado podem ser rejeitadas em review. A data ajuda a auditar débito técnico depois.

## Reproduzir localmente

```bash
# Lint completo (inclui novas regras)
npm run lint

# Só checagem de deps
npm run deps:check

# Cobertura + gate
npm run test:coverage
npm run coverage:gate

# Relatório consolidado (igual ao que o bot posta)
npm run audit:report

# Tudo de uma vez
npm run audit:all
```

O bot do PR atualiza o comentário marcado com `<!-- audit-report -->` a cada push (não cria duplicados).

## Fases

| Fase | Início | ESLint | coverage-gate | deps:check |
|---|---|---|---|---|
| Fase 1 | rollout | severidade `warn` | `AUDIT_GATE_MODE=warn` (continue-on-error) | `error` (bloqueante — só ciclos) |
| Fase 2 | +2 semanas estáveis | severidade `error` | `AUDIT_GATE_MODE=error` (bloqueante) | `error` |
| Fase 3 (futuro) | — | + per-module coverage quando houver fronteira clara | + thresholds mais altos | — |

## Out of scope

- **Mutation testing (Stryker):** descartado por enquanto. Reabrir quando coverage tradicional plateau (≥ 70%).
- **SaaS de qualidade (SonarCloud, Code Climate):** descartado por custo recorrente. `lcov.info` que geramos é compatível com Codecov free se quiserem ligar depois.

## Referências

- Cognitive Complexity (SonarSource paper): https://www.sonarsource.com/resources/cognitive-complexity/
- ESLint complexity rule: https://eslint.org/docs/latest/rules/complexity
- dependency-cruiser: https://github.com/sverweij/dependency-cruiser
