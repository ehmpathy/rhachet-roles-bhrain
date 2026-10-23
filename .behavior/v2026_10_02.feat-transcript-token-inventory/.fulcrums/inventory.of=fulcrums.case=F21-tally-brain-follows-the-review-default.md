# F21 — the review tally brain is `openrouter/deepseek/flash`, not `fireworks/deepseek/v4-flash`

## .the fork

every prose-verdict l3 lane ended in `review tally fallback failed`. the fixed tally brain answered
each call with `412 Account … is suspended`. three choices:

- **A — point `FIXED_FALLBACK_BRAIN` at `openrouter/deepseek/flash`**, the provider F19 already
  ruled for the `review` default
- **B — make the tally brain follow the review default** through one shared constant
- **C — leave it**, and ask each reviewer to emit numeric counts so the fallback is never reached

## .taken — A, and why at the time

the same deepseek flash model, on the provider that answers; one constant, one clamp. B is the
tidier shape but couples two contracts the code deliberately keeps apart (the tally brain is not
configurable per route). C leaves a guard that cannot read a prose verdict, which is the case the
fallback exists for.

## .rework — clean

one constant; three snapshots that render the footer.

## .confidence — 85%, and why it is low

a contract a human did not pick, though it follows F19's ruled provider exactly.

## .where

- `src/domain.operations/route/genReviewBrainSupply.ts`
- `src/domain.operations/route/genReviewBrainSupply.integration.test.ts` — the clamp, red on the 412

## .verdict

open.
