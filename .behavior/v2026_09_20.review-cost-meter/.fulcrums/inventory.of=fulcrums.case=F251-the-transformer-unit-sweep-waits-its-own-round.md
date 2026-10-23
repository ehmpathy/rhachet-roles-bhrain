# F251 — the transformer unit sweep waits its own round

- raised 2026-10-12, by `ergo-contract-snapshots` (nitpick.2, nitpick.3, nitpick.5, nitpick.7, nitpick.9, nitpick.20), at 5.3 i004
- rework: **clean** — each test file is additive; no prod contract moves
- status: 🟡 **BEST-GUESSED — disputed**
- confidence: **80%**

## .the fork, stated fairly

six concerns, one per partition, each name the pure transformers that partition adds with no
collocated unit test of their own:

| concern | the partition |
|---|---|
| nitpick.2 | `review/meter/` and `review/grove/` |
| nitpick.3 | `review/partition/` |
| nitpick.5 | the review-prompt renderers |
| nitpick.7 | the review root |
| nitpick.9 | `route/guard/review/peer/` |
| nitpick.20 | the extracted reflect `step2/` transformers |

| option | the claim |
|---|---|
| **A — hold, and rely on the callers' suites** | every transformer named runs inside a higher-grain suite that asserts its output (the meter stdout suites, `getAllTargetsByPartition`, `compileReviewPrompt`, the peer-given suites, `executeManifestOperations.integration`). a per-file sweep is ~70 new test files in one round |
| **B — sweep now** | `rule.require.test-coverage-by-grain` asks each transformer for its own unit test; a caller's suite proves the composition, not the leaf |

## .taken, and why

**A**, for the sweep — the same call as F238 one round earlier, on a different set. the grain rule
grades an absent transformer test a **nitpick**, and the set is dirty by size, not by shape. the
cheap files this lane named landed this round instead:
`getOneReviewPartitionSplitVerdict.test.ts` (nitpick.4), `emitReviewRefusal.test.ts` (nitpick.1),
`asRedactedOutput.test.ts` (nitpick.23), `maskVerdictCounts.test.ts` (nitpick.24), and a snapshot
per case in `computeOutputTree.test.ts` (nitpick.25).

## .rework, and why

**clean.** each test is a new file beside its transformer, a data-driven caselist. no contract has
to change, and the sweep can land in any order.

## .confidence, and why it is not higher

a transformer whose every caller asserts only a fragment of its output is covered less than this
row claims; a per-file read of the ~70 callers was not done to rank which of them that is.

## .where

`src/domain.operations/review/meter/` · `src/domain.operations/review/grove/` ·
`src/domain.operations/review/partition/` · `src/domain.operations/review/` ·
`src/domain.operations/route/guard/review/peer/` · `src/domain.operations/reflect/step2/`

## .verdict

— (awaits the council)
