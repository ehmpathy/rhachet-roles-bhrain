# F273 — a found warmer on the asked plan is a one-line no-op

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (nitpick.2), at 5.3 i004
- rework: **clean** — one branch of `emitReviewWarmerSpawn`, plus its unit snapshot
- status: 🟡 **BEST-GUESSED — disputed; the council rules on the collapse**
- confidence: **80%**

## .the fork, stated fairly

`emitReviewWarmerSpawn` renders a fresh spawn as a tree, and a found warmer whose plan matches the
ask as one line.

| option | the claim |
|---|---|
| **A — keep the one-line collapse** | the three outcomes differ in what a driver must do. a found warmer on the asked plan is a no-op; a spawn is a new spender; a plan mismatch is a plan silently discarded |
| **B — render the found branch as the same tree** | one fact family should read in one shape |

## .taken, and why

**A.** the docblock at `src/domain.operations/review/warmer/emitReviewWarmerSpawn.ts:29-35` states the
reason: a no-op that costs seven lines of attention trains a driver to skip the block that carries
the other two outcomes. the collapse keeps the two news-shaped outcomes loud. the one line still
carries the reviewer, the plan, and both levers (`stop:` and `never spawn:`), so no fact a driver
acts on is dropped.

## .rework, and why

**clean.** the found branch could print the full tree; one branch and one snapshot change.

## .confidence, and why it is not higher

the rule reads "same format across similar outputs" strictly, and a reader may weigh shape over
attention.

## .where

`src/domain.operations/review/warmer/emitReviewWarmerSpawn.ts`

## .verdict

— (awaits the council)
