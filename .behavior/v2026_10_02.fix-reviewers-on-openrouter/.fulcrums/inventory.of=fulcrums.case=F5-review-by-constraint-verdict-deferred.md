# F5 — review.by's constraint verdict is deferred, not built in this cutover

## .the fork
- A: pin today's behavior (fix text reaches the human, framed `💥`, exit 1), narrow the vision's
  "every source refuses alike" claim, and catch the verdict-class change as a dream
- B: add a `constraint` outcome to review.by's verdict in this route, so a guard reads `✋`, exit 2

## .taken
A. the change B needs reaches review.by's published exit-code contract (its criteria pin every
error to exit 1), its stdout render and snapshots, and how a guard grades a review.by run. the gap
predates the cutover, which neither caused nor worsened it, and the fix text reaches the human today.
both level-3 reviewers graded it a nitpick.

## .rework
dirty — B ripples into a published contract and a guard's grade, so it is its own change.

## .confidence
75%. it is low because vision case 1 is the densest critipath, and a driver whose key is absent will
read `💥` there, which the vision set out to avoid; a council may prefer to land B before release.

## .where
`src/domain.operations/review.by/asReviewVerdict.ts` · `ReviewByResult.ts` · `genReviewByStdout.ts` ·
`src/contract/cli/review.by.ts` · `blackbox/review.by.key-absent.acceptance.test.ts` ·
`.dream/v2026_10_03.fix.review-by-constraint-verdict.md`

## .raised again
i005 r010 (`enroll-impl-behavior-intent`, last budget round) graded it a blocker and asked that the
wisher confirm the deferral rather than let it pass. i005 r011 (`enroll-impl-arch-defects`) endorsed
the deferral as correct scope. the stone halts on this one call.

## .verdict
ruled in part — the wisher confirms a key-absent refusal is a constraint error (S07), so `✋` exit 2 is
the target. whether it lands in this branch or in its own change is open; the dream carries the shape.
