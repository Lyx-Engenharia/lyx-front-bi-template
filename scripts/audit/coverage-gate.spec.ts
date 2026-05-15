import { describe, it, expect } from "vitest";
import {
  parseLcov,
  evaluateGate,
  decideExitCode,
  shouldExclude,
  aggregateFromFiles,
  type LcovTotals,
  type GateResult,
} from "./coverage-gate";

// ── Helpers ──────────────────────────────────────────────────────────────────

const totals = (
  linesPct: number,
  branchesPct: number,
  branchesFound = 100,
): LcovTotals => ({
  linesFound: 100,
  linesHit: linesPct,
  branchesFound,
  branchesHit: Math.round((branchesPct * branchesFound) / 100),
  linesPct,
  branchesPct,
});

const lcovTwoFiles = `
TN:
SF:src/lib/auth/role-permissions.ts
LF:100
LH:80
BRF:50
BRH:35
end_of_record
SF:src/lib/dashboards.ts
LF:100
LH:60
BRF:50
BRH:25
end_of_record
`.trim();

// ── parseLcov ────────────────────────────────────────────────────────────────

describe("parseLcov", () => {
  it("soma LF/LH/BRF/BRH no global", () => {
    const r = parseLcov(lcovTwoFiles);
    expect(r.global.linesFound).toBe(200);
    expect(r.global.linesHit).toBe(140);
    expect(r.global.branchesFound).toBe(100);
    expect(r.global.branchesHit).toBe(60);
  });

  it("calcula percentuais globais arredondados", () => {
    const r = parseLcov(lcovTwoFiles);
    expect(r.global.linesPct).toBe(70);
    expect(r.global.branchesPct).toBe(60);
  });

  it("retorna byFile com totais por arquivo", () => {
    const r = parseLcov(lcovTwoFiles);
    expect(r.byFile["src/lib/auth/role-permissions.ts"]).toEqual({
      linesFound: 100,
      linesHit: 80,
      branchesFound: 50,
      branchesHit: 35,
      linesPct: 80,
      branchesPct: 70,
    });
    expect(r.byFile["src/lib/dashboards.ts"]).toEqual({
      linesFound: 100,
      linesHit: 60,
      branchesFound: 50,
      branchesHit: 25,
      linesPct: 60,
      branchesPct: 50,
    });
  });

  it("retorna 0% quando LF=0 (evita NaN)", () => {
    const r = parseLcov(
      "TN:\nSF:src/empty.ts\nLF:0\nLH:0\nBRF:0\nBRH:0\nend_of_record",
    );
    expect(r.global.linesPct).toBe(0);
    expect(r.global.branchesPct).toBe(0);
    expect(r.byFile["src/empty.ts"]?.linesPct).toBe(0);
  });
});

// ── shouldExclude ────────────────────────────────────────────────────────────

describe("shouldExclude", () => {
  it.each([
    ["src/lib/foo.spec.ts", true],
    ["src/lib/foo.test.ts", true],
    ["src/components/foo.spec.tsx", true],
    ["src/components/foo.test.tsx", true],
    ["src/types/index.d.ts", true],
    ["src/lib/__fixtures__/x.ts", true],
    ["scripts/seed.ts", true],
    ["/abs/scripts/admin/foo.ts", true],
    ["src/app/(dashboards)/page.tsx", true],
    ["src/app/login/layout.tsx", true],
    ["src/app/(dashboards)/loading.tsx", true],
    ["src/app/forbidden/error.tsx", true],
    ["src/app/not-found.tsx", false], // top-level not-found has no parent — accept
    ["src/types/dashboard.ts", true],
    ["src/lib/auth/role-permissions.ts", false],
    ["src/lib/utils.ts", false],
    ["src/middleware.ts", false],
    ["src/components/auth/auth-provider.tsx", false],
  ])("shouldExclude(%s) === %s", (path, expected) => {
    expect(shouldExclude(path)).toBe(expected);
  });
});

// ── aggregateFromFiles ───────────────────────────────────────────────────────

