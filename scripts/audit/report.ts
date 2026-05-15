/**
 * Audit Report — agrega ESLint JSON + dep-cruiser JSON + coverage gate
 * num markdown consolidado pra postar como comentário no PR.
 *
 * Uso:
 *   npm run audit:report > audit/report.md
 *
 * Lê:
 *   audit/eslint.json       (ESLint --format=json --output-file=...)
 *   audit/depcruise.json    (depcruise . --output-type=json --output-to=...)
 *   coverage/gate.json      (coverage-gate.ts)
 */
import { readFileSync, existsSync } from "node:fs";

type EslintMsg = {
  ruleId: string | null;
  severity: number;
  message: string;
  line: number;
  column: number;
};
type EslintFile = {
  filePath: string;
  messages: EslintMsg[];
  errorCount: number;
  warningCount: number;
};
type EslintOutput = { violations: EslintFile[] };

type DepcruiseViolation = {
  rule: { name: string; severity: string };
  from: string;
  to: string;
  cycle?: string[];
};
type DepcruiseOutput = { violations: DepcruiseViolation[] };

type CoverageTotals = {
  linesFound: number;
  linesHit: number;
  branchesFound: number;
  branchesHit: number;
  linesPct: number;
  branchesPct: number;
};

type CoverageViolation = {
  scope: "global";
  metric: "lines" | "branches";
  actual: number;
  expected: number;
};

type CoverageInput = {
  totals: CoverageTotals;
  thresholds: { linesMin: number; branchesMin: number };
  gate: { passed: boolean; violations: CoverageViolation[] };
  mode: "warn" | "error";
};

export type AuditInputs = {
  commitSha: string;
  eslint: EslintOutput;
  depcruise: DepcruiseOutput;
  coverage: CoverageInput;
};

const MARKER = "<!-- audit-report -->";

const COGNITIVE_LIMIT = 15;
const COMPLEXITY_LIMIT = 12;
const MAX_LINES_LIMIT = 500;
const MAX_LINES_FN_LIMIT = 80;

function statusIcon(passed: boolean, warn = false): string {
  if (passed) return "OK";
  return warn ? "WARN" : "FAIL";
}

function summarizeEslint(eslint: EslintOutput) {
  const byRule = new Map<
    string,
    { count: number; samples: { file: string; line: number; msg: string }[] }
  >();
  for (const file of eslint.violations) {
    for (const msg of file.messages) {
      const rule = msg.ruleId ?? "(no-rule)";
      const entry = byRule.get(rule) ?? { count: 0, samples: [] };
      entry.count += 1;
      if (entry.samples.length < 5) {
        entry.samples.push({
          file: file.filePath,
          line: msg.line,
          msg: msg.message,
        });
      }
      byRule.set(rule, entry);
    }
  }
  return byRule;
}

