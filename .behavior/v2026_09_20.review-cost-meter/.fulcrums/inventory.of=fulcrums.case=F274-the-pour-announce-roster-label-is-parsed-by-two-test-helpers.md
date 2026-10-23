# F274 — the pour announce roster label is parsed by two test helpers

- raised 2026-10-12, by `ergo-snapshot-visual-blemishes` (nitpick.7), at 5.3 i004
- rework: **dirty** — the label is matched by two parsers and asserted in eight-plus suites
- status: 🟡 **BEST-GUESSED — disputed for dirt**
- confidence: **75%**

## .the fork, stated fairly

the pour announce names lanes `r1:wide-a`; the reviewer trees name them `r1: wide-a`.

| option | the claim |
|---|---|
| **A — defer the space** | the label is a key two test helpers parse, and a change ripples past the render |
| **B — add the space now** | one label should read one way |

## .taken, and why

**A**, for dirt alone. the change is one character in
`src/domain.operations/route/guard/review/asReviewLevelPourAnnounce.ts:86`, but the `r<n>:<slug>` form is
matched by `blackbox/.test/getAllPourAnnounceLines.ts` and
`src/domain.operations/route/__test_assets__/asStderrSansPourAnnounce.ts`, asserted literally in their
tests, in `asReviewLevelPourAnnounce.test.ts`, and in acceptance suites (`driver.route.peer-concurrency`,
`peer-budget-exhaustion-unlocks-level`, and the five the lane names). a partial change leaves a
parser that no longer finds the roster, which strips the announce from a snapshot without a sound.

## .rework, and why

**dirty.** two parsers, their tests, and the acceptance snapshots move together, and the
acceptance half cannot be run in this lane.

## .confidence, and why it is not higher

the defect is real and the target shape is not in doubt; only when to land it is.

## .where

`src/domain.operations/route/guard/review/asReviewLevelPourAnnounce.ts`

## .verdict

— (awaits the council)