describe("aggregateFromFiles", () => {
  it("agrega arquivos incluídos somando contagens", () => {
    const byFile = {
      "src/lib/auth/role-permissions.ts": totals(60, 50),
      "src/lib/utils.ts": totals(80, 70),
    };
    const agg = aggregateFromFiles(byFile);
    expect(agg.linesFound).toBe(200);
    expect(agg.linesHit).toBe(140);
    expect(agg.linesPct).toBe(70);
    expect(agg.branchesPct).toBe(60);
  });

  it("ignora arquivos excluídos", () => {
    const byFile = {
      "src/lib/utils.ts": totals(80, 60),
      "src/lib/utils.spec.ts": totals(0, 0),
      "src/types/foo.ts": totals(0, 0),
      "src/app/(dashboards)/page.tsx": totals(0, 0),
      "scripts/seed.ts": totals(0, 0),
    };
    const agg = aggregateFromFiles(byFile);
    expect(agg.linesPct).toBe(80);
    expect(agg.linesFound).toBe(100);
  });

  it("retorna 0% quando nenhum arquivo incluído", () => {
    const byFile = {
      "src/lib/utils.spec.ts": totals(0, 0),
    };
    const agg = aggregateFromFiles(byFile);
    expect(agg.linesPct).toBe(0);
    expect(agg.linesFound).toBe(0);
  });
});

// ── evaluateGate ─────────────────────────────────────────────────────────────

describe("evaluateGate", () => {
  const t = { linesMin: 50, branchesMin: 40 };

  it("passa quando global está acima do threshold", () => {
    const gate = evaluateGate(totals(60, 50), t);
    expect(gate.passed).toBe(true);
    expect(gate.violations).toHaveLength(0);
  });

  it("falha quando lines está abaixo do threshold", () => {
    const gate = evaluateGate(totals(40, 50), t);
    expect(gate.passed).toBe(false);
    expect(gate.violations).toContainEqual({
      scope: "global",
      metric: "lines",
      actual: 40,
      expected: 50,
    });
  });

  it("falha em branches só quando branchesFound > 0", () => {
    const noBranches: LcovTotals = {
      linesFound: 100,
      linesHit: 60,
      branchesFound: 0,
      branchesHit: 0,
      linesPct: 60,
      branchesPct: 0,
    };
    const gate = evaluateGate(noBranches, t);
    expect(gate.passed).toBe(true);
    expect(gate.violations).toHaveLength(0);
  });

  it("falha em branches quando branchesPct < threshold e branchesFound > 0", () => {
    const gate = evaluateGate(totals(80, 30), t);
    expect(gate.passed).toBe(false);
    expect(gate.violations).toContainEqual({
      scope: "global",
      metric: "branches",
      actual: 30,
      expected: 40,
    });
  });

  it("passa quando linesFound == 0 (não computa)", () => {
    const empty: LcovTotals = {
      linesFound: 0,
      linesHit: 0,
      branchesFound: 0,
      branchesHit: 0,
      linesPct: 0,
      branchesPct: 0,
    };
    const gate = evaluateGate(empty, t);
    expect(gate.passed).toBe(true);
  });
});

// ── decideExitCode ───────────────────────────────────────────────────────────

describe("decideExitCode", () => {
  it("retorna 0 em modo warn mesmo com violações", () => {
    const gate: GateResult = {
      passed: false,
      violations: [
        { scope: "global", metric: "lines", actual: 40, expected: 50 },
      ],
    };
    expect(decideExitCode(gate, "warn")).toBe(0);
  });

  it("retorna 1 em modo error com violações", () => {
    const gate: GateResult = {
      passed: false,
      violations: [
        { scope: "global", metric: "lines", actual: 40, expected: 50 },
      ],
    };
    expect(decideExitCode(gate, "error")).toBe(1);
  });

  it("retorna 0 em modo error sem violações", () => {
    const gate: GateResult = { passed: true, violations: [] };
    expect(decideExitCode(gate, "error")).toBe(0);
  });
});