export function renderReport(input: AuditInputs): string {
  const lines: string[] = [];
  lines.push(MARKER);
  lines.push("");
  lines.push(`## Audit Report — commit \`${input.commitSha}\``);
  lines.push("");

  const cov = input.coverage;
  const eslintByRule = summarizeEslint(input.eslint);
  const cognitiveOk = !eslintByRule.has("sonarjs/cognitive-complexity");
  const complexityOk = !eslintByRule.has("complexity");
  const maxLinesOk = !eslintByRule.has("max-lines");
  const maxLinesFnOk = !eslintByRule.has("max-lines-per-function");
  const cyclesOk = !input.depcruise.violations.some(
    (v) => v.rule.name === "no-circular",
  );

  lines.push("### Resumo");
  lines.push("");
  lines.push("| Métrica | Status | Detalhe |");
  lines.push("|---|---|---|");
  // ESLint complexity/max-lines rules estão configurados como `warn` na Fase 1.
  // statusIcon recebe warn=true pra refletir severidade real no resumo.
  lines.push(
    `| Cognitive complexity | ${statusIcon(cognitiveOk, true)} | limite ${COGNITIVE_LIMIT} |`,
  );
  lines.push(
    `| Cyclomatic complexity | ${statusIcon(complexityOk, true)} | limite ${COMPLEXITY_LIMIT} |`,
  );
  lines.push(
    `| Linhas por arquivo | ${statusIcon(maxLinesOk, true)} | limite ${MAX_LINES_LIMIT} |`,
  );
  lines.push(
    `| Linhas por função | ${statusIcon(maxLinesFnOk, true)} | limite ${MAX_LINES_FN_LIMIT} |`,
  );
  const linesViolation = cov.gate.violations.find((v) => v.metric === "lines");
  const linesOk = linesViolation === undefined;
  const linesStatus = linesOk
    ? "OK"
    : cov.mode === "warn"
      ? "WARN"
      : "FAIL";
  lines.push(
    `| Cobertura (lines) | ${linesStatus} | global ${cov.totals.linesPct}% — threshold >= ${cov.thresholds.linesMin}% |`,
  );
  const branchesAbsent = cov.totals.branchesFound === 0;
  const branchesViolation = cov.gate.violations.find(
    (v) => v.metric === "branches",
  );
  const branchesOk = branchesAbsent || branchesViolation === undefined;
  const branchesStatus = branchesOk
    ? "OK"
    : cov.mode === "warn"
      ? "WARN"
      : "FAIL";
  const branchesDetail = branchesAbsent
    ? "sem dados (lcov não emitiu)"
    : `global ${cov.totals.branchesPct}% — threshold >= ${cov.thresholds.branchesMin}%`;
  lines.push(
    `| Cobertura (branches) | ${branchesStatus} | ${branchesDetail} |`,
  );
  lines.push(
    `| Ciclos de import | ${statusIcon(cyclesOk)} | zero tolerância |`,
  );

  if (!cov.gate.passed) {
    lines.push("");
    lines.push("### Cobertura abaixo do threshold");
    for (const v of cov.gate.violations) {
      lines.push(
        `- **${v.metric}**: ${v.actual}% (esperado >= ${v.expected}%)`,
      );
    }
  }

  if (eslintByRule.size > 0) {
    lines.push("");
    lines.push("### Hotspots ESLint");
    for (const [rule, entry] of eslintByRule) {
      lines.push("");
      lines.push(`#### \`${rule}\` (${entry.count} ocorrências)`);
      for (const s of entry.samples) {
        const relFile = s.file.replace(`${process.cwd()}/`, "");
        lines.push(`- \`${relFile}:${s.line}\` — ${s.msg}`);
      }
    }
  }

  if (input.depcruise.violations.length > 0) {
    lines.push("");
    lines.push("### Hotspots dependency-cruiser");
    for (const v of input.depcruise.violations.slice(0, 10)) {
      const cycle = v.cycle ? ` (ciclo: ${v.cycle.join(" -> ")})` : "";
      lines.push(
        `- **${v.rule.name}** ${v.rule.severity}: \`${v.from}\` -> \`${v.to}\`${cycle}`,
      );
    }
    if (input.depcruise.violations.length > 10) {
      lines.push(
        `- _... e mais ${input.depcruise.violations.length - 10} violações_`,
      );
    }
  }

  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push(
    "_Use `npm run audit:report` localmente pra reproduzir. Doc: [`docs/AUDITORIA_AUTOMATIZADA.md`](docs/AUDITORIA_AUTOMATIZADA.md)._",
  );

  return lines.join("\n");
}

function loadJsonOrDefault<T>(path: string, fallback: T): T {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    return fallback;
  }
}

function main() {
  const commitSha = (process.env.GITHUB_SHA ?? "local").slice(0, 7);

  const eslintRaw = loadJsonOrDefault<EslintFile[]>("audit/eslint.json", []);
  const eslint: EslintOutput = {
    violations: eslintRaw.filter((f) => f.messages.length > 0),
  };

  const depRaw = loadJsonOrDefault<{
    summary?: { violations?: DepcruiseViolation[] };
  }>("audit/depcruise.json", {});
  const depcruise: DepcruiseOutput = {
    violations: depRaw.summary?.violations ?? [],
  };

  const coverage = loadJsonOrDefault<CoverageInput>("coverage/gate.json", {
    totals: {
      linesFound: 0,
      linesHit: 0,
      branchesFound: 0,
      branchesHit: 0,
      linesPct: 0,
      branchesPct: 0,
    },
    thresholds: { linesMin: 50, branchesMin: 40 },
    gate: { passed: true, violations: [] },
    mode: "warn",
  });

  process.stdout.write(
    renderReport({ commitSha, eslint, depcruise, coverage }),
  );
}

const isMain =
  typeof process !== "undefined" &&
  Array.isArray(process.argv) &&
  process.argv[1] !== undefined &&
  import.meta.url === `file://${process.argv[1]}`;
if (isMain) main();
