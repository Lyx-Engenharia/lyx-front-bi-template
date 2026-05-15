import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import sonarjs from "eslint-plugin-sonarjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Audit additions:
    "coverage/**",
    "node_modules/**",
  ]),
  // ── Auditoria automatizada — Fase 1 (warn) ────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.{ts,mjs}"],
    rules: {
      complexity: ["warn", 12],
      "max-lines": [
        "warn",
        { max: 500, skipBlankLines: true, skipComments: true },
      ],
      "max-lines-per-function": [
        "warn",
        {
          max: 80,
          skipBlankLines: true,
          skipComments: true,
          IIFEs: true,
        },
      ],
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: { sonarjs },
    rules: {
      "sonarjs/cognitive-complexity": ["warn", 15],
    },
  },
  // ── Downgrade de regras Next.js/React strict pra Fase 1 (warn) ───────────
  // Template tem código legado (e.g. setState dentro de useEffect) que dispara
  // estas regras como `error`. Manter como warn pra não quebrar CI de cara —
  // forks devem corrigir antes de promover pra Fase 2.
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: [
      "**/*.{spec,test}.{ts,tsx}",
      "**/__fixtures__/**",
      "**/__tests__/**",
    ],
    rules: {
      "max-lines": "off",
      "max-lines-per-function": "off",
      "sonarjs/cognitive-complexity": "off",
      complexity: "off",
    },
  },
]);

export default eslintConfig;
