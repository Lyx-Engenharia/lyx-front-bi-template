import { describe, it, expect } from "vitest";
import { renderReport, type AuditInputs } from "./report";

const minInputs: AuditInputs = {
  commitSha: "abc1234",
  eslint: { violations: [] },
  depcruise: { violations: [] },
  coverage: {
    totals: {
      linesFound: 1000,
      linesHit: 800,
      branchesFound: 200,
      branchesHit: 100,
      linesPct: 80,
      branchesPct: 50,
    },
    thresholds: { linesMin: 50, branchesMin: 40 },
    gate: { passed: true, violations: [] },
    mode: "warn",
  },
};

describe("renderReport", () => {
  it("inclui marker HTML do bot", () => {
    const md = renderReport(minInputs);
    expect(md).toContain("<!-- audit-report -->");
  });

  it("inclui commit SHA curto", () => {
    const md = renderReport(minInputs);
    expect(md).toContain("abc1234");
  });

  it("quando tudo OK, marca resumo com OK", () => {
    const md = renderReport(minInputs);
    expect(md).toContain("OK");
    expect(md).not.toContain("FAIL");
  });

  it("renderiza tabela Resumo com cobertura global", () => {
    const md = renderReport(minInputs);
    expect(md).toContain("### Resumo");
    expect(md).toContain("Cobertura (lines)");
    expect(md).toContain("Cobertura (branches)");
    expect(md).toContain("global 80%");
  });

  it("mostra cobertura abaixo do threshold com FAIL + lista de violations (modo error)", () => {
    const md = renderReport({
      ...minInputs,
      coverage: {
        ...minInputs.coverage,
        totals: {
          linesFound: 1000,
          linesHit: 300,
          branchesFound: 200,
          branchesHit: 50,
          linesPct: 30,
          branchesPct: 25,
        },
        gate: {
          passed: false,
          violations: [
            { scope: "global", metric: "lines", actual: 30, expected: 50 },
            { scope: "global", metric: "branches", actual: 25, expected: 40 },
          ],
        },
        mode: "error",
      },
    });
    expect(md).toContain("FAIL");
    expect(md).toContain("Cobertura abaixo do threshold");
    expect(md).toContain("30%");
    expect(md).toContain("25%");
  });

  it("em modo warn, violação de cobertura aparece como WARN no resumo", () => {
    const md = renderReport({
      ...minInputs,
      coverage: {
        ...minInputs.coverage,
        totals: {
          linesFound: 1000,
          linesHit: 300,
          branchesFound: 200,
          branchesHit: 50,
          linesPct: 30,
          branchesPct: 25,
        },
        gate: {
          passed: false,
          violations: [
            { scope: "global", metric: "lines", actual: 30, expected: 50 },
          ],
        },
        mode: "warn",
      },
    });
    expect(md).toContain("WARN");
  });

  it("mostra 'sem dados' no Resumo quando branchesFound === 0", () => {
    const md = renderReport({
      ...minInputs,
      coverage: {
        ...minInputs.coverage,
        totals: {
          ...minInputs.coverage.totals,
          branchesFound: 0,
          branchesHit: 0,
          branchesPct: 0,
        },
      },
    });
    expect(md).toContain("sem dados");
    const branchesRow = md
      .split("\n")
      .find((l) => l.includes("Cobertura (branches"));
    expect(branchesRow).toBeDefined();
    expect(branchesRow).not.toContain("FAIL");
  });

  it("mostra ciclos como hotspots quando dep-cruiser reporta", () => {
    const md = renderReport({
      ...minInputs,
      depcruise: {
        violations: [
          {
            rule: { name: "no-circular", severity: "error" },
            from: "src/a.ts",
            to: "src/b.ts",
            cycle: ["src/a.ts", "src/b.ts", "src/a.ts"],
          },
        ],
      },
    });
    expect(md).toContain("no-circular");
    expect(md).toContain("src/a.ts");
  });

  it("mostra hotspots de ESLint agrupados por regra", () => {
    const md = renderReport({
      ...minInputs,
      eslint: {
        violations: [
          {
            filePath: "/abs/src/lib/big.ts",
            errorCount: 0,
            warningCount: 1,
            messages: [
              {
                ruleId: "complexity",
                severity: 1,
                message: "function 'foo' has complexity 18",
                line: 42,
                column: 1,
              },
            ],
          },
        ],
      },
    });
    expect(md).toContain("Hotspots ESLint");
    expect(md).toContain("complexity");
    expect(md).toContain("foo");
  });

  it("Resumo mostra WARN (não FAIL) pra regras ESLint warn-severity violadas", () => {
    const md = renderReport({
      ...minInputs,
      eslint: {
        violations: [
          {
            filePath: "/abs/src/lib/big.ts",
            errorCount: 0,
            warningCount: 1,
            messages: [
              {
                ruleId: "complexity",
                severity: 1,
                message: "function 'foo' has complexity 18",
                line: 42,
                column: 1,
              },
            ],
          },
        ],
      },
    });
    // Resumo (tabela) deve marcar WARN, não FAIL — regra está em warn na Fase 1
    const resumoSection = md
      .split("### Hotspots")[0]!
      .split("### Resumo")[1]!;
    expect(resumoSection).toContain("WARN");
    expect(resumoSection).not.toContain("| FAIL ");
    const complexityRow = resumoSection
      .split("\n")
      .find((l) => l.includes("Cyclomatic complexity"));
    expect(complexityRow).toContain("WARN");
  });
});
