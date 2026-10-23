# fulcrum F54 — `emit*`, the extant `parseReviewArgs`, and `brain/` keep their shape

- rework = clean — a rename per op, or one moved file; no caller outside this repo
- status = 🟡 **BEST-GUESSED 2026-09-26 — option A, keep all three**
- confidence = 🟡 **80%** — the `emit` verb is a declared term; the other two lean on scope reads
- raised.by = peer lane `arch-smell-scopeleaks`, i006, `blocker.1` (brain edge) and `nitpick.2`

## .the fork

the lane names three shapes as unsanctioned or leaky:

1. `emit*` ops — `emitReviewRefusal`, `emitReviewOverflowRefusal`, `emitReviewWarmerSpawn`,
   `emitReviewWarmerDisowned`
2. `parseReviewArgs` in `contract/cli/review.ts` — a `parse*` verb and a positional `argv`
3. `route/guard/review/runStoneGuardReviews` → `brain/getOneBrainChoicePinned`

### A — keep all three (taken)

1. `emit` is this repo's declared verb for an op whose whole effect is to write a surface to a
   stream (`domain.terms/term=emit._.choice._.md`, which forbids `output`, `print`, `render`). the
   lane itself files these as the rule's imperative-command class
2. `parseReviewArgs` is on main and exported from `contract/cli`, a published surface; the
   `(input, context)` rule scopes to internal contracts. its warmer twin, which this branch added,
   was renamed `asWarmerArgs({ argv })`
3. `brain/` is new on this branch as the common-ancestor lift of the pin, with readers in
   `contract/cli/{review,reflect,review._.warmer}.ts` and `route/genReviewBrainSupply.ts` (on main
   since #320). a read of a shared subdomain is the shape `rule.prefer.most-common-denominator`
   asks for — the same move this round made for the diff reader into `git/`

### B — rename and re-home

`emit*` → `set*` would name a stream write as state; `parseReviewArgs` → `asReviewArgs({ argv })`
changes an exported contract outside this wish; `brain/` could not move lower without a split per
reader.

## .confidence, and why it is not higher

row 1 rests on a declared term and holds. rows 2 and 3 rest on scope reads that a council may draw
differently — `parseReviewArgs` is one line to rename, and a stricter read of `scope-leaks` may want
a `shared/` root above `brain/` and `git/`.
