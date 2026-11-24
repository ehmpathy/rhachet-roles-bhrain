# F5 — the practice owns the jest files exactly; how the repo keeps its behaviors

## .the fork
declapract-typescript-ehmpathy 0.50.0 checks `jest.{unit,integration,acceptance}.config.ts`, `jest.{integration,acceptance}.env.ts`, `jest.*.prepare.ts`, and `src/.test/use*.ts` as EQUALS (or a findsert over an exact base). only `jest.unit.env.ts` is CONTAINS. `declapract.use.yml` has no per-file override. main's configs owed:

| behavior | suite |
|---|---|
| `.log/`, `.behavior/`, `.scratch/` cut from the haste map | all |
| `.mjs` transformed; node_modules not exempt (esm under pnpm) | all |
| 30s test budget | unit |
| `.agent/repo=.this/` skill suites run | integration |
| brain tier pick, once per run | integration, acceptance |
| `jest.retryTimes(2)`, attempt-agnostic snapshots | integration, acceptance |
| 240s test budget | acceptance |
| a 7-worker pool (`ACCEPTANCE_WORKERS` override) | acceptance |

options:
- **A.** conform, list the losses, dispatch upstream
- **B.** keep main's files whole; every behavior holds, every config drifts wholesale from the practice
- **C.** one repo seam: each practice config passes through `asJestConfigOfRepo` (`jest.repo.ts`), which adds the repo env (`jest.repo.env.ts`) and the repo prepare (`jest.repo.prepare.ts`, which runs the practice prepare, then the brain pick). each practice config drifts by two lines; envs and prepares stay exact

## .taken: C
- every behavior main owed holds, and each is clamped in `src/.test/jestRepoSeam.test.ts`
- the practice files stay exact save one import and one export line per config, so a future practice diff reads at a glance
- a `declapract apply` that strips the seam turns the clamp red

## .rework: clean
the seam lives in three repo-owned files; its removal is two lines per config.

- the 7-worker acceptance pool: the practice's acceptance npm commands pass `--runInBand`, which outranks config, so package.json drops that flag (two more drift lines) and the seam sets the pool. clamped too

## .confidence: 85%, why not higher
`declapract plan` will report the package.json and config drift on every run until upstream ships a seam; a human who runs `declapract apply` strips it, and only the clamp catches that.

## .where
the jest files at the repo root; found in stone `3.1.repair.test.defects`.

## .verdict
ruled by the director: an upgrade keeps every behavior the old config owed; the mechanism is the driver's. taken: C. the upstream request (`293410814e2f028f`) stays queued.
