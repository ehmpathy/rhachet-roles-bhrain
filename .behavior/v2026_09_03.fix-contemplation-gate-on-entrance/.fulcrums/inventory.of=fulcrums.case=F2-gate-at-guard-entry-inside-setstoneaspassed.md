# fulcrum F2 — gate at guard entry inside `setStoneAsPassed`

- **rework** = clean
- **status** = open
- **confidence** = 92%. ⚠️ **it gained evidence after it was written and was never re-scored** — see
  the summary's note that F2 and F4 share this gap
- **found** = 1.vision

## .the fork, stated fairly

the wish names `runStoneGuardReviews.js` as the operation that never consults the gate, which reads
as a call to add the check there.

- **inside `runStoneGuardReviews`** — the gate sits with the code that spawns reviewers.
- **at guard entry in `setStoneAsPassed`** — the gate sits beside the extant `review.self` gate,
  before the call to `runStoneGuardReviews`.

## .taken, and why at the time

**guard entry in `setStoneAsPassed`.** the source shows `runStoneGuardReviews` is *called from*
`setStoneAsPassed:378` — entrance and exit are already the same function. so the defect is a
sequence defect within one operation, not an absent call site across two.

three reasons the entry placement wins:

1. **a paved precedent sits three blocks above.** the `review.self` gate (`:195-255`) already halts
   at guard entry, with `refs: { reviews: [], judges: [] }` and an unstamped emit. this gate is its
   twin and should look identical.
2. **`runStoneGuardReviews` returns artifacts; it does not halt.** a halt inside it would need a new
   return shape or a throw, and every caller would inherit it.
3. **grain.** `runStoneGuardReviews` executes reviewers. passage policy belongs to the operation
   that decides passage.

## .rework, and why

**clean.** the gate is a self-contained block that reads one operation and returns
`genStoneGuardBlockedEmit`. to relocate it is a cut and paste within one file; no contract moves.

## .confidence — 92%

the 8% doubt: if a second caller of `runStoneGuardReviews` appears later, the gate would not cover
it. today `setStoneAsPassed` is the only caller, so the placement is correct for the code that
exists (`rule.prefer.wet-over-dry`).

## .where

- `1.vision.yield.md` § "P1 — gate the entrance"
- `setStoneAsPassed.ts:195-255` (the precedent), `:378` (the call), `:814-872` (today's gate)

## .the verdict

_unruled._
