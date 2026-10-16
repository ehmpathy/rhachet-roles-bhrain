# F283 — the overflow refusal states size, not the cache seam

## .the fork

| option | what the refusal prints |
|---|---|
| keep the census | 11 rows, one per named input, zero rows included, each marked by cache seam; a lever head that leads with the added/edited share |
| **one line** ✅ | `prompt — <total> · <targets> (<share>) · <each other input that sent chars, heaviest first>`; the lever head names the act, and each directory row carries its own kind split |

## .taken, and why

an overflow is a question of size. the seam answers a cost question the refusal does not ask, and a
zero row fills no window. the added/edited split already rides each directory row
(`620.0k bodies · 75.0k edits`), so a lead line that restated it was a second copy. the refusal
fell from ~27 lines to ~11 with no figure lost that a driver needs to cut.

## .rework — clean

a render change in two transformers (`asReviewOverflowScopeLines`, `asReviewOverflowLeverLines`)
and their snapshots. no contract, no caller, no persisted shape.

## .confidence — 85%, and why not higher

seed S32 asked that the added/edited split set the lever's lead. the split still sets the
suggestion (partition vs cut), and it is visible per row — but it no longer heads the lever. if
the lead itself was the point, restore one clause.

## .where

- `src/domain.operations/review/asReviewOverflowScopeLines.ts`
- `src/domain.operations/review/asReviewOverflowLeverLines.ts`
- `src/contract/cli/review._.cost.ts` — the help text, densified in the same pass

## .verdict

open.
