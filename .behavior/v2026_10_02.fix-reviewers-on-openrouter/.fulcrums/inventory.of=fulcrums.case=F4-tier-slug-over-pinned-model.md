# F4 — the defaults take the tier slug, not a pinned model id

## .the fork
- A: every default and the tally fallback name `openrouter/deepseek/flash`, the tier; the drift is
  recorded in a `.note` at each declaration
- B: the decision surface (`FIXED_FALLBACK_BRAIN`) pins a model id such as
  `openrouter/deepseek/deepseek-v4-flash`, so a tally cannot move with no diff here

## .taken
A. the wish names `openrouter/deepseek/flash` verbatim as the brain. the tier is also what keeps the
cutover cheap to maintain: a new flash release lands with no code change, which the vision lists as a
pro. the drift is bounded where it matters — a tally the sub-brain cannot read grades `malfunction`
and re-runs, never a silent pass — and each constant names the drift where a reader meets it.

## .rework
clean — one constant swap for B, in `genReviewBrainSupply.ts`; the render and footer read it from there.

## .confidence
85%. it is low because a reviewer reads a pinned id on the tally as the safer default, and the
wisher named the tier for the reviewers in general, not for the tally fallback in particular.

## .where
`src/domain.operations/route/genReviewBrainSupply.ts` · `src/contract/cli/review.ts` ·
`src/contract/cli/review.by.ts` · `src/.test/genTestBrainContext.ts`

## .verdict
open
