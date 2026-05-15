/**
 * Coverage gate: parsea lcov.info, agrega globalmente, compara contra
 * thresholds, escreve coverage/gate.json e (em Fase 2) sai com exit 1
 * se algum threshold for violado.
 *
 * Uso:
 *   npm run coverage:gate
 *
 * Env:
 *   AUDIT_LINES_MIN     mínimo % de lines global (default 50)
 *   AUDIT_BRANCHES_MIN  mínimo % de branches global (default 40)
 *   AUDIT_GATE_MODE     "warn" (default, sempre exit 0) | "error" (exit 1 se violar)
 *
 * Arquivos excluídos do cálculo (sem lógica testável):
 *   *.spec.ts(x), *.test.ts(x), *.d.ts, **\/__fixtures__/**,
 *   **\/page.tsx, **\/layout.tsx, **\/loading.tsx, **\/error.tsx, **\/not-found.tsx,
 *   src/types/**, scripts/**
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";

const EnvSchema = z.object({
  AUDIT_LINES_MIN: z.coerce.number().int().min(0).max(100).default(50),
  AUDIT_BRANCHES_MIN: z.coerce.number().int().min(0).max(100).default(40),
  AUDIT_GATE_MODE: z.enum(["warn", "error"]).default("warn"),
});

export type LcovTotals = {
  linesFound: number;
  linesHit: number;
  branchesFound: number;
  branchesHit: number;
  linesPct: number;
  branchesPct: number;
};

export type LcovParsed = {
  global: LcovTotals;
  byFile: Record<string, LcovTotals>;
};

function pctOrZero(hit: number, found: number): number {
  return found === 0 ? 0 : Math.round((hit / found) * 100);
}

function emptyTotals(): LcovTotals {
  return {
    linesFound: 0,
    linesHit: 0,
    branchesFound: 0,
    branchesHit: 0,
    linesPct: 0,
    branchesPct: 0,
  };
}

function finalizeTotals(t: LcovTotals): LcovTotals {
  return {
    ...t,
    linesPct: pctOrZero(t.linesHit, t.linesFound),
    branchesPct: pctOrZero(t.branchesHit, t.branchesFound),
  };
}

export function parseLcov(content: string): LcovParsed {
  const byFile: Record<string, LcovTotals> = {};
  const global = emptyTotals();
  let currentSF: string | null = null;
  let currentTotals: LcovTotals = emptyTotals();

  for (const line of content.split("\n")) {
    if (line.startsWith("SF:")) {
      currentSF = line.slice(3).trim();
      currentTotals = emptyTotals();
    } else if (line.startsWith("LF:")) {
      const n = Number(line.slice(3));
      currentTotals.linesFound += n;
      global.linesFound += n;
    } else if (line.startsWith("LH:")) {
      const n = Number(line.slice(3));
      currentTotals.linesHit += n;
      global.linesHit += n;
    } else if (line.startsWith("BRF:")) {
      const n = Number(line.slice(4));
      currentTotals.branchesFound += n;
      global.branchesFound += n;
    } else if (line.startsWith("BRH:")) {
      const n = Number(line.slice(4));
      currentTotals.branchesHit += n;
      global.branchesHit += n;
    } else if (line.startsWith("end_of_record")) {
      if (currentSF !== null) byFile[currentSF] = finalizeTotals(currentTotals);
      currentSF = null;
      currentTotals = emptyTotals();
    }
  }

  return { global: finalizeTotals(global), byFile };
}

const EXCLUDE_PATTERNS: RegExp[] = [
  /\.spec\.(ts|tsx)$/,
  /\.test\.(ts|tsx)$/,
  /\.d\.ts$/,
  /__fixtures__\//,
  /(?:^|\/)src\/app\/.+\/(page|layout|loading|error|not-found|template|default|route|icon|opengraph-image|sitemap|robots|manifest)\.(ts|tsx)$/,
  /(?:^|\/)src\/types\//,
  /(?:^|\/)scripts\//,
];

export function shouldExclude(filePath: string): boolean {
  return EXCLUDE_PATTERNS.some((re) => re.test(filePath));
}

export type Thresholds = { linesMin: number; branchesMin: number };
export type Violation = {
  scope: "global";
  metric: "lines" | "branches";
  actual: number;
  expected: number;
};
export type GateResult = { passed: boolean; violations: Violation[] };

export function evaluateGate(
  global: LcovTotals,
  t: Thresholds,
): GateResult {
  const violations: Violation[] = [];
  if (global.linesFound > 0 && global.linesPct < t.linesMin) {
    violations.push({
      scope: "global",
      metric: "lines",
      actual: global.linesPct,
      expected: t.linesMin,
    });
  }
  if (global.branchesFound > 0 && global.branchesPct < t.branchesMin) {
    violations.push({
      scope: "global",
      metric: "branches",
      actual: global.branchesPct,
      expected: t.branchesMin,
    });
  }
  return { passed: violations.length === 0, violations };
}

export function decideExitCode(gate: GateResult, mode: string): 0 | 1 {
  return !gate.passed && mode === "error" ? 1 : 0;
}

function filterIncluded(
  byFile: Record<string, LcovTotals>,
): Record<string, LcovTotals> {
  const filtered: Record<string, LcovTotals> = {};
  for (const [file, totals] of Object.entries(byFile)) {
    if (!shouldExclude(file)) filtered[file] = totals;
  }
  return filtered;
}

export function aggregateFromFiles(
  byFile: Record<string, LcovTotals>,
): LcovTotals {
  const included = filterIncluded(byFile);
  const agg = emptyTotals();
  for (const totals of Object.values(included)) {
    agg.linesFound += totals.linesFound;
    agg.linesHit += totals.linesHit;
    agg.branchesFound += totals.branchesFound;
    agg.branchesHit += totals.branchesHit;
  }
  return finalizeTotals(agg);
}

function main() {
  const lcovPath = "coverage/lcov.info";
  const outPath = "coverage/gate.json";
  if (!existsSync(lcovPath)) {
    console.error(
      `[coverage-gate] ${lcovPath} não existe. Rode 'npm run test:coverage' antes.`,
    );
    process.exit(1);
  }
  const env = EnvSchema.parse(process.env);
  const parsed = parseLcov(readFileSync(lcovPath, "utf8"));
  const aggregated = aggregateFromFiles(parsed.byFile);
  const thresholds: Thresholds = {
    linesMin: env.AUDIT_LINES_MIN,
    branchesMin: env.AUDIT_BRANCHES_MIN,
  };
  const gate = evaluateGate(aggregated, thresholds);
  const mode = env.AUDIT_GATE_MODE;

  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(
    outPath,
    JSON.stringify(
      { totals: aggregated, thresholds, gate, mode },
      null,
      2,
    ),
  );

  console.log(
    `[coverage-gate] global lines=${aggregated.linesPct}% branches=${aggregated.branchesPct}% — thresholds: lines>=${thresholds.linesMin}% branches>=${thresholds.branchesMin}% — mode=${mode}`,
  );
  if (gate.violations.length === 0) {
    console.log("  OK — thresholds globais atingidos");
  } else {
    for (const v of gate.violations) {
      console.log(
        `  FAIL — ${v.metric}: ${v.actual}% (esperado >= ${v.expected}%)`,
      );
    }
  }

  const code = decideExitCode(gate, mode);
  if (code !== 0) process.exit(code);
}

const isMain =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;
if (isMain) main();
