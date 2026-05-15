/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-circular",
      severity: "error",
      comment:
        "Ciclo de import detectado — bug latente. Refatore extraindo a peça compartilhada.",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      severity: "warn",
      comment:
        "Arquivo sem importadores — provavelmente código morto ou esquecido.",
      from: {
        orphan: true,
        pathNot: [
          "\\.(spec|test)\\.(ts|tsx)$",
          "\\.d\\.ts$",
          "^next\\.config\\.",
          "^postcss\\.config\\.",
          "^eslint\\.config\\.",
          "^vitest\\.config\\.",
          "^\\.dependency-cruiser\\.cjs$",
          "^src/middleware\\.ts$",
          "^src/app/(page|layout|loading|error|not-found|template|default|route|icon|opengraph-image|sitemap|robots|manifest)\\.(ts|tsx)$",
          "^src/app/.+/(page|layout|loading|error|not-found|template|default|route|icon|opengraph-image|sitemap|robots|manifest)\\.(ts|tsx)$",
          "^src/app/.*/globals\\.css$",
          "^scripts/",
          "/__fixtures__/",
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    exclude: {
      path: ["node_modules", "\\.next/", "coverage/"],
    },
  },
};
