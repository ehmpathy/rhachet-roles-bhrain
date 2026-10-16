# F238 — new ops with indirect coverage wait for a per-file sweep

- raised 2026-10-12, by `ergo-acceptance-journey-coverage` (nitpick.2, nitpick.3, nitpick.6, nitpick.9, nitpick.10), at 5.3 i003
- rework: **clean** — each test file is additive; no prod contract moves
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **80%**

## .the fork, stated fairly

~43 operations this branch adds have no collocated test of their own:

| concern | the set |
|---|---|
| nitpick.2 | the watermark communicators in `review/watermark/` — the churn-retry bound needs a contended fixture |
| nitpick.3 | 8 meter transformers and predicates |
| nitpick.6 | ~16 ops in `review/partition/` |
| nitpick.9 | 8 review-core transformers |
| nitpick.10 | 8 `review/set*` fs writers |

| option | the claim |
|---|---|
| **A — hold, and rely on the callers' suites** | each op runs inside a higher-grain suite today (`genReviewMeterStdout.test.ts`, `getAllTargetsByPartition`, `stepReview.case*`, `genReviewWarmer.integration`). a per-file sweep ripples to ~40 new test files in one round |
| **B — sweep now** | `rule.require.test-coverage-by-grain` asks each grain for its own test; a caller's suite proves the composition, not the leaf |

## .taken, and why

**A**, for the sweep. the cheap single files this lane named landed this round:
`asRouteGuardPartitionClaimsOfFlags.test.ts`, `getOnePromptTokens.test.ts`,
`asTargetDiffBody.test.ts`, `asSuppliedFilesSection.test.ts`, `asArgvSpaced.test.ts`,
`isErrorOfAbsence.test.ts`, `getAllErrorClassNames.test.ts`. the rest is dirty by size, not by
shape, and the grain rule grades an absent orchestrator or transformer test as a nitpick.

## .rework, and why

**clean.** each test is a new file beside its op. no contract has to change.

## .confidence, and why it is not higher

the watermark churn-retry bound (nitpick.2) is a communicator, which the grain rule grades a
blocker when uncovered at integration grain; its callers reach it only on the uncontended path.

## .where

`src/domain.operations/review/watermark/` · `src/domain.operations/review/meter/` ·
`src/domain.operations/review/partition/` · `src/domain.operations/review/`

## .verdict

— (awaits the council)
