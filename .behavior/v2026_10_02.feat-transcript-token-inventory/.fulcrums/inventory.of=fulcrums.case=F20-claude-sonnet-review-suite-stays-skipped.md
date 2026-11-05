# F20 — the `claude-sonnet` review suite stays skipped, on cost

## .the fork

`src/domain.operations/review/stepReview.caseBrain.claude-sonnet.integration.test.ts:25` is a
pre-extant `describe.skip` (63 tests, `.skip = anthropic api too pricey for ci`) inside this
stone's run scope. the zero-skips check flags any skip in scope.

- **A — keep the skip**, recorded as a deliberate cost choice
- **B — remove the skip**, and pay an anthropic api run on every ci integration pass

## .taken — A, and why at the time

the skip predates this branch and names its reason in place. the spend is a cost call no driver
may make, so it was handed to the foreman rather than removed or worked around.

## .rework — clean

one `.skip` removed, and an anthropic key in the ci keyrack.

## .confidence — 70%, and why it is low

a skip in scope reads as a silent gap to the zero-skips rubric; whether cost justifies it is a
budget judgment, not a technical one.

## .where

- `src/domain.operations/review/stepReview.caseBrain.claude-sonnet.integration.test.ts:25`
- `5.3.verification.yield.md` · zero skips verified

## .verdict

ruled — A, by the efficiency director at 5.3 (seed S6): the skip stands, on cost.
