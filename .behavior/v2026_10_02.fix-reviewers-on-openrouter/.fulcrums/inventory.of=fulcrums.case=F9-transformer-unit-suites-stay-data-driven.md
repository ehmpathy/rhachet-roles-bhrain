# F9 — the two transformer unit suites stay data-driven, in the caselist form

## .the fork
- A: keep `asConstraintRefusalText.test.ts` and `isCallerConstraintError.test.ts` as caselists
  (`TEST_CASES.map(case => test(...))`)
- B: rewrite each as `given`/`when`/`then` blocks

## .taken
A. both operations are pure transformers, and the repo's own brief `rule.prefer.data-driven` names the
caselist form for exactly this case: unit tests of transformers. each case carries its `description`,
`given` and `expect`, so the cases read as a table. a `given`/`when`/`then` rewrite would turn a
five-row table into five nested blocks with no gain in clarity.

## .what the reviewer is right about
`rule.require.given-when-then` names the bdd frame for tests. the two rules sit side by side in the
mechanic briefs, and the data-driven one is the more specific for this grain.

## .rework
clean — a mechanical rewrite of two small files if a council prefers B.

## .confidence
80%. the residual doubt is that a reviewer that grades only the bdd rule reads the caselist as a gap.

## .where
`src/utils/asConstraintRefusalText.test.ts` · `src/utils/isCallerConstraintError.test.ts`

## .raised
i005 r012 (`enroll-verif-test-intent`) and i002/i004 r007 (`mech-given-when-then`), graded nitpick.

## .verdict
open — handed to the wisher
