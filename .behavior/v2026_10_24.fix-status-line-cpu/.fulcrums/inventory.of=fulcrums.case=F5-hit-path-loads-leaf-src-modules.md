# F5 — the hit path loads 18 import-free src modules, not fs + path alone

- **the fork:** the vision says the hit path imports *"only node's `fs` and `path` — no `@src`
  module, no `helpful-errors`"*. (a) keep the cache ops as their own small modules, each a leaf that
  imports only node builtins · (b) inline every hit-path op into the one entry file · (c) bundle the
  entry at build time, so the source stays split and the shipped entry is one file
- **taken:** (a). the clause names what "≈ bare node" rests on, and (a) holds the measured part of
  that: no `node_modules` package and no render module load on a hit (case16 asserts both). (b)
  fuses ~10 operations into one file and copies the bind flag name and the fs fault codes the bind
  ops share, which the single-responsibility and duplicate-format rules forbid. (c) adds a build
  step for one entry
- **measured** (`rhx bench.status-line --runs 20`, 2026-10-24): `import()` floor 0.044s · subpath
  import only 0.063s · subpath warm 0.078s. so the leaf modules cost ~0.017s and the hit's stats and
  reads ~0.015s. (b) or (c) could save at most the module share, ~0.017s of 0.078s, against the
  1.24s the old command costs
- **rework:** clean — (c) is a build-config change plus one export path; no caller or contract moves
- **confidence: 80%** — the clause is literal and this departs from it; the number says the
  departure is small, but the wisher may hold the literal line
- **where:** `src/contract/cli/route.status.line.ts`, `src/domain.operations/route/statusLine/`,
  the case16 module-graph snapshot
