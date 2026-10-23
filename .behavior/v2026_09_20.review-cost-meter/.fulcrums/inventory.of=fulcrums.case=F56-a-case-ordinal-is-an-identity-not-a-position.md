# fulcrum F56 — a case ordinal is an identity, not a position

- rework = 🔴 **dirty** — a renumber moves every citation of the ordinal it moves
- status = 🟡 **DISPUTED 2026-09-26 — option A, ordinals stay as minted**
- confidence = 🟡 **80%** — see `.why not higher`
- raised.by = peer lane `behavior-intent-coverage-review-ops`, nitpick.3, round hash `d95cdbd3c7e3186cd2`

## .the fork

seven suites under `review/` declare cases out of numeric order, and one has gaps
(`getAllReviewRunMeters.integration.test.ts`: 1–5, 8). the lane asks to renumber or reorder so
document order matches numeric order.

### A — an ordinal is minted once and never reassigned (taken)

a case's ordinal is its **name**. it is cited from prod code (`getAllReviewRunMeters.ts` cites
`[case4]` and `[case8]` as the clamps of its filter), from peer suites, from the yield, from
fulcrums, and from takens. measured: **529 `[caseN]` lines** across `src/domain.operations/review`.

- a new case takes the next free ordinal, wherever it sits in the file — beside the case it
  argues with, which is where a reader wants it
- a retired case leaves its ordinal unused, so no later case inherits a citation meant for it
- ⇒ an ordinal read anywhere names one case, forever. that is the property a citation needs

### B — renumber to document order

every citation of a moved ordinal must move with it, by hand: a sweep cannot part a citation of
`[case8]` in one file from a declaration of `[case8]` in another. a missed one does not fail — it
silently points at a different case, which is worse than the disorder it repairs.

### C — reorder blocks, keep ordinals

keeps every citation sound, and fixes the scan order. but it moves hundreds of lines per suite to
buy a scan-order win, and it breaks the adjacency A chose on purpose — a clamp placed beside the
case whose defect it guards.

## .why not higher

- the scan cost the lane names is real: a reader who scrolls for `[case4]` meets `[case5]` first
- the gaps in `getAllReviewRunMeters` carry no note of what retired 6 and 7. a one-line note at
  the gap would answer the reader the lane describes, and is owed where a gap is cited

## .where

- `src/domain.operations/review/meter/reviewPromptCacheAnatomy.test.ts`
- `src/domain.operations/review/getOnePromptComposition.test.ts`
- `src/domain.operations/review/meter/asReviewRunIdentity.test.ts`
- `src/domain.operations/review/warmer/emitReviewWarmerSpawn.test.ts`
- `src/domain.operations/review/warmer/setReviewWarmerPokes.integration.test.ts`
- `src/domain.operations/review/grove/genReviewGroveStdout.test.ts`
- `src/domain.operations/review/meter/getAllReviewRunMeters.integration.test.ts`
